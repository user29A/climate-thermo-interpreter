"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const WAITING_MESSAGE = "Awaiting your input... (scroll down for the input area)";

const FAQ_ITEMS = [
  {
    question: "Is the radiative greenhouse effect real?",
    paragraphs: [
      "No. Heat is energy transferred because of a temperature difference, and it flows only from hotter to colder. Radiation from cooler atmospheric gases, including CO₂, is not heat performed on the warmer surface.",
      "Surface temperature is set by absorbed sunlight, atmospheric mass and pressure, and the gravity-driven lapse. Those already produce the observed profile. A radiative greenhouse is not an extra term in that accounting.",
    ],
  },
  {
    question: "Can cooler CO₂ heat the warmer ground?",
    paragraphs: [
      "No. The hotter surface still emits at its own temperature, σ T_h⁴. The difference σ (T_h⁴ − T_c⁴) is heat transferred to the colder body. It is not two opposing heats, not thermalization of T_c⁴ in the hotter body, and not slowed emission that raises T_h.",
      "A blanket keeps you warm by cutting convection and contact with colder air, not by colder fabric heating you. A space blanket works because its outer surface has low emissivity. Neither is a model of a colder gas heating a warmer ground.",
    ],
  },
  {
    question: "Does “slowed cooling” raise Earth’s temperature?",
    paragraphs: [
      "No. In greenhouse theory, “slowed cooling” is the gap between a fictional no-atmosphere planet at −18 °C and the real Earth at +15 °C, relabeled as an effect. The real planet is not that fiction with an inhibitor attached.",
      "A smaller temperature contrast does reduce heat from hotter ground to cooler air; that is ordinary constitutive transfer. It does not mean the ground is being heated by the air, and it does not replace the adiabatic lapse already fixed by the First Law and hydrostatic balance.",
    ],
  },
  {
    question: "Why is the surface about +15 °C, not −18 °C?",
    paragraphs: [
      "The −18 °C figure is the blackbody equivalent of Earth’s outgoing planetary power, S(1−α)/4. It is not a surface temperature the ground would have without greenhouse gases.",
      "The dry adiabat is dT/dh = −g/C_p ≈ −9.8 K/km. Latent heat reduces this to an environmental mean near −6.5 K/km. The mass-weighted mid-level of that linear troposphere is near 5 km, where the observed temperature is about −18 °C. Surface temperature is that average plus the integrated lapse: −18 °C + 6.5 K/km × 5 km ≈ +15 °C. Sunlight, gravity, and atmospheric mass already close that calculation.",
    ],
  },
  {
    question: "CO₂ absorbs infrared. Doesn’t that trap heat?",
    paragraphs: [
      "Absorption is real; trapping is not. CO₂ resonantly absorbs and re-emits at its vibrational bands. Near those wavelengths the lower air is already optically thick, so extra CO₂ does not add a new heat source at the ground.",
      "Heat still moves only from hotter regions to colder ones. Photons absorbed by cooler gas are not a reservoir stored and later delivered as heat to a warmer surface. Surface emission continues at the ground’s own temperature. Planetary outgoing power is the ensemble energy balance, not a slowed leak of ground emission.",
    ],
  },
];

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
  const thinkSecondsRef = useRef(0);

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
      thinkSecondsRef.current = 0;
      return;
    }
    const timer = setInterval(() => {
      thinkSecondsRef.current += 1;
      setThinkSeconds(thinkSecondsRef.current);
    }, 1000);
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

  const readChatResponse = async (
    res: Response
  ): Promise<{ content?: string; error?: string }> => {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/event-stream") && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let last: { content?: string; error?: string } | null = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const part of parts) {
          for (const line of part.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const raw = line.slice(5).trim();
            if (!raw) continue;
            try {
              last = JSON.parse(raw);
            } catch {
              // ignore malformed chunks
            }
          }
        }
      }
      return last || { error: "Empty response" };
    }
    return res.json();
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

      const data = await readChatResponse(res);
      if (data.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.error as string }]);
        return;
      }
      const reply = data.content;
      if (!reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error connecting to the interpreter. Please try again." },
        ]);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (error: any) {
      console.error("Fetch error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            thinkSecondsRef.current >= 15
              ? "The interpreter is still working, but the connection timed out. Please wait a moment and try again."
              : "Error connecting to the interpreter. Please try again.",
        },
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
            <p className="text-sm text-muted-foreground mt-3">
              Replies can take several minutes. The interpreter is working through the physics
              and mathematics of thermodynamics, not producing a canned slogan.
            </p>
          </form>
        </Card>

        <section className="mt-16" aria-labelledby="faq-heading">
          <h2
            id="faq-heading"
            className="text-3xl md:text-4xl font-bold text-center text-red-700 mb-4"
          >
            Frequently asked questions
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-3xl mx-auto">
            The questions visitors ask most often, answered from the same thermodynamic
            principles as the interpreter.
          </p>
          <div className="flex flex-col gap-6">
            {FAQ_ITEMS.map((item) => (
              <Card key={item.question} className="px-6 border-red-700/20 shadow-xl">
                <h3 className="text-xl font-semibold mb-3">{item.question}</h3>
                {item.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-muted-foreground leading-relaxed mb-3 last:mb-0"
                  >
                    {paragraph}
                  </p>
                ))}
              </Card>
            ))}
          </div>
        </section>

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