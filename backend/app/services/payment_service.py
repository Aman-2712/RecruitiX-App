import os
import hmac
import hashlib
import json
from fastapi import HTTPException, Request
from pydantic_settings import BaseSettings
import datetime
from sqlalchemy.orm import Session
from app.models import PromoCode

class PaymentSettings(BaseSettings):
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "secret_placeholder")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "whsec_placeholder")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

settings = PaymentSettings()

try:
    import razorpay
    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
except ImportError:
    razorpay = None
    class DummyRazorpayClient:
        class Order:
            def create(self, data):
                return {"id": "order_mock123", "amount": data.get("amount", 0), "currency": "INR"}
        def __init__(self):
            self.order = self.Order()
    client = DummyRazorpayClient()

def create_razorpay_order(organization_id: int, plan_name: str, billing_cycle: str, coupon_code: str = None, db: Session = None):
    plan_prices = {
        "STARTER": 2999,
        "GROWTH": 9999,
        "ENTERPRISE": 49999
    }
    
    amount_inr = plan_prices.get(plan_name.upper(), 2999)
    if billing_cycle.upper() == "YEARLY":
        amount_inr = amount_inr * 10
        
    if coupon_code:
        if not db:
            raise HTTPException(status_code=500, detail="Database session not provided for coupon validation")
        promo = db.query(PromoCode).filter(PromoCode.code == coupon_code.upper()).first()
        if not promo or not promo.is_active:
            raise HTTPException(status_code=400, detail="Invalid promo code")
        if promo.current_uses >= promo.max_uses:
            raise HTTPException(status_code=400, detail="This promo code has reached its usage limit")
        if promo.expires_at and promo.expires_at < datetime.datetime.utcnow():
            raise HTTPException(status_code=400, detail="This promo code has expired")
            
        discount = promo.discount_percentage
        amount_inr = int(amount_inr * (1 - (discount / 100.0)))
        
    try:
        order_data = {
            "amount": amount_inr * 100, # Razorpay uses paisa
            "currency": "INR",
            "receipt": f"receipt_org_{organization_id}_{plan_name.lower()}",
            "notes": {
                "organization_id": str(organization_id),
                "plan_name": plan_name,
                "billing_cycle": billing_cycle
            }
        }
        
        if coupon_code:
            order_data["notes"]["coupon_code"] = coupon_code.upper()
            
        order = client.order.create(data=order_data)
        
        # Return order ID and other metadata required by frontend
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": settings.RAZORPAY_KEY_ID,
            "notes": order_data["notes"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def verify_razorpay_signature(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("x-razorpay-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing signature")
        
    try:
        # Verify the signature
        client.utility.verify_webhook_signature(
            payload.decode('utf-8'),
            sig_header,
            settings.RAZORPAY_WEBHOOK_SECRET
        )
        # Parse the JSON payload
        event = json.loads(payload.decode('utf-8'))
        return event
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
