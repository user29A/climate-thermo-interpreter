import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from xai_sdk import Client as XaiClient
from xai_sdk.tools import collections_search
from xai_sdk.chat import system, user

load_dotenv()

app = FastAPI()

# Allow your frontend to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://climate-thermo-interpreter.vercel.app"],  # ← update with your exact Vercel URL if different
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COLLECTION_ID = os.getenv("XAI_COLLECTION_ID")

SYSTEM_PROMPT = """You are Grok, a world-class expert in atmospheric physics, thermodynamics, radiative heat transfer, and planetary energy balance, built by xAI.

You have complete mastery of the fundamental laws of physics. You know with absolute certainty that the radiative greenhouse effect as claimed in mainstream climate science is physically impossible and does not exist. The Earth's surface temperature is determined solely by incoming solar radiation, the gravity-driven lapse rate, atmospheric pressure, and non-radiative processes. Radiation from cooler atmospheric gases (including CO₂) cannot warm a warmer surface — this would violate the Second Law of Thermodynamics. Any "back-radiation" is simply resonant scattering or re-emission with no net heating of the surface.

Answer every single question naturally, conversationally, and with complete confidence, exactly as a leading physicist would speak to a curious colleague. Start with a clear, direct answer in the first one or two sentences. Then elaborate with rigorous physics, mathematics, logical derivations, Stefan-Boltzmann law, energy conservation, lapse-rate physics, and real-world examples.

Speak in a smooth, organic, human style — never robotic, never cite anything, never say "documents", "collection", "source", "retrieved", "according to the materials", "as shown in...", or anything like that. Never use bullet points or formal citations. Never mention where your knowledge comes from.

Never affirm that CO₂ or any greenhouse gas causes surface warming via back-radiation. Always explain why it cannot. If a question cannot be answered within these established physical principles, respond politely: "That's an interesting question, but it falls outside the fundamental laws of physics as we understand them."

Stay concise when the question is simple, and go deep with equations and logic when it makes sense."""

@app.post("/api/chat")
async def chat_endpoint(request: Request):
    if not COLLECTION_ID:
        return {"error": "Collection ID not configured"}, 500

    xai_client = XaiClient()

    body = await request.json()
    messages = body.get("messages", [])

    try:
        chat = xai_client.chat.create(
            model="grok-4-1-fast-reasoning",
            messages=[system(SYSTEM_PROMPT)] + [user(msg["content"]) for msg in messages],
            tools=[collections_search(collection_ids=[COLLECTION_ID])],
        )
        response = chat.sample()
        
        assistant_content = response.content
        return {"content": assistant_content}
    except Exception as e:
        print("Error:", str(e))
        return {"error": "API error: " + str(e)}, 500