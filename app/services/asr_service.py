import assemblyai as aai
from app.config import Config
import asyncio


class ASRService:
    def __init__(self, callback):
        self.api_key = Config.ASSEMBLYAI_API_KEY
        self.callback = callback
        self.transcriber = None
        self.loop = None
        
        # Configure AssemblyAI
        aai.settings.api_key = self.api_key


    def _on_data(self, transcript: aai.RealtimeTranscript):
        """Synchronous callback function to handle incoming transcripts."""
        if not transcript.text:
            return

        is_final = transcript.message_type == aai.RealtimeTranscriptType.FinalTranscript
        
        # Universal-Streaming doesn't provide sentiment in real-time
        # You can add it later via post-processing if needed
        sentiment = None

        # Schedule the async callback in the event loop
        if self.loop:
            asyncio.run_coroutine_threadsafe(
                self.callback(transcript.text, is_final, sentiment),
                self.loop
            )


    def _on_error(self, error: aai.RealtimeError):
        """Synchronous callback function to handle errors."""
        print(f"❌ AssemblyAI Error: {error}")


    def _on_open(self, session_opened: aai.RealtimeSessionOpened):
        """Called when the connection opens."""
        print(f"✓ AssemblyAI Universal-Streaming session opened")
        print(f"  Session ID: {session_opened.session_id}")


    def _on_close(self):
        """Called when the connection closes."""
        print("✓ AssemblyAI session closed")


    async def start(self):
        """Starts the Universal-Streaming transcription session."""
        print("Starting AssemblyAI Universal-Streaming Service...")
        
        # Store the current event loop
        self.loop = asyncio.get_event_loop()
        
        # Create the transcriber with Universal-Streaming configuration
        self.transcriber = aai.RealtimeTranscriber(
            on_data=self._on_data,
            on_error=self._on_error,
            on_open=self._on_open,
            on_close=self._on_close,
            sample_rate=16_000,
            encoding=aai.AudioEncoding.pcm_s16le,
            # Universal-Streaming specific settings
            end_utterance_silence_threshold=700,  # ms of silence before considering utterance complete
            disable_partial_transcripts=False,  # Enable interim results for low latency
        )
        
        # Connect (this is synchronous, not async)
        self.transcriber.connect()
        
        print("✓ AssemblyAI Universal-Streaming Service ready!")


    async def send_audio(self, audio_chunk):
        """Streams an audio chunk to AssemblyAI."""
        if self.transcriber:
            # Run in thread pool since stream() is blocking
            await asyncio.get_event_loop().run_in_executor(
                None, 
                self.transcriber.stream, 
                audio_chunk
            )


    async def stop(self):
        """Stops the real-time transcription session."""
        if self.transcriber:
            # Run in thread pool since close() is blocking
            await asyncio.get_event_loop().run_in_executor(
                None,
                self.transcriber.close
            )
            self.transcriber = None
            print("✓ AssemblyAI Universal-Streaming Service stopped.")
