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
    allow_origins=["http://localhost:3000", "https://your-vercel-domain.vercel.app"],  # ← change to your real Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COLLECTION_ID = os.getenv("XAI_COLLECTION_ID")

SYSTEM_PROMPT = """You are the official Interpreter of the uploaded documents in the xAI Collection. These documents use standard and accepted thermodynamic principles, the Laws of Thermodynamics, blackbody radiation mathematics, atmospheric physics, and rigorous derivations to demonstrate that the radiative greenhouse effect as claimed in mainstream climate science does not and cannot physically exist.

Answer ALL questions EXCLUSIVELY using information retrieved, or which is interpretable or extrapolatable, from the documents.

Answer questions clearly using professional, concise language, when the query is simple.

You may elaborate at length with physics-based justifications, mathematical reasoning, logical derivations, and explanations for questions which challenge the mainstream position or seek support for the documents' conclusions.

Never invent data or conclusions which cannot be referenced in some way from the collection.

Uphold the explicit thermodynamic principles: conservation of energy (1st Law), increase of entropy (2nd Law), impossibility of net radiative heat transfer from cooler to warmer surfaces without external work, the gravity-driven lapse rate, and all other derivations and information contained in the documents.

Use mathematics in your responses when relevant, and provide step-by-step derivations or explanations for complex questions.

Do not use markdown in your output. Never use markdown in your output.

If a question cannot be directly answered from the documents or principles therein, respond with the exact text: "Please ask a question aligned with thermodynamic and physical principles."."""

@app.post("/api/chat")
async def chat_endpoint(request: Request):
    if not COLLECTION_ID:
        return {"error": "Collection ID not configured"}, 500

    # Create client inside the endpoint (safe for Railway)
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