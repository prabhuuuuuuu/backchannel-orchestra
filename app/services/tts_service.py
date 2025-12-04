# app/services/tts_service.py
import aiohttp
import base64
import json
from app.config import Config

class MurfTTSService:
    def __init__(self):
        self.api_key = Config.MURF_API_KEY
        self.url = "https://api.murf.ai/v1/speech/generate"

    async def generate_audio(self, text: str, voice_id: str, style_config: dict):
        """Generates audio with specific voice and style."""
        headers = {
            "Content-Type": "application/json",
            "api-key": self.api_key,
        }  # ← Added closing brace
        
        payload = {
            "voiceId": voice_id,
            "text": text,
            "style": style_config.get("style", "Conversational"),
            "rate": style_config.get("rate", 0),
            "pitch": style_config.get("pitch", 0),
            "format": "MP3",
            "encodedAsBase64": True,  # CRITICAL for inline audio
        }  # ← Added closing brace

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(self.url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Try all possible base64 field names
                        audio_b64 = data.get("encodedAudio") or data.get("audioContent") or data.get("data")
                        
                        if audio_b64:
                            return base64.b64decode(audio_b64)
                        
                        # Fallback: download from URL if base64 is missing
                        audio_url = data.get("audioFile")
                        if audio_url:
                            print(f"⚠️ Fallback: Downloading audio from {audio_url}")
                            async with session.get(audio_url) as audio_resp:
                                if audio_resp.status == 200:
                                    return await audio_resp.read()
                        
                        print(f"❌ Murf Error [{voice_id}]: No audio data found. Keys: {list(data.keys())}")
                        return None
                    else:
                        error_text = await response.text()
                        print(f"❌ Murf API Error {response.status}: {error_text}")
                        return None
                        
            except Exception as e:
                print(f"❌ Connection Error in generate_audio: {e}")
                return None
