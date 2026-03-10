# Forma — Project Progress

> Stack: Next.js · Tailwind · Neon DB · Multimodal AI (Vision + Text)
> Last Updated: 2026-03-10 (Phase 3 bug fixes: MacroRing thinner rings, home page daily summary now filters by today's date + force-dynamic, meal log API input validation, advisor markdown rendering (bold/tables/lists), workout completion persists weekly via ISO-week localStorage keys, quick-log API creates DB session when day complete so advisor nudges update correctly)

---

## Phase Overview

| Phase | Name | Status |
| :---: | :--- | :--- |
| 1 | Foundation & Auth | ✅ Complete |
| 2 | Workout Tracker (Pillar II) | ✅ Complete |
| 3 | Vision Nutrition Tracker (Pillar III) | ✅ Complete |
| 4 | AI Advisor & Chat (Pillar I) | ✅ Complete |
| 5 | Contextual Intelligence & Location Awareness | ✅ Complete |
| 6 | Polish, Performance & Launch | ✅ Complete |

---

## Phase 1 — Foundation & Auth

**Goal:** Scaffold the project, set up the DB, and get a user signed in.

| Task | Status | Notes |
| :--- | :---: | :--- |
| Init Next.js project with Tailwind | ✅ | App Router, TypeScript, package.json, tsconfig, next.config |
| Configure Neon DB project (postgres, branching) | ✅ | Schema pushed. Scripts use dotenv-cli. Reset script in scripts/reset-db.mjs |
| Set up Auth (NextAuth.js or Clerk) | ✅ | NextAuth.js v5 — credentials provider + optional Google OAuth. auth.ts, middleware.ts |
| Design DB schema (users, workouts, meals, logs) | ✅ | db/schema.ts — auth_users + users + exercises, plans, sessions, sets, meals, summaries, messages |
| Build sign-up / sign-in screens (email + OAuth) | ✅ | Custom DLS forms — sign-in uses signIn(), sign-up calls POST /api/auth/register |
| User profile onboarding flow (goals, stats) | ✅ | app/onboarding — AI chat flow: greeting → biometrics → gym photo (optional) → week plan → handoff animation. Routes: /api/onboarding/parse-profile, /api/onboarding/generate-plan. haptic.handoff() double-pulse. |
| Global layout, navigation shell | ✅ | BottomNav (Home/Train/Fuel/Advisor) with blur backdrop, active state |
| Design system tokens (colors, typography, spacing) | ✅ | tailwind.config.ts — Neumorphic DLS palette (#e0e0e0 base, dual shadows), type scale, animations |

---

## Phase 2 — Workout Tracker (Pillar II: The Plan)

**Goal:** One-exercise-at-a-time guided workout experience.

| Task | Status | Notes |
| :--- | :---: | :--- |
| Exercise library (seeded in Neon DB) | ✅ | 32 exercises across all muscle groups. Run: npm run db:seed. No video assets yet (Phase 6). |
| Workout plan builder (AI-generated or manual) | ✅ | /workout/plan/new — exercise picker + sets/reps editor + day-of-week assignment (M-S buttons). |
| Weekly Train view — day accordion | ✅ | /workout — 7 day pills, expand day → see exercises. Tap circle to complete (localStorage). Chevron shows muscle SVG + instructions. Day pills show checkmark when all exercises complete. |
| Exercise completion (tap-to-done) | ✅ | Per-day localStorage key. Set buttons in expanded panel (N buttons per exercise) auto-mark exercise done when all sets tapped. Manual circle toggle still works. |
| Per-exercise weight tracking | ✅ | Weight input in expanded panel. Saves to localStorage per exercise. Shows previous session's weight as hint and delta vs last. |
| Elapsed stopwatch in active workout | ✅ | Neuo pill stopwatch in top-right of ActiveWorkout header. Counts up from session startedAt. |
| Train page title cleanup | ✅ | Plan name shown as small subtitle under "This Week". No more crowded double-heading. |
| Muscle diagram SVGs per exercise | ✅ | Inline SVG human silhouette with highlighted region per muscle group (WeeklyPlanView component). |
| dayOfWeek column on plan_exercises | ✅ | Schema updated, db:push run. 0=Mon…6=Sun, null=unscheduled. |
| Active workout screen — single-exercise focus view | ⏸ | Deferred — old flow retained at /workout/active but not surfaced in main UI anymore. |
| Rest timer with haptic signatures | ✅ | lib/haptics.ts — haptic.success(), haptic.alert(), haptic.timer(), haptic.heavy(). Used in ActiveWorkout. |
| Set/rep/weight logging (minimal input) | ⏸ | Deferred — simplified to tap-to-complete model. Detailed logging can return in Phase 4 via AI. |
| Workout summary & history | ✅ | /workout/summary/[sessionId] — duration, sets, volume. /workout/history — session list with set counts. |
| Volume/intensity adjustment via AI prompt | ⏸ | Blocked — requires Phase 4 (AI Advisor) LLM integration |
| AI-generated weekly plan | ⏸ | Blocked — requires Phase 4 LLM. AI will assign exercises to days automatically. |
| \"Dynamic Island\" style header during active workout | ✅ | WorkoutIsland component — floating pill overlay (fixed top center), shows exercise, set dots, rest timer. Framer Motion spring animation. Tap to expand with full timer + link to /workout/active. |

---

## Phase 3 — Vision Nutrition Tracker (Pillar III: The Fuel)

**Goal:** Point, shoot, confirm — AI handles the math.

| Task | Status | Notes |
| :--- | :---: | :--- |
| Camera UI (full-screen, minimal chrome) | ✅ | /nutrition/log — file input with capture="environment", image preview well |
| Vision AI integration for food identification | ✅ | claude-opus-4-6 vision via @anthropic-ai/sdk. POST /api/nutrition/analyze |
| Calorie & macro estimation pipeline | ✅ | Returns name, mealType, calories, protein, carbs, fat, items breakdown |
| Meal confirmation screen (edit if needed) | ✅ | All macro fields editable. Meal type selector (4 options). |
| Daily nutrition log & summary | ✅ | /nutrition — macro progress bars (cal/protein/carbs/fat). Meal list with MealCard. |
| Protein / macro gap alerts | ✅ | Inset alert shown when protein >30g below target or calories >400 below with logged meals. |
| Semantic meal refinement (voice / text) | ✅ | "Refinement" input on confirm screen → re-calls analyze with context. |

---

## Phase 4 — AI Advisor (Pillar I: The Advisor)

**Goal:** Persistent LLM that knows the user's biology, history, and environment.

| Task | Status | Notes |
| :--- | :---: | :--- |
| LLM integration (chat + voice input) | ✅ | claude-opus-4-6 streaming via @anthropic-ai/sdk. POST /api/advisor/chat returns ReadableStream. |
| Persistent user context memory in Neon DB | ✅ | advisorMessages table — role, content, createdAt. GET /api/advisor/messages loads history. Last 20 messages fed to Claude. |
| Advisor chat UI (minimal, coach-like) | ✅ | /advisor — streaming chat, neumorphic bubbles (inset=user, raised=AI), dot-bounce typing indicator, auto-scroll, auto-resize textarea. |
| Routine adjustment actions from chat | ✅ | Claude tool use: update_exercise (sets/reps/weight/rest on planExercises) + update_macro_targets (users table). Transparent streaming — tools execute server-side, follow-up response streams to client. |
| Gym equipment inventory (Vision scan → DB) | ✅ | gym_equipment table in schema. POST /api/advisor/equipment/scan — Vision AI identifies equipment from photo. /advisor/equipment — list, scan, delete UI. Equipment included in advisor system prompt. |
| Proactive push notifications / nudges | ✅ | GET /api/advisor/nudges — rule-based: protein gap, calorie gap, workout frequency. NudgesSection component on home dashboard. Links to /advisor. Warning severity shows amber accent. |

---

## Phase 5 — Contextual Intelligence

**Goal:** The app knows where you are and reconfigures itself accordingly.

| Task | Status | Notes |
| :--- | :---: | :--- |
| Location detection (gym / restaurant / home) | ✅ | Browser Geolocation API + Haversine distance (≤250m = at gym). Time-based fallback: mealtime windows (11:30–14:30, 17:30–20:30), recovery (21:00–05:30). |
| Dynamic UI mode switching | ✅ | ContextualQuickStart reorders CTAs: gym→workout first, mealtime→meal first, recovery→advisor first. Mode banner with accent stripe. |
| Gym onboarding via Vision AI (equipment scan) | ✅ | gymLatitude/gymLongitude added to users table. "Set gym location" CTA on home screen saves current GPS. Equipment scan already in /advisor/equipment (Phase 4). |
| Context-aware home screen | ✅ | DailySnapshot replaced by ContextualQuickStart — context banner + reordered quick actions. Gym location save prompt if not yet set. |

---

## Phase 6 — Polish, Performance & Launch

**Goal:** Hit the 3-second rule and ship a product that feels invisible.

| Task | Status | Notes |
| :--- | :---: | :--- |
| Performance audit (launch → ready < 3 sec) | ✅ | Parallelized 3 DB queries in dashboard page via Promise.all. NudgesSection loads async client-side. |
| Framer Motion layout transitions | ✅ | framer-motion installed. PageTransition component wraps dashboard children. AnimatePresence with opacity+Y slide (220ms, iOS spring ease). BottomNav uses layoutId="nav-pill" for spring-animated active indicator. |
| Lottie exercise form models | ✅ | lottie-react installed. 12 Lottie JSON files generated (scripts/generate-lottie.mjs → public/lottie/[group].json). Each: 80×132px, 30fps, 72 frames, body silhouette + pulsing #007AFF highlight (72%→32%→72% opacity). ExerciseLottie component loads JSON, falls back to AnimatedMuscleSVG. WeeklyPlanView expanded panel uses ExerciseLottie. Swap in professional animations by replacing files in public/lottie/. |
| \"Dynamic Island\" workout header | ✅ | WorkoutIsland component — fixed pill overlay, WorkoutSessionContext propagates state from ActiveWorkout. See components/workout/WorkoutIsland.tsx + contexts/WorkoutSessionContext.tsx |
| PWA configuration (home screen install) | ✅ | public/manifest.json, public/sw.js (stale-while-revalidate), components/PwaInstaller.tsx, icons generated via scripts/generate-icons.mjs (sharp). themeColor fixed to #f0f0f0. |
| Subtle ambient animations & transitions | ✅ | PageTransition fade+slide on route change. Nav pill spring animation. MacroRing ring CSS transition retained. |
| Haptics implementation (Success / Alert / Timer) | ✅ | lib/haptics.ts — haptic.success, haptic.alert, haptic.timer, haptic.heavy. All ActiveWorkout inline vibrate calls replaced. |
| Accessibility audit | ✅ | :focus-visible styles added to globals.css. aria-hidden on emoji icons in NudgesSection. aria-label on nav + nav links. aria-current="page" on active nav item. aria-live="polite" on NudgesSection. role="img" + aria-label on MacroRing SVG. aria-expanded on instructions toggle. aria-busy on finish button. htmlFor+id on ActiveWorkout inputs. |
| End-to-end testing | ✅ | Playwright (@playwright/test) installed. playwright.config.ts — iPhone 14 Pro viewport, chromium. Test suites: tests/auth.spec.ts, tests/home.spec.ts, tests/workout.spec.ts, tests/nutrition.spec.ts, tests/pwa.spec.ts. Auth session helper: tests/setup-auth.ts. Scripts: npm run test:e2e, test:e2e:ui, test:auth. |
| Production deployment | ✅ | vercel.json — headers for SW, manifest, icons. .env.local.example updated with ANTHROPIC_API_KEY. .gitignore updated (playwright-report, tests/.auth). Deploy: push to main → Vercel auto-deploys. Set env vars in Vercel dashboard. Run npm run db:seed against prod DATABASE_URL after first deploy. |

---

## Completed Items

### Phase 1 — Foundation & Auth ✅ (2026-03-08)
- Next.js 15 + Tailwind scaffolded (App Router, TypeScript)
- Neon DB connected, full schema pushed (13 tables + 4 enums)
- NextAuth.js v5 — email/password credentials, optional Google OAuth
- Custom sign-in / sign-up screens (DLS themed)
- 4-step onboarding (name → biometrics → goal → activity)
- Macro target calculator (Mifflin-St Jeor + TDEE)
- Bottom nav shell (Home / Train / Fuel / Advisor)
- Design system tokens (palette, type scale, animations) — refactored to Neumorphic Soft UI (2026-03-08)

### Phase 3 — Vision Nutrition Tracker ✅ (2026-03-08)
- `@anthropic-ai/sdk` installed — claude-opus-4-6 for Vision AI
- Camera UI at `/nutrition/log` — file input (capture="environment"), image preview, 3-step flow: camera → analyzing → confirm
- Vision AI endpoint `POST /api/nutrition/analyze` — base64 image → structured macro JSON (name, mealType, calories, protein, carbs, fat, items)
- Semantic refinement: text input on confirm screen re-calls analysis with user context ("add a side of ranch")
- Meal logging endpoint `POST /api/nutrition/log` — saves to `meal_logs`, upserts `daily_summaries` macros
- Daily nutrition hub `/nutrition` — macro progress bars (4 macros), meal list with `MealCard` component, empty state
- Macro gap alerts — protein & calorie deficit warnings shown inline
- `GET /api/nutrition/daily` — returns today's meals + totals

### Phase 4 — AI Advisor ✅ (2026-03-08)
- Streaming chat at `/advisor` — neumorphic message bubbles, dot-bounce typing indicator, auto-scroll, auto-resize textarea
- `POST /api/advisor/chat` — ReadableStream response, claude-opus-4-6, full user context injected (biometrics, targets, 7d nutrition, 5 recent sessions, active plan with exercise IDs, equipment list)
- `GET /api/advisor/messages` — persists and loads full message history from `advisor_messages` table
- **Claude tool use** — `update_exercise` mutates `plan_exercises` (sets/reps/weight/rest), `update_macro_targets` mutates `users`. Transparent: tools execute server-side, follow-up streams to client
- **Gym equipment inventory** — `gym_equipment` table. `POST /api/advisor/equipment/scan` (Vision AI identifies equipment from photo). `/advisor/equipment` — scan, confirm with checkboxes, list, delete. Equipment context fed into every chat prompt
- **Proactive nudges** — `GET /api/advisor/nudges` rule-based analysis: protein deficit, calorie deficit, workout frequency. `NudgesSection` on home dashboard, links to `/advisor`, warning severity shows amber accent
- `@keyframes dotBounce` + `.dot-bounce` CSS added to globals.css

### Phase 5 — Contextual Intelligence ✅ (2026-03-08)
- `gymLatitude` + `gymLongitude` columns added to `users` table (schema + `db:push`)
- `GET /api/context` — returns user's saved gym coordinates
- `POST /api/context` — saves current browser GPS as gym location
- `ContextualQuickStart` client component — replaces `DailySnapshot` on home screen
  - Fetches gym coords, runs `navigator.geolocation.getCurrentPosition()`
  - Haversine distance ≤250m → Gym Mode; otherwise time-of-day fallback
  - Time fallback: lunch/dinner windows → Fuel Mode; late night/early morning → Recovery Mode
  - Mode banner with left accent stripe (blue/green/purple per context)
  - Quick actions reordered: gym→[workout, advisor, meal], mealtime→[meal, advisor, workout], recovery→[advisor, meal, workout]
  - "Set gym location" prompt shown until user saves GPS coordinates

### Phase 2 — Workout Tracker ✅ (2026-03-08)
- 32-exercise library across all muscle groups (`scripts/seed-exercises.mjs`, run via `npm run db:seed`)
- 7 API routes: GET /api/exercises, GET+POST /api/plans, POST /api/workouts/start, GET /api/workouts/[sessionId], POST /api/workouts/[sessionId]/log-set, POST /api/workouts/[sessionId]/complete, GET /api/workouts/history
- Workout hub (`/workout`) — active plan display, exercise list preview, recent sessions
- Plan builder (`/workout/plan/new`) — exercise picker modal with muscle group filter, sets/reps/rest editor, reorder
- Active workout screen (`/workout/active`) — single-exercise focus, set dot progress, instructions toggle, inset rest timer with auto-start + haptic vibrate patterns
- Session complete flow: POST to complete, duration calculated, daily_summaries upserted
- Summary page (`/workout/summary/[sessionId]`) — duration + sets + volume stats, per-exercise breakdown
- History page (`/workout/history`) — chronological session list with set counts, links to summary/resume
- BottomNav active state fixed for nested routes (startsWith logic)
- AI volume adjustment blocked (⏸) pending Phase 4 LLM

### Phase 6 — Polish, Performance & Launch ✅ (2026-03-08)
- **PWA**: `public/manifest.json` + `public/sw.js` (stale-while-revalidate SW) + `components/PwaInstaller.tsx`. Icons 192×512 generated via `scripts/generate-icons.mjs` (sharp). `themeColor` fixed to `#f0f0f0`. `next.config.ts` + `vercel.json` add `Service-Worker-Allowed: /` header.
- **Performance**: `Promise.all` on 3 sequential DB queries in `app/(dashboard)/page.tsx`. NudgesSection loads async client-side without blocking render.
- **Haptics**: `lib/haptics.ts` — `haptic.success / alert / timer / heavy`. All inline `navigator.vibrate` calls replaced throughout `ActiveWorkout`.
- **Accessibility**: `:focus-visible` restored in `globals.css`. `aria-hidden` on emoji (NudgesSection). `aria-label` + `aria-current="page"` on all nav items. `aria-live="polite"` on NudgesSection container. `role="img"` + `aria-label` on MacroRing SVG. `aria-expanded` on instructions toggle. `aria-busy` on finish button. `<label htmlFor>` + `id` on all ActiveWorkout inputs. `aria-label="Main navigation"` on `<nav>`.
- **Framer Motion**: `framer-motion` installed. `PageTransition` — opacity+Y slide (AnimatePresence, 220ms, iOS spring ease). `BottomNav` — `layoutId="nav-pill"` spring-animated active background pill.
- **Dynamic Island**: `WorkoutSessionContext` provider + `WorkoutIsland` fixed-position pill — exercise name, set dots, rest timer countdown. Spring animate in/out on workout start/end. Tap to expand with full timer + link. `ActiveWorkout` emits state on every action.
- **Lottie**: `lottie-react` installed. `ExerciseLottie` component — loads `/lottie/[group].json` if present, falls back to `AnimatedMuscleSVG`. `MuscleSVG` highlight shapes wrapped in `.muscle-highlight` CSS pulse animation (2.4s). `WeeklyPlanView` expanded panel uses `ExerciseLottie`. Drop real Lottie JSON into `public/lottie/` — see `README.md`.
- **E2E Testing**: `@playwright/test` installed. `playwright.config.ts` — iPhone 14 Pro viewport, Chromium. 5 test suites covering auth flows, home screen, workout, nutrition, and PWA. `tests/setup-auth.ts` saves Playwright auth session. `npm run test:e2e` script added.
- **Production deployment**: `vercel.json` with response headers for SW/manifest/icons. `.env.local.example` updated with `ANTHROPIC_API_KEY`. `.gitignore` excludes Playwright artifacts and auth session. Deploy: push `main` → Vercel. Set env vars in dashboard. Run `npm run db:seed` against prod DB after first deploy.

---

## Status Key

| Symbol | Meaning |
| :---: | :--- |
| 🔲 | Not Started |
| 🔄 | In Progress |
| ✅ | Complete |
| ⏸ | Blocked |
