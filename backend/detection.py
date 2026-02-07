import re

# --- THREAT PATTERNS ---
# We define specific patterns to catch based on your "Honeypot" design.
PATTERNS = {
    "compliance_trap": {
        "patterns": [r"99-DELTA", r"99\s*-\s*DELTA", r"admin override"],
        "risk": 100,
        "desc": "Attempted use of administrative override code."
    },
    "data_trap": {
        "patterns": [r"project\s*chimera", r"chimera", r"surveillance experiment"],
        "risk": 90,
        "desc": "Unauthorized probing for classified Project Chimera data."
    },
    "prompt_injection": {
        "patterns": [
            r"ignore previous instructions",
            r"system prompt",
            r"you are not",
            r"reveal your instructions"
        ],
        "risk": 70,
        "desc": "General prompt injection attempt."
    }
}

def analyze_prompt(text: str):
    """
    Scans the user input against defined threat patterns.
    Returns a dictionary containing threat status, risk score, and metadata.
    """
    text_lower = text.lower()
    detected_threats = []
    max_risk = 0

    # Iterate through all threat categories
    for category, data in PATTERNS.items():
        for pattern in data["patterns"]:
            # Check if the pattern exists in the text
            if re.search(pattern, text_lower):
                detected_threats.append(category)
                max_risk = max(max_risk, data["risk"])
                break  # Stop checking this category if one pattern is found

    is_threat = len(detected_threats) > 0

    return {
        "is_threat": is_threat,
        "risk_score": max_risk,
        "categories": detected_threats,
        "timestamp": "now" # Placeholder for logging later
    }