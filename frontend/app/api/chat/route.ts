import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 8000;

function visitorIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      return NextResponse.json({ error: "BACKEND_URL not configured" }, { status: 500 });
    }

    const messages = body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (messages.length > MAX_MESSAGES) {
      return NextResponse.json(
        { error: "This conversation is long enough. Refresh to start a new one." },
        { status: 400 }
      );
    }
    for (const msg of messages) {
      if (typeof msg?.content !== "string" || !msg.content.trim() || msg.content.length > MAX_MESSAGE_CHARS) {
        return NextResponse.json({ error: "Invalid message" }, { status: 400 });
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Forwarded-For": visitorIp(request),
      "X-Real-IP": visitorIp(request),
    };
    const backendSecret = process.env.BACKEND_SECRET;
    if (backendSecret) {
      headers["X-Backend-Secret"] = backendSecret;
    }

    const res = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let errorPayload: unknown;
      try {
        errorPayload = await res.json();
      } catch {
        errorPayload = { error: await res.text() };
      }
      return NextResponse.json(errorPayload, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}