import aiohttp
import base64
import json
from app.config import Config

class MurfTTSService:
    def __init__(self):
        self.api_key = Config.MURF_API_KEY
        self.url = "https://api.murf.ai/v1/speech/generate" 

    async def generate_audio(self, text: str, voice_id: str, style_config: dict):
        """
        Generates audio with specific voice and style.
        """
        headers = {
            "Content-Type": "application/json",
            "api-key": self.api_key
        }
        
        payload = {
            "voiceId": voice_id,
            "text": text,
            "style": style_config.get("style", "Conversational"),
            "rate": style_config.get("rate", 0),
            "pitch": style_config.get("pitch", 0),
            "format": "MP3"
        }

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(self.url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return base64.b64decode(data["audioContent"])
                    else:
                        error_text = await response.text()
                        print(f"Murf Error ({voice_id}): {error_text}")
                        return None
            except Exception as e:
                print(f"Connection Error: {e}")
                return None
