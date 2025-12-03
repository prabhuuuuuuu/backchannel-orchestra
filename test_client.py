import asyncio
import websockets
import pyaudio
import sys

# Audio Configuration - Must match what your ASR expects
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 4000

async def run_test():
    uri = "ws://localhost:8000/ws/session"
    p = pyaudio.PyAudio()
    
    # Setup Microphone Input
    mic_stream = p.open(format=FORMAT, channels=CHANNELS, 
                        rate=RATE, input=True, 
                        frames_per_buffer=CHUNK)
    
    print(f"Connecting to {uri}...")
    
    async with websockets.connect(uri) as websocket:
        print("✓ Connected! Start talking (Press Ctrl+C to stop)\n")
        
        async def send_audio():
            try:
                while True:
                    data = mic_stream.read(CHUNK, exception_on_overflow=False)
                    await websocket.send(data)
                    await asyncio.sleep(0.01)
            except Exception as e:
                print(f"❌ Sending error: {e}")
        
        async def receive_audio():
            try:
                async for message in websocket:  # ← FIXED: Changed from websocket.receive()
                    if isinstance(message, bytes):
                        print(f"🔊 Received Audio Chunk: {len(message)} bytes")
                        # In a real app, you'd play this audio here
                    else:
                        print(f"📨 Received Message: {message}")
            except Exception as e:
                print(f"❌ Receiving error: {e}")
        
        # Run send and receive in parallel
        await asyncio.gather(send_audio(), receive_audio())

if __name__ == "__main__":
    try:
        asyncio.run(run_test())
    except KeyboardInterrupt:
        print("\n✓ Stopped.")
        sys.exit(0)
