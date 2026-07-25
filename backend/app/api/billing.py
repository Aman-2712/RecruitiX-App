import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import SubscriptionPlan, Organization, UsageTracking, User, Job, PromoCode
from app.services.payment_service import create_razorpay_order, verify_razorpay_signature
from app.services.email_service import send_promo_exhausted_notification
router = APIRouter(prefix="/api/billing", tags=["billing"])

class UpgradeRequest(BaseModel):
    plan_name: str # STARTER, GROWTH, ENTERPRISE
    billing_cycle: str = "MONTHLY" # MONTHLY, YEARLY
    coupon_code: Optional[str] = None

class WebhookRequest(BaseModel):
    organization_id: int
    plan_name: str
    billing_cycle: str = "MONTHLY"

class ValidateCouponRequest(BaseModel):
    coupon_code: str

@router.post("/validate-coupon")
def validate_coupon(req: ValidateCouponRequest, db: Session = Depends(get_db)):
    promo = db.query(PromoCode).filter(PromoCode.code == req.coupon_code.upper()).first()
    if not promo or not promo.is_active:
        raise HTTPException(status_code=400, detail="Invalid promo code")
    if promo.current_uses >= promo.max_uses:
        raise HTTPException(status_code=400, detail="This promo code has reached its usage limit")
    if promo.expires_at and promo.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="This promo code has expired")
        
    return {
        "valid": True,
        "discount_percentage": promo.discount_percentage
    }

@router.get("/plans")
def get_plans(db: Session = Depends(get_db)):
    plans = db.query(SubscriptionPlan).all()
    results = []
    for plan in plans:
        results.append({
            "id": plan.id,
            "name": plan.name,
            "monthly_price": plan.monthly_price,
            "yearly_price": plan.yearly_price,
            "job_limit": plan.job_limit,
            "resume_limit": plan.resume_limit,
            "user_limit": plan.user_limit,
            "features": json.loads(plan.features_json or "[]")
        })
    return results

@router.get("/subscription")
def get_subscription(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = current_user.organization
    if not org:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")
        
    if org.plan_status == "TRIAL" and org.trial_end_date and org.trial_end_date < datetime.datetime.utcnow():
        org.plan_status = "INACTIVE"
        org.current_plan = "NONE"
        db.commit()
        db.refresh(org)
        
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == org.current_plan).first()
    plan_features = json.loads(plan.features_json or "[]") if plan else []
        
    return {
        "organization_id": org.id,
        "organization_name": org.name,
        "current_plan": org.current_plan,
        "plan_status": org.plan_status,
        "billing_cycle": org.billing_cycle,
        "trial_end_date": org.trial_end_date,
        "subscription_start": org.subscription_start,
        "subscription_end": org.subscription_end,
        "plan_features": plan_features
    }

@router.get("/usage")
def get_usage(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = current_user.organization
    if not org:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")
        
    if org.plan_status == "TRIAL" and org.trial_end_date and org.trial_end_date < datetime.datetime.utcnow():
        org.plan_status = "INACTIVE"
        org.current_plan = "NONE"
        db.commit()
        db.refresh(org)
        
    usage = db.query(UsageTracking).filter(UsageTracking.organization_id == org.id).first()
    if not usage:
        usage = UsageTracking(organization_id=org.id)
        db.add(usage)
        db.commit()
        db.refresh(usage)

    # Synchronize real-time usage metrics with actual database record counts
    real_candidates_count = db.query(Candidate).join(Job).filter(Job.organization_id == org.id).count()
    real_jobs_count = db.query(Job).filter(Job.organization_id == org.id).count()
    real_users_count = db.query(User).filter(User.organization_id == org.id).count()

    actual_resumes = max(usage.resumes_processed, real_candidates_count)
    actual_jobs = max(usage.jobs_created, real_jobs_count)
    actual_users = max(usage.active_users, real_users_count)

    if usage.resumes_processed != actual_resumes or usage.jobs_created != actual_jobs or usage.active_users != actual_users:
        usage.resumes_processed = actual_resumes
        usage.jobs_created = actual_jobs
        usage.active_users = actual_users
        db.commit()
        db.refresh(usage)
        
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == org.current_plan).first()
    
    # If no active plan, return zero limits
    if not plan:
        return {
            "jobs_created": usage.jobs_created,
            "jobs_limit": 0,
            "resumes_processed": usage.resumes_processed,
            "resumes_limit": 0,
            "active_users": usage.active_users,
            "users_limit": 0,
            "billing_period_start": usage.billing_period_start,
            "billing_period_end": usage.billing_period_end
        }
        
    return {
        "jobs_created": usage.jobs_created,
        "jobs_limit": plan.job_limit,
        "resumes_processed": usage.resumes_processed,
        "resumes_limit": plan.resume_limit,
        "active_users": usage.active_users,
        "users_limit": plan.user_limit,
        "billing_period_start": usage.billing_period_start,
        "billing_period_end": usage.billing_period_end
    }

