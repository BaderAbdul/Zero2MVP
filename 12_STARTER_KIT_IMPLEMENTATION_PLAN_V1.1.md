# 12_STARTER_KIT_IMPLEMENTATION_PLAN_V1.1.md

## 1. Implementation Principles

The Starter Kit system is designed to accelerate participant progress without doing the learning for them. To achieve this, the implementation must optimize for:
- **Beginner usability:** Code and docs must be completely free of jargon and unnecessary abstractions.
- **Agent compatibility:** AI agents (Antigravity) must be able to read, understand, and integrate the kits flawlessly from standard prompts.
- **Mentor reliability:** Mentors need predictable failure states and standardized rescue paths.
- **Fast integration:** Kits should be "drop-in" ready for the Golden Path.
- **Security by default:** No open rules, no leaked keys. Security is never an "exercise for the reader."
- **Clear failure recovery:** Every kit anticipates its own failure and provides immediate fallback/rescue instructions.
- **Fresh-project reproducibility:** A kit must work when dropped into a brand new, empty React/Firebase/Vercel project.

**NO UNVERIFIED ASSUMPTIONS RULE:**
If a technical version, command, dependency, or configuration has not been explicitly tested and validated for the current bootcamp cohort, DO NOT present it as certified. It must be explicitly marked as `UNVERIFIED` or `TBD`.

*Starter Kits are accelerators, not finished products.*

## 2. The Standard Kit Contract

Every kit strictly follows a standardized folder and file structure. Only include folders (`/code/`, `/docs/`, `/examples/`) if they are actually required. Do NOT force empty directories.

**Standard Contract:**
```text
/starter-kit-name/
  ├── README.md           (Participant quick start and overview)
  ├── KIT_SPEC.md         (Technical specification for Antigravity integration)
  ├── TEST_CHECKLIST.md   (Manual verification steps)
  ├── MENTOR_NOTES.md     (Expected failure modes, Rescue procedures)
  ├── VERSION.md          (Semantic versioning tracking)
  ├── /code/              (Optional: The actual React/Firebase/Config files)
  ├── /docs/              (Optional: Extended conceptual documentation)
  └── /examples/          (Optional: Concrete use cases)
```

## 3. Implementation Order & Data Flow

Kits will be built in the exact sequence participants need them to achieve the Golden Path. 

**PHASE 1 — Foundation**
- `01 Vercel Deployment Starter`

**PHASE 2 — UI Foundation**
- `02 Responsive UI Starter`
- `03 Dashboard Starter`
- `04 Form Starter`

**PHASE 3 — Backend**
- `05 Firebase Auth Starter`
- `06 Firestore CRUD Starter`

**PHASE 4 — AI**
- `07 AI Feature Starter`

**Build Order vs. Data Flow:**
It is critical to distinguish the *build order* (above) from the *data flow*.
The Form Starter (Phase 2) is **UI-only**. It must NOT assume authentication or Firestore are present. 
The actual data flow in a finished app is: `Form (UI) → Auth Identity (Logic) → Firestore (Persistence)`. The Starter Kits are built sequentially to support this separation of concerns.

## 4. Kit Specifications

### 01 Vercel Deployment Starter
- **Purpose:** Ensure predictable, instant deployment (Ghost Deploy).
- **Target learner:** Level 2 Product Architect.
- **Prerequisites:** GitHub repo, basic React/Vite app.
- **Important Boundary:** The Vercel Deployment Starter must NOT contain: Firebase, Authentication, Firestore, Gemini, Cloud Functions, AI, Mobile/Expo code, or Application-specific business logic. Its only responsibility is: `React/Vite project → GitHub → Vercel → Live production URL`.
- **Surface Status:**
  - Web: AVAILABLE
  - PWA: AVAILABLE
  - Expo: NOT SUPPORTED
- **Certified Development Environment:**
  - Node version: `22.x`
  - Vite version: `8.x`
  - React version: `Selected from Vite template during Fresh Project Test (recorded in VERSION.md)`
  - TypeScript version: `Selected from Vite template during Fresh Project Test (recorded in VERSION.md)`
  - npm version: `TBD` (Tied to Node 22.x)
  - Vercel configuration: `Vite framework preset with vercel.json SPA rewrites`
  - Build command: `npm run build`
  - Output directory: `dist`
  - SPA routing: `vercel.json rewrite all routes to /index.html`
  - Environment variable strategy: ZERO environment variables required for this starter. Firebase variables are introduced only in Kit 05. (If a participant's existing project independently requires variables, those are configured in Vercel according to that project's requirements).
