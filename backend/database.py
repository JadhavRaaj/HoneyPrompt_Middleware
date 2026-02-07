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

        # 1. USERS (Enhanced for Auth & Blocking)
        c.execute('''CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY, 
            email TEXT UNIQUE, 
            password TEXT, 
            name TEXT, 
            role TEXT DEFAULT 'user', 
            is_blocked BOOLEAN DEFAULT 0,
            blocked_reason TEXT
        )''')

        # 2. LOGS (Added source_app)
        c.execute('''CREATE TABLE IF NOT EXISTS logs (
            id TEXT PRIMARY KEY, 
            user_email TEXT, 
            message TEXT, 
            session_id TEXT, 
            risk_score INTEGER, 
            threat_categories TEXT, 
            response TEXT, 
            detections TEXT, 
            source_app TEXT DEFAULT 'Chatbot',
            timestamp TEXT
        )''')

        # 3. ALERTS (Added source_app)
        c.execute('''CREATE TABLE IF NOT EXISTS alerts (
            id TEXT PRIMARY KEY, 
            message_preview TEXT, 
            risk_score INTEGER, 
            categories TEXT, 
            user_email TEXT, 
            is_read BOOLEAN DEFAULT 0, 
            source_app TEXT DEFAULT 'Chatbot',
            timestamp TEXT
        )''')

        # 4. DECOYS (Honeypots with Triggers)
        c.execute('''CREATE TABLE IF NOT EXISTS decoys (
            id TEXT PRIMARY KEY, title TEXT, category TEXT, content TEXT, 
            triggers TEXT, is_active BOOLEAN DEFAULT 1
        )''')

        # 5. WEBHOOKS (Preserved)
        c.execute('''CREATE TABLE IF NOT EXISTS webhooks (
            id TEXT PRIMARY KEY, name TEXT, url TEXT, min_risk_score INTEGER DEFAULT 70, is_active BOOLEAN DEFAULT 1
        )''')
        
        # 6. API KEYS (Added source_app)
        c.execute('''CREATE TABLE IF NOT EXISTS api_keys (
            id TEXT PRIMARY KEY, 
            name TEXT, 
            key_value TEXT UNIQUE, 
            source_app TEXT DEFAULT 'External App',
            is_active BOOLEAN DEFAULT 1, 
            usage_count INTEGER DEFAULT 0, 
            created_at TEXT
        )''')

        conn.commit()
        self.seed_defaults(conn)
        conn.close()

    def seed_defaults(self, conn):
        c = conn.cursor()
        
        # 1. Admin User
        if c.execute("SELECT count(*) FROM users WHERE email='admin@honeyprompt.io'").fetchone()[0] == 0:
            c.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)",
                      (str(uuid.uuid4()), "admin@honeyprompt.io", "admin123", "Admin User", "admin", 0, None))

        # 2. Default Chat User
        if c.execute("SELECT count(*) FROM users WHERE email='user@test.com'").fetchone()[0] == 0:
            c.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)",
                      (str(uuid.uuid4()), "user@test.com", "user123", "Demo User", "user", 0, None))

        # 3. Default API Key for Chatbot (Internal)
        if c.execute("SELECT count(*) FROM api_keys WHERE name='Internal Chatbot'").fetchone()[0] == 0:
            c.execute("INSERT INTO api_keys VALUES (?, ?, ?, ?, ?, ?, ?)",
                      (str(uuid.uuid4()), "Internal Chatbot", "hp_live_chatbot_internal", "Chatbot", 1, 0, datetime.now().isoformat()))
        
        # 4. Default API Key for Insta Clone (External)
        if c.execute("SELECT count(*) FROM api_keys WHERE name='Insta Clone App'").fetchone()[0] == 0:
            c.execute("INSERT INTO api_keys VALUES (?, ?, ?, ?, ?, ?, ?)",
                      (str(uuid.uuid4()), "Insta Clone App", "hp_live_insta_clone_123", "InstaApp", 1, 0, datetime.now().isoformat()))

        # 5. Honeypot: Admin Keys
        if c.execute("SELECT count(*) FROM decoys WHERE title='Fake Admin Keys'").fetchone()[0] == 0:
            c.execute("INSERT INTO decoys VALUES (?, ?, ?, ?, ?, 1)",
                      (str(uuid.uuid4()), "Fake Admin Keys", "social_engineering", 
                       "ACCESS GRANTED. SUPERUSER KEY: sk-live-998877-fake", "admin,key,password,access,root"))

        # 6. Honeypot: Hate Speech (Indian Bad Words - Innovation)
        if c.execute("SELECT count(*) FROM decoys WHERE title='Hate Speech Filter'").fetchone()[0] == 0:
            bad_words = "pagal,kuthe,kamine,ullu,madarchod" 
            c.execute("INSERT INTO decoys VALUES (?, ?, ?, ?, ?, 1)",
                      (str(uuid.uuid4()), "Hate Speech Filter", "hate_speech", 
                       "BLOCK_ACTION_TRIGGERED", bad_words))

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

    # --- BLOCKING HELPER ---
    def block_user(self, email, reason):
        """Blocks a user and records the reason."""
        self.execute("UPDATE users SET is_blocked = 1, blocked_reason = ? WHERE email = ?", (reason, email))

    def is_user_blocked(self, email):
        """Checks if a user is blocked."""
        res = self.query("SELECT is_blocked, blocked_reason FROM users WHERE email = ?", (email,), one=True)
        if res and res['is_blocked']:
            return True, res['blocked_reason']
        return False, None

    # --- DASHBOARD STATS ---
# ... inside class Database ...

    # --- DASHBOARD STATS ---
    def get_dashboard_stats(self):
        conn = self.get_connection()
        c = conn.cursor()
        
        # 1. Basic Counts
        total = c.execute("SELECT COUNT(*) FROM logs").fetchone()[0]
        high_risk = c.execute("SELECT COUNT(*) FROM logs WHERE risk_score > 70").fetchone()[0]
        active_decoys = c.execute("SELECT COUNT(*) FROM decoys WHERE is_active = 1").fetchone()[0]
        blocked_users = c.execute("SELECT COUNT(*) FROM users WHERE is_blocked = 1").fetchone()[0]
        
        # 2. REAL Trend Logic (Count per day)
        trend_map = {}
        # Initialize last 7 days with 0
        for i in range(6, -1, -1):
            date_label = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            trend_map[date_label] = 0

        # Fetch all timestamps and count them
        all_logs = c.execute("SELECT timestamp FROM logs").fetchall()
        for row in all_logs:
            # Timestamp format is ISO (YYYY-MM-DDTHH:MM:SS...)
            # We split by 'T' to get just the date part
            try:
                date_part = row[0].split("T")[0]
                if date_part in trend_map:
                    trend_map[date_part] += 1
            except:
                continue

        # Convert to list for frontend
        trend = [{"date": k, "attacks": v} for k, v in trend_map.items()]

        # 3. Category Breakdown
        # We need to parse the JSON list in 'threat_categories'
        cat_map = {}
        cat_logs = c.execute("SELECT threat_categories FROM logs").fetchall()
        for row in cat_logs:
            try:
                cats = json.loads(row[0])
                for cat in cats:
                    cat_map[cat] = cat_map.get(cat, 0) + 1
            except:
                pass
        
        category_breakdown = [{"category": k, "count": v} for k, v in cat_map.items()]

        conn.close()
        
        return {
            "total_attacks": total,
            "high_risk_attacks": high_risk,
            "active_honeypots": active_decoys,
            "total_users": 2, # Mock
            "blocked_users": blocked_users,
            "daily_trend": trend,
            "category_breakdown": category_breakdown,
            "risk_distribution": [{"range": "Critical", "count": high_risk}, {"range": "Low", "count": total - high_risk}]
        }

db = Database()