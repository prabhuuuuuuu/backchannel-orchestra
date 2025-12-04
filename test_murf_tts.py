import asyncio
from app.services.tts_service import MurfTTSService
from app.config import Config  # just to ensure env is loaded

async def main():
    tts = MurfTTSService()

    text = "Testing, this is a Murf Falcon backchannel."
    voice_id = "en-US-terrell"  # or "en-US-alicia" / "en-US-miles"

    style = {"style": "Conversational", "rate": 0, "pitch": 0}

    audio_bytes = await tts.generate_audio(text, voice_id, style)

    if audio_bytes:
        with open("test_output.mp3", "wb") as f:
            f.write(audio_bytes)
        print("Saved audio to test_output.mp3")
    else:
        print("No audio returned from Murf")

if __name__ == "__main__":
    asyncio.run(main())