- **Installation & Integration steps:** Link GitHub repo to Vercel. 
- **Expected result:** Live `.vercel.app` URL.
- **Timing tier:** Quick Win (5–15 min).
- **Failure modes:** Build fails due to TS errors.
- **Rescue Lane procedure (TypeScript Build Policy):** "Ship Ugly" does NOT mean "Ship Broken." The certified Starter Kit must produce a successful production build. If TypeScript errors occur:
  1. Diagnose
  2. Fix
  3. Re-run `npm run build`
  4. Re-deploy
  5. Document recurring beginner failure modes
  *(Do NOT recommend removing or bypassing `tsc` as a Rescue Lane).*
- **Security considerations:** Ensure no secrets are committed to the git repo.
- **Agent integration points:** Agent reads `vercel.json` and package scripts.
- **Testing requirements (vercel.json):** The certification test must verify:
  - `/` (root route)
  - a nested client-side route such as `/dashboard`
  - direct navigation to `/dashboard`
  - browser refresh on `/dashboard`
- **Modify:** Project name.
- **Do NOT modify:** Build output directory structure without mentor oversight.
- **Mentor escalation triggers:** Two consecutive failed builds on Vercel.

### 02 Responsive UI Starter
- **Purpose:** Provide a minimal, mobile-first flexbox container layout.
- **Target learner:** Level 3 AI Builder.
- **Prerequisites:** Phase 1 Vercel Deploy.
- **Surface Status:**
  - Web: AVAILABLE
  - PWA: AVAILABLE
  - Expo: NOT SUPPORTED
- **Integration steps:** Wrap main routes in the layout container.
- **Timing tier:** Quick Win (5–15 min).
- **Modify:** Colors, padding variables.
- **Do NOT modify:** Core flexbox container boundaries.

### 03 Dashboard Starter
- **Purpose:** Provide a reusable shell, navigation, and summary cards.
- **Target learner:** Level 3 AI Builder.
- **Prerequisites:** Phase 2 Responsive UI.
- **Surface Status:**
  - Web: AVAILABLE
  - PWA: AVAILABLE
  - Expo: NOT SUPPORTED
- **Integration steps:** Configure navigation links and route wrapper.
- **Timing tier:** Quick Win (5–15 min).
- **Modify:** Link names, icons, routing paths.
- **Do NOT modify:** Core routing state wrapper without mentor.

### 04 Form Starter
- **Purpose:** Create a reusable, controlled form pattern with validation. UI ONLY.
- **Target learner:** Level 3 AI Builder.
- **Prerequisites:** Phase 2 UI.
- **Surface Status:**
  - Web: AVAILABLE
  - PWA: AVAILABLE
  - Expo: NOT SUPPORTED
- **Integration steps:** Define fields, validation rules, and submit payload action.
- **Timing tier:** Quick Win (5–15 min).
- **Modify:** Fields, validation logic, UI.
- **Do NOT modify:** Core controlled component state architecture.

### 05 Firebase Auth Starter
- **Purpose:** Provide Sign Up / Login → Authenticated State → Logout.
- **Target learner:** Level 4 MVP Creator.
- **Surface Status:**
  - Web: AVAILABLE
  - PWA: AVAILABLE
  - Expo: ARCHITECTURALLY COMPATIBLE / NOT YET PACKAGED
- **Integration steps:** Wrap app in Auth Provider, protect specific routes.
- **Timing tier:** Standard (15–30 min).
- **Modify:** Login UI, redirect paths.
- **Do NOT modify:** Auth context provider logic.

### 06 Firestore CRUD Starter
- **Purpose:** Establish the minimum useful data loop (Create → Read).
- **Target learner:** Level 4 MVP Creator.
- **Surface Status:**
  - Web: AVAILABLE
  - PWA: AVAILABLE
  - Expo: ARCHITECTURALLY COMPATIBLE / NOT YET PACKAGED
- **Integration steps:** Connect Form Starter payload to Create hook.
- **Timing tier:** Standard (15–30 min).
- **Security considerations:** MUST use user-scoped security rules (`users/{userId}/...`).
- **Modify:** Data schemas, collection names.
- **Do NOT modify:** Security rule architecture.

### 07 AI Feature Starter
- **Purpose:** Demonstrate a secure pattern for calling AI APIs.
- **Target learner:** Level 3/4.
- **Surface Status:**
  - Web: AVAILABLE
  - PWA: AVAILABLE
  - Expo: ARCHITECTURALLY COMPATIBLE / NOT YET PACKAGED
- **AI Architecture Decision Placeholder (REQUIRED BEFORE IMPLEMENTATION):**
  - Firebase Functions runtime: `TBD`
  - Gemini SDK/version: `TBD`
  - Secret Manager mechanism: `TBD`
  - Callable Function vs HTTP Function: `TBD` *(Recommendation: Evaluate Firebase Callable Functions as the default because they implicitly pass Auth context and reduce manual CORS complexity for the bootcamp).*
  - CORS strategy: `TBD`
  - Error response contract: `TBD`
  - Rate limiting / abuse protection: `TBD`
  - Logging strategy: `TBD`
- **Timing tier:** Complex (30–45 min).
- **Security considerations:** Server-side AI secrets ONLY.
- **Modify:** Prompts, UI display of results.
- **Do NOT modify:** Separation of client/server architecture.

## 5. Kit Dependency Matrix

| Kit | Required Kits | Optional Kits | Blocks/Conflicts | Can Operate Independently? | Recommended Order |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01 Vercel Deploy** | None | None | None | Yes | 1 |
| **02 Responsive UI** | 01 Vercel | None | None | Yes | 2 |
| **03 Dashboard** | 01 Vercel | 02 Resp. UI | None | Yes | 3 |
| **04 Form** | 01 Vercel | 02 Resp. UI | None | Yes (UI only) | 4 |
| **05 Auth** | 01 Vercel | 03 Dashboard | None | Yes | 5 |
| **06 Firestore** | 01 Vercel, 05 Auth | 04 Form | None | No | 6 |
| **07 AI Feature** | 01 Vercel | 05 Auth | None | Yes (if anon) | 7 |

## 6. The Golden Path

The canonical Web path layers build upon each other:

1. **Vercel:** Establishes the live production environment and CI/CD.
2. **Responsive UI:** Establishes the layout container so things don't break on mobile.
3. **Dashboard:** Adds the navigation shell and user-facing structure.
4. **Form:** Allows structured user input (UI Only).
5. **Firebase Auth:** Secures the app and identifies the user (Identity).
6. **Firestore:** Persists the user's input safely based on their identity (Persistence).
7. **AI Feature:** Enhances the persisted data or input using secure server-side AI.

## 7. The Experimental Mobile Path

The bootcamp formally recognizes **React Native / Expo** as an experimental implementation surface. 
*Note: No mobile code will be built in the initial Starter Kit system.*

- **Entry requirements:** Team must explicitly opt-in and possess prior JavaScript familiarity.
- **Technical checkpoint:** Team must prove the app runs locally, renders a screen, connects to Firebase, executes the core flow, and demos on a device/emulator.
- **Supported surface-agnostic kits:** 05 Auth, 06 Firestore, 07 AI Feature (Backend are architecturally compatible).
- **Unsupported web-specific kits:** 01 Vercel, 02 Responsive UI, 03 Dashboard, 04 Form.
- **Fallback to Web/PWA:** If the checkpoint fails, the team must immediately transition to the Web/PWA Golden Path.

## 8. Testing Strategy & Certification Gate

Every Kit must pass a rigorous testing procedure. 

**CERTIFICATION GATE:**
Before any Starter Kit becomes participant-ready, it must successfully pass through:
`Architecture Review → Fresh Project Test → Agent Test → Beginner Test → Failure Recovery Test → Mentor Sign-off → Release`

1. **Fresh Project Test:** Kit code drops into a blank React/Firebase project and compiles.
2. **Installation Test:** Documentation steps are accurate.
3. **Integration Test:** Kits work with their dependencies.
4. **Agent Test:** AI can implement it (See Section 9).
5. **Beginner Usability Test:** Beginner can integrate it in the expected timing tier.
6. **Failure Recovery Test:** Mentor can fix deliberate breakage via Rescue Lane procedures.
7. **Deployment Test:** Builds on Vercel without environment/TS errors.

