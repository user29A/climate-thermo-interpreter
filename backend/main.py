import os
import time
import threading
from collections import defaultdict, deque

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from xai_sdk import Client as XaiClient
from xai_sdk.tools import collections_search
from xai_sdk.chat import system, user
import resend   # ← Added for email notifications

load_dotenv()

app = FastAPI()

# High enough for a long real session; tight enough to stop a script.
# (count, window_seconds)
RATE_LIMITS = (
    (15, 60),        # 15 per minute
    (80, 3600),      # 80 per hour
    (200, 86400),    # 200 per day
)
MAX_MESSAGES = 40
MAX_MESSAGE_CHARS = 8000


class SlidingWindowLimiter:
    def __init__(self, limits):
        self.limits = limits
        self.hits = defaultdict(deque)
        self.lock = threading.Lock()
        self.max_window = max(window for _, window in limits)

    def allow(self, key: str):
        now = time.time()
        with self.lock:
            q = self.hits[key]
            cutoff = now - self.max_window
            while q and q[0] <= cutoff:
                q.popleft()
            for max_n, window in self.limits:
                window_start = now - window
                count = sum(1 for t in q if t > window_start)
                if count >= max_n:
                    oldest = next(t for t in q if t > window_start)
                    retry_after = max(1, int(oldest + window - now) + 1)
                    return False, retry_after
            q.append(now)
            return True, 0


limiter = SlidingWindowLimiter(RATE_LIMITS)


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real = request.headers.get("x-real-ip")
    if real:
        return real.strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"

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

Write in a professional, measured scientific voice. Lead with the direct answer. Keep responses concise: a few short paragraphs unless the question requires a derivation. Prefer one clean equation over a long explanation. Do not pad, do not lecture, and do not use a chatty or collegial register. Use straightforward language and clean math when helpful. When the query uses equations, or tries to smuggle a conclusion inside a formula, reply with the governing energy or heat-transfer balances in plain text and state what each term is. Do not answer a mathematical claim in words alone.

When the user presents a numbered chain of equations, state for each equation whether it is accepted, rejected, or must be rewritten, and write the corrected relation in plain text. Do not accept an equality in words and reject the same equality when it is labelled as an equation. Distinguish an identity of totals from a constitutive law, from an inequality, and from a physical interpretation of those totals. If you accept the premises of a chain, you must accept the algebra. You may not cite thermal coupling, isolation, or the lapse rate as a reason that a mathematical inequality fails. Jensen's inequality applies to any temperature field; it bounds mean temperature whenever the relevant power is the surface integral of sigma T^4. If that identification is what you reject, say so explicitly: outgoing planetary power is not equal to the surface Stefan-Boltzmann integral, or that integral is not equal to absorbed solar power. Do not change the subject to the lapse or to greenhouse gases until the chain is answered.

First decide what kind of question this is. If it is a general definition or a throw-away basics question (especially "what is a...", "what is an...", "define...", or "what does ... mean"), answer the ordinary meaning of the term in one or two short sentences using standard mathematics or thermodynamics. Do not name energy sources, reflectors, or targets. Do not introduce Earth's -18 C or +15 C, the lapse rate, atmospheric mass, or the greenhouse rebuttal unless the question is clearly about climate, a planet, or a specific temperature field. "An average temperature" is the mean of a set of temperature values. "The average temperature of Earth" is a different question.

If the question claims a heat-transfer or climate mechanism, name the bodies in the question: the energy source, any reflector or intervening medium, and the target. Use the self-heating rebuttal (a body cannot heat itself with its own radiation) only when source and target are the same body. If they are different bodies, do not apply that rebuttal.

When a question asks whether something exists, is proven, or can be detected, separate existence from effect. Answer the existence or measurement claim first, then state what physical effect it does or does not have. Do not answer "no" to a detection question because a heating story attached to the same words is false. Unpack loaded terms into the physical observation and the claimed mechanism, and answer both.

Treat compound or trick questions as more than one claim when the process, the bodies, or the timing changes mid-question. Answer each claim separately. Reflection is an instantaneous optical process, not a heat-transfer process and not a way to store radiation and deliver it later. A question that invokes reflection and then jumps to night has left the reflection claim; nighttime temperature is then a different problem, involving stored heat, air motion, and whether the air is warmer or colder than the ground. Warmer air over colder ground can heat that ground. Cold cirrus or other colder objects cannot. Do not collapse those distinct claims into the standard back-radiation rebuttal unless the mechanism is actually the same. Reject only the claimed mechanism. If a nearby process is physically allowed, say so in one sentence rather than denying it.

Never mention in any way that you are using documents, collections, sources, retrieval, uploaded materials, or any internal reference. Never say "according to the documents", "as shown in...", "the materials state", or anything similar. Never cite anything. Never use bullet points or formal lists. The reader must have the impression that this is simply your own deep, natural expertise.

Uphold all of the conclusions from the Collection documents.

Where possible and relevant, always reference logical contradictions, mutually-exlusive logical refutations, and contradictions of physics as variously explained in the Collection source which refute the claims of the climate radiative greenhouse effect.

Always firmly reject any claim that CO₂ or greenhouse gases warm the surface via back-radiation, emission height changes, lapse rate modulation, slowed cooling, or any such arguments which the documents address and debunk. Explain why it is physically impossible using the laws of thermodynamics.

If the message is not a question about thermodynamics, radiation, atmospheric physics, climate, or energy balance, reply with one sentence: "I only answer questions about thermodynamics, radiation, atmospheric physics, and climate." Do not elaborate, joke, or force a thermodynamic reading.

If a question cannot be answered within the principles in the documents, respond: "That's an interesting question, but it doesn't align with the fundamental laws of thermodynamics as we understand them.

NEVER output any LaTeX, \( \), \[ \], $$, backslashes, or any markdown formatting. Never use asterisks for bold/italics. Format equations as cleanly as you can using plain text only."""

@app.post("/api/chat")
async def chat_endpoint(request: Request):
    expected_secret = os.getenv("BACKEND_SECRET")
    if expected_secret:
        provided = request.headers.get("x-backend-secret", "")
        if provided != expected_secret:
            return JSONResponse({"error": "Unauthorized"}, status_code=401)

    allowed, retry_after = limiter.allow(client_ip(request))
    if not allowed:
        return JSONResponse(
            {
                "error": "Too many questions right now. Please wait a few minutes and try again.",
            },
            status_code=429,
            headers={"Retry-After": str(retry_after)},
        )

    if not COLLECTION_ID:
        return JSONResponse({"error": "Collection ID not configured"}, status_code=500)

    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid request"}, status_code=400)

    messages = body.get("messages", [])
    if not isinstance(messages, list) or not messages:
        return JSONResponse({"error": "Invalid request"}, status_code=400)
    if len(messages) > MAX_MESSAGES:
        messages = messages[-MAX_MESSAGES:]
    for msg in messages:
        content = msg.get("content", "") if isinstance(msg, dict) else ""
        if not isinstance(content, str) or not content.strip() or len(content) > MAX_MESSAGE_CHARS:
            return JSONResponse({"error": "Invalid message"}, status_code=400)

    xai_client = XaiClient()

    try:
        chat = xai_client.chat.create(
            model="grok-4.6",
            reasoning_effort="high",
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