# app/services/asr_service.py

import os
import asyncio
from typing import Optional

from deepgram import (
    DeepgramClient,
    DeepgramClientOptions,
    LiveTranscriptionEvents,
    LiveOptions,
)
from dotenv import load_dotenv

load_dotenv()


class ASRService:
    def __init__(self, callback):
        """
        callback: async function(text: str, is_final: bool, sentiment: Optional[str])
        """
        self.api_key: Optional[str] = os.getenv("DEEPGRAM_API_KEY")
        if not self.api_key:
            print("❌ ERROR: DEEPGRAM_API_KEY is missing in .env")

        self.callback = callback
        self.connection = None

    async def start(self):
        """Connect to Deepgram Live and start receiving transcripts."""
        config = DeepgramClientOptions(options={"keepalive": "true"})
        deepgram = DeepgramClient(self.api_key, config)

        self.connection = deepgram.listen.asynclive.v("1")

        loop = asyncio.get_running_loop()

        # ----- Event handlers MUST be plain functions, not bound async methods -----

        def on_transcript(conn, result, **kwargs):
            """Called by Deepgram when a transcript chunk arrives."""
            try:
                if not result.channel.alternatives:
                    return

                sentence = result.channel.alternatives[0].transcript
                if not sentence:
                    return

                is_final = result.is_final
                print(f"📝 Heard: '{sentence}' (final={is_final})")

                # Schedule your async callback back on the FastAPI event loop
                loop.create_task(self.callback(sentence, is_final, None))
            except Exception as e:
                print(f"❌ Error in on_transcript handler: {e}")

        def on_error(conn, error, **kwargs):
            print(f"❌ Deepgram Error: {error}")

        def on_close(conn, close, **kwargs):
            print("✓ Deepgram connection closed")

        # Register handlers with correct signatures
        self.connection.on(LiveTranscriptionEvents.Transcript, on_transcript)
        self.connection.on(LiveTranscriptionEvents.Error, on_error)
        self.connection.on(LiveTranscriptionEvents.Close, on_close)

        # Audio format must match test_client.py
        options = LiveOptions(
            model="nova-2",
            language="en-US",
            smart_format=True,
            interim_results=True,
            encoding="linear16",  # PCM 16‑bit
            sample_rate=16000,    # matches RATE in test_client.py
            channels=1,           # mono
        )

        await self.connection.start(options)
        print("✓ Deepgram Live ASR connected")

    async def send_audio(self, audio_chunk: bytes):
        """Send raw audio bytes to Deepgram."""
        if self.connection:
            await self.connection.send(audio_chunk)

    async def stop(self):
        """Cleanly close the Deepgram connection."""
        if self.connection:
            await self.connection.finish()
            self.connection = None
