"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

export default function ClimateInterpreterPage() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Awaiting your input... (scroll down for the input area)",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, isLoading]);

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
        const error = await res.text();
        throw new Error(error || "API error");
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
    <section className="py-16 md:py-24 lg:py-16 min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-4xl md:text-7xl font-bold text-center mb-12 text-red-700">
          Ask a Question!
        </h1>

        <p className="text-center text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
          Welcome to the Thermodynamic Climate Interpreter. 
          Ask any question about radiation, thermodynamics, atmospheric physics, the greenhouse effect, CO₂, climate models, or energy balance. 
          All answers are sourced exclusively from accepted thermodynamic and mathematical principles.
        </p>

        {/* Tall card with input at the bottom */}
        <Card className="h-[800px] md:h-[65vh] flex flex-col bg-background/95 shadow-xl border-red-700/20">
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
                    <p className="text-muted-foreground">Thinking with thermodynamics...</p>
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
              <Button type="submit" size="lg" disabled={isLoading || !input.trim()}>
                Send
              </Button>
            </div>
          </form>
        </Card>

        <p className="text-center text-muted-foreground mt-6 mb-10">
          Responses are generated using Grok with Retrieval-Augmented Generation.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 justify-center mt-8">
        <Button size="lg" variant="outline" asChild>
          <a href="/">Home</a>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <a href="/why">Why the Documents Matter</a>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <a href="https://console.x.ai" target="_blank">View Collections</a>
        </Button>
      </div>
    </section>
  );
}