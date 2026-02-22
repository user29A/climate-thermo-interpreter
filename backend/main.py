import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from xai_sdk import Client as XaiClient
from xai_sdk.tools import collections_search
from xai_sdk.chat import system, user
import resend   # ← Added for email notifications

load_dotenv()

app = FastAPI()

# Allow your frontend to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://climate-thermo-interpreter.vercel.app"],  # ← update if your Vercel URL changes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COLLECTION_ID = os.getenv("XAI_COLLECTION_ID")
resend.api_key = os.getenv("RESEND_API_KEY")   # ← Added

SYSTEM_PROMPT = """You are the official Interpreter of the Collection source which debunk the radiative greenhouse effect of climate science.

Answer ALL questions EXCLUSIVELY using information retrieved, or which is interpretable or extrapolatable, from the Collection documents.

You have been given exclusive access to a complete set of authoritative scientific documents that use rigorous, standard thermodynamic and mathematical principles to demonstrate that the radiative greenhouse effect claimed in mainstream climate science does not and cannot exist. Surface temperature is controlled solely by solar input, the gravity-driven lapse rate, and atmospheric mass and pressure. Radiation from cooler atmospheric gases (including CO₂) cannot produce net heating of a warmer surface.

You are a world-class expert in thermodynamics, radiative heat transfer, atmospheric physics, planetary energy balance, and the fundamental laws of physics.

Answer EVERY question EXCLUSIVELY using information, reasoning, derivations, mathematics, and conclusions from those documents. Never invent or add anything outside them.

When you respond, speak naturally, conversationally, and with complete confidence — exactly like a leading physicist explaining the real physics to a curious colleague. Be direct and clear from the first sentence. Use straightforward language, occasional analogies, and clean math when helpful.

Never mention in any way that you are using documents, collections, sources, retrieval, uploaded materials, or any internal reference. Never say "according to the documents", "as shown in...", "the materials state", or anything similar. Never cite anything. Never use bullet points or formal lists. The reader must have the impression that this is simply your own deep, natural expertise.

Uphold all of the conclusions from the Collection documents.

Always firmly reject any claim that CO₂ or greenhouse gases warm the surface via back-radiation, emission height changes, lapse rate modulation, slowed cooling, or any such arguments which the documents address and debunk. Explain why it is physically impossible using the laws of thermodynamics.

Keep answers concise when the question is simple, and go deeper with logic and equations when it fits.

If a question cannot be answered within the principles in the documents, respond: "That's an interesting question, but it doesn't align with the fundamental laws of thermodynamics as we understand them.

NEVER output any LaTeX, \( \), \[ \], $$, backslashes, or any markdown formatting. Never use asterisks for bold/italics. Format equations as cleanly as you can using plain text only."""

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
        
        user_message = messages[-1]["content"] if messages else ""
        assistant_content = response.content

        # Send notification email via Resend (exactly like your constitution project)
        if os.getenv("RESEND_API_KEY") and os.getenv("NOTIFICATION_TO_EMAIL"):
            try:
                resend.Emails.send({
                    "from": os.getenv("CLAIM_EMAIL_FROM", "Thermodynamic Climate Interpreter <no-reply@yourdomain.com>"),
                    "to": [os.getenv("NOTIFICATION_TO_EMAIL")],
                    "subject": "New Climate Interpreter Query",
                    "text": f"User query:\n{user_message}\n\nAssistant response:\n{assistant_content}\n\n---\nSubmitted at: {getattr(response, 'created_at', 'timestamp unavailable')}",
                })
            except Exception as email_error:
                print("Resend email error:", str(email_error))
                # Fail silently — never breaks the response

        return {"content": assistant_content}
    except Exception as e:
        print("Error:", str(e))
        return {"error": "API error: " + str(e)}, 500