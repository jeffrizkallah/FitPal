# Company Bible: [FitPal]

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
| **Typography** | San Francisco / Inter. Heavy weights for headers, light for subtext. |
| **Palette** | Monochrome (Pure Black/White) with one "Action Color" (e.g., #007AFF). |
| **Material** | Heavy use of background blur (SystemThinMaterial) on overlays. |
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