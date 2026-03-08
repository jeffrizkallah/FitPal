# Company Bible: [Forma]

## 1. Core Vision
Eliminate the friction between intent and action. Most fitness apps fail by demanding too much manual input. This platform exists to automate the "clerical work" of fitness—tracking, planning, and adjusting—through high-fidelity AI and minimalist design.

---

## 2. Product Principles (The "Apple" Standard)

### Zero-Clutter Interface
* **Rule:** If a data point isn't needed *this second*, hide it.
* **Execution:** Use long-press (Force Touch) for deep metrics. Use generous negative space. No "rate us" pop-ups, no social feeds, no gamification badges.

### Radical Automation
* **Rule:** Manual typing is a design failure.
* **Execution:** Use Vision AI for gym onboarding and meal tracking. Use LLM voice/chat for routine adjustments. The user should never see a "plus button" to add a row to a spreadsheet.

### Contextual Intelligence
* **Rule:** The app must know where the user is and what they need.
* **Execution:** If the user is at the gym, the UI is a workout tracker. If they are at a table, it is a camera. If they are resting, it is a coach.

---

## 3. The Three Pillars

### Pillar I: The Advisor (LLM)
* **Tone:** Professional, objective, and data-driven.
* **Function:** Serves as the persistent memory of the user’s biology and environment. It translates "I feel tired" into "Reducing volume by 20% for today."

### Pillar II: The Plan (Interactive Guide)
* **Visuals:** High-quality, subtle animations. Use human models, not cartoon avatars.
* **Flow:** One exercise at a time. The screen shows the *now*, not the *next hour*.

### Pillar III: The Fuel (Vision Tracker)
* **Accuracy:** Prioritize speed and "good enough" estimation over scientific perfection that requires a scale. 
* **Interaction:** Point, shoot, confirm. The AI handles the caloric and macro math in the background.

---

## 4. Design Language System (DLS)

| Element | Specification |
| :--- | :--- |
| **Typography** | San Francisco / Inter. Heavy weights for headers (`font-bold`), light for subtext. High letter-spacing on labels and body; tight negative tracking on display/title sizes. |
| **Palette** | Neumorphic base: `#f0f0f0` global background (`--neuo-bg`). Light shadow: `#ffffff` (`--neuo-light`). Dark shadow: `#d0d0d0` (`--neuo-dark`). One action color: `#007AFF`. No pure black — text primary is `#2c2c2c`. |
| **Material** | Neumorphic Soft UI — dual box-shadow on all surfaces: `8px 8px 16px var(--neuo-dark), -8px -8px 16px var(--neuo-light)`. No borders, no glass blur. |
| **Shadow Architecture** | Raised (cards, buttons): `8px 8px 16px var(--neuo-dark), -8px -8px 16px var(--neuo-light)`. Inset (inputs, pressed states): `inset 8px 8px 16px var(--neuo-dark), inset -8px -8px 16px var(--neuo-light)`. CSS variables are the single source of truth — never hardcode shadow hex values. |
| **Geometry** | Minimum `border-radius: 24px` (`rounded-3xl`) on all containers. Cards use `rounded-4xl` (32px). |
| **Interactions** | Active/pressed states switch box-shadow to `inset` to simulate surface depression. Transitions: `duration-200` ease. |
| **Haptics** | Distinct tactile signatures for 'Success', 'Alert', and 'Timer'. |

---

## 5. Technical Manifest
* **Stack:** Next.js, Tailwind, Neon DB (serverless Postgres).
* **AI Model:** Multimodal (Vision + Text). Must support low-latency responses.
* **Performance:** 3-second rule. From app-launch to "Camera Ready" or "Workout Started" must be under 3 seconds.

---

## 6. Tone of Voice
* **Direct:** No "Hey there! Let's get crushing!"
* **Objective:** "Your protein intake is 40g below target. Suggested snack: Greek yogurt."
* **Invisible:** The best interface is the one that disappears when the work starts.

---

## 7. The Goal
Model obsolescence via user self-sufficiency. The app should make the user so efficient at their fitness and nutrition that the app becomes a seamless, transparent extension of their daily rhythm.

# Gym & Nutrition Web App Blueprint

## Core Architecture

### 1. LLM Advisory Interface
* **Context Persistence:** Store user height, weight, goals, and gym equipment list in a database. This eliminates repetitive data entry.
* **Vision Integration:** Use a multimodal API to analyze gym photos. The LLM references this equipment inventory for all future routines.
* **Command Center:** Use a single chat thread. This serves as the brain that pushes data to the exercise and meal sections.
* **Zero-Input Onboarding:** Record a panoramic walk-through of your gym. The AI parses the video to identify every dumbbell rack and machine to create an automatic "Gym Profile."

### 2. Interactive Daily Plan
* **Dynamic Synchronization:** Routines generated in the chat automatically populate this view.
* **Visual Guides:** Use lightweight Lottie animations or SVG-based human models to demonstrate form.
* **Focus Points:** Display two bullet points per exercise: the primary muscle target and one technical cue.
* **Progression Tracking:** Use a simple tap-to-complete interaction. Completed exercises fade to keep the screen uncluttered.
* **Glanceable Widgets:** A "Dynamic Island" style header that shows only the Current Set and Rest Timer during a workout.

### 3. Vision-Based Calorie Tracker
* **Instant Analysis:** Implement a camera-first UI. One tap opens the lens; the AI identifies food items and estimates volume.
* **Macro Breakdown:** Display three primary numbers: Protein, Carbs, and Fats.
* **Logging:** Automatically add the meal to a daily timeline with a timestamp.
* **Semantic Adjustments:** Use voice or text to refine logs (e.g., "Add a side of ranch") to keep the UI free of manual data-entry forms.

---

## UI/UX Design Strategy (Apple Aesthetic)

### Visual Principles
* **Negative Space:** Use generous padding between elements to prevent cognitive overload.
* **Typography:** Utilize San Francisco or Inter fonts. Use varying weights to create hierarchy instead of multiple colors.
* **Color Palette:** Use a system background of pure white or deep black. Use a single accent color like electric blue or soft mint.
* **Glassmorphism:** Apply subtle background blurs on navigation bars and cards.
* **Hidden Data:** Use "Force Touch" or long-press interactions to reveal detailed macro breakdowns, keeping the main view minimal.

### Navigation and Motion
* **Tab Bar:** Use a three-icon bottom navigation bar for high reachability on mobile.
* **Haptic-First Feedback:** Different vibrations for completing a set (light tap) versus finishing a rest timer (double pulse).
* **Transitions:** Use smooth layout transitions and soft "glow" scanlines for AI camera functions.

---

## Technical Stack

| Component | Recommendation |
| :--- | :--- |
| **Frontend** | Next.js with Tailwind CSS |
| **Mobile Optimization** | PWA (Progressive Web App) for home screen access |
| **AI Engine** | GPT-4o or Gemini 1.5 Pro for multimodal tasks |
| **Database** | Supabase for user data and meal logs |
| **Animations** | Framer Motion for UI; Lottie for models |