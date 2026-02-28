# Phase F — Polish & Demo Readiness

> **Estimated time:** 1–2 hours
> **Prerequisite:** Phases B–E complete (or at least B + C + D)
> **Reference:** [demo-script.md](../demo-script.md), [README.md](../../README.md)

---

## Overview

Final polish pass: fix metadata, create `.env.example`, add voice capture UI, verify demo flow end-to-end, and ensure the repo looks professional for AI judge scanning.

---

## Tasks

### F.1 — Create `.env.example`

Create `.env.example` in the project root (referenced by README):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJ...
SUPABASE_SECRET_KEY=eyJ...

# AI — Vercel AI Gateway
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### F.2 — Voice capture component (Web Speech API)

Create `components/voice-recorder.tsx`:

Uses the browser's built-in Web Speech API (`SpeechRecognition`) for real-time voice-to-text. No server call needed for transcription in MVP.

**Behavior:**

1. Tap microphone → start listening
2. Real-time transcript appears as text
3. Tap stop → final transcript fills the diary entry `content` field
4. User reviews, optionally edits, then saves

```typescript
'use client';
import { useState, useRef } from 'react';

export function VoiceRecorder({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
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
    <div>
      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? '⏹ Stop' : '🎙 Record'}
      </button>
      {transcript && <p className="text-sm text-zinc-500 mt-2">{transcript}</p>}
    </div>
  );
}
```

Integrate this into the diary entry form (`/diary/new`) — the transcript fills the content textarea.

---

### F.3 — Add TypeScript declaration for Web Speech API

Create `types/speech.d.ts` (or add to existing declarations):

```typescript
interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}
```

---

### F.4 — Verify layout metadata

Confirm `app/layout.tsx` has:

```tsx
export const metadata: Metadata = {
  title: "Grit & Grain",
  description:
    "The AI-powered ranch assistant — stop relying on memory, start relying on history.",
};
```

---

### F.5 — Style consistency pass

Quick visual check across all pages:

- Consistent color scheme (zinc/neutral palette from Tailwind)
- Dark mode works (if using `dark:` classes)
- Cards/containers have consistent border-radius and spacing
- Buttons use the same style (rounded-full or rounded-lg — pick one)
- Typography: headings are consistent sizes

---

### F.6 — Demo flow end-to-end test

Walk through the exact [demo script](../demo-script.md) sequence:

1. **Sign in** with the demo account
2. **Seed demo farm** (if not already seeded) → verify entries appear
3. **Navigate to Dashboard** → see recent entries, stats
4. **Record a voice note** (or type a new diary entry) → verify it saves + tags correctly
5. **Open Farm Memory** → ask "When did we last rest the south pasture?" → verify cited response
6. **Open Weekly Review** → click Generate → verify structured summary appears
7. **Check review history** → verify the review was saved and is viewable

**Fix any issues discovered during this walkthrough.**

---

### F.7 — README final check

Verify these match the actual implementation:

- [ ] Technical Implementation table matches real models/packages used
- [ ] Getting Started instructions actually work
- [ ] Docs links point to correct files
- [ ] No references to features that don't exist yet (or they're clearly marked as roadmap)

---

### F.8 — Git housekeeping

```bash
# Make sure .gitignore includes:
.env.local
.env*.local
node_modules/
.next/
supabase/.temp/

# Clean commit history if needed
git add -A
git commit -m "MVP complete: auth + CRUD + seed data + AI features (RAG chat, weekly review)"
git push
```

---

### F.9 — Deploy to Vercel (if time allows)

```bash
# Link to Vercel project
vercel link

# Set environment variables on Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
vercel env add SUPABASE_SECRET_KEY
vercel env add OPENAI_API_KEY
vercel env add ANTHROPIC_API_KEY

# Deploy
vercel --prod
```

Point the Supabase project at the production Supabase instance (not local).

---

## Checklist

- [ ] `.env.example` file created
- [ ] Voice recorder component implemented
- [ ] TypeScript declaration for Web Speech API
- [ ] Layout metadata updated
- [ ] Style consistency across pages
- [ ] Demo flow tested end-to-end (all 7 steps from demo script)
- [ ] README verified against actual implementation
- [ ] Git clean, committed, pushed
- [ ] Deployed to Vercel (stretch goal)
