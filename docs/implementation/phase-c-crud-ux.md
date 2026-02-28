# Phase C — CRUD UX (Diary-First)

> **Estimated time:** 2–3 hours
> **Prerequisite:** Phase B complete (database tables exist)
> **Reference:** [schema-draft.md](../schema-draft.md), dashboard currently shows email + sign-out only

---

## Overview

Build the core user-facing pages: app navigation shell, diary entry creation/listing, pasture and herd management. The dashboard becomes the main hub.

---

## Tasks

### C.1 — Update `app/layout.tsx` metadata

Change the default Next.js metadata to Grit & Grain branding:

```tsx
export const metadata: Metadata = {
  title: "Grit & Grain",
  description:
    "The AI-powered ranch assistant — stop relying on memory, start relying on history.",
};
```

---

### C.2 — Create navigation component

Create `components/nav.tsx` — a top navigation bar shared across all authenticated pages.

**Links:**

- Dashboard (`/dashboard`)
- Farm Memory (`/chat`)
- Weekly Review (`/review`)

**Right side:**

- User email (from server-side session)
- Sign out button (POST to `/api/auth/sign-out`)

Keep it minimal — Tailwind, no component library. A horizontal bar with links.

---

### C.3 — Create shared authenticated layout

Create `app/(authenticated)/layout.tsx` — a layout wrapper that:

1. Verifies the user is authenticated (redirects to `/login` if not)
2. Renders the `<Nav />` component
3. Wraps `{children}` in a consistent page container

Move the dashboard, chat, review, and diary routes under this group:

```
app/(authenticated)/
  layout.tsx
  dashboard/page.tsx
  diary/page.tsx
  diary/new/page.tsx
  chat/page.tsx
  review/page.tsx
```

Alternatively, keep the flat structure and import `<Nav />` into each page — simpler for hackathon speed.

**Recommendation:** Use the route group `(authenticated)` approach — it avoids duplicating auth checks and nav imports.

---

### C.4 — Rebuild Dashboard page

The dashboard is the main hub. It should show:

1. **Welcome header** — ranch name (from `profiles`) or user email
2. **Quick stats** — entry count, pasture count (simple queries)
3. **Recent diary entries** — last 5 entries, each showing date, pasture, content snippet
4. **Quick-add button** — links to `/diary/new`
5. **Seed demo button** — shown only if user has 0 diary entries (Phase D will implement the handler)

```tsx
// Server component — fetch data directly
const { data: entries } = await supabase
  .from("diary_entries")
  .select("*, pastures(name)")
  .order("entry_date", { ascending: false })
  .limit(5);
```

---

### C.5 — Create diary entry form

Create `app/(authenticated)/diary/new/page.tsx`:

**Fields:**

- **Date** — date picker, default today
- **Pasture** — dropdown populated from `pastures` table
- **Herd group** — dropdown populated from `herd_groups` table
- **Content** — textarea (the main observation)
- **Tags** — optional multi-select or comma-separated (rainfall, rotation, hay, herd_health, supplement, etc.)

**On submit:**

- Insert into `diary_entries` with `profile_id = user.id`
- Redirect to `/dashboard`

Voice recording will be added in Phase F — for now, manual text input works for the full demo.

Server action or API route — server action is simpler:

```tsx
"use server";
async function createEntry(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("diary_entries").insert({
    profile_id: user.id,
    pasture_id: formData.get("pasture_id") || null,
    herd_group_id: formData.get("herd_group_id") || null,
    entry_date: formData.get("entry_date"),
    content: formData.get("content"),
    tags: formData.getAll("tags"),
  });

  redirect("/dashboard");
}
```

---

### C.6 — Create diary list page

Create `app/(authenticated)/diary/page.tsx`:

- Full list of diary entries for the current user
- Each entry shows: date, pasture name, herd group, content (truncated), tags
- Optional: filter by pasture dropdown, date range
- Link to individual entry (stretch — not needed for demo)

```tsx
const { data: entries } = await supabase
  .from("diary_entries")
  .select("*, pastures(name), herd_groups(name)")
  .order("entry_date", { ascending: false });
```

---

### C.7 — Create pasture management page

Create `app/(authenticated)/pastures/page.tsx` (or a section within dashboard):

Ultra-minimal:

- List existing pastures (name, acres, notes)
- "Add pasture" form (inline or modal): name, acres (optional), notes (optional)
- Edit/delete (stretch — nice but not critical for demo)

---

### C.8 — Create herd group management page

Same pattern as pastures. Create `app/(authenticated)/herds/page.tsx`:

- List existing herd groups (name, species, head count)
- "Add herd group" form: name, species, head count (optional), notes (optional)

---

### C.9 — Create reusable components

Create these in `components/`:

- **`diary-entry-card.tsx`** — displays a single diary entry (date, pasture, content snippet, tags)
- **`empty-state.tsx`** — "No entries yet" message with CTA button (used on dashboard + diary list)

---

## Checklist

- [ ] Layout metadata updated to "Grit & Grain"
- [ ] Navigation component created
- [ ] Auth layout wrapper (route group or per-page)
- [ ] Dashboard rebuilt with recent entries + quick stats
- [ ] Diary entry form (`/diary/new`) with pasture/herd dropdowns
- [ ] Diary list page (`/diary`) with all entries
- [ ] Pasture management (list + add)
- [ ] Herd group management (list + add)
- [ ] Reusable `diary-entry-card` component
- [ ] All pages use consistent styling (Tailwind)
