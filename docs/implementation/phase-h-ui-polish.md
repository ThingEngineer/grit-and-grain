# Phase H — UI/UX Polish & Production Readiness

> **Estimated time:** 4–6 hours across 5 sprints
> **Prerequisite:** Phases B–G complete
> **Goal:** Elevate the app from functional to visually production-ready — consistent component primitives, interaction polish, and delight details that make the product feel complete.

---

## Audit Summary

The design foundation is strong: well-structured OKLCH design tokens, correct dark mode via `next-themes`, Newsreader/Space Grotesk typography hierarchy, and good accessibility groundwork. The gaps are classic functional-first build artifacts:

- Button, input, label, card, and alert Tailwind class strings duplicated verbatim across ~10 files
- Body font variable declared but never applied to `body` in `globals.css`
- Nav active links are visually identical to inactive ones despite `aria-current` being set
- Hardcoded Tailwind color values (`green-200`, `green-50`) bypass the design token system
- Loading states are a single spinner rather than skeleton screens matched to content

---

## Sprint 1 — Component Primitives & Base Fixes

### H.1.1 — Create `components/ui/` primitive library

These wrapper components eliminate class string duplication and establish a single source of truth for all interactive element styles.

**Files to create:**

#### `components/ui/button.tsx`

```tsx
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx"; // or twMerge if already available

type ButtonVariant =
  | "default"
  | "secondary"
  | "ghost"
  | "destructive"
  | "outline";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
  ghost: "text-foreground hover:bg-muted hover:text-foreground",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-border bg-transparent text-foreground hover:bg-muted",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
```

#### `components/ui/input.tsx`

```tsx
import { type InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={[
      "w-full rounded-md border border-input bg-background px-3 py-2",
      "text-sm text-foreground shadow-sm placeholder:text-muted-foreground",
      "focus:border-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    {...props}
  />
));
Input.displayName = "Input";
```

#### `components/ui/label.tsx`

```tsx
import { type LabelHTMLAttributes } from "react";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`mb-1 block text-sm font-medium text-foreground ${className ?? ""}`}
      {...props}
    />
  );
}
```

#### `components/ui/card.tsx`

```tsx
type CardProps = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-card shadow-sm ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={`border-b border-border px-4 py-3 ${className ?? ""}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: CardProps) {
  return <div className={`p-4 ${className ?? ""}`}>{children}</div>;
}
```

#### `components/ui/alert.tsx`

Replaces the hardcoded `border-green-200 bg-green-50 text-green-800` pattern used in the account and profile pages. Uses design tokens where possible; semantic green/amber/red only for status color.

```tsx
type AlertVariant = "success" | "error" | "warning" | "info";

type AlertProps = Readonly<{
  variant: AlertVariant;
  children: React.ReactNode;
  role?: string;
}>;

const variantClasses: Record<AlertVariant, string> = {
  success:
    "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  info: "border-border bg-muted text-foreground",
};

export function Alert({ variant, children, role = "alert" }: AlertProps) {
  return (
    <div
      role={role}
      className={`rounded-md border px-4 py-3 text-sm ${variantClasses[variant]}`}
    >
      {children}
    </div>
  );
}
```

#### `components/ui/badge.tsx`

Replaces inline pasture/herd/tag chips in `DiaryEntryCard`.

```tsx
type BadgeVariant = "primary" | "accent" | "muted";

type BadgeProps = Readonly<{
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}>;

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/20 text-accent-foreground",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({ children, variant = "muted", className }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
```

---

### H.1.2 — Apply body font in `globals.css`

**File:** `app/globals.css`

The `--font-space-grotesk` variable is declared via `next/font` in `layout.tsx` but never assigned to `body`. All `font-sans` styling currently falls back to the browser default.

**Add after the `@theme inline` block:**

```css
body {
  font-family: var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif;
}
```

---

### H.1.3 — Nav active link indicator

**File:** `components/nav.tsx`

`aria-current="page"` is already set on active links but there is zero visual difference between active and inactive states.

**Change the desktop nav link `className`:**

```tsx
// Before
className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"

// After — conditionally apply active style
className={`text-sm font-medium transition-colors hover:text-foreground ${
  pathname === href
    ? "text-foreground underline underline-offset-4 decoration-primary"
    : "text-muted-foreground"
}`}
```

**Change the mobile dropdown link `className`:**

```tsx
// After
className={`py-3 text-sm font-medium transition-colors hover:text-foreground ${
  pathname === href ? "text-foreground font-semibold" : "text-muted-foreground"
}`}
```

---

### H.1.4 — Refactor alert instances to use `Alert` component

After creating `Alert` (H.1.1), replace all inline alert patterns in:

- `app/(authenticated)/account/page.tsx` — success/error params
- `app/(authenticated)/profile/page.tsx` — success/error params
- `app/(authenticated)/chat/page.tsx` — error display, topic warning

---

## Sprint 2 — Core Screen Polish

### H.2.1 — Dashboard stat cards

**File:** `app/(authenticated)/dashboard/page.tsx`

**Problems:**

- Only 2 of 4 grid columns are populated
- Numbers have no icon, no accent color, and no visual weight
- No hover state on cards

**Changes:**

1. Fetch herd count alongside existing queries in `getDashboardData`
2. Add a "last entry" relative timestamp as the 4th stat
3. Apply `text-primary` to the stat number for accent
4. Add `hover:shadow-md transition-shadow` to each card
5. Add Lucide icons (`BookOpen`, `MapPin`, `Users`, `Calendar`) imported from `lucide-react`

**Example card structure:**

```tsx
<div className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow">
  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
    <BookOpen className="h-4 w-4" aria-hidden="true" />
    <span className="text-xs font-medium uppercase tracking-wide">
      Diary entries
    </span>
  </div>
  <p className="font-serif text-3xl font-bold text-primary">
    {entryCount ?? 0}
  </p>
</div>
```

---

### H.2.2 — Diary entry card polish

**File:** `components/diary-entry-card.tsx`

**Problems:**

- Edit/Delete are tiny text links — hard to tap on mobile
- Content is truncated with JS string slicing (can overflow on long words)
- Tags use `text-muted-foreground` (low contrast) with no consistent sizing
- No hover state on the card

**Changes:**

1. Replace `Edit` / `Delete` text links with icon buttons (`Pencil`, `Trash2` from `lucide-react`)
2. Replace JS truncation with CSS `line-clamp-3 overflow-hidden break-words`
3. Replace inline tag `<span>` with `Badge` component (from H.1.1)
4. Add `hover:shadow-md transition-shadow` and `border-l-2 border-l-primary/20 hover:border-l-primary/60` to the card
5. Use `Badge` variant `primary` for pasture chips, `accent` for herd chips, `muted` for tags

```tsx
// Content truncation — replace the JS slice:
// Before
const truncated = content.length > 180 ? content.slice(0, 180) + "…" : content;
// <p className="mb-2 text-sm text-card-foreground">{truncated}</p>

// After
<p className="mb-2 line-clamp-3 overflow-hidden break-words text-sm text-card-foreground">
  {content}
</p>;
```

---

### H.2.3 — Empty state icons

**File:** `components/empty-state.tsx`

**Change:** Accept an optional `icon` prop (a Lucide icon component at `className="h-10 w-10 text-muted-foreground/50"`) rendered above the message text.

```tsx
import type { LucideIcon } from "lucide-react";

type EmptyStateProps = Readonly<{
  icon?: LucideIcon;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}>;

