import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, PushSubscription

logger = logging.getLogger("hirecue.notifications")

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

class SubscriptionRequest(BaseModel):
    endpoint: str
    keys: Optional[dict] = None

class BroadcastPushRequest(BaseModel):
    title: str
    body: str
    url: Optional[str] = "/dashboard"

@router.post("/subscribe")
def subscribe_push_notifications(
    req: SubscriptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Subscribes a user's web/mobile browser device to push notifications.
    """
    existing = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id,
        PushSubscription.endpoint == req.endpoint
    ).first()

    keys_str = json.dumps(req.keys) if req.keys else None

    if existing:
        existing.keys_json = keys_str
    else:
        sub = PushSubscription(
            user_id=current_user.id,
            endpoint=req.endpoint,
            keys_json=keys_str
        )
        db.add(sub)
    
    db.commit()
    return {"status": "success", "message": "Device subscribed to mobile & web push notifications."}

@router.get("/subscriptions")
def get_user_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subs = db.query(PushSubscription).filter(PushSubscription.user_id == current_user.id).all()
    return {"count": len(subs), "subscriptions": [{"id": s.id, "endpoint": s.endpoint, "created_at": s.created_at} for s in subs]}
