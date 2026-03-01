"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { stripMarkdown } from "@/lib/utils/strip-markdown";

type ReadAloudButtonProps = Readonly<{
  /** Raw text (may contain Markdown) to read aloud. */
  text: string;
}>;

export function ReadAloudButton({ text }: ReadAloudButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
  }, []);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  function toggle() {
    if (isSpeaking) {
      stop();
      return;
    }

    const plain = stripMarkdown(text);
    if (!plain) return;

    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.lang = "en-US";

    utterance.onend = () => {
      utteranceRef.current = null;
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      utteranceRef.current = null;
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isSpeaking ? "Stop reading" : "Read aloud"}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
        isSpeaking
          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
          : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
      }`}
    >
      {isSpeaking ? (
        <>
          <VolumeX className="h-3.5 w-3.5" />
          Stop
        </>
      ) : (
        <>
          <Volume2 className="h-3.5 w-3.5" />
          Read Aloud
        </>
      )}
    </button>
  );
}
