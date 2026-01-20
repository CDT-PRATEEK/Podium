from fastapi import FastAPI
from pydantic import BaseModel
from textblob import TextBlob
from better_profanity import profanity

app = FastAPI()

# Load the default profanity list
profanity.load_censor_words()

# Custom Data Model

class TextCheck(BaseModel):
    content: str

@app.post("/analyze_sentiment")
def analyze_text(data: TextCheck):
    text = data.content.lower().strip()
   
    # 1. HARD CHECK: Profanity
    has_bad_words = profanity.contains_profanity(text)

    # 2. SOFT CHECK: Sentiment Analysis
    analysis = TextBlob(text)
    polarity = analysis.sentiment.polarity
   
    is_toxic = False
   
    # 3. CONTEXT LOGIC:
    # If it's a question (ends with ?) or starts with a question word
    question_words = ('is', 'why', 'how', 'what', 'can', 'should', 'do')
    is_question = text.endswith('?') or text.startswith(question_words)

    if has_bad_words:
        is_toxic = True
        reason = "Profanity Detected"
    elif is_question and polarity < -0.85: # Very strict for questions
        is_toxic = True
        reason = "Extremely Negative Question"
    elif not is_question and polarity < -0.6: # Normal strictness for statements
        is_toxic = True
        reason = "Negative Sentiment"
    else:
        is_toxic = False
        reason = "Clean"

    return {
        "is_toxic": is_toxic,
        "reason": reason,
        "score": polarity,
        "service": "FastAPI Hybrid Moderator"
    }