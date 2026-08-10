# FROM ZERO TO MVP — CAMP OS ARCHITECTURE

## 01 — CAMP OS PRODUCT ARCHITECTURE

**Vision:** A real-time Operating System (OS) for running the "From Zero to MVP" bootcamp. It is not just a learning portal; it is a live, interactive environment that orchestrates the entire bootcamp experience across all actors.

**Core Philosophy:** 
- **Real-time First:** Every action (progress, scoring, checkpoints) is reflected instantly on the Projector and Dashboards.
- **Role-based Experience:** Five distinct views for five distinct roles (Participant, Mentor, Organizer, Judge, Projector).
- **Gamified Engagement:** Progress, XP, and badges drive engagement, not punishment.
- **Embedded AI:** AI is an active assistant within the platform, guiding participants through the product thinking and building phases.

**Tech Stack:**
- **Frontend:** Next.js (App Router) for robust routing, layouts, and API integration.
- **Styling:** Vanilla CSS (CSS Modules) / Custom Design System for premium, dynamic, and glassmorphic aesthetics.
- **Backend/Real-time:** Firebase Firestore (Real-time listeners), Firebase Auth.
- **AI Integration:** Google Gemini API (Firebase AI Logic) for the embedded Camp Assistant.

---

## 02 — USER JOURNEYS

### 1. Participant Journey
- **Onboarding:** Join team -> Connect Auth -> View "Problem Hunter" level.
- **Learning & Doing:** Interact with AI Camp Assistant -> Complete tasks (e.g., Define Problem, Map Core Flow) -> Unlock next levels (Product Architect, AI Builder, etc.).
- **Evaluation:** Submit Checkpoint -> Wait for Mentor Approval -> Earn XP/Badges.
- **Demo Day:** View live queue -> Present -> See live scores.

### 2. Mentor Journey
- **Monitoring:** Watch live dashboard of all teams -> Identify "🔴 Need Help" teams.
- **Intervention:** Click into a struggling team -> See AI usage & blocked tasks -> Provide feedback or trigger "Rescue Mode".
- **Validation:** Receive Checkpoint requests -> Review submitted work -> Approve (unlocks next level) or Reject with feedback.

### 3. Organizer Journey
- **Orchestration:** Start the bootcamp -> Trigger Session (e.g., "AI Building Session") -> Projector updates instantly.
- **Pacing:** Send live announcements -> Launch Countdowns -> Open/Close submissions.
- **Demo Day Control:** Transition platform to "Demo Day Mode" -> Queue up teams -> Reveal scores.

### 4. Judge Journey
- **Demo Day:** Log in -> View current presenting team.
- **Scoring:** Score across 5 criteria (Problem, Product, Execution, AI, Pitch) dynamically -> Submit.
- **Feedback:** Leave quick notes for the team.

---

## 03 — MODULE MAP

The OS is divided into interconnected modules:

1. **Identity & Auth Module:** Role-based access control (Participant, Mentor, Organizer, Judge).
2. **Journey Engine:** Unlocks levels, tracks task completion, handles AI assistant interactions.
3. **Live Gamification Module:** Calculates XP, issues badges, updates the leaderboard in real-time.
4. **Command Center Module (Organizer):** Controls global state (current session, projector view, announcements).
5. **Team Monitor Module (Mentor):** Aggregates team health, checkpoint submissions, and blockages.
6. **Demo Day Engine:** Manages the presentation queue, collects judge scores, aggregates results.
7. **Projector/Display Module:** A view-only, highly visual module driven by global state changes.

---

## 04 — DATA MODEL (FIRESTORE)

### `users`
- `id`, `name`, `role` (participant, mentor, organizer, judge), `teamId`, `xp`, `badges[]`

### `teams`
- `id`, `name`, `projectIdea`, `currentLevel`, `progressPercentage`, `status` (🟢, 🟡, 🔴), `checkpointPending`

### `globalState` (Single Document)
- `currentPhase` (onboarding, building, checkpoint, demo_day)
- `currentSessionTitle`, `countdownEndTime`, `announcement`
- `activeDemoTeamId`

### `tasks` (Subcollection under `teams`)
- `taskId`, `status` (pending, completed), `aiLog`, `submittedWork`

### `scores` (For Demo Day)
- `teamId`, `judgeId`, `criteria` (problem, product, execution, ai, pitch), `total`

---

## 05 — REAL-TIME EVENT ARCHITECTURE

We will rely heavily on **Firestore `onSnapshot` listeners**.

