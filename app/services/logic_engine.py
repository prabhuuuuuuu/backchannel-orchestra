# app/services/logic_engine.py

import time
import random
from textblob import TextBlob
from app.config import Config


class BackchannelLogic:
    def __init__(self):
        self.last_trigger_time = 0.0
        self.cooldown = Config.BACKCHANNEL_COOLDOWN
        self.current_mode = Config.DEFAULT_MODE  # "coach", "heckler", or "supportive"
        self.sentiment_state = "neutral"

        # Expanded, natural vocabulary
        self.responses = {
            "coach": {
                "neutral": [
                    "mm-hmm", "right", "okay", "go on", "I see", "uh-huh",
                    "got it", "sure", "keep going", "interesting", "fair enough",
                    "yeah, makes sense", "I'm with you", "alright", "go ahead"
                ],
                "positive": [
                    "love that energy!", "yes!", "exactly!", "totally agree",
                    "brilliant point", "spot on", "that's great", "absolutely",
                    "I love that", "keep that up!", "nice one", "that's powerful",
                    "well said", "that's really good"
                ],
                "negative": [
                    "it's okay, take a breath", "hmm, that's a tough one",
                    "take your time", "I hear you", "that sounds hard",
                    "let's unpack that", "stay with it", "you're doing fine",
                    "don't worry, keep going", "makes sense, keep explaining"
                ],
            },
            "heckler": {
                "neutral": [
                    "boring!", "louder!", "what?", "yawn...", "heard it before",
                    "get to the point", "really?", "come on...", "is this going somewhere?",
                    "try that again", "you can do better", "wake us up!"
                ],
                "positive": [
                    "too excited, calm down", "meh", "trying too hard",
                    "cringe", "who cares?", "save it for the blog",
                    "relax, it's not that deep", "alright, alright, we get it"
                ],
                "negative": [
                    "lost me there", "awkward...", "yikes", "oof",
                    "this is rough", "wrap it up", "that was painful",
                    "hmm, not convinced", "are you sure about that?"
                ],
            },
            "supportive": {
                "neutral": [
                    "oh, I see", "is that so?", "tell me more", "oh really?",
                    "go on, I'm listening", "mm, interesting"
                ],
                "positive": [
                    "how wonderful!", "oh wow!", "that's lovely",
                    "fantastic!", "that's amazing", "so good!"
                ],
                "negative": [
                    "oh dear", "that's a shame", "oh no", "I'm sorry to hear that",
                    "that sounds difficult", "that's not easy"
                ],
            },
        }

    def set_mode(self, mode: str):
        if mode in ("coach", "heckler", "supportive"):
            self.current_mode = mode
            print(f"[MODE] Switched to {mode.upper()}")

    def analyze_sentiment(self, text: str) -> str:
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity  # -1.0 .. 1.0
        if polarity > 0.4:
            return "positive"
        if polarity < -0.3:
            return "negative"
        return "neutral"

    def decide_reaction(self, transcript: str, is_final: bool):
        """
        Returns list of reaction dicts:
        [{ "text": "...", "voice_id": "...", "style": {...} }, ...]
        """
        now = time.time()
        if now - self.last_trigger_time < self.cooldown:
            return []

        text = transcript.strip()
        if not text:
            return []

        sentiment = self.analyze_sentiment(text)
        self.sentiment_state = sentiment

        # Only trigger on final segments or short phrases
        if not is_final and len(text) > 25:
            return []

        mode_responses = self.responses.get(self.current_mode, self.responses["coach"])
        options = mode_responses.get(sentiment, mode_responses["neutral"])
        chosen_text = random.choice(options)

        # Primary voice selection
        if self.current_mode == "heckler":
            voice_id = Config.VOICES["tough_heckler"]
        else:
            voice_id = Config.VOICES["primary_coach"]

        style = Config.MODES.get(self.current_mode, Config.MODES["coach"])["style"]

        reactions = [
            {
                "text": chosen_text,
                "voice_id": voice_id,
                "style": style,
            }
        ]

        # Optional “crowd” layer for strong positive in coach mode
        if sentiment == "positive" and self.current_mode == "coach":
            crowd_voice = random.choice(
                [Config.VOICES["crowd_member_1"], Config.VOICES["crowd_member_2"]]
            )
            crowd_text = random.choice(["yeah!", "woo!", "nice!", "right on!"])
            reactions.append(
                {
                    "text": crowd_text,
                    "voice_id": crowd_voice,
                    "style": {"pitch": 5, "rate": 10},
                }
            )

        self.last_trigger_time = now
        print(
            f"[{self.current_mode.upper()}] Triggered: '{chosen_text}' "
            f"(Sentiment: {sentiment})"
        )
        return reactions
