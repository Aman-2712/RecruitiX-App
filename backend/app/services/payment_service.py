import os
import hmac
import hashlib
import json
import razorpay
from fastapi import HTTPException, Request
from pydantic_settings import BaseSettings

class PaymentSettings(BaseSettings):
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "secret_placeholder")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "whsec_placeholder")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

settings = PaymentSettings()
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

def create_razorpay_order(organization_id: int, plan_name: str, billing_cycle: str):
    plan_prices = {
        "STARTER": 2499,
        "GROWTH": 7999,
        "ENTERPRISE": 24999
    }
    
    amount_inr = plan_prices.get(plan_name.upper(), 2499)
    if billing_cycle.upper() == "YEARLY":
        amount_inr = amount_inr * 10
        
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
        
        order = client.order.create(data=order_data)
        
        # Return order ID and other metadata required by frontend
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": settings.RAZORPAY_KEY_ID
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