@router.post("/start-trial")
def start_trial(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = current_user.organization
    if not org:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")
        
    if org.plan_status != "ONBOARDING":
        raise HTTPException(status_code=400, detail="Cannot start trial. Organization is not in ONBOARDING status.")
        
    org.current_plan = "STARTER"
    org.plan_status = "TRIAL"
    org.subscription_start = datetime.datetime.utcnow()
    org.subscription_end = datetime.datetime.utcnow() + datetime.timedelta(days=1)
    org.trial_end_date = org.subscription_end
    db.commit()
    return {
        "status": "success",
        "message": "1-Day Free Trial started.",
        "trial_end_date": org.trial_end_date
    }

@router.post("/upgrade")
def upgrade_subscription(
    req: UpgradeRequest, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    org = current_user.organization
    if not org:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")
        
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == req.plan_name.upper()).first()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan {req.plan_name} not found")
        
    # Simulate payment process
    org.current_plan = plan.name
    org.plan_status = "ACTIVE"
    org.billing_cycle = req.billing_cycle.upper()
    org.subscription_start = datetime.datetime.utcnow()
    org.subscription_end = datetime.datetime.utcnow() + datetime.timedelta(days=365 if req.billing_cycle.upper() == "YEARLY" else 30)
    
    # Reset usage cycle dates but maintain count, or reset count (standard billing resets counts monthly!)
    usage = db.query(UsageTracking).filter(UsageTracking.organization_id == org.id).first()
    if usage:
        usage.billing_period_start = org.subscription_start
        usage.billing_period_end = org.subscription_end
        # Reset count for new cycle
        usage.resumes_processed = 0
        
    if org.current_plan == "ENTERPRISE":
        try:
            from app.services.email_service import send_enterprise_welcome_email
            send_enterprise_welcome_email(current_user.email, current_user.full_name or "Enterprise Admin", org.name)
        except Exception as e:
            logger.error(f"Error sending enterprise welcome email: {e}")
            
    db.commit()
    return {
        "status": "success",
        "message": f"Successfully upgraded to {plan.name} {req.billing_cycle} plan",
        "current_plan": org.current_plan
    }

@router.post("/cancel")
def cancel_subscription(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = current_user.organization
    if not org:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")
        
    # In a real app we might downgrade at period end. Here we mark cancelled and lock them out.
    org.plan_status = "INACTIVE"
    org.current_plan = "NONE"
    db.commit()
    return {
        "status": "success",
        "message": "Subscription cancelled. Reverted to STARTER plan.",
        "current_plan": org.current_plan,
        "plan_status": org.plan_status
    }

@router.get("/billing-history")
def get_billing_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = current_user.organization
    if not org:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")
        
    # If they have no plan, they have no invoices yet
    if org.current_plan == "NONE":
        return []

    # Generate mock invoice lists dynamically based on active plan
    results = []
    base_date = datetime.datetime.utcnow()
    
    plan_prices = {
        "STARTER": 2999,
        "GROWTH": 9999,
        "ENTERPRISE": 49999
    }
    
    amount = plan_prices.get(org.current_plan, 2999)
    if org.billing_cycle == "YEARLY":
        amount *= 10 # 10 months pricing discount
        
    # Add recent invoice
    results.append({
        "invoice_no": f"INV-2026-{org.id:04d}-01",
        "date": base_date.strftime("%Y-%m-%d"),
        "plan": org.current_plan,
        "amount": amount,
        "status": "PAID"
    })
    
    # Add past mock invoice if they are not on default starter trial
    if org.current_plan != "STARTER" or org.plan_status != "ACTIVE":
        past_date = base_date - datetime.timedelta(days=30)
        results.append({
            "invoice_no": f"INV-2026-{org.id:04d}-02",
            "date": past_date.strftime("%Y-%m-%d"),
            "plan": "STARTER",
            "amount": 2999,
            "status": "PAID"
        })
        
    return results

@router.post("/webhook/payment")
def payment_webhook(req: WebhookRequest, db: Session = Depends(get_db)):
    """
    Mock payment webhook endpoint to simulate external gateways (Stripe, Razorpay, etc.)
    Upgrades the specified organization plan directly.
    """
    org = db.query(Organization).filter(Organization.id == req.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == req.plan_name.upper()).first()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan {req.plan_name} not found")
        
    org.current_plan = plan.name
    org.plan_status = "ACTIVE"
    org.billing_cycle = req.billing_cycle.upper()
    org.subscription_start = datetime.datetime.utcnow()
    org.subscription_end = datetime.datetime.utcnow() + datetime.timedelta(days=365 if req.billing_cycle.upper() == "YEARLY" else 30)
    
    usage = db.query(UsageTracking).filter(UsageTracking.organization_id == org.id).first()
    if usage:
        usage.billing_period_start = org.subscription_start
        usage.billing_period_end = org.subscription_end
        usage.resumes_processed = 0
        
    db.commit()
    return {"status": "success", "message": f"Webhook processed: Organization {org.id} upgraded to {plan.name}"}

@router.post("/create-razorpay-order")
def api_create_razorpay_order(
    req: UpgradeRequest, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    org = current_user.organization
    if not org:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")
        
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == req.plan_name.upper()).first()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan {req.plan_name} not found")
        
    order_data = create_razorpay_order(org.id, plan.name, req.billing_cycle, req.coupon_code, db)
    return order_data

@router.post("/webhook/razorpay")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        # event = await verify_razorpay_signature(request)
        payload = await request.body()
        event = json.loads(payload.decode('utf-8'))
        
        # DEBUG: Log the event to a dummy job so we can read it
        try:
            debug_job = Job(
                organization_id=1,
                title="WEBHOOK_LOG",
                description=json.dumps(event)[:2000],
                status="OPEN"
            )
            db.add(debug_job)
            db.commit()
        except Exception:
            pass
            
        event_type = event.get("event")
        
        if event_type in ['order.paid', 'payment.captured']:
            if event_type == 'order.paid':
                payload_entity = event.get("payload", {}).get("order", {}).get("entity", {})
            else:
                payload_entity = event.get("payload", {}).get("payment", {}).get("entity", {})
                
            notes = payload_entity.get("notes", {})
            org_id_str = notes.get("organization_id")
            plan_name = notes.get("plan_name")
            billing_cycle = notes.get("billing_cycle", "MONTHLY")
            coupon_code = notes.get("coupon_code")
            
            if org_id_str and plan_name:
                org = db.query(Organization).filter(Organization.id == int(org_id_str)).first()
                if org:
                    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == plan_name.upper()).first()
                    if plan:
                        org.current_plan = plan.name
                        org.plan_status = "ACTIVE"
                        org.billing_cycle = billing_cycle.upper()
                        org.subscription_start = datetime.datetime.utcnow()
                        org.subscription_end = datetime.datetime.utcnow() + datetime.timedelta(days=365 if billing_cycle.upper() == "YEARLY" else 30)
                        
                        usage = db.query(UsageTracking).filter(UsageTracking.organization_id == org.id).first()
                        if usage:
                            usage.billing_period_start = org.subscription_start
                            usage.billing_period_end = org.subscription_end
                            usage.resumes_processed = 0
                            
                        if coupon_code:
                            promo = db.query(PromoCode).filter(PromoCode.code == coupon_code).first()
                            if promo:
                                promo.current_uses += 1
                                if promo.current_uses == promo.max_uses:
                                    try:
                                        send_promo_exhausted_notification(promo.code)
                                    except Exception as e:
                                        print(f"Error sending promo email: {e}")
                                        
                        db.commit()
        
        return {"status": "success"}
    except Exception as e:
        print(f"Razorpay Webhook Error: {str(e)}")
        return {"status": "error", "message": str(e)}
