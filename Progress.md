# FitPal — Project Progress

> Stack: Next.js · Tailwind · Neon DB · Multimodal AI (Vision + Text)
> Last Updated: 2026-03-08 (Phase 1 in progress)

---

## Phase Overview

| Phase | Name | Status |
| :---: | :--- | :--- |
| 1 | Foundation & Auth | 🔄 In Progress |
| 2 | Workout Tracker (Pillar II) | 🔲 Not Started |
| 3 | Vision Nutrition Tracker (Pillar III) | 🔲 Not Started |
| 4 | AI Advisor & Chat (Pillar I) | 🔲 Not Started |
| 5 | Contextual Intelligence & Location Awareness | 🔲 Not Started |
| 6 | Polish, Performance & Launch | 🔲 Not Started |

---

## Phase 1 — Foundation & Auth

**Goal:** Scaffold the project, set up the DB, and get a user signed in.

| Task | Status | Notes |
| :--- | :---: | :--- |
| Init Next.js project with Tailwind | ✅ | App Router, TypeScript, package.json, tsconfig, next.config |
| Configure Neon DB project (postgres, branching) | 🔄 | db/index.ts + drizzle.config ready — add DATABASE_URL to .env.local and run `npm run db:push` |
| Set up Auth (NextAuth.js or Clerk) | ✅ | Clerk — middleware.ts, sign-in/sign-up pages with DLS theming |
| Design DB schema (users, workouts, meals, logs) | ✅ | db/schema.ts — users, exercises, plans, sessions, sets, meals, summaries, advisor messages |
| Build sign-up / sign-in screens (email + OAuth) | ✅ | app/(auth)/sign-in & sign-up — Clerk components themed to DLS |
| User profile onboarding flow (goals, stats) | ✅ | app/onboarding — 4-step: name, biometrics, goal, activity level. Saves to Neon via POST /api/user/onboard |
| Global layout, navigation shell | ✅ | BottomNav (Home/Train/Fuel/Advisor) with blur backdrop, active state |
| Design system tokens (colors, typography, spacing) | ✅ | tailwind.config.ts — full DLS palette, type scale, glass utilities, animations |

---

## Phase 2 — Workout Tracker (Pillar II: The Plan)

**Goal:** One-exercise-at-a-time guided workout experience.

| Task | Status | Notes |
| :--- | :---: | :--- |
| Exercise library (seeded in Neon DB) | 🔲 | With human model video/image assets |
| Workout plan builder (AI-generated or manual) | 🔲 | |
| Active workout screen — single-exercise focus view | 🔲 | No distractions, full screen |
| Rest timer with haptic signatures | 🔲 | Distinct tactile for Timer |
| Set/rep/weight logging (minimal input) | 🔲 | Swipe or single tap |
| Workout summary & history | 🔲 | |
| Volume/intensity adjustment via AI prompt | 🔲 | "I feel tired" → −20% volume |

---

## Phase 3 — Vision Nutrition Tracker (Pillar III: The Fuel)

**Goal:** Point, shoot, confirm — AI handles the math.

| Task | Status | Notes |
| :--- | :---: | :--- |
| Camera UI (full-screen, minimal chrome) | 🔲 | |
| Vision AI integration for food identification | 🔲 | Multimodal model |
| Calorie & macro estimation pipeline | 🔲 | "Good enough" speed over perfection |
| Meal confirmation screen (edit if needed) | 🔲 | |
| Daily nutrition log & summary | 🔲 | |
| Protein / macro gap alerts | 🔲 | "40g below target. Suggested: Greek yogurt." |

---

## Phase 4 — AI Advisor (Pillar I: The Advisor)

**Goal:** Persistent LLM that knows the user's biology, history, and environment.

| Task | Status | Notes |
| :--- | :---: | :--- |
| LLM integration (chat + voice input) | 🔲 | Low-latency multimodal model |
| Persistent user context memory in Neon DB | 🔲 | Biology, history, preferences |
| Advisor chat UI (minimal, coach-like) | 🔲 | Direct, objective tone |
| Routine adjustment actions from chat | 🔲 | AI can mutate workout/meal plans |
| Proactive push notifications / nudges | 🔲 | Data-driven, not gamified |

---

## Phase 5 — Contextual Intelligence

**Goal:** The app knows where you are and reconfigures itself accordingly.

| Task | Status | Notes |
| :--- | :---: | :--- |
| Location detection (gym / restaurant / home) | 🔲 | |
| Dynamic UI mode switching | 🔲 | Gym→tracker, table→camera, rest→coach |
| Gym onboarding via Vision AI (equipment scan) | 🔲 | |
| Context-aware home screen | 🔲 | |

---

## Phase 6 — Polish, Performance & Launch

**Goal:** Hit the 3-second rule and ship a product that feels invisible.

| Task | Status | Notes |
| :--- | :---: | :--- |
| Performance audit (launch → ready < 3 sec) | 🔲 | |
| Subtle animations & transitions | 🔲 | No cartoony effects |
| SystemThinMaterial blur overlays | 🔲 | |
| Haptics implementation (Success / Alert / Timer) | 🔲 | |
| Accessibility audit | 🔲 | |
| End-to-end testing | 🔲 | |
| Production deployment | 🔲 | |

---

## Completed Items

_Nothing completed yet — let's get started._

---

## Status Key

| Symbol | Meaning |
| :---: | :--- |
| 🔲 | Not Started |
| 🔄 | In Progress |
| ✅ | Complete |
| ⏸ | Blocked |
