# app/main.py

import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.services.asr_service import ASRService
from app.services.tts_service import MurfTTSService
from app.services.logic_engine import BackchannelLogic

load_dotenv()

app = FastAPI()

# If you have a frontend on 3000, this keeps it working
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tts_service = MurfTTSService()
logic_engine = BackchannelLogic()


@app.get("/")
async def root():
    return {"status": "Backchannel Orchestra API is running", "version": "2.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "mode": logic_engine.current_mode}


@app.websocket("/ws/session")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("✓ WebSocket client connected")

    # This is called by ASRService every time Deepgram has text
    async def on_transcript(text: str, is_final: bool, sentiment):

        await websocket.send_json({
            "type": "transcript",
            "text": text,
            "is_final": is_final,
            "sentiment": sentiment,
        })
        # Voice commands to switch mode
        lower = text.lower()
        if "switch to heckler" in lower:
            logic_engine.set_mode("heckler")
            await websocket.send_json({"type": "mode_change", "mode": "heckler"})
            print("🔥 Switched to HECKLER mode")
            return
        elif "switch to coach" in lower:
            logic_engine.set_mode("coach")
            await websocket.send_json({"type": "mode_change", "mode": "coach"})
            print("💪 Switched to COACH mode")
            return

        # Ask the brain what to say
        reaction_plan = logic_engine.decide_reaction(text, is_final, sentiment)

        if reaction_plan:
            print(f"🎭 Orchestrating {len(reaction_plan)} voice(s)... Text: '{text}'")

            # Generate all backchannels in parallel
            tasks = [
                tts_service.generate_audio(
                    reaction["text"],
                    reaction["voice_id"],
                    reaction["style"],
                )
                for reaction in reaction_plan
            ]

            audio_results = await asyncio.gather(*tasks)

            # Send audio bytes (and optional metadata) back to client
            for idx, audio_bytes in enumerate(audio_results):
                if not audio_bytes:
                    continue

                await websocket.send_bytes(audio_bytes)
                await websocket.send_json(
                    {
                        "type": "feedback",
                        "text": reaction_plan[idx]["text"],
                        "voice": reaction_plan[idx]["voice_id"],
                    }
                )
                print(f"✅ Sent: '{reaction_plan[idx]['text']}'")

    # Wire up ASR
    asr_service = ASRService(callback=on_transcript)
    await asr_service.start()  # Deepgram start() is async

    try:
        while True:
            # Receive raw audio from test_client / frontend
            data = await websocket.receive_bytes()
            print("Server got audio chunk:", len(data))
            await asr_service.send_audio(data)
    except WebSocketDisconnect:
        print("❌ Client disconnected")
        await asr_service.stop()
