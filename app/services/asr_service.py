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
    Deepgram-based streaming ASR service.
    - Streams 16kHz mono PCM from the WebSocket client.
    - Calls the provided async callback(text, is_final, sentiment) on each transcript.
    """

    def __init__(self, callback):
        # callback: async function(text: str, is_final: bool, sentiment: Optional[str])
        self.api_key: Optional[str] = os.getenv("DEEPGRAM_API_KEY")
        if not self.api_key:
            print("ERROR: DEEPGRAM_API_KEY is missing in .env")

        self.callback = callback
        self.connection = None

    async def start(self):
        """
        Connect to Deepgram Live and start receiving transcripts
        with sentiment analysis enabled.
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

        # IMPORTANT: enable sentiment analysis here
        options = LiveOptions(
            model="nova-2",
            language="en-US",
            smart_format=True,
            interim_results=True,
            encoding="linear16",
            sample_rate=16000,
            channels=1,
            analyze_sentiment=True,  # <--- this turns sentiment ON
        )

        await self.connection.start(options)
        print("✓ Deepgram Live ASR connected with sentiment")

    async def _on_message(self, result, **kwargs):
        """
        Handler for incoming Deepgram transcripts.
        Extracts text, final flag, and sentiment label.
        Calls self.callback(text, is_final, sentiment).
        """
        if not result.channel.alternatives:
            return

        alt = result.channel.alternatives[0]
        sentence = alt.transcript
        if not sentence:
            return

        is_final = result.is_final

        # Default if sentiment not present
        sentiment: Optional[str] = None

        # Deepgram returns sentiment in 'sentiment' or 'sentiments' on the alternative
        # depending on SDK/version. We check both patterns defensively.
        if hasattr(alt, "sentiment") and alt.sentiment:
            # alt.sentiment is usually a single label: "positive" / "negative" / "neutral"
            sentiment = alt.sentiment
        elif hasattr(alt, "sentiments") and alt.sentiments:
            # Sometimes it's a list of {label, confidence}; pick highest confidence
            best = max(alt.sentiments, key=lambda s: getattr(s, "confidence", 0.0))
            sentiment = getattr(best, "label", None)

        print(
            f"📝 Heard: '{sentence}' (final={is_final}, sentiment={sentiment})"
        )

        # Forward to main logic
        await self.callback(sentence, is_final, sentiment)

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
