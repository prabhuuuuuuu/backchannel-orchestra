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
    """
    Deepgram-based streaming ASR.
    - Expects 16 kHz, mono, 16-bit PCM audio from client.
    - Calls async callback(text: str, is_final: bool) for every non-empty transcript.
    """

    def __init__(self, callback):
        # callback: async function(text: str, is_final: bool)
        self.api_key: Optional[str] = os.getenv("DEEPGRAM_API_KEY")
        if not self.api_key:
            print("ERROR: DEEPGRAM_API_KEY is missing in .env")
        self.callback = callback
        self.connection = None

    async def start(self):
        """
        Connect to Deepgram Live and start receiving transcripts.
        """
        config = DeepgramClientOptions(options={"keepalive": "true"})
        dg = DeepgramClient(self.api_key, config)

        self.connection = dg.listen.asynclive.v("1")

        # Wrapper to avoid "multiple values for argument 'result'"
        def on_transcript(conn, result, **kwargs):
            # Schedule processing in the running event loop
            asyncio.create_task(self._handle_result(result))

        # Register the wrapper, NOT a bound method
        self.connection.on(LiveTranscriptionEvents.Transcript, on_transcript)

        options = LiveOptions(
            model="nova-2",
            language="en-US",
            smart_format=True,
            interim_results=True,
            encoding="linear16",
            sample_rate=16000,
            channels=1,
        )

        await self.connection.start(options)
        print("✓ Deepgram Live ASR connected")

    async def _handle_result(self, result):
        """
        Internal async handler used by on_transcript wrapper.
        """
        try:
            if not result.channel.alternatives:
                print("⚠ Deepgram: no alternatives in result")
                return

            alt = result.channel.alternatives[0]
            text = alt.transcript or ""
            is_final = bool(getattr(result, "is_final", False))

            # Log what Deepgram actually sent
            print(f"📝 Deepgram raw: '{text}' (final={is_final})")

            if text.strip():
                await self.callback(text, is_final, None)  # Always pass None for sentiment

        except Exception as e:
            print(f"ASRService._handle_result error: {e}")

    async def send_audio(self, audio_chunk: bytes):
        """
        Send raw PCM audio to Deepgram.
        """
        if self.connection:
            await self.connection.send(audio_chunk)

    async def stop(self):
        """
        Close Deepgram connection cleanly.
        """
        if self.connection:
            await self.connection.finish()
            self.connection = None
            print("✓ Deepgram Live ASR closed")
