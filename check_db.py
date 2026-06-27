import os
import sys
from dotenv import load_dotenv

load_dotenv('backend/.env')

sys.path.insert(0, os.path.abspath('backend'))
from app.core.database import SessionLocal
from app.models import Organization

db = SessionLocal()
orgs = db.query(Organization).all()
for o in orgs:
    print(f'Org ID {o.id}: {o.name} - Plan: {o.current_plan}')
