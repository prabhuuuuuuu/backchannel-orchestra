# app/main.py

import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketState
from dotenv import load_dotenv

from app.services.asr_service import ASRService
from app.services.tts_service import MurfTTSService
from app.services.logic_engine import BackchannelLogic

load_dotenv()

app = FastAPI()

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
    return {"status": "Backchannel Orchestra API is running", "mode": logic_engine.current_mode}


@app.websocket("/ws/session")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("✓ WebSocket client connected")

    async def on_transcript(text: str, is_final: bool):
        # If the client disconnected, ignore late transcripts
        if websocket.client_state != WebSocketState.CONNECTED:
            return

        lower = text.lower()
        if "switch to heckler" in lower:
            logic_engine.set_mode("heckler")
            await websocket.send_json({"type": "modechange", "mode": "heckler"})
            return
        if "switch to coach" in lower:
            logic_engine.set_mode("coach")
            await websocket.send_json({"type": "modechange", "mode": "coach"})
            return

        reaction_plan = logic_engine.decide_reaction(text, is_final)
        if not reaction_plan:
            # Still forward transcript to frontend if you want
            await websocket.send_json(
                {"type": "transcript", "text": text, "is_final": is_final, "sentiment": logic_engine.sentiment_state}
            )
            return

        print(f"🎭 Orchestrating {len(reaction_plan)} voice(s)... Text: '{text}'")

        tasks = [
            tts_service.generate_audio(r["text"], r["voice_id"], r["style"])
            for r in reaction_plan
        ]
        audio_results = await asyncio.gather(*tasks)

        if websocket.client_state != WebSocketState.CONNECTED:
            return

        for idx, audio_bytes in enumerate(audio_results):
            if not audio_bytes:
                continue
            await websocket.send_bytes(audio_bytes)
            await websocket.send_json(
                {
                    "type": "feedback",
                    "text": reaction_plan[idx]["text"],
                    "voice": reaction_plan[idx]["voice_id"],
                    "sentiment": logic_engine.sentiment_state,
                }
            )
            print(f"✅ Sent: '{reaction_plan[idx]['text']}'")

    asr_service = ASRService(callback=on_transcript)
    await asr_service.start()

    try:
        while True:
            data = await websocket.receive_bytes()
            await asr_service.send_audio(data)
    except WebSocketDisconnect:
        print("INFO:     connection closed")
        await asr_service.stop()
