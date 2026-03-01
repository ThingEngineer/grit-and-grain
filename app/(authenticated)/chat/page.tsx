"use client";

import { FormEvent, useMemo, useRef, useEffect, useState } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import Markdown from "react-markdown";
import { checkTopicRelevance } from "@/lib/ai/topic-guard";
import { ReadAloudButton } from "@/components/read-aloud-button";
import { VoiceRecorder } from "@/components/voice-recorder";
import { useOffline } from "@/components/offline-provider";
import { WifiOff, Wheat, ChevronDown } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";

export default function ChatPage() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
    }),
  });
  const [input, setInput] = useState("");
  const [topicWarning, setTopicWarning] = useState<string | undefined>();
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "submitted" || status === "streaming";
  const { isOnline } = useOffline();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleScroll() {
    const el = messagesContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollTop < el.scrollHeight - el.clientHeight - 100);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleInputChange(value: string) {
    setInput(value);
    // Only evaluate once the user has typed a few words
    if (value.trim().split(/\s+/).length >= 3) {
      const check = checkTopicRelevance(value);
      setTopicWarning(check.allowed ? undefined : check.reason);
    } else {
      setTopicWarning(undefined);
    }
  }

  // Try to surface the structured error message returned by the server (e.g. 422 topic guard)
  const errorMessage = useMemo(() => {
    if (!error) return null;
    try {
      const parsed = JSON.parse(error.message) as { error?: string };
      return parsed.error ?? "Something went wrong. Please try again.";
    } catch {
      return "Something went wrong. Please try again.";
    }
  }, [error]);

  const renderedMessages = useMemo(
    () =>
      messages.map((message) => {
        const textContent = message.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("\n");

        return {
          id: message.id,
          role: message.role,
          text: textContent,
        };
      }),
    [messages],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = input.trim();
    if (!value || isLoading) {
      return;
    }

    // Block submission for clearly off-topic messages (server will also reject these)
    if (topicWarning) {
      return;
    }

    setInput("");
    setTopicWarning(undefined);
    await sendMessage({ text: value });
  }

  const suggestions = [
    "When did we last rest the south pasture?",
    "How much rain did we get this month?",
    "What's the history of herd health issues?",
    "When did we vaccinate the herd?",
    "When did we turn the bull out this year?",
  ];

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="Farm Memory"
        description="Ask questions about your ranch history — powered by your diary entries."
      />

      {/* Messages */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          role="log"
          aria-label="Conversation"
          aria-live="polite"
          className="h-full space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-4"
        >
          {renderedMessages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <Wheat
                className="h-10 w-10 text-muted-foreground/50"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground">
                Ask anything about your ranch diary…
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setInput(s);
                    }}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {renderedMessages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border rounded-bl-sm"
                }`}
              >
                {m.role === "user" ? (
                  <div className="whitespace-pre-wrap">{m.text}</div>
                ) : (
                  <>
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
                      <Markdown>{m.text}</Markdown>
                    </div>
                    <div className="mt-1.5 flex justify-end">
                      <ReadAloudButton text={m.text} />
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div
                role="status"
                aria-live="polite"
                className="rounded-bl-sm rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && <Alert variant="error">{errorMessage}</Alert>}
          <div ref={messagesEndRef} />
        </div>
        {showScrollBtn && (
          <button
            type="button"
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
            className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ChevronDown
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* Input */}
      {isOnline ? (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2">
          {topicWarning && <Alert variant="warning">{topicWarning}</Alert>}
          <div className="mb-2">
            <VoiceRecorder
              label="Ask by voice"
              onTranscript={(text) =>
                handleInputChange(input ? input + " " + text : text)
              }
            />
          </div>
          <div className="flex gap-2">
            <input
              id="chat-input"
              aria-label="Ask about your ranch history"
              value={input}
              onChange={(event) => handleInputChange(event.target.value)}
              placeholder="Ask about your ranch history…"
              className={`flex-1 rounded-lg border bg-background px-4 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 ${
                topicWarning
                  ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500"
                  : "border-border focus:border-ring focus:ring-ring"
              }`}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !!topicWarning}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ask
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Reconnect for insights</span>
        </div>
      )}
    </div>
  );
}
