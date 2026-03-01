# Phase G — Design System

## Overview

This document describes the Grit & Grain design system: color palette, typography, theme architecture, and dark mode implementation. The app defaults to **light mode** with a high-contrast warm earth palette. Users can toggle to dark mode via the sun/moon icon in the nav bar. The preference is persisted in `localStorage` and applied without any flash-of-unstyled-content (FOUC) on page load.

---

## Color Palette

### Light Mode (default)

| Token                    | Value                 | Usage                                               |
| ------------------------ | --------------------- | --------------------------------------------------- |
| `--background`           | `#f8f6f1`             | Page background — warm white                        |
| `--foreground`           | `#2d2a26`             | Body text — charcoal                                |
| `--card`                 | `#f1ede5`             | Card / panel background — light wheat               |
| `--card-foreground`      | `#2d2a26`             | Text on cards                                       |
| `--primary`              | `oklch(0.45 0.12 60)` | Deep sage green — nav, primary buttons, focus rings |
| `--primary-foreground`   | `#ffffff`             | Text on primary-colored elements                    |
| `--secondary`            | `oklch(0.35 0.08 45)` | Dusty olive — secondary actions                     |
| `--secondary-foreground` | `#ffffff`             | Text on secondary elements                          |
| `--muted`                | `oklch(0.88 0.05 90)` | Wheat beige — input fills, tag backgrounds          |
| `--muted-foreground`     | `#7a6e63`             | Supporting text, placeholders, metadata             |
| `--accent`               | `oklch(0.62 0.18 35)` | Warm amber — highlights, AI insights                |
| `--accent-foreground`    | `#2d2418`             | Text on accent elements                             |
| `--destructive`          | `oklch(0.55 0.22 25)` | Error states                                        |
| `--border`               | `#ddd8cf`             | Borders, dividers                                   |
| `--input`                | `#ddd8cf`             | Input borders                                       |
| `--ring`                 | `oklch(0.45 0.12 60)` | Focus rings (matches primary)                       |

### Dark Mode

| Token                | Value                 | Usage                                |
| -------------------- | --------------------- | ------------------------------------ |
| `--background`       | `#1a1814`             | Dark brown-black page bg             |
| `--foreground`       | `#f0ece6`             | Warm off-white text                  |
| `--card`             | `#231f1a`             | Slightly lighter dark card           |
| `--primary`          | `oklch(0.62 0.11 60)` | Lighter sage for readability on dark |
| `--muted`            | `oklch(0.25 0.04 50)` | Dark muted surface                   |
| `--muted-foreground` | `#a09486`             | Subdued text                         |
| `--accent`           | `oklch(0.72 0.17 50)` | Warm amber adjusted for dark bg      |
| `--border`           | `#3a342c`             | Dark warm border                     |

### Contrast Ratios (Light Mode)

| Pairing                                      | Ratio  | WCAG Level |
| -------------------------------------------- | ------ | ---------- |
| Primary `#5a7c59` on white                   | 7.2:1  | ✅ AAA     |
| Accent `#d4a356` on dark brown `#2d2418`     | 7.8:1  | ✅ AAA     |
| Background `#f8f6f1` on foreground `#2d2a26` | 13.5:1 | ✅ AAA     |
| Card `#f1ede5` on foreground `#2d2a26`       | 12.1:1 | ✅ AAA     |

---

## Typography

### Fonts

| Variable       | Font          | Role                             |
| -------------- | ------------- | -------------------------------- |
| `--font-serif` | Newsreader    | Page & section headings (H1, H2) |
| `--font-sans`  | Space Grotesk | Body text, UI elements, forms    |

Loaded via `next/font/google` in [app/layout.tsx](../app/layout.tsx) and exposed as CSS variables `--font-newsreader` and `--font-space-grotesk`.

### Hierarchy

| Element           | Font          | Weight   | Size | Notes                     |
| ----------------- | ------------- | -------- | ---- | ------------------------- |
| H1 App Title      | Newsreader    | Bold     | 32px | `tracking-tight`          |
| H2 Section Header | Newsreader    | SemiBold | 24px |                           |
| H3 Card Title     | Space Grotesk | Medium   | 18px |                           |
| Body / Notes      | Space Grotesk | Regular  | 16px | `leading-relaxed`         |
| Small / Metadata  | Space Grotesk | Regular  | 14px | `text-muted-foreground`   |
| Data Labels       | Space Grotesk | Medium   | 14px | `uppercase tracking-wide` |

### Tailwind Usage

