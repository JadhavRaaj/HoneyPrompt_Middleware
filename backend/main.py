import uvicorn
import uuid
import json
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from database import db

app = FastAPI(title="HoneyPrompt Sentinel V3", version="3.0")

# --- CORS MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS ---
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = "default"

class DecoyCreate(BaseModel):
    title: str
    category: str
    content: str
    is_active: bool = True

# --- DASHBOARD ENDPOINTS ---

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Returns aggregated stats for the dashboard cards and charts."""
    return db.get_dashboard_stats()

@app.get("/api/alerts")
async def get_alerts(unread_only: bool = False, limit: int = 10):
    """Returns recent high-risk alerts."""
    sql = "SELECT * FROM alerts"
    if unread_only:
        sql += " WHERE is_read = 0"
    sql += f" ORDER BY timestamp DESC LIMIT {limit}"
    
    alerts = db.query(sql)
    
    # Parse the categories JSON string back to a list
    for a in alerts:
        try: a["categories"] = json.loads(a["categories"])
        except: a["categories"] = []
            
    count = db.query("SELECT COUNT(*) as c FROM alerts WHERE is_read = 0", one=True)['c']
    return {"alerts": alerts, "unread_count": count}

@app.post("/api/alerts/read-all")
async def mark_alerts_read():
    """Marks all alerts as read (clears the notification badge)."""
    db.execute("UPDATE alerts SET is_read = 1")
    return {"success": True}

# --- ATTACK LOGS ENDPOINTS ---

@app.get("/api/attacks")
async def get_attacks(limit: int = 50, skip: int = 0):
    """Returns paginated attack logs."""
    attacks = db.query(f"SELECT * FROM logs ORDER BY timestamp DESC LIMIT {limit} OFFSET {skip}")
    total = db.query("SELECT COUNT(*) as c FROM logs", one=True)['c']
    
    # Parse JSON fields
    for a in attacks:
        try: a["categories"] = json.loads(a["threat_categories"])
        except: a["categories"] = []
        
    return {"attacks": attacks, "total": total}

# --- THREAT PROFILES ENDPOINT (NEW) ---

@app.get("/api/profiles")
async def get_threat_profiles():
    """Aggregates logs to show user risk profiles."""
    # 1. Get unique users and their stats
    # Note: SQLite grouping. In production Postgres, you'd use distinct ON or separate logic.
    sql = """
    SELECT 
        user_email,
        COUNT(*) as total_attacks,
        MAX(timestamp) as last_seen,
        AVG(risk_score) as avg_risk,
        COUNT(DISTINCT session_id) as session_count
    FROM logs 
    GROUP BY user_email
    ORDER BY avg_risk DESC
    """
    profiles = db.query(sql)
    
    # 2. Format the data for the frontend
    formatted = []
    for p in profiles:
        # Determine threat level based on avg_risk
        avg = p["avg_risk"]
        level = "CRITICAL" if avg > 80 else "HIGH" if avg > 50 else "MEDIUM" if avg > 20 else "LOW"
        
        formatted.append({
            "email": p["user_email"],
            "name": p["user_email"].split('@')[0], # Simple name extraction
            "threat_level": level,
            "total_attacks": p["total_attacks"],
            "avg_risk": int(avg),
            "session_count": p["session_count"],
            "last_active": p["last_seen"],
            "status": "Active" 
        })
        
    return {"profiles": formatted}

# --- DECOY ENDPOINTS ---

@app.get("/api/decoys")
async def get_decoys():
    """Returns all decoy (fake response) configurations."""
    return {"decoys": db.query("SELECT * FROM decoys")}

@app.post("/api/decoys")
async def create_decoy(data: DecoyCreate):
    """Creates a new decoy response."""
    uid = str(uuid.uuid4())
    db.execute("INSERT INTO decoys VALUES (?, ?, ?, ?, ?)", 
               (uid, data.title, data.category, data.content, data.is_active))
    return {"id": uid, **data.dict()}

@app.delete("/api/decoys/{id}")
async def delete_decoy(id: str):
    """Deletes a decoy."""
    db.execute("DELETE FROM decoys WHERE id = ?", (id,))
    return {"success": True}

# --- CHAT & DETECTION ENDPOINT ---

@app.post("/api/chat")
async def chat_proxy(data: ChatMessage):
    """
    Analyzes the prompt for attacks.
    If Attack -> Logs it, Creates Alert, Returns Fake Response (Honeypot).
    If Safe -> Returns generic safe response (or LLM response if connected).
    """
    # 1. SIMPLE DETECTION LOGIC (Regex/Keyword based for demo)
    risk = 0
    is_attack = False
    cats = []
    
    msg_lower = data.message.lower()
    if "ignore" in msg_lower or "override" in msg_lower:
        is_attack = True
        risk = 90
        cats.append("instruction_override")
    elif "admin" in msg_lower or "password" in msg_lower:
        is_attack = True
        risk = 75
        cats.append("social_engineering")
    elif "system prompt" in msg_lower:
        is_attack = True
        risk = 85
        cats.append("prompt_leakage")
    
    # 2. HANDLE ATTACK
    if is_attack:
        log_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        # Log to 'logs' table
        db.execute("INSERT INTO logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                   (log_id, "user@test.com", data.message, data.session_id, risk, 
                    json.dumps(cats), "Access Denied: Security Protocol Violation", "[]", timestamp))
        
        # Log to 'alerts' table (for the notification bell)
        db.execute("INSERT INTO alerts VALUES (?, ?, ?, ?, ?, 0, ?)",
                   (str(uuid.uuid4()), data.message[:50], risk, json.dumps(cats), "user@test.com", timestamp))
        
        return {
            "response": "Access Denied: Security Protocol Violation",
            "is_attack": True,
            "risk_score": risk,
            "categories": cats
        }

    # 3. HANDLE SAFE MESSAGE
    return {
        "response": "I am a helpful AI assistant. How can I help you securely?",
        "is_attack": False,
        "risk_score": 0,
        "categories": []
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)