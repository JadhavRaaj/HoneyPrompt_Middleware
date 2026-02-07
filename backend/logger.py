import json
import os
from datetime import datetime

LOG_FILE = "attacks.json"

def log_threat(user_message, analysis, ai_response):
    """
    Logs a detected threat to a JSON file.
    """
    # 1. Create the log entry structure
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "original_prompt": user_message,
        "threat_categories": analysis["categories"],
        "risk_score": analysis["risk_score"],
        "system_response": ai_response,
        "session_id": "default-session" # Placeholder for future expansion
    }

    # 2. Read existing logs (if file exists)
    logs = []
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, "r") as f:
                logs = json.load(f)
        except json.JSONDecodeError:
            logs = [] # Start fresh if file is corrupted

    # 3. Append new log
    logs.append(log_entry)

    # 4. Write back to file
    with open(LOG_FILE, "w") as f:
        json.dump(logs, f, indent=4)

    print(f"📁 [LOGGING]: Attack saved to {LOG_FILE}")

def get_logs():
    """
    Retrieves all logs for the dashboard.
    """
    if not os.path.exists(LOG_FILE):
        return []
    
    with open(LOG_FILE, "r") as f:
        try:
            return json.load(f)
        except:
            return []