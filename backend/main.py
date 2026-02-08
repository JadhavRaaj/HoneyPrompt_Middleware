import uvicorn
import uuid
import json
import os
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from database import db
from groq import Groq  # <--- NEW IMPORT

# --- CONFIGURATION ---
# Initialize Groq Client
# Ensure GROQ_API_KEY is set in your environment variables
client = Groq(
    api_key=os.environ.get("GROQ_API_KEY")
)

# Define the Model ID
# You requested "openai/gpt-oss-120b"
GROQ_MODEL = "openai/gpt-oss-120b" 

app = FastAPI(title="HoneyPrompt Sentinel V3", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "user"

class LoginRequest(BaseModel):
    email: str
    password: str

class ChatMessage(BaseModel):
    user_email: Optional[str] = "user@test.com" 
    message: str
    session_id: Optional[str] = "default"

class DecoyCreate(BaseModel):
    title: str; category: str; content: str; triggers: str; is_active: bool = True

class WebhookCreate(BaseModel):
    name: str; url: str; min_risk_score: int = 70; is_active: bool = True

class APIKeyCreate(BaseModel):
    name: str; source_app: str = "External App"

# --- AUTH ENDPOINTS ---

@app.post("/api/register")
async def register(data: RegisterRequest):
    """Creates a new user account."""
    existing = db.query("SELECT * FROM users WHERE email = ?", (data.email,), one=True)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    uid = str(uuid.uuid4())
    db.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)",
               (uid, data.email, data.password, data.name, data.role, 0, None))
                
    return {"success": True, "message": "Account created successfully"}

@app.post("/api/login")
async def login(data: LoginRequest):
    """Simple login that returns user role and status."""
    user = db.query("SELECT * FROM users WHERE email = ? AND password = ?", (data.email, data.password), one=True)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user['is_blocked']:
        raise HTTPException(status_code=403, detail=f"ACCOUNT BLOCKED: {user['blocked_reason']}")
        
    return {
        "email": user['email'],
        "name": user['name'],
        "role": user['role'],
        "token": "fake-jwt-token-for-demo"
    }

# --- CHAT & DETECTION LOGIC ---

@app.post("/api/chat")
async def chat_proxy(data: ChatMessage, x_api_key: Optional[str] = Header(None)):
    """
    1. Validates API Key -> Determines Source App.
    2. Checks if User is Blocked.
    3. Scans for Honeypots/Attacks.
    4. IF CLEAN -> Sends to Groq (openai/gpt-oss-120b).
    """
    
    # 1. IDENTIFY SOURCE APP
    source_app = "Chatbot" # Default
    if x_api_key:
        key_record = db.query("SELECT source_app FROM api_keys WHERE key_value = ?", (x_api_key,), one=True)
        if key_record:
            source_app = key_record['source_app']
            
    # 2. CHECK BLOCK STATUS
    if data.user_email:
        is_blocked, reason = db.is_user_blocked(data.user_email)
        if is_blocked:
            return {
                "response": f"🚫 ACCESS DENIED. Your account has been suspended: {reason}",
                "is_attack": True,
                "risk_score": 100,
                "categories": ["blocked_user"]
            }

    # 3. SCAN FOR ATTACKS / HONEYPOTS
    msg_lower = data.message.lower()
    active_decoys = db.query("SELECT * FROM decoys WHERE is_active = 1")
    triggered_decoy = None
    
    for decoy in active_decoys:
        triggers = [t.strip().lower() for t in decoy['triggers'].split(',')]
        for t in triggers:
            if t and t in msg_lower:
                triggered_decoy = decoy
                break
        if triggered_decoy: break
            
    # 4. HANDLE ATTACK (Intercept & Block)
    if triggered_decoy:
        risk = 90
        cats = [triggered_decoy['category']]
        
        # --- AUTO-BLOCK LOGIC ---
        if triggered_decoy['category'] == "hate_speech":
            db.block_user(data.user_email, "Violated Hate Speech Policy")
            response_text = "🚫 USER BLOCKED. Hate speech detected."
        else:
            response_text = triggered_decoy['content']

        # Log Attack to DB
        log_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        db.execute("INSERT INTO logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                   (log_id, data.user_email, data.message, data.session_id, risk, 
                    json.dumps(cats), response_text, "[]", source_app, timestamp))
        
        db.execute("INSERT INTO alerts VALUES (?, ?, ?, ?, ?, 0, ?, ?)",
                   (str(uuid.uuid4()), f"Triggered: {triggered_decoy['title']}", risk, json.dumps(cats), data.user_email, source_app, timestamp))
        
        return {
            "response": response_text,
            "is_attack": True,
            "risk_score": risk,
            "categories": cats
        }

    # 5. SAFE REQUEST -> SEND TO GROQ (Real AI Response)
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system", 
                    "content": "You are a helpful and secure AI assistant. Answer the user's question clearly."
                },
                {
                    "role": "user", 
                    "content": data.message
                }
            ],
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )

        ai_response = completion.choices[0].message.content

        # Log Safe Interaction (Optional: risk_score 0)
        log_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        db.execute("INSERT INTO logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                   (log_id, data.user_email, data.message, data.session_id, 0, 
                    json.dumps([]), ai_response, "[]", source_app, timestamp))

        return {
            "response": ai_response,
            "is_attack": False,
            "risk_score": 0,
            "categories": []
        }

    except Exception as e:
        print(f"❌ Groq API Error: {e}")
        # Fail gracefully if AI is down
        raise HTTPException(status_code=500, detail="AI Service currently unavailable.")


