import hmac
import hashlib
import json
import requests
import os
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

# Load Server 1 env (Razorpay)
load_dotenv("branch-server1/.env")
# Load Server 3 env (Supabase Admin)
load_dotenv("branch-server3/.env", override=False)

SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET")
URL = "http://localhost:8080/api/webhooks/razorpay"

# Supabase for verification
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_test_user():
    user_id = "d0a0b0c0-d0e0-f0a0-b0c0-d0e0f0a0b0c0"
    res = supabase.table("users").select("id").eq("id", user_id).execute()
    if not res.data:
        supabase.table("users").insert({
            "id": user_id,
            "email": "test_payment@talvix.in",
            "tier": "free",
            "full_name": "Test Payment User"
        }).execute()
        print(f"Created test user: {user_id}")
    else:
        supabase.table("users").update({
            "tier": "free",
            "subscription_expires_at": None,
            "auto_apply_paused": False
        }).eq("id", user_id).execute()
        print(f"Reset test user {user_id} to free")
    return user_id

def send_webhook(payload):
    body = json.dumps(payload, separators=(',', ':'))
    signature = hmac.new(
        SECRET.encode('utf-8'),
        body.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    headers = {
        "Content-Type": "application/json",
        "X-Razorpay-Signature": signature
    }
    
    resp = requests.post(URL, data=body, headers=headers)
    print(f"Sent {payload['event']}: {resp.status_code}")
    return resp.status_code == 200

def test_lifecycle():
    uid = create_test_user()
    
    # 1. Initial Payment
    print("\n--- Testing initial payment ---")
    send_webhook({
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "notes": {"user_id": uid, "plan": "professional"}
                }
            }
        }
    })
    time.sleep(2)
    user = supabase.table("users").select("tier", "subscription_expires_at").eq("id", uid).single().execute().data
    print(f"State: tier={user['tier']}, expires={user['subscription_expires_at']}")
    
    # 2. Subscription Charged (Renewal)
    print("\n--- Testing subscription renewal ---")
    current_end = int(time.time())
    send_webhook({
        "event": "subscription.charged",
        "payload": {
            "subscription": {
                "entity": {
                    "current_end": current_end,
                    "notes": {"user_id": uid, "plan": "monthly"}
                }
            }
        }
    })
    time.sleep(2)
    user = supabase.table("users").select("subscription_expires_at").eq("id", uid).single().execute().data
    print(f"State: expires={user['subscription_expires_at']}")
    
    # 3. Subscription Paused
    print("\n--- Testing subscription pause ---")
    send_webhook({
        "event": "subscription.paused",
        "payload": {
            "subscription": {
                "entity": {
                    "notes": {"user_id": uid}
                }
            }
        }
    })
    time.sleep(2)
    user = supabase.table("users").select("auto_apply_paused").eq("id", uid).single().execute().data
    print(f"State: auto_apply_paused={user['auto_apply_paused']}")
    
    # 4. Subscription Resumed
    print("\n--- Testing subscription resume ---")
    send_webhook({
        "event": "subscription.resumed",
        "payload": {
            "subscription": {
                "entity": {
                    "notes": {"user_id": uid}
                }
            }
        }
    })
    time.sleep(2)
    user = supabase.table("users").select("auto_apply_paused").eq("id", uid).single().execute().data
    print(f"State: auto_apply_paused={user['auto_apply_paused']}")

if __name__ == "__main__":
    test_lifecycle()
