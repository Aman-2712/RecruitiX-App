import os
import stripe
from fastapi import HTTPException, Request
from pydantic_settings import BaseSettings

class PaymentSettings(BaseSettings):
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "sk_test_placeholder")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_placeholder")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

settings = PaymentSettings()
stripe.api_key = settings.STRIPE_SECRET_KEY

def create_checkout_session(organization_id: int, plan_name: str, billing_cycle: str):
    plan_prices = {
        "STARTER": 2999,
        "GROWTH": 9999,
        "ENTERPRISE": 49999
    }
    
    amount = plan_prices.get(plan_name.upper(), 2999)
    if billing_cycle.upper() == "YEARLY":
        amount = amount * 10
        
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'RecruitX {plan_name.capitalize()} Plan ({billing_cycle.capitalize()})',
                    },
                    'unit_amount': amount, # Stripe uses cents
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{settings.FRONTEND_URL}/dashboard/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/dashboard/billing",
            client_reference_id=str(organization_id),
            metadata={
                "organization_id": organization_id,
                "plan_name": plan_name,
                "billing_cycle": billing_cycle
            }
        )
        return session.url
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def construct_stripe_event(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
        return event
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")