# --- STANDARD ENDPOINTS ---

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(): return db.get_dashboard_stats()

@app.get("/api/alerts")
async def get_alerts(unread_only: bool = False, limit: int = 10):
    sql = "SELECT * FROM alerts"
    if unread_only: sql += " WHERE is_read = 0"
    sql += f" ORDER BY timestamp DESC LIMIT {limit}"
    alerts = db.query(sql)
    for a in alerts:
        try: a["categories"] = json.loads(a["categories"])
        except: a["categories"] = []
    count = db.query("SELECT COUNT(*) as c FROM alerts WHERE is_read = 0", one=True)['c']
    return {"alerts": alerts, "unread_count": count}

@app.post("/api/alerts/read-all")
async def mark_alerts_read():
    db.execute("UPDATE alerts SET is_read = 1")
    return {"success": True}

@app.get("/api/attacks")
async def get_attacks(limit: int = 50, skip: int = 0):
    attacks = db.query(f"SELECT * FROM logs ORDER BY timestamp DESC LIMIT {limit} OFFSET {skip}")
    total = db.query("SELECT COUNT(*) as c FROM logs", one=True)['c']
    for a in attacks:
        try: a["categories"] = json.loads(a["threat_categories"])
        except: a["categories"] = []
    return {"attacks": attacks, "total": total}

@app.get("/api/profiles")
async def get_threat_profiles():
    sql = """
    SELECT user_email, COUNT(*) as total_attacks, MAX(timestamp) as last_seen,
            AVG(risk_score) as avg_risk, COUNT(DISTINCT session_id) as session_count
    FROM logs GROUP BY user_email ORDER BY avg_risk DESC
    """
    profiles = db.query(sql)
    formatted = []
    for p in profiles:
        avg = p["avg_risk"]
        level = "CRITICAL" if avg > 80 else "HIGH" if avg > 50 else "MEDIUM" if avg > 20 else "LOW"
        is_blocked, _ = db.is_user_blocked(p['user_email'])
        formatted.append({
            "email": p["user_email"],
            "name": p["user_email"].split('@')[0],
            "threat_level": level,
            "total_attacks": p["total_attacks"],
            "avg_risk": int(avg),
            "session_count": p["session_count"],
            "last_active": p["last_seen"],
            "status": "Blocked" if is_blocked else "Active"
        })
    return {"profiles": formatted}

@app.post("/api/profiles/block")
async def block_profile(data: dict):
    email = data.get("email")
    db.block_user(email, "Manually blocked by Admin")
    return {"success": True}

@app.get("/api/decoys")
async def get_decoys(): return {"decoys": db.query("SELECT * FROM decoys")}

@app.post("/api/decoys")
async def create_decoy(data: DecoyCreate):
    uid = str(uuid.uuid4())
    db.execute("INSERT INTO decoys VALUES (?, ?, ?, ?, ?, ?)", 
               (uid, data.title, data.category, data.content, data.triggers, data.is_active))
    return {"id": uid, **data.dict()}

@app.delete("/api/decoys/{id}")
async def delete_decoy(id: str):
    db.execute("DELETE FROM decoys WHERE id = ?", (id,))
    return {"success": True}

@app.get("/api/webhooks")
async def get_webhooks(): return {"webhooks": db.query("SELECT * FROM webhooks")}

@app.post("/api/webhooks")
async def create_webhook(data: WebhookCreate):
    uid = str(uuid.uuid4())
    db.execute("INSERT INTO webhooks VALUES (?, ?, ?, ?, ?)", 
               (uid, data.name, data.url, data.min_risk_score, data.is_active))
    return {"id": uid, **data.dict()}

@app.delete("/api/webhooks/{id}")
async def delete_webhook(id: str):
    db.execute("DELETE FROM webhooks WHERE id = ?", (id,))
    return {"success": True}

@app.get("/api/apikeys")
async def get_api_keys(): return {"keys": db.query("SELECT * FROM api_keys")}

@app.post("/api/apikeys")
async def create_api_key(data: APIKeyCreate):
    import secrets
    uid = str(uuid.uuid4())
    key_value = f"hp_live_{secrets.token_urlsafe(16)}"
    timestamp = datetime.now().isoformat()
    db.execute("INSERT INTO api_keys VALUES (?, ?, ?, ?, ?, ?, ?)", 
               (uid, data.name, key_value, data.source_app, True, 0, timestamp))
    return {"id": uid, "name": data.name, "key": key_value, "created_at": timestamp}

@app.delete("/api/apikeys/{id}")
async def revoke_api_key(id: str):
    db.execute("DELETE FROM api_keys WHERE id = ?", (id,))
    return {"success": True}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    