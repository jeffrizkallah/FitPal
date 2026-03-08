# CLAUDE.md — Forma Project Instructions

## Project Overview
Forma is a minimalist AI fitness app built with **Next.js, Tailwind, and Neon DB**.
Core principles are in `CompanyBible.md`. Project phases and task tracking are in `Progress.md`.

---

## Progress Tracking — MANDATORY

After **every** session where code is added, changed, or a task is completed:

1. Open `Progress.md`
2. Update the relevant task row — change the status symbol:
   - `🔲` → Not Started
   - `🔄` → In Progress
   - `✅` → Complete
   - `⏸` → Blocked (add a note in the Notes column explaining why)
3. Move any fully completed tasks to the **Completed Items** section at the bottom with the completion date.
4. Update the **Phase Overview** table at the top to reflect overall phase status.
5. Update the `Last Updated` date at the top of the file.

Do this **before ending the session**, not after. No exceptions.

---

## Design Rules — Neumorphic Soft UI (MANDATORY for every component)

### Palette — CSS Variables (single source of truth in `globals.css` `:root`)
| Variable | Value | Use |
| :--- | :--- | :--- |
| `--neuo-bg` | `#f0f0f0` | All surface backgrounds |
| `--neuo-light` | `#ffffff` | Top-left shadow (light source) |
| `--neuo-dark` | `#d0d0d0` | Bottom-right shadow (depth) |
| `--neuo-mid` | `#d8d8d8` | Mid shadow for smaller elements |
| `#007AFF` | Action color | Buttons, active states, accent only |
| `#2c2c2c` | Text primary | Never pure black |

**Rule: Always reference `var(--neuo-*)` in inline styles. Never hardcode `#d0d0d0` or `#f0f0f0` directly.**

### Component Classes (defined in `globals.css`)
Use these classes — do not reinvent them:

| Class | Purpose |
| :--- | :--- |
| `.neuo-card` or `.glass` | Raised card / panel |
| `.btn-primary` | Filled action button (`#007AFF`, raised shadow) |
| `.btn-ghost` | Neutral raised button |
| `.input-field` | Text input (inset shadow — looks pressed in) |
| `.neuo-option` | Selectable card — unselected (raised) |
| `.neuo-option-selected` | Selectable card — selected (inset + left `#007AFF` border) |
| `.section-label` | Uppercase label with wide tracking |

### Shadow Rules — Apply to Every Element
```
Raised (cards, buttons, nav):   8px 8px 16px var(--neuo-dark), -8px -8px 16px var(--neuo-light)
Raised small (icon wells, tags): 4px 4px 10px var(--neuo-mid), -4px -4px 10px var(--neuo-light)
Inset (inputs, pressed, active): inset 8px 8px 16px var(--neuo-dark), inset -8px -8px 16px var(--neuo-light)
Inset small:                     inset 4px 4px 8px var(--neuo-mid), inset -4px -4px 8px var(--neuo-light)
```

### Geometry
- All cards / containers: `rounded-3xl` (24px) minimum — prefer `rounded-4xl` (32px) for main cards
- All buttons: `rounded-3xl`
- All inputs: `rounded-3xl`
- Icon wells / small circles: `rounded-2xl`
- **No `border` on any element.** Depth comes from shadows only.

### Interactions
- Pressed / active: switch `box-shadow` from raised → inset (`duration-200`)
- Primary button active: `inset 4px 4px 8px rgba(0,0,0,0.18), inset -2px -2px 6px rgba(255,255,255,0.2)` + `scale(0.99)`
- Ghost button active: full inset neuo shadow
- Link cards active: Tailwind arbitrary `active:shadow-[inset_6px_6px_12px_#d0d0d0,inset_-6px_-6px_12px_#ffffff]`

### Typography
- Display/Title: negative letter-spacing (`-0.03em` / `-0.02em`), `font-bold`
- Body: slight positive tracking (`0.005em`)
- Labels: `0.02em` tracking, `uppercase` for section labels
- Font stack: Inter → `-apple-system` → San Francisco

### What NOT to do
- No `backdrop-blur` or `glass` effects (replaced by Neumorphic shadows)
- No `border` or `border-*` classes on cards, buttons, inputs
- No `bg-white`, `bg-black`, or any raw surface color — use `var(--neuo-bg)`
- No `shadow-*` Tailwind utilities — use the component classes or CSS vars in inline styles
- No gamification, no exclamation marks in copy
- No pure `#000000` text — use `text-text-primary` (`#2c2c2c`)

---

## Technical Rules

- Use **App Router** (not Pages Router) in Next.js
- All DB interactions go through **Neon DB** (serverless Postgres)
- Auth is handled via **NextAuth.js v5** (credentials + optional Google OAuth) — see `auth.ts`
- File/image storage use a separate service (e.g. Cloudinary or Vercel Blob) — Neon has no built-in storage
- AI calls must be **low-latency** — use streaming where possible
- The **3-second rule:** From app launch to "Camera Ready" or "Workout Started" must be under 3 seconds — do not regress this
- Environment variables go in `.env.local`, never committed

---

## Phase Sequence

Work phases in order unless the user explicitly redirects:
1. Foundation & Auth
2. Workout Tracker
3. Vision Nutrition Tracker
4. AI Advisor
5. Contextual Intelligence
6. Polish & Launch

Do not skip phases. Do not build Phase 3 features while Phase 1 is incomplete.

---

## File Reference

| File | Purpose |
| :--- | :--- |
| `docs/CompanyBible.md` | Product vision, principles, design language |
| `docs/Progress.md` | Live task tracker — update every session |
| `CLAUDE.md` | This file — standing instructions for Claude |
| `auth.ts` | NextAuth.js v5 config |
| `db/schema.ts` | Drizzle ORM schema (all tables) |
| `scripts/reset-db.mjs` | Drop all tables (dev only) |