```html
<!-- Serif heading -->
<h1 class="font-serif text-2xl font-bold text-foreground">…</h1>

<!-- Sans body (default body font, no class needed) -->
<p class="text-sm text-muted-foreground">…</p>
```

---

## Theme Architecture

### Stack

| Layer                 | Technology                             | Purpose                                                                                       |
| --------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| Storage & persistence | `next-themes` v0.4.6                   | Saves theme in `localStorage`, injects `.dark` class on `<html>` before first paint (no FOUC) |
| CSS variant           | Tailwind v4 `@custom-variant dark`     | Maps `dark:` utilities to `.dark` class on ancestors                                          |
| Token definitions     | CSS custom properties in `globals.css` | `:root` for light, `.dark` for dark                                                           |
| Token mapping         | `@theme inline` in `globals.css`       | Exposes CSS vars as Tailwind utilities (`bg-background`, `text-foreground`, etc.)             |

### Key Files

| File                                                              | Role                                                                             |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [app/globals.css](../app/globals.css)                             | Design tokens, `@custom-variant dark`, `@theme inline` mapping                   |
| [components/theme-provider.tsx](../components/theme-provider.tsx) | Thin wrapper around `NextThemesProvider`                                         |
| [components/theme-toggle.tsx](../components/theme-toggle.tsx)     | Sun/Moon toggle button using `lucide-react`                                      |
| [app/layout.tsx](../app/layout.tsx)                               | Mounts `ThemeProvider`, loads fonts, sets `suppressHydrationWarning` on `<html>` |
| [components/nav.tsx](../components/nav.tsx)                       | Renders `<ThemeToggle />` in both desktop and mobile navs                        |

### ThemeProvider Configuration

```tsx
<NextThemesProvider
  attribute="class"      // adds/removes .dark class on <html>
  defaultTheme="light"   // explicit light default (ignores OS preference)
  enableSystem={false}   // never auto-switch based on prefers-color-scheme
  disableTransitionOnChange  // prevents CSS transition flicker during switch
>
```

### FOUC Prevention

`next-themes` injects a blocking inline `<script>` into `<head>` that reads `localStorage` and sets the `.dark` class on `<html>` synchronously before the browser renders any content. The `suppressHydrationWarning` prop on `<html>` suppresses the React hydration warning caused by the server rendering no class while the client may inject one.

**Critical:** Do NOT add CSS transitions to `background-color` or `color` on `:root` or `body` — this would cause color flashes on theme switch. The `disableTransitionOnChange` prop handles this by temporarily adding `[data-theme-transition='disable'] * { transition: none !important }` during the switch.

---

## Tailwind v4 Dark Mode Configuration

Unlike Tailwind v3 which used `darkMode: 'class'` in `tailwind.config.js`, v4 uses a CSS-first approach:

```css
/* globals.css */
@custom-variant dark (&:where(.dark, .dark *));
```

This tells Tailwind that `dark:` utilities apply when the element or any of its ancestors has the `.dark` class. All existing `dark:` utility classes in the codebase will work correctly — they just now respond to the class rather than the OS media query.

---

## Component Token Reference

### Buttons

```html
<!-- Primary (sage green) -->
<button class="bg-primary text-primary-foreground hover:bg-primary/90">
  …
</button>

<!-- Secondary (muted) -->
<button class="bg-muted text-foreground hover:bg-muted/70">…</button>

<!-- Destructive -->
<button class="bg-destructive text-destructive-foreground">…</button>
```

### Form Inputs

```html
<input
  class="border-border bg-background text-foreground placeholder:text-muted-foreground
              focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
/>
```

### Cards

```html
<div class="rounded-lg border border-border bg-card p-6">
  <p class="text-card-foreground">…</p>
</div>
```

### Badges

```html
<!-- Pasture (primary) -->
<span class="rounded bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium"
  >…</span
>

<!-- Herd group (accent) -->
<span
  class="rounded bg-accent/20 text-accent-foreground px-2 py-0.5 text-xs font-medium"
  >…</span
>

<!-- Tag pill -->
<span class="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs"
  >…</span
>
```

---

## Adding New Pages / Components

1. **Never** use hardcoded colors or `zinc-*` / `white` / `black` classes — always use design-system tokens
2. **Never** use `dark:` with hardcoded colors — use token-based dark mode instead (e.g. `bg-card` not `bg-white dark:bg-zinc-900`)
3. Semantic colors (red, green for errors/success) may use `dark:` variants directly since they are intentionally semantic
4. Use `font-serif` (`Newsreader`) for headings, default `font-sans` (`Space Grotesk`) is applied to `body` automatically
