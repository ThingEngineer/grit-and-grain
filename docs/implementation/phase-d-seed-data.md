# Phase D — Seed Data (Demo Reliability)

> **Estimated time:** 1–2 hours
> **Prerequisite:** Phase B complete (tables exist), Phase C helpful but not required
> **Reference:** [demo-script.md](../demo-script.md) — "Dry Creek Ranch" with 12 months of synthetic data

---

## Overview

Create an API route that seeds a demo ranch with realistic data. This is **critical for demo reliability** — the Farm Memory chat and Weekly Review need real entries to query against. The seed button appears on the dashboard when the user has no entries.

---

## Tasks

### D.1 — Create seed API route

Create `app/api/seed/route.ts`:

**Flow:**

1. Authenticate the user (via server client)
2. Check if user already has diary entries (skip if so, or offer to reset)
3. Update user's profile with ranch name "Dry Creek Ranch"
4. Create pastures
5. Create herd groups
6. Create 12 months of diary entries with realistic patterns
7. Return success JSON

**Important:** Use the Supabase admin client (`lib/supabase/admin.ts`) to bypass RLS during seeding, but set `profile_id` to the authenticated user's ID on every row.

---

### D.2 — Define seed pastures

Create 4 pastures for "Dry Creek Ranch":

```typescript
const pastures = [
  {
    name: "North Pasture",
    acres: 40,
    notes: "Cool-season mix, fescue dominant. Creek runs along north edge.",
  },
  {
    name: "South Pasture",
    acres: 35,
    notes: "Warm-season grasses. Tends to dry out in late summer.",
  },
  {
    name: "East Hay Field",
    acres: 25,
    notes: "Primarily orchard grass and clover. Cut for hay 1-2x per season.",
  },
  {
    name: "West Bottom",
    acres: 20,
    notes:
      "Low-lying area near creek. Rich soil, holds moisture well. Floods occasionally.",
  },
];
```

---

### D.3 — Define seed herd groups

```typescript
const herdGroups = [
  {
    name: "Angus Cow-Calf Pairs",
    species: "cattle",
    head_count: 32,
    notes: "Main herd. Spring calving season Feb-April.",
  },
  {
    name: "Yearling Steers",
    species: "cattle",
    head_count: 15,
    notes: "Backgrounding group. Target weight 850 lbs by fall.",
  },
];
```

---

### D.4 — Generate 12 months of diary entries

Create entries spanning **March 2025 – February 2026** (12 months leading up to today). This gives the RAG system meaningful historical context.

**Target: 30–50 entries** covering a realistic yearly cycle:

| Month        | Key Events to Seed                                                                     |
| ------------ | -------------------------------------------------------------------------------------- |
| **Mar 2025** | Spring green-up starting. First rotation move. Calving season begins.                  |
| **Apr 2025** | Active calving. Moved pairs to North Pasture. Light rain.                              |
| **May 2025** | Good grass growth. First hay cut on East Hay Field. Brand/tag new calves.              |
| **Jun 2025** | Peak growth. Rotated to South Pasture. Adequate rainfall.                              |
| **Jul 2025** | Summer slump beginning. Grass thinning on South. Moved back to North.                  |
| **Aug 2025** | Dry month. Rested South Pasture 28 days. Minimal rain (0.8 in total).                  |
| **Sep 2025** | Second hay cut on East. Fall recovery on South. Rain returns.                          |
| **Oct 2025** | Weaned calves. Sold yearlings. Good pasture condition.                                 |
| **Nov 2025** | Stockpiled fescue on North. Started supplementing yearlings.                           |
| **Dec 2025** | Winter feeding begins. 4 bales/week to cow-calf herd. Cold snap.                       |
| **Jan 2026** | Heavy hay feeding (6 bales/week). Vet check on pregnant cows. Snow.                    |
| **Feb 2026** | Pre-calving prep. Two rainfall events (0.6" + 0.4"). First calf of year. Pasture walk. |

**Each entry should include:**

- Realistic `content` text (1–3 sentences, written like a voice note)
- `entry_date` within the month
- `pasture_id` and/or `herd_group_id` where relevant
- `tags` array (e.g. `['rotation', 'rainfall']`)

**Example entries:**

```typescript
{
  entry_date: '2025-03-15',
  pasture_id: northPastureId,
  herd_group_id: cowCalfId,
  content: 'North pasture is greening up nicely after last week\'s rain. Ground is still soft in spots near the creek. Moved the cow-calf pairs out here today — plenty of forage to get started. Estimated about 0.6 inches of rain this week.',
  tags: ['rotation', 'rainfall'],
},
{
  entry_date: '2025-07-22',
  pasture_id: southPastureId,
  herd_group_id: cowCalfId,
  content: 'South pasture is looking thin — classic summer slump. Grass barely above ankle height. Moving the herd back to North tomorrow. Going to rest South for at least 30 days.',
  tags: ['rotation', 'herd_health'],
},
{
  entry_date: '2025-12-08',
  pasture_id: null,
  herd_group_id: cowCalfId,
  content: 'Started full winter feeding today. Putting out 4 round bales per week for the cow-calf pairs. Hay tested at 9% protein — decent but might need to supplement with a mineral tub.',
  tags: ['hay', 'supplement'],
},
```

---

### D.5 — Trigger embedding generation after seeding

After all entries are inserted, call the embedding endpoint for each entry. This ensures the Farm Memory chat has vectors to search against immediately.

```typescript
// After inserting all entries, trigger embedding for each
for (const entry of insertedEntries) {
  await fetch("/api/ai/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entryId: entry.id }),
  });
}
```

**Note:** This depends on Phase E (AI features). If Phase E isn't done yet, skip this step and add a manual "Generate all embeddings" button later.

**Alternative for speed:** Generate embeddings in the seed route directly using the Vercel AI SDK, without calling the separate endpoint.

---

### D.6 — Add seed button to dashboard

In the dashboard page, show a "Seed Demo Farm" button when the user has 0 diary entries:

```tsx
{
  entries.length === 0 && (
    <button onClick={handleSeed} className="...">
      🌾 Load Demo Farm (Dry Creek Ranch)
    </button>
  );
}
```

The button calls `POST /api/seed` and reloads the page on success.

---

## Checklist

- [ ] Seed API route created (`/api/seed`)
- [ ] 4 pastures with realistic names, acres, and notes
- [ ] 2 herd groups with species and head counts
- [ ] 30–50 diary entries spanning 12 months (Mar 2025 – Feb 2026)
- [ ] Entries cover: rotation moves, rainfall, hay cuts, winter feeding, calving, summer slump
- [ ] Tags applied to each entry
- [ ] Profile updated with "Dry Creek Ranch" name
- [ ] Seed button on dashboard (visible when no entries exist)
- [ ] Embedding generation triggered after seeding (or deferred to Phase E)
