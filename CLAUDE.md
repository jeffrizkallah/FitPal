# CLAUDE.md — FitPal Project Instructions

## Project Overview
FitPal is a minimalist AI fitness app built with **Next.js, Tailwind, and Neon DB**.
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

## Design Rules (from CompanyBible.md)

- **Palette:** Monochrome (Pure Black / White) + `#007AFF` action color only
- **Typography:** San Francisco / Inter — heavy weights for headers, light for subtext
- **No clutter:** No badges, no social feeds, no "rate us" prompts
- **No manual input:** If the user is typing into a form, ask if there's a vision/AI alternative
- **Tone:** Direct and objective. Never use exclamation-heavy copy.
- **Animations:** Subtle only. Human models, not cartoon avatars.

---

## Technical Rules

- Use **App Router** (not Pages Router) in Next.js
- All DB interactions go through **Neon DB** (serverless Postgres)
- Auth is handled separately via **NextAuth.js** or **Clerk** — Neon has no built-in auth
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
| `CompanyBible.md` | Product vision, principles, design language |
| `Progress.md` | Live task tracker — update every session |
| `CLAUDE.md` | This file — standing instructions for Claude |