## 9. The Agent Test

A Starter Kit is not considered complete until an AI coding agent (Antigravity) can successfully:
1. Understand the `README.md` and `KIT_SPEC.md`.
2. Identify the integration point in the codebase.
3. Install/use the Kit autonomously via tool usage.
4. Modify it for a sample product (e.g., adapt generic "items" to "tasks").
5. Run the application successfully.
6. Verify the result (no console errors).

The documentation must be explicitly authored for **BOTH** the human participant and the AI coding agent.

## 10. Security Baseline

All Firebase-related Kits strictly enforce:
- **No secrets in frontend:** API keys for third parties (Gemini) do not exist in client code.
- **No service-account credentials in client code:** Firebase Admin SDK is for Cloud Functions only.
- **Secure Firestore rules:** Enforced by default (`users/{userId}/...`).
- **User-scoped data:** Participants learn data isolation from day one.
- **Server-side AI secrets:** Executed exclusively via Firebase Cloud Functions or secure backend.
- **No hardcoded mock users:** If Auth fails, reduce scope to anonymous.
- **No insecure test-mode rules:** Production-ready kits only.

## 11. Versioning

Kits use semantic versioning: **MAJOR.MINOR.PATCH** (e.g., `1.0.0`).

- **Breaking changes (MAJOR):** E.g., Upgrading from Firebase 9 to Firebase 10 syntax.
- **New features (MINOR):** E.g., Adding a new input type to the Form Starter.
- **Bug fixes (PATCH):** E.g., Fixing a CSS typo in Responsive UI.
- **Compatibility:** `VERSION.md` will explicitly state which cohort/year the kit is certified for.

## 12. First Implementation: 01 — Vercel Deployment Starter

Before building, here is the exact specification for the first kit.

**Exact folder structure:**
```text
/01-vercel-deploy-starter/
  ├── README.md
  ├── KIT_SPEC.md
  ├── TEST_CHECKLIST.md
  ├── MENTOR_NOTES.md
  ├── VERSION.md
  └── /code/
      └── vercel.json
```

- **Files & Purpose:** 
  - The 5 standard contract files. 
  - `vercel.json` ensures SPA fallback routing works (rewrites all routes to `/index.html`).
- **Important Boundary:** The Vercel Deployment Starter must NOT contain Firebase, Authentication, Firestore, Gemini, Cloud Functions, AI, Mobile/Expo code, or Application-specific business logic. Its only responsibility is: `React/Vite project → GitHub → Vercel → Live production URL`.
- **Dependencies:** Vercel CLI (optional for local, mainly GitHub integration).
- **Vite configuration:** Standard Vite build (`dist` output).
- **Build command:** `npm run build`
- **Deploy command:** Triggered via Git push.
- **Environment strategy:** ZERO environment variables required for this starter. Firebase variables are introduced only in Kit 05. (If a participant's existing project independently requires variables, those are configured in Vercel according to that project's requirements).
- **Expected output:** Live URL rendering the React app.
- **Failure recovery (TypeScript Build Policy):** If TypeScript errors occur, participants must diagnose, fix, re-run `npm run build`, and re-deploy. (Do NOT recommend removing or bypassing `tsc` as a Rescue Lane).
- **Agent instructions:** "Review `vercel.json` configuration and ensure package.json build scripts are standard."
- **Test checklist (vercel.json):** The certification test must verify:
  - `/`
  - a nested client-side route such as `/dashboard`
  - direct navigation to `/dashboard`
  - browser refresh on `/dashboard`

*(Code will not be created yet.)*

## 13. READY TO BUILD?

The architecture is considered implementation-ready because:
- [x] No contradictory dependencies exist between Web and Mobile paths.
- [x] No undefined terminology exists (Surface-Agnostic vs Surface-Specific is clear).
- [x] All Kits have clear boundaries and integration points.
- [x] Security defaults are locked and non-negotiable.
- [x] The Mobile path is cleanly isolated as an experimental checkpoint.
- [x] Testing is reproducible across 7 distinct layers.
- [x] Mentor rescue procedures are defined.
- [x] Agent integration is a first-class requirement.

The architecture is locked. We are ready to build Phase 1.
