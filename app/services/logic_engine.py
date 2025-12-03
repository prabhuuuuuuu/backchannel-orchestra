import time
import random
from textblob import TextBlob
from app.config import Config

class BackchannelLogic:
    def __init__(self):
        self.last_trigger_time = 0
        self.cooldown = 2.5 
        self.current_mode = "coach" # Default mode
        
        # Feature 1: Emotional Mirror (Sentiment mapping)
        self.sentiment_state = "neutral" 

        # EXPANDED VOCABULARY FOR NATURAL HUMAN INTERACTION
        self.responses = {
            "coach": {
                "neutral": [
                    "mm-hmm", "right", "okay", "go on", "I see", "uh-huh", 
                    "got it", "sure", "keep going", "interesting", "fair enough"
                ],
                "positive": [
                    "love that energy!", "yes!", "exactly!", "totally agree", 
                    "brilliant point", "spot on", "wow", "that's great", 
                    "absolutely", "I love that", "keep that up!"
                ],
                "negative": [
                    "it's okay, take a breath", "hmmm", "slow down", "take your time",
                    "I hear you", "tough one", "that sounds hard", "hmm, really?",
                    "let's unpack that", "stay with it"
                ]
            },
            "heckler": {
                "neutral": [
                    "boring!", "louder!", "what?", "yawn...", "heard it before",
                    "get to the point", "blah blah blah", "really?", "come on...",
                    "is this going somewhere?"
                ],
                "positive": [
                    "too excited", "calm down", "meh", "overacting much?", 
                    "fake news", "trying too hard", "cringe", "who cares?",
                    "save it for the blog"
                ],
                "negative": [
                    "lost me there", "awkward...", "yikes", "disaster", 
                    "painful to listen to", "train wreck", "wrap it up", 
                    "this is brutal", "fail"
                ]
            },
            "supportive": { # Optional extra mode if you want "Grandma" vibes
                "neutral": ["oh my", "is that so?", "tell me more", "oh really?"],
                "positive": ["how wonderful!", "oh wow!", "bless you", "fantastic!"],
                "negative": ["oh dear", "that's a shame", "oh no", "I'm sorry"]
            }
        }

    def set_mode(self, mode: str):
        """Safely switches the current persona mode."""
        if mode in ["coach", "heckler", "supportive"]:
            self.current_mode = mode
            print(f"Switched to {mode} mode")

    def analyze_sentiment(self, text: str):
        """
        Determines if the text is positive, negative, or neutral.
        Uses TextBlob for simple polarity analysis (-1.0 to 1.0).
        """
        analysis = TextBlob(text)
        # Adjusted thresholds for better sensitivity
        if analysis.sentiment.polarity > 0.4:
            return "positive"
        elif analysis.sentiment.polarity < -0.3:
            return "negative"
        return "neutral"

    def decide_reaction(self, transcript: str, is_final: bool, deepgram_sentiment=None):
        """
        Main logic function.
        Returns: list of dicts [{'text': 'wow', 'voice_id': '...', 'style': {...}}]
        """
        current_time = time.time()
        
        # 1. Cooldown Check (Prevent spamming)
        if (current_time - self.last_trigger_time) < self.cooldown:
            return []

        text = transcript.lower().strip()
        if not text:
            return []
        
        # 2. Detect Sentiment (Prioritize AssemblyAI's result if available)
        # Note: deepgram_sentiment is passed as an arg name to keep compatibility with main.py
        # even though we are using AssemblyAI now.
        sentiment = deepgram_sentiment if deepgram_sentiment else self.analyze_sentiment(text)
        self.sentiment_state = sentiment
        
        reactions = []
        
        # 3. Trigger Logic
        # We trigger if the user pauses (is_final) OR if they say a very long sentence (> 15 chars)
        if is_final or len(text) > 25: # Increased char limit slightly for less interruption
            
            # Safety check: Ensure mode and sentiment exist in our dictionary
            mode_responses = self.responses.get(self.current_mode, self.responses["coach"])
            options = mode_responses.get(sentiment, mode_responses["neutral"])
            
            # Pick a random response from our expanded list
            chosen_text = random.choice(options)
            
            # Configure the voice parameters
            voice_id = Config.VOICES["primary_coach"] 
            if self.current_mode == "heckler":
                voice_id = Config.VOICES["tough_heckler"]
            
            style = Config.MODES.get(self.current_mode, Config.MODES["coach"])
            
            # Add the primary reaction
            reactions.append({
                "text": chosen_text,
                "voice_id": voice_id,
                "style": style
            })

            # Feature 2: The Orchestra (Add crowd support on strong positive sentiment)
            # If sentiment is POSITIVE and we are in COACH mode, add a background cheer
            if sentiment == "positive" and self.current_mode == "coach":
                # Randomly pick which crowd member speaks to add variety
                crowd_voice = random.choice([Config.VOICES["crowd_member_1"], Config.VOICES["crowd_member_2"]])
                crowd_text = random.choice(["yeah!", "woo!", "nice!", "right on!"])
                
                reactions.append({
                    "text": crowd_text,
                    "voice_id": crowd_voice,
                    "style": {"pitch": 5, "rate": 10} # High energy crowd
                })

            # Update last trigger time
            self.last_trigger_time = current_time
            print(f"[{self.current_mode.upper()}] Triggered: '{chosen_text}' (Sentiment: {sentiment})")
            
        return reactions
