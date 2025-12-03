# 🎭 Backchannel Orchestra

> Transform solo presentation practice into an interactive experience with AI-powered audience responses

[![murf-ai](https://img.shields.io/badge/Powered%20by-Murf%20Falcon-blue)](https://murf.ai/falcon)
[![Deepgram](https://img.shields.io/badge/Speech-Deepgram-green)](https://deepgram.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-teal)](https://fastapi.tiangolo.com/)

<!-- Demo Video: Add your demo video link here -->
<!-- [▶️ Watch Demo](https://your-demo-link.com) -->

A real-time AI audience system providing natural vocal backchannels for public speaking practice. Built for the **Murf Voice Agent Hackathon** using ultra-low latency speech synthesis.

## 🌟 Key Features

- **Real-Time Vocal Backchannels**: Instant responses ("mm-hmm", "go on", "right", "wow!") triggered by speech patterns via Murf Falcon's ultra-fast TTS.
- **Emotional Mirror**: Sentiment analysis adapts responses—energetic for positive speech, supportive for negative, neutral cues otherwise.
- **Orchestra Mode**: Multi-voice crowd simulation with simultaneous reactions from different personas.
- **Dynamic Personas**: Switch between **Coach** (supportive) and **Heckler** (challenging) modes via voice commands.

## 🏗️ Architecture

![System Architecture](assets/ARCHITECTURE.png)

**Core Components**:

| Component        | Technology           | Role                                      |
|------------------|----------------------|-------------------------------------------|
| **ASR**          | Deepgram Nova-2      | Real-time speech-to-text + interim results |
| **Logic Engine** | Python (TextBlob)    | Sentiment analysis & backchannel triggering |
| **TTS**          | Murf Falcon API      | Ultra-low latency multi-voice synthesis   |
| **Backend**      | FastAPI + WebSockets | Bidirectional audio streaming             |

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Microphone-enabled device
- API Keys:
  - [Murf.ai](https://murf.ai/api) (Falcon TTS)
  - [Deepgram](https://deepgram.com/) (Nova-2 ASR)

### Installation
1. Clone the repository:  
   `git clone https://github.com/yourusername/backchannel-orchestra.git`  
   `cd backchannel-orchestra`
2. Create virtual environment:  
   `python -m venv venv`  
   - Windows: `venv\Scripts\activate`  
   - Mac/Linux: `source venv/bin/activate`
3. Install dependencies:  
   `pip install -r requirements.txt`
4. Configure environment:  
   `cp .env.example .env`  
   Edit `.env` and add your API keys.

### Configuration
Create a `.env` file with your API keys:

**Required API Keys**  
`DEEPGRAM_API_KEY=your_deepgram_key_here`  
`MURF_API_KEY=your_murf_key_here`

**Optional: Voice Configuration**  
`MURF_VOICE_ID=en-US-natalie`

### Running the Application
**Terminal 1 - Start the backend:**  
`uvicorn app.main:app --reload`

**Terminal 2 - Test with microphone:**  
`python test_client.py`

You should see output like:  
✓ WebSocket client connected  
✓ Deepgram Live ASR connected  
📝 Heard: 'hello everyone' (final=True)  
🎭 Orchestrating 1 voice(s)... Text: 'hello everyone'  
[COACH] Triggered: 'okay' (Sentiment: neutral)  
✅ Sent: 'okay'

## 🎤 Voice Commands
Say these phrases during your session to switch modes:

| Command            | Effect                                      |
|--------------------|---------------------------------------------|
| "Switch to coach"  | Supportive responses (mm-hmm, go on, great!) |
| "Switch to heckler"| Challenging responses (boring!, louder!, what?) |

## 📊 API Reference

### WebSocket Endpoint
**URL**: `ws://localhost:8000/ws/session`  
**Input**: Raw PCM audio  
- Format: 16-bit signed integer (linear16)  
- Sample Rate: 16000 Hz  
- Channels: Mono  

**Output**: Mixed binary and JSON messages

| Type       | Format | Example                                      |
|------------|--------|----------------------------------------------|
| Audio      | Binary (MP3) | `<MP3_BYTES>`                               |
| Metadata   | JSON   | `{"type": "feedback", "text": "mm-hmm", "voice": "en-US-natalie"}` |
| Mode Change| JSON   | `{"type": "mode_change", "mode": "heckler"}` |

### REST Endpoints

| Endpoint | Method | Description                  |
|----------|--------|------------------------------|
| `/`      | GET    | API status                   |
| `/health`| GET    | Health check with current mode |

## 🧪 Testing

### CLI Test Client
`python test_client.py`

Lists available microphones, connects to the WebSocket, and logs all backchannels.

### Expected Console Output

**Server (Terminal 1):**  
📝 Heard: 'My name is Fernando' (final=True)  
[COACH] Triggered: 'okay' (Sentiment: neutral)  
🎭 Orchestrating 1 voice(s)...  
✅ Sent: 'okay'

**Client (Terminal 2):**  
🔊 RECEIVED AUDIO (Backchannel) - 8432 bytes  
📨 Server: {"type":"feedback","text":"okay","voice":"en-US-natalie"}

## 📁 Project Structure
```
backchannel-orchestra/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI WebSocket handler
│   ├── config.py            # Environment configuration
│   └── services/
│       ├── __init__.py
│       ├── asr_service.py   # Deepgram Nova-2 integration
│       ├── tts_service.py   # Murf Falcon TTS wrapper
│       └── logic_engine.py  # Backchannel decision logic
├── static/
│   ├── index.html           # Web UI (optional)
│   └── client.js            # Browser WebSocket client
├── .env.example             # API key template
├── .gitignore
├── requirements.txt
├── test_client.py           # CLI microphone test
└── README.md
```

## 🛠️ Technology Stack

| Component  | Technology       | Purpose                          |
|------------|------------------|----------------------------------|
| **TTS**    | Murf Falcon API  | Ultra-fast voice synthesis       |
| **ASR**    | Deepgram Nova-2  | Real-time transcription          |
| **Backend**| FastAPI + WebSockets | Async bidirectional streaming |
| **Frontend**| Vanilla JS + Web Audio | Browser audio capture/playback |
| **Sentiment** | TextBlob     | Local sentiment analysis         |
| **Server** | Uvicorn ASGI     | Production-ready async server    |

## 📦 Dependencies
```
fastapi
uvicorn
websockets>=12,<14
python-dotenv
aiohttp
deepgram-sdk==3.0.0
requests
pydantic
textblob
pyaudio
```

> ⚠️ **Note**: `websockets` must be version 12-13. Version 14+ causes compatibility issues with Deepgram SDK.

## 🎯 Use Cases
- **Presentation Practice**: Get real-time audience simulation while rehearsing.
- **Public Speaking Training**: Build confidence with supportive feedback.
- **Language Learning**: Practice conversation flow with audio cues.
- **Interview Preparation**: Use Heckler mode to simulate pressure.

## 🔮 Future Enhancements
- [ ] Visual avatar with lip-sync animation.
- [ ] Custom backchannel phrase training.
- [ ] Analytics dashboard (pace, filler words, trends).
- [ ] Multi-language support.
- [ ] Mobile app integration.

## 👥 Team

| Name                      | Role              | Responsibilities                  |
|---------------------------|-------------------|-----------------------------------|
| **Pranav Prashant Shewale** | AI Engineer     | ASR/TTS integration, Logic Engine |
| **Shourya Agrawal**       | Full Stack Engineer | UI/UX, WebSocket streaming      |

## 🏆 Hackathon Compliance
- ✅ Clear README with setup instructions.
- ✅ Demo video showcasing functionality.
- ✅ Secure API key management via `.env`.
- ✅ Repository tagged with `murf-ai`.
- ✅ LinkedIn post with Murf AI tag.

## 📄 License
MIT License – See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments
- [Murf.ai](https://murf.ai) for Falcon TTS API.
- [Deepgram](https://deepgram.com) for Nova-2 real-time transcription.
- [Techfest IIT Bombay](https://techfest.org) & Murf Hackathon organizers.

---

**Built with ❤️ for the Murf Voice Agent Hackathon**  

**Tags**: `murf-ai` `voice-agent` `tts` `asr` `hackathon` `public-speaking` `fastapi` `websockets` `deepgram`
