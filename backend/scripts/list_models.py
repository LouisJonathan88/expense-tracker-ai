from google import genai

from app.config import config

client = genai.Client(api_key=config.GEMINI_API_KEY)
for m in client.models.list():
    if "flash" in m.name:
        print(m.name)