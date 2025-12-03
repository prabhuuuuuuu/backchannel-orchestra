import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.services.asr_service import ASRService
from app.services.tts_service import MurfTTSService
from app.services.logic_engine import BackchannelLogic
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS - Allow all origins for development/hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Changed to allow all during testing
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
    # Accept the WebSocket connection immediately
    await websocket.accept()
    print("✓ WebSocket client connected")
    
    async def on_transcript(text, is_final, sentiment):
        # 1. Special Command Handling
        if "switch to heckler" in text.lower():
            logic_engine.set_mode("heckler")
            await websocket.send_json({"type": "mode_change", "mode": "heckler"})
            return
        elif "switch to coach" in text.lower():
            logic_engine.set_mode("coach")
            await websocket.send_json({"type": "mode_change", "mode": "coach"})
            return

        # 2. Get Reaction Plan
        reaction_plan = logic_engine.decide_reaction(text, is_final, sentiment)
        
        if reaction_plan:
            print(f"🎭 Orchestrating {len(reaction_plan)} voices...")
            
            # 3. Generate Audio in Parallel
            tasks = []
            for reaction in reaction_plan:
                tasks.append(
                    tts_service.generate_audio(
                        reaction["text"], 
                        reaction["voice_id"], 
                        reaction["style"]
                    )
                )
            
            audio_results = await asyncio.gather(*tasks)
            
            # 4. Send audio and metadata
            for idx, audio_bytes in enumerate(audio_results):
                if audio_bytes:
                    await websocket.send_bytes(audio_bytes)
                    # Also send metadata for UI visualization
                    await websocket.send_json({
                        "type": "feedback", 
                        "text": reaction_plan[idx]["text"],
                        "voice": reaction_plan[idx]["voice_id"]
                    })

    # Initialize ASR service
    asr_service = ASRService(callback=on_transcript)
    await asr_service.start()

    try:
        while True:
            data = await websocket.receive_bytes()
            await asr_service.send_audio(data)
            
    except WebSocketDisconnect:
        print("❌ Client disconnected")
        await asr_service.stop()
    except Exception as e:
        print(f"❌ Error in WebSocket: {e}")
        await asr_service.stop()
