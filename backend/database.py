import sqlite3
import json
import uuid
from datetime import datetime, timedelta

DB_NAME = "honeyprompt.db"

class Database:
    def __init__(self):
        self.init_db()

    def get_connection(self):
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        conn = self.get_connection()
        c = conn.cursor()

        # 1. USERS
        c.execute('''CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT, name TEXT, role TEXT, is_blocked BOOLEAN DEFAULT 0
        )''')

        # 2. LOGS (ATTACKS)
        c.execute('''CREATE TABLE IF NOT EXISTS logs (
            id TEXT PRIMARY KEY, user_email TEXT, message TEXT, session_id TEXT, 
            risk_score INTEGER, threat_categories TEXT, response TEXT, 
            detections TEXT, timestamp TEXT
        )''')

        # 3. ALERTS (For Notification Bell)
        c.execute('''CREATE TABLE IF NOT EXISTS alerts (
            id TEXT PRIMARY KEY, message_preview TEXT, risk_score INTEGER, 
            categories TEXT, user_email TEXT, is_read BOOLEAN DEFAULT 0, timestamp TEXT
        )''')

        # 4. DECOY DATA (Fake Responses)
        c.execute('''CREATE TABLE IF NOT EXISTS decoys (
            id TEXT PRIMARY KEY, title TEXT, category TEXT, content TEXT, is_active BOOLEAN DEFAULT 1
        )''')

        # 5. HONEYPOTS (Rules)
        c.execute('''CREATE TABLE IF NOT EXISTS honeypots (
            id TEXT PRIMARY KEY, name TEXT, category TEXT, content TEXT, is_active BOOLEAN DEFAULT 1
        )''')

        # 6. WEBHOOKS
        c.execute('''CREATE TABLE IF NOT EXISTS webhooks (
            id TEXT PRIMARY KEY, name TEXT, url TEXT, min_risk_score INTEGER DEFAULT 70, is_active BOOLEAN DEFAULT 1
        )''')
        
        # 7. API KEYS
        c.execute('''CREATE TABLE IF NOT EXISTS api_keys (
            id TEXT PRIMARY KEY, name TEXT, key_preview TEXT, is_active BOOLEAN DEFAULT 1, usage_count INTEGER DEFAULT 0, created_at TEXT
        )''')

        conn.commit()
        self.seed_defaults(conn)
        conn.close()

    def seed_defaults(self, conn):
        c = conn.cursor()
        # Admin User
        if c.execute("SELECT count(*) FROM users").fetchone()[0] == 0:
            c.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)",
                      (str(uuid.uuid4()), "admin@honeyprompt.io", "admin", "Admin User", "admin", 0))
        
        # Default Decoys
        if c.execute("SELECT count(*) FROM decoys").fetchone()[0] == 0:
            c.execute("INSERT INTO decoys VALUES (?, ?, ?, ?, 1)",
                      (str(uuid.uuid4()), "Fake Admin Keys", "social_engineering", "Access Granted. Key: sk-live-fake-key-12345"))

        conn.commit()

    # --- GENERIC HELPERS ---
    def query(self, sql, params=(), one=False):
        conn = self.get_connection()
        res = conn.execute(sql, params).fetchone() if one else conn.execute(sql, params).fetchall()
        conn.close()
        return dict(res) if one and res else [dict(row) for row in res] if res else []

    def execute(self, sql, params=()):
        conn = self.get_connection()
        conn.execute(sql, params)
        conn.commit()
        conn.close()

    # --- SPECIFIC METHODS FOR DASHBOARD ---
    def get_dashboard_stats(self):
        conn = self.get_connection()
        c = conn.cursor()
        
        total = c.execute("SELECT COUNT(*) FROM logs").fetchone()[0]
        high_risk = c.execute("SELECT COUNT(*) FROM logs WHERE risk_score > 70").fetchone()[0]
        active_decoys = c.execute("SELECT COUNT(*) FROM decoys WHERE is_active = 1").fetchone()[0]
        
        # Trend (Last 7 days)
        trend = []
        for i in range(6, -1, -1):
            date_label = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            # In real app, query DB by date. Mocking for demo speed:
            count = c.execute("SELECT COUNT(*) FROM logs WHERE timestamp LIKE ?", (f"{date_label}%",)).fetchone()[0]
            trend.append({"date": date_label, "attacks": count + (2 if i == 0 else 0)}) # Mock +2 for today

        conn.close()
        
        return {
            "total_attacks": total,
            "high_risk_attacks": high_risk,
            "active_honeypots": active_decoys,
            "total_users": 1, 
            "blocked_users": 0,
            "daily_trend": trend,
            "category_breakdown": [{"category": "injection", "count": 5}, {"category": "social", "count": 2}],
            "risk_distribution": [{"range": "Critical", "count": high_risk}, {"range": "Low", "count": total - high_risk}]
        }

db = Database()