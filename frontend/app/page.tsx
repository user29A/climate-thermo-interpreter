"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const WAITING_MESSAGE = "Awaiting your input... (scroll down for the input area)";

export default function ClimateInterpreterPage() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: WAITING_MESSAGE,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkSeconds, setThinkSeconds] = useState(0);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      setThinkSeconds(0);
      return;
    }
    const timer = setInterval(() => setThinkSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleCopy = async () => {
    const lines = messages
      .filter((msg) => msg.content !== WAITING_MESSAGE)
      .map((msg) => `${msg.role === "user" ? "User" : "Interpreter"}:\n${msg.content}`);
    if (input.trim()) {
      lines.push(`User (unsent):\n${input.trim()}`);
    }
    const text = lines.join("\n\n");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        let message = "Error connecting to the interpreter. Please try again.";
        if (res.status === 504 || res.status === 502 || res.status === 524) {
          message =
            "The interpreter is still working, but the connection timed out. Please wait a moment and try again.";
        }
        try {
          const err = await res.json();
          if (typeof err?.error === "string" && err.error.trim()) {
            message = err.error;
          }
          if (res.status === 429) {
            message = err.error || "Too many questions right now. Please wait a few minutes and try again.";
          }
        } catch {
          // keep default or timeout message
        }
        setMessages((prev) => [...prev, { role: "assistant", content: message }]);
        return;
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (error: any) {
      console.error("Fetch error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error connecting to the interpreter. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-background">
      <header
        className="relative w-full bg-cover bg-center"
        style={{ backgroundImage: "url('/header.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/30 to-background" />
        <div className="relative container mx-auto px-4 max-w-5xl py-16 md:py-20">
          <h1 className="text-4xl md:text-6xl font-bold text-center text-red-700 drop-shadow-[0_1px_8px_rgba(255,255,255,0.9)]">
            Thermodynamic Climate Interpreter
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-5xl pt-8 md:pt-10">
        <p className="text-center text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
          Ask any question about radiation, thermodynamics, atmospheric physics, the greenhouse effect, CO₂, climate models, or energy balance. 
          All answers are sourced exclusively from accepted thermodynamic and mathematical principles.
        </p>

        {/* Tall card with input at the bottom */}
        <Card className="h-[800px] md:h-[65vh] flex flex-col bg-background shadow-xl border-red-700/20">
          {/* Messages area */}
          <div className="flex-1 p-6 overflow-y-auto" ref={scrollRef}>
            <div className="flex flex-col gap-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-3xl rounded-lg px-6 py-4 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-6 py-4">
                    <p className="text-muted-foreground flex items-center gap-2">
                      <span>Thinking with thermodynamics</span>
                      <span className="inline-flex items-end gap-1 h-3" aria-hidden="true">
                        <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                        <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                        <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" />
                      </span>
                      {thinkSeconds > 0 ? (
                        <span className="tabular-nums">{thinkSeconds}s</span>
                      ) : null}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="border-t p-6">
            <div className="flex gap-4">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about the greenhouse effect, CO₂, back-radiation, lapse rate..."
                className="min-h-24 resize-none"
                disabled={isLoading}
              />
              <div className="flex flex-col gap-2">
                <Button type="submit" size="lg" disabled={isLoading || !input.trim()}>
                  Send
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleCopy}
                  disabled={
                    isLoading ||
                    (messages.every((msg) => msg.content === WAITING_MESSAGE) && !input.trim())
                  }
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        <p className="text-center text-muted-foreground mt-8 mb-10">
          Contact:{" "}
          <a
            href="mailto:joepostma@live.ca"
            className="underline underline-offset-4 hover:text-foreground"
          >
            joepostma@live.ca
          </a>
        </p>
      </div>      
    </section>
  );
}