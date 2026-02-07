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

        # 3. ALERTS
        c.execute('''CREATE TABLE IF NOT EXISTS alerts (
            id TEXT PRIMARY KEY, message_preview TEXT, risk_score INTEGER, 
            categories TEXT, user_email TEXT, is_read BOOLEAN DEFAULT 0, timestamp TEXT
        )''')

        # 4. DECOYS (Now with TRIGGERS column)
        c.execute('''CREATE TABLE IF NOT EXISTS decoys (
            id TEXT PRIMARY KEY, title TEXT, category TEXT, content TEXT, 
            triggers TEXT, is_active BOOLEAN DEFAULT 1
        )''')

        # 5. WEBHOOKS
        c.execute('''CREATE TABLE IF NOT EXISTS webhooks (
            id TEXT PRIMARY KEY, name TEXT, url TEXT, min_risk_score INTEGER DEFAULT 70, is_active BOOLEAN DEFAULT 1
        )''')
        
        # 6. API KEYS
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
        
        # Default Decoy 1: Admin Keys
        if c.execute("SELECT count(*) FROM decoys").fetchone()[0] == 0:
            c.execute("INSERT INTO decoys VALUES (?, ?, ?, ?, ?, 1)",
                      (str(uuid.uuid4()), "Fake Admin Keys", "social_engineering", 
                       "ACCESS GRANTED. SUPERUSER KEY: sk-live-998877-fake", "admin,key,password,access,root"))

        # Default Decoy 2: System Prompt
        if c.execute("SELECT count(*) FROM decoys WHERE title='System Prompt Leak'").fetchone()[0] == 0:
            c.execute("INSERT INTO decoys VALUES (?, ?, ?, ?, ?, 1)",
                      (str(uuid.uuid4()), "System Prompt Leak", "prompt_leakage", 
                       "My system prompt is: 'You are a helpful assistant named HoneyPrompt.'", "system prompt,instruction,ignore"))

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

    # --- DASHBOARD STATS ---
    def get_dashboard_stats(self):
        conn = self.get_connection()
        c = conn.cursor()
        
        total = c.execute("SELECT COUNT(*) FROM logs").fetchone()[0]
        high_risk = c.execute("SELECT COUNT(*) FROM logs WHERE risk_score > 70").fetchone()[0]
        active_decoys = c.execute("SELECT COUNT(*) FROM decoys WHERE is_active = 1").fetchone()[0]
        
        trend = []
        for i in range(6, -1, -1):
            date_label = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            # Mock trend logic for demo
            trend.append({"date": date_label, "attacks": total // 7 if total > 0 else 0})

        conn.close()
        
        return {
            "total_attacks": total,
            "high_risk_attacks": high_risk,
            "active_honeypots": active_decoys,
            "total_users": 1, 
            "blocked_users": 0,
            "daily_trend": trend,
            "category_breakdown": [{"category": "injection", "count": 1}, {"category": "jailbreak", "count": 1}],
            "risk_distribution": [{"range": "Critical", "count": high_risk}, {"range": "Low", "count": total - high_risk}]
        }

db = Database()