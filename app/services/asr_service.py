# app/services/asr_service.py

import os
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
    Deepgram-based streaming ASR service.
    - Streams 16kHz mono PCM from the WebSocket client.
    - Calls the provided async callback(text: str, is_final: bool) on each transcript.
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
        deepgram = DeepgramClient(self.api_key, config)

        # Create live connection
        self.connection = deepgram.listen.asynclive.v("1")

        # Register event handler
        self.connection.on(
            LiveTranscriptionEvents.Transcript,
            self._on_message,
        )

        # IMPORTANT: no sentiment flag here — only core ASR options
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

    async def _on_message(self, result, **kwargs):
        """
        Handler for incoming Deepgram transcripts.
        Extracts text and final flag, then calls self.callback.
        """
        if not result.channel.alternatives:
            return

        alt = result.channel.alternatives[0]
        sentence = alt.transcript
        if not sentence:
            return

        is_final = result.is_final

        print(f"📝 Heard: '{sentence}' (final={is_final})")

        # Forward to main logic
        await self.callback(sentence, is_final)

    async def send_audio(self, audio_chunk: bytes):
        """
        Send raw audio bytes to Deepgram.
        """
        if self.connection:
            await self.connection.send(audio_chunk)

    async def stop(self):
        """
        Cleanly close the Deepgram connection.
        """
        if self.connection:
            await self.connection.finish()
            self.connection = None
            print("✓ Deepgram Live ASR closed")
