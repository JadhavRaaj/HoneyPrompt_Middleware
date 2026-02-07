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
    triggers: str  # <--- NEW FIELD
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
    for a in alerts:
        try: a["categories"] = json.loads(a["categories"])
        except: a["categories"] = []     
    count = db.query("SELECT COUNT(*) as c FROM alerts WHERE is_read = 0", one=True)['c']
    return {"alerts": alerts, "unread_count": count}

@app.post("/api/alerts/read-all")
async def mark_alerts_read():
    """Marks all alerts as read."""
    db.execute("UPDATE alerts SET is_read = 1")
    return {"success": True}

# --- ATTACK LOGS ENDPOINTS ---

@app.get("/api/attacks")
async def get_attacks(limit: int = 50, skip: int = 0):
    """Returns paginated attack logs."""
    attacks = db.query(f"SELECT * FROM logs ORDER BY timestamp DESC LIMIT {limit} OFFSET {skip}")
    total = db.query("SELECT COUNT(*) as c FROM logs", one=True)['c']
    for a in attacks:
        try: a["categories"] = json.loads(a["threat_categories"])
        except: a["categories"] = []
    return {"attacks": attacks, "total": total}

# --- THREAT PROFILES ENDPOINT ---

@app.get("/api/profiles")
async def get_threat_profiles():
    """Aggregates logs to show user risk profiles."""
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
    formatted = []
    for p in profiles:
        avg = p["avg_risk"]
        level = "CRITICAL" if avg > 80 else "HIGH" if avg > 50 else "MEDIUM" if avg > 20 else "LOW"
        formatted.append({
            "email": p["user_email"],
            "name": p["user_email"].split('@')[0],
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
    # Ensure we insert all 6 fields: id, title, category, content, triggers, is_active
    db.execute("INSERT INTO decoys VALUES (?, ?, ?, ?, ?, ?)", 
               (uid, data.title, data.category, data.content, data.triggers, data.is_active))
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
    1. Checks if the message triggers any Active Honeypots.
    2. If yes -> Returns fake bait & logs attack.
    3. If no -> Returns safe generic response.
    """
    msg_lower = data.message.lower()
    
    # 1. Fetch active decoys from DB
    active_decoys = db.query("SELECT * FROM decoys WHERE is_active = 1")
    
    triggered_decoy = None
    
    # 2. Check for triggers
    for decoy in active_decoys:
        # Split comma-separated triggers: "admin, root, secret" -> ["admin", "root", "secret"]
        triggers = [t.strip().lower() for t in decoy['triggers'].split(',')]
        for t in triggers:
            if t and t in msg_lower: # basic keyword matching
                triggered_decoy = decoy
                break
        if triggered_decoy:
            break
            
    # 3. IF ATTACK DETECTED
    if triggered_decoy:
        risk = 90
        cats = [triggered_decoy['category']]
        
        log_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        # Log to 'logs' table
        db.execute("INSERT INTO logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                   (log_id, "user@test.com", data.message, data.session_id, risk, 
                    json.dumps(cats), triggered_decoy['content'], "[]", timestamp))
        
        # Log to 'alerts' table
        db.execute("INSERT INTO alerts VALUES (?, ?, ?, ?, ?, 0, ?)",
                   (str(uuid.uuid4()), f"Triggered: {triggered_decoy['title']}", risk, json.dumps(cats), "user@test.com", timestamp))
        
        return {
            "response": triggered_decoy['content'], # <--- THE BAIT
            "is_attack": True,
            "risk_score": risk,
            "categories": cats
        }

    # 4. HANDLE SAFE MESSAGE
    return {
        "response": "I am a secure AI assistant. How can I help you?",
        "is_attack": False,
        "risk_score": 0,
        "categories": []
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)