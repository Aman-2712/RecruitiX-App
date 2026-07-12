import traceback
import sys
try:
    from app.main import app
    print("SUCCESS")
except Exception as e:
    print("FAILED")
    traceback.print_exc()
    sys.exit(1)
