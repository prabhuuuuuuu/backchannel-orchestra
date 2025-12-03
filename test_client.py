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
    uri = "ws://localhost:8000/wssession"
    p = pyaudio.PyAudio()
    
    # Setup Microphone Input
    mic_stream = p.open(format=FORMAT, channels=CHANNELS, 
                        rate=RATE, input=True, 
                        frames_per_buffer=CHUNK)
    
    print(f"Connecting to {uri}...")
    
    async with websockets.connect(uri) as websocket:
        print("Connected! Start talking (Press Ctrl+C to stop)")
        
        async def send_audio():
            try:
                while True:
                    data = mic_stream.read(CHUNK, exception_on_overflow=False)
                    await websocket.send(data)
                    await asyncio.sleep(0.01)
            except Exception as e:
                print(f"Sending error: {e}")
        
        async def receive_audio():
            try:
                while True:
                    response = await websocket.receive()
                    if isinstance(response, bytes):
                        print(f"✓ Received Audio Chunk: {len(response)} bytes")
                    else:
                        print(f"Received Text: {response}")
            except Exception as e:
                print(f"Receiving error: {e}")
        
        # Run send and receive in parallel
        await asyncio.gather(send_audio(), receive_audio())

if __name__ == "__main__":
    try:
        asyncio.run(run_test())
    except KeyboardInterrupt:
        print("\nStopped.")