- **Global Sync:** The Projector and Organizer Control Center listen to the `globalState` document. When the Organizer updates `currentPhase` to `demo_day`, the Projector instantly transitions its UI with a fluid animation.
- **Progress Sync:** As a Participant completes a task, the `teams` document's `progressPercentage` is incremented. The Mentor Dashboard and Projector Leaderboard, both listening to the `teams` collection, update instantly.
- **Checkpoint Sync:** Participant submits a checkpoint -> Document written to `checkpoints` collection -> Cloud Function / Client Listener alerts Mentors -> Mentor approves -> Level unlocks for Participant.

---

## 06 — PROJECTOR / LIVE SCREEN ARCHITECTURE

**URL:** `/projector` (View Only, No Auth required or specific Projector Auth)

**Views (Controlled by `globalState`):**
1. **Idle/Waiting:** Beautiful countdown, pulsing background, team count.
2. **Build Mode:** Split screen. Left: Current Mission. Right: Live Leaderboard/Progress Bars moving dynamically.
3. **Checkpoint Mode:** High-tension UI showing teams checking in. Progress rings filling up.
4. **Demo Day Mode:** Cinematic intro for the next team. Live score tally animation as judges submit.

**Aesthetics:** Dark mode, vibrant neon accents, ultra-smooth Framer Motion/CSS transitions. Large typography.

---

## 07 — DEMO DAY ENGINE

A specialized state machine for the final event:
1. **Queue Management:** Organizer drags and drops teams into presentation order.
2. **Active Presentation:** Organizer clicks "Next Team" -> Projector shows "TEAM NOVA - READY?".
3. **Scoring:** Judges' screens unlock for "TEAM NOVA". They adjust sliders (1-10).
4. **Aggregation:** As judges hit submit, a Cloud Function aggregates the score.
5. **Reveal:** Organizer clicks "Reveal Score" -> Projector dynamically counts up the total score with sound/visual effects.

---

## 08 — ORGANIZER CONTROL CENTER

**URL:** `/organizer`

**Features:**
- **Master Switchboard:** Set current phase (Welcome, Build, Lunch, Demo Day).
- **Timer Control:** Set global countdown timers (e.g., "1 hour left").
- **Override:** Force unlock a level for a bugged team.
- **Messaging:** Push screen-takeover announcements to all participants.
- **Demo Day Control:** The "Next", "Reveal Score", and "Announce Winner" buttons.

---

## 09 — PARTICIPANT EXPERIENCE

**URL:** `/participant` (or `/dashboard`)

- **Current Focus:** Always shows the *exact next thing* they need to do. No clutter.
- **AI Camp Assistant:** A persistent chat UI. 
  - *Context Aware:* "I see you are on the Core Flow task. What is your user's primary goal?"
- **Team Hub:** View teammates, current XP, and badges earned.
- **Checkpoints:** A clear "Submit for Review" button when a level is complete.

---

## 10 — MENTOR EXPERIENCE

**URL:** `/mentor`

- **Grid View:** A dashboard of all teams. Color-coded (Green = On track, Yellow = Slow, Red = Blocked/Needs Help).
- **Drill Down:** Click a team to see their exact task, their recent chat logs with the AI assistant, and their submitted work.
- **Action Center:** Approve checkpoints, send direct feedback, or activate "Rescue Mode" (which might unlock a hint or skip a broken step for the team).

---

## 11 — JUDGE EXPERIENCE

**URL:** `/judge`

- **Minimal UI:** Optimized for mobile/tablet.
- **Context:** Shows the current team's name and 1-sentence pitch.
- **Inputs:** 5 large sliders or rating buttons for the criteria.
- **State:** Locked until the Organizer sets `activeDemoTeamId`. Auto-switches to the next team when the Organizer advances the queue.

---

## 12 — MVP SCOPE (Phase 1 Build)

To build this incrementally, the MVP of the Camp OS will include:

1. **Auth & Identity:** Firebase Auth integration, basic routing based on roles.
2. **The Data Engine:** Firestore schemas for Users, Teams, and Global State.
3. **Organizer & Projector (The Core Loop):** The ability for the Organizer to change global state and see the Projector update in real-time.
4. **Participant Progress:** A simplified 3-level journey where clicking "Complete Task" updates the Team Progress on the Projector.
5. **Mentor Dashboard:** A read-only view of all teams' progress.

*Deferred to Phase 2:* Demo Day Engine, AI Assistant integration, Gamification (XP/Badges).
