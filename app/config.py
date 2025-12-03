import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # API Keys
    MURF_API_KEY = os.getenv("MURF_API_KEY")
    ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
    
    # Feature 2: The Orchestra (Multiple Voices)
    VOICES = {
        "primary_coach": os.getenv("VOICE_PRIMARY_COACH", "en-US-ken"),
        "tough_heckler": os.getenv("VOICE_TOUGH_HECKLER", "en-US-terrell"),
        "crowd_member_1": os.getenv("VOICE_CROWD_MEMBER_1", "en-US-alicia"),
        "crowd_member_2": os.getenv("VOICE_CROWD_MEMBER_2", "en-US-miles")
    }

    # Feature 3: Persona Configuration (Prosody settings)
    MODES = {
        "coach": {"style": "Conversational", "pitch": 0, "rate": 0},
        "heckler": {"style": "Angry", "pitch": -10, "rate": 10},
        "supportive": {"style": "Calm", "pitch": 5, "rate": -5}
    }

    # Performance Settings
    BACKCHANNEL_COOLDOWN = float(os.getenv("BACKCHANNEL_COOLDOWN", "2.5"))
    DEFAULT_MODE = os.getenv("DEFAULT_MODE", "coach")
    DEBUG_SENTIMENT = os.getenv("DEBUG_SENTIMENT", "false").lower() == "true"