export function EmptyState({ icon: Icon, message, actionLabel, actionHref }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12">
      {Icon && (
        <Icon
          className="mb-4 h-10 w-10 text-muted-foreground/50"
          aria-hidden="true"
        />
      )}
      <p
        className={`text-sm text-muted-foreground ${actionLabel ? "mb-4" : ""}`}
      >
        {message}
      </p>
      {actionLabel && actionHref && (
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
```

**Apply icons at call sites:**

| Page                     | Icon                                        |
| ------------------------ | ------------------------------------------- |
| Diary list               | `BookOpen`                                  |
| Dashboard recent entries | `BookOpen`                                  |
| Pastures                 | `MapPin`                                    |
| Herds                    | `Users`                                     |
| Chat (empty)             | already has 🌾 emoji — replace with `Wheat` |
| Review                   | `FileText`                                  |

---

### H.2.4 — Page header component

**File:** `components/page-header.tsx` (new)

Standardizes the `<h1>` + optional description + optional action pattern used on every authenticated page.

```tsx
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type PageHeaderProps = Readonly<{
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
}>;

export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {backLabel ?? "Back"}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
```

**Apply to:**

- `dashboard/page.tsx` — with `action={<Link href="/diary/new">+ New entry</Link>}`
- `diary/page.tsx` — with `action={<Link href="/diary/new">+ New entry</Link>}`
- `diary/[id]/edit/page.tsx` — with `backHref="/diary" backLabel="All entries"`
- `diary/new/page.tsx` — with `backHref="/diary" backLabel="All entries"`
- `herds/page.tsx`
- `pastures/page.tsx`
- `review/page.tsx`
- `chat/page.tsx`
- `account/page.tsx`
- `profile/page.tsx`

---

## Sprint 3 — Loading States & Structural Polish

### H.3.1 — Route-level skeleton loading screens

Skeleton screens matched to content shape are significantly better UX than a centered spinner.

**Files to create:**

#### `app/(authenticated)/diary/loading.tsx`

```tsx
export default function DiaryLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-36 rounded-md bg-muted" />
        <div className="h-9 w-28 rounded-md bg-muted" />
      </div>
      <div className="mb-6 h-12 w-full rounded-lg bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex justify-between">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-4/5 rounded bg-muted" />
              <div className="h-3 w-3/5 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### `app/(authenticated)/dashboard/loading.tsx`

```tsx
export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="mt-2 h-4 w-36 rounded bg-muted" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
            <div className="h-8 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 h-4 w-40 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="mt-1 h-3 w-4/5 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### `app/(authenticated)/review/loading.tsx`

```tsx
export default function ReviewLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 h-8 w-40 rounded-md bg-muted" />
      <div className="mb-6 h-4 w-96 rounded bg-muted" />
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`h-3 rounded bg-muted ${i % 3 === 2 ? "w-2/3" : "w-full"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### H.3.2 — Weekly Review: structured output display

**File:** `app/(authenticated)/review/review-client.tsx`

**Problems:**

- Streamed markdown has no visual containment
- Previous reviews are displayed in an unstyled list
- No copy-to-clipboard action on completed reviews

**Changes:**

1. Wrap the streaming review output in a `Card` with an `accent`-colored top border: `border-t-2 border-t-accent`
2. Add a "Copy" button (uses `Check` / `Copy` icon from `lucide-react` with a 2s success state)
3. Render previous reviews as collapsible sections — show date as header, collapse body by default
4. Add a `prose prose-sm dark:prose-invert` wrapper around all markdown output for consistent typography

```tsx
// Copy button pattern
const [copied, setCopied] = useState(false);

function handleCopy(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

// Button render
<button onClick={() => handleCopy(reviewText)} className="...">
  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
  {copied ? "Copied" : "Copy"}
</button>;
```

---

## Sprint 4 — Interaction Polish

### H.4.1 — Chat UI: bubble style and scroll UX

**File:** `app/(authenticated)/chat/page.tsx`

**Problems:**

- User bubble uses `bg-foreground text-background` — jarring in dark mode, semantically odd
- No scroll-to-bottom button when user scrolls up mid-conversation
- "Thinking…" indicator is a bare animate-pulse text with no visual distinction

**Changes:**

1. **User bubble:** change to `bg-primary text-primary-foreground rounded-br-sm`
2. **Assistant bubble:** change to `bg-card border border-border rounded-bl-sm`
3. **Scroll-to-bottom button:** attach a `ref` to the message container and render a floating `ChevronDown` button (fixed bottom-right of the message area) when `scrollTop < scrollHeight - clientHeight - 100`
4. **Thinking indicator:** replace with three animated dots:

```tsx
<div className="flex items-center gap-1 px-4 py-3">
  {[0, 1, 2].map((i) => (
    <span
      key={i}
      className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
      style={{ animationDelay: `${i * 150}ms` }}
    />
  ))}
</div>
```

---

### H.4.2 — Mobile nav: slide animation

**File:** `components/nav.tsx`

Replace the abrupt conditional mount of the mobile menu with a `framer-motion` `AnimatePresence` slide.

```tsx
import { AnimatePresence, motion } from "framer-motion";

// Replace {menuOpen && <div ...>} with:
<AnimatePresence>
  {menuOpen && (
    <motion.div
      id="mobile-menu"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="border-t border-border bg-background md:hidden"
    >
      {/* existing content unchanged */}
    </motion.div>
  )}
</AnimatePresence>;
```

---

### H.4.3 — Table rows: hover states and icon actions

**Files:** `components/herd-form.tsx`, `components/pasture-form.tsx`

**Changes:**

1. Add `hover:bg-muted/40 transition-colors` to each `<tr>`
2. Replace text "Delete" links with `<button>` containing `Trash2` icon from `lucide-react`
3. Wrap the icon button in a `title` attribute for tooltip: `title="Delete"`
4. Add a `sr-only` span inside the button for accessibility: `<span className="sr-only">Delete {name}</span>`

---

### H.4.4 — Delete confirmation modal: entry animation

**File:** `components/diary-entry-card.tsx`

Wrap the modal content `<div>` (not the backdrop) in a Framer Motion `motion.div` for a subtle scale-in:

```tsx
<AnimatePresence>
  {showConfirm && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" ...>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        {/* existing content unchanged */}
      </motion.div>
    </div>
  )}
</AnimatePresence>
```

---

## Sprint 5 — Micro-polish & Final Pass

### H.5.1 — Voice recorder: replace emoji with Lucide icons

**File:** `components/voice-recorder.tsx`

Replace `🎙` emoji with `Mic` from `lucide-react`. The ping animation indicator color is also too subtle.

```tsx
import { Mic, Square } from "lucide-react";

// Recording button:
{
  isListening ? (
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
  );
}
```

---

### H.5.2 — Form field helper text

**Files:** `app/(authenticated)/diary/new/diary-entry-form.tsx`, `app/(authenticated)/diary/[id]/edit/diary-entry-edit-form.tsx`, `components/profile-form.tsx`

Add `<p className="mt-1 text-xs text-muted-foreground">` helper text below key fields:

| Field                  | Helper text                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| `content` (diary)      | "Speak freely — AI will extract dates, weather, and events automatically." |
| `ranch_name` (profile) | "Used in your dashboard heading and weekly reviews."                       |
| `entry_date`           | "Defaults to today. Adjust if recording a past observation."               |

Add `<p className="mb-4 text-xs text-muted-foreground">Fields marked * are required.</p>` at the top of forms with required fields.

---

### H.5.3 — Focus ring standardization

Ensure all interactive elements use the same focus ring spec: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`. This is automatically handled once all inputs and buttons are routed through `components/ui/input.tsx` and `components/ui/button.tsx` (H.1.1).

**Check and update manually:**

- `components/voice-recorder.tsx` — recording button
- `components/read-aloud-button.tsx` — read aloud button
- `components/theme-toggle.tsx` — toggle button
- `components/profile-menu.tsx` — menu trigger
- Landing page CTAs in `components/landing/hero.tsx`

---

### H.5.4 — Seed button UX

**File:** `components/seed-button.tsx`

Review the current implementation and ensure:

- Button is not shown in production (only dev/staging) — add an environment check
- Loading state shows a spinner inline, not just disabled
- Success/failure state communicates clearly before the button disappears

---

## Completion Checklist

### Sprint 1 — Primitives & Base

- [ ] `components/ui/button.tsx` created
- [ ] `components/ui/input.tsx` created
- [ ] `components/ui/label.tsx` created
- [ ] `components/ui/card.tsx` created
- [ ] `components/ui/alert.tsx` created
- [ ] `components/ui/badge.tsx` created
- [ ] `globals.css` — body font applied
- [ ] `components/nav.tsx` — active link indicator added
- [ ] `account/page.tsx` — alert refactored
- [ ] `profile/page.tsx` — alert refactored
- [ ] `chat/page.tsx` — error/warning alerts refactored

### Sprint 2 — Core Screens

- [ ] Dashboard stat cards — icons, herd count, last-entry stat, hover
- [ ] `diary-entry-card.tsx` — icon buttons, CSS truncation, badges, hover
- [ ] `empty-state.tsx` — icon prop added
- [ ] Empty state icons applied at all call sites
- [ ] `components/page-header.tsx` created
- [ ] Page header applied to all authenticated pages

### Sprint 3 — Loading & Structure

- [ ] `diary/loading.tsx` skeleton created
- [ ] `dashboard/loading.tsx` skeleton created
- [ ] `review/loading.tsx` skeleton created
- [ ] `review-client.tsx` — accent card border, copy button, collapsible history

### Sprint 4 — Interaction

- [ ] Chat bubbles — primary for user, card for assistant
- [ ] Chat — three-dot typing indicator
- [ ] Chat — scroll-to-bottom button
- [ ] Mobile nav — Framer Motion slide animation
- [ ] Table rows — hover states + icon action buttons
- [ ] Delete confirmation — Framer Motion scale animation

### Sprint 5 — Micro-polish

- [ ] Voice recorder — Lucide icon, ping fix
- [ ] Form helper text added to diary and profile forms
- [ ] Focus ring standardization pass
- [ ] Seed button environment check + loading state
- [ ] Final `pnpm lint` clean pass
- [ ] Final `pnpm test` green pass

---

## Notes

- All new components should be in `components/ui/` and imported with `@/components/ui/...`
- Do not install a component library (shadcn, radix, MUI) — keep primitives hand-rolled to stay lightweight and on-brand
- `clsx` or `tailwind-merge` may be added if not already present to handle conditional class composition in primitives
- Dark mode is handled by design tokens — no `dark:` utility classes needed in the new primitives except in `Alert` (which has semantic status colors outside the token system)
- Framer Motion is already a dependency — no new packages needed for animations
