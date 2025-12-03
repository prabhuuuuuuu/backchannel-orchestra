# 🎭 Backchannel Orchestra

> Transform solo presentation practice into an interactive experience with AI-powered audience responses

[![murf-ai](https://img.shields.io/badge/Powered%20by-Murf%20Falcon-blue)](https://murf.ai/falcon)
[![AssemblyAI](https://img.shields.io/badge/Speech-AssemblyAI-green)](https://www.assemblyai.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-teal)](https://fastapi.tiangolo.com/)

<!-- Demo Video Placeholder: Insert demo video here -->
<!-- ![Demo Video](demo.mp4) or [Watch Demo](demo-link) -->

A real-time AI audience system providing natural vocal backchannels for public speaking practice. Built for the Murf Voice Agent Hackathon using ultra-low latency speech synthesis.

## 🌟 Key Features

- **Real-Time Vocal Backchannels**: Instant responses ("mm-hmm", "go on", "wow!") triggered by speech patterns via Murf Falcon's 130ms TTS.
- **Emotional Mirror**: Sentiment analysis from AssemblyAI adapts responses—energetic for positive, supportive for negative, neutral cues for neutral.
- **Orchestra Mode**: Multi-voice crowd simulation with simultaneous reactions.
- **Dynamic Personas**: Switch between Coach (supportive) and Heckler (challenging) modes with prosody controls.

## 🏗️ Architecture

<!-- System Architecture Image Placeholder: Insert architecture diagram here -->
<!-- ![System Architecture](architecture.png) -->

**Core Components**:
- **ASR Service**: Real-time speech-to-text with sentiment analysis.
- **Logic Engine**: Rule-based triggering with cooldowns.
- **TTS Service**: Multi-voice generation with prosody.
- **WebSocket Handler**: Bidirectional audio streaming.

## 🚀 Setup

### Prerequisites
- Python 3.9+
- Microphone-enabled device
- API Keys: [Murf.ai](https://murf.ai/api), [AssemblyAI](https://www.assemblyai.com/)

### Installation
1. Clone: `git clone https://github.com/yourusername/backchannel-orchestra.git && cd backchannel-orchestra`
2. Virtual env: `python -m venv venv` then activate (Windows: `venv\Scripts\activate`; Mac/Linux: `source venv/bin/activate`).
3. Dependencies: `pip install -r requirements.txt`
4. Config: `cp .env.example .env` and add keys (e.g., `MURF_API_KEY=your_key`).
5. Run backend: `uvicorn app.main:app --reload`
6. Open UI: http://localhost:8000

## 🔐 API Keys
Store in `.env` (gitignored). Use `.env.example` as template. Rotate keys regularly.

## 📊 API Details

### WebSocket: `ws://localhost:8000/ws/session`
- **Input**: Raw PCM audio (16kHz, 16-bit, mono).
- **Output**: MP3 chunks + JSON metadata.

**Message Types**:
- Binary: `<MP3_BYTES>`
- JSON: `{"type": "feedback", "text": "mm-hmm", "mode": "coach", "sentiment": "positive"}`

**Voice Commands**:
- "Switch to coach": Supportive mode.
- "Switch to heckler": Challenging mode.

## 🧪 Testing
Run `python test_client.py` to stream mic audio and log backchannels.

## 📁 Structure
```
backchannel-orchestra/
├── app/
│   ├── main.py          # WebSocket handler
│   ├── config.py        # Env config
│   ├── services/
│   │   ├── asr_service.py     # AssemblyAI
│   │   ├── tts_service.py     # Murf Falcon
│   │   └── logic_engine.py    # Decision logic
│   └── utils/
│       └── audio_utils.py     # Audio helpers
├── static/
│   ├── index.html       # Web UI
│   └── client.js        # WebSocket client
├── .env.example         # Key template
├── requirements.txt     # Dependencies
├── test_client.py       # Test script
└── README.md
```

## 🏆 Hackathon Compliance
- Clear README, demo video, secure keys, tagged `murf-ai`.

## 🛠️ Technologies

| Component   | Technology              |
|-------------|-------------------------|
| TTS         | Murf Falcon API         |
| ASR         | AssemblyAI Streaming    |
| Backend     | FastAPI + WebSockets    |
| Frontend    | Vanilla JS + Web Audio  |
| Sentiment   | TextBlob + AssemblyAI   |
| Deployment  | Uvicorn ASGI            |

## 🎯 Use Cases
- Presentation practice with simulated engagement.
- Speech training for confidence.
- Language learning via cues.
- Interview prep under pressure.

## 🔮 Enhancements
- Visual avatar with lip-sync.
- Custom phrase training.
- Analytics (pace, fillers, trends).
- Multi-language.
- Hardware integration.

## 👥 Team
Mr. Pranav Prashant Shewale - AI Engineer (ASR/TTS/logic).
Mr. Shourya Agrawal - Full Stack Engineer (UI/streaming).

## 📄 License
MIT – See [LICENSE](LICENSE).

## 🙏 Acknowledgments
- [Murf.ai](https://murf.ai) for Falcon TTS.
- [AssemblyAI](https://www.assemblyai.com) for transcription.
- Murf Hackathon organizers.

**Tags**: `murf-ai` `voice-agent` `tts` `asr` `hackathon` `public-speaking` `fastapi` `websockets`
