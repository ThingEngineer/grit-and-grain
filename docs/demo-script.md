# Demo Video Script — Grit & Grain (2–3 Minutes)

> **Presenter note:** The demo account is pre-loaded with 12 months of synthetic diary data for "Dry Creek Ranch." All AI responses shown are grounded in that seed data.

---

> _Hi, I’m Josh Campbell. I grew up on a small hobby farm in Willard, Missouri, and I care deeply about building practical tools for people who do hard, essential work. Grit & Grain is my answer to one of agriculture’s most overlooked problems: institutional knowledge disappears when it lives only in someone’s head. With voice-first capture, grounded AI retrieval, and weekly operational summaries, Grit & Grain helps ranchers turn experience into a durable competitive advantage._

## Opening (0:00 – 0:20)

> _"Every rancher I've talked to has the same problem: decades of knowledge stored entirely up here [point to head]. What happened to the north pasture in that dry year? When did they last cut hay on the south field? The answer is usually 'I think it was… maybe three years ago?' — and that uncertainty costs money."_

> _"Grit & Grain changes that. It's a voice-first field journal that turns your daily observations into a searchable, AI-powered history of your ranch."_

---

## Act 1 — Recording a Voice Note (0:20 – 0:55)

**Action:** Navigate to the Dashboard. Tap the microphone button.

> _"It starts with the most natural thing in the world — talking. I'm going to record a quick note the way a rancher actually would, right after checking on the animals."_

**Speak into the mic:**

> _"February 28th, moved the Angus herd off the south pasture. Grass is looking thin but the water trough is full after last week's rain — guessing about an inch and a half. Planning to rest south for at least 30 days."_

**Action:** Tap **Stop**. Watch the transcript appear. The entry is automatically tagged to "South Pasture" and today's date.

> _"The note is transcribed, tagged to the right pasture, and saved — no form-filling, no typing. That's the whole input experience."_

---

## Act 2 — Farm Memory Chat (0:55 – 1:50)

**Action:** Navigate to **Farm Memory**. Type (or speak) the question:

> _"When did we last rest the south pasture, and what was the rainfall that month?"_

**Wait for response (≈ 2 seconds).** The AI returns an answer with inline citations.

**Expected response (example):**

> _"The South Pasture was last rested in August 2025 for 28 days following the July rotation move [Entry #142, 2025-07-31]. Recorded rainfall for August 2025 was approximately 0.8 inches across three events [Entry #147, 2025-08-12; Entry #151, 2025-08-22]."_

> _"That's the key thing: every answer cites the actual diary entry it came from. No hallucinated numbers — it's grounded in your history."_

**Ask a second question:**

> _"Has the south pasture ever produced a second hay cut in a dry year?"_

**Action:** Scroll through the cited entries that appear.

> _"It searched across 12 months of entries and found every relevant note. This is what 'longitudinal' means — the more you log, the smarter the answers get."_

---

## Act 3 — Weekly Review (1:50 – 2:25)

**Action:** Navigate to **Weekly Review**. Click **Generate This Week's Review**.

> _"Every week, Grit & Grain synthesises everything you logged into a structured summary — rainfall totals, rotation moves, hay activity, herd health. No more trying to remember what happened Monday when you're doing your Saturday planning."_

> _"In testing, reviews are generated on-demand so the producer stays in control. In practice, this would be scheduled automatically on a chosen day and time, and optionally delivered by email or push notification."_

**Highlight the "Trends to Watch" section.**

> _"This section flags things worth monitoring next week — things the AI noticed across your entries that you might not have consciously connected."_

---

## Act 4 — Offline Mode (2:25 – 2:45)

**Action:** Navigate to the **Dashboard**. Disconnect from the Internet (toggle Wi-Fi off or unplug the ethernet cable).

> _"One more thing ranchers ask about — what happens when you're out of cell range? Because that's most of the time."_

**Action:** Point out the **Offline** banner that appears at the top of the screen.

> _"The app detects it immediately and lets you know. But watch — everything still works."_

**Action:** Tap the microphone button and record a new diary entry.

> _"March 1st, moved the cow-calf pairs off the north pasture. Looking a little thin after the strip-grazing. Going to let it rest for three weeks before putting anyone back on it."_

**Action:** Tap **Stop**. The entry saves locally — it appears in the diary list.

> _"That entry is saved right on the device. No signal, no problem. If you try to open Farm Memory or generate a review, you'll see a 'Reconnect for insights' message — but recording notes keeps working without interruption."_

**Action:** Re-enable the Internet connection. Watch the offline banner disappear and the queued entry sync automatically.

> _"The moment you're back online, it syncs silently in the background. Nothing to confirm, nothing to re-submit. Your entry is in the database, embedded, and ready to be cited in a future Farm Memory answer."_

---

## Closing (2:45 – 3:05)

> _"Every voice note you record today becomes historical context for a question you haven't thought to ask yet. Three years from now you'll be able to ask 'what did we do the last time we had a dry February?' — and you'll get a real answer, with receipts."_

> _"Grit & Grain: stop relying on memory, start relying on history."_

---

## Q&A Prompts (if time allows)

- _"What happens to my voice recordings?"_ → Transcribed and discarded; only text is stored.
- _"Does it work offline?"_ → Yes. The app installs as a PWA and caches all pages for offline browsing. Any diary entries, pasture changes, or herd updates you make without signal are queued locally and sync automatically the moment you reconnect. AI features (Farm Memory, Weekly Review) show a "Reconnect for insights" message but everything else keeps working.
- _"How does the AI know which pasture I'm talking about?"_ → NLP entity extraction recognises pasture names from your profile; you can also tap to confirm or correct the auto-tag.
