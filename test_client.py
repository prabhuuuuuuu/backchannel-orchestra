import asyncio
import websockets
import pyaudio

# Audio Configuration - MUST match Deepgram settings
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 8000  # Larger chunks = more reliable streaming

async def run_test(uri):
    p = pyaudio.PyAudio()
    
    # List available input devices
    print("\n🎤 Available microphones:")
    for i in range(p.get_device_count()):
        dev = p.get_device_info_by_index(i)
        if dev['maxInputChannels'] > 0:
            print(f"   [{i}] {dev['name']}")
    
    default_input = p.get_default_input_device_info()
    print(f"\n✓ Using: [{default_input['index']}] {default_input['name']}\n")

    try:
        mic_stream = p.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            input=True,
            frames_per_buffer=CHUNK
        )
    except Exception as e:
        print(f"❌ Microphone Error: {e}")
        return

    print(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✓ Connected! Speak into your microphone...\n")
            
            async def send_audio():
                try:
                    while True:
                        data = mic_stream.read(CHUNK, exception_on_overflow=False)
                        print("Mic chunk size:", len(data))
                        await websocket.send(data)
                        await asyncio.sleep(0.1)  # Small delay to prevent flooding
                except Exception as e:
                    print(f"Sending Error: {e}")

            async def receive_audio():
                try:
                    while True:
                        response = await websocket.recv()
                        if isinstance(response, bytes):
                            print(f"🔊 RECEIVED AUDIO (Backchannel) - {len(response)} bytes")
                        else:
                            print(f"📨 Server: {response}")
                except Exception as e:
                    print(f"Receiving Error: {e}")

            await asyncio.gather(send_audio(), receive_audio())
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
    finally:
        mic_stream.stop_stream()
        mic_stream.close()
        p.terminate()

if __name__ == "__main__":
    try:
        asyncio.run(run_test("ws://localhost:8000/ws/session"))
    except KeyboardInterrupt:
        print("\nStopped.")
