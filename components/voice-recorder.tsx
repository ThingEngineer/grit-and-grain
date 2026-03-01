"use client";

import { useState, useRef } from "react";
import { Mic, Square } from "lucide-react";

type VoiceRecorderProps = Readonly<{
  onTranscript: (text: string) => void;
  label?: string;
}>;

export function VoiceRecorder({
  onTranscript,
  label = "Record note",
}: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        "Voice recognition is not supported in this browser. Try Chrome or Edge.",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    onTranscript(transcript);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        aria-label={isListening ? "Stop recording" : "Start voice recording"}
        aria-pressed={isListening}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          isListening
            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {isListening ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            <Square className="h-4 w-4" aria-hidden="true" />
            Stop recording
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" aria-hidden="true" />
            {label}
          </>
        )}
      </button>
      {transcript && !isListening && (
        <span className="text-xs text-muted-foreground">
          Transcript ready — tap again to re-record
        </span>
      )}
    </div>
  );
}
