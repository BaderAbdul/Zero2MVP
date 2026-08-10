# 12_STARTER_KIT_IMPLEMENTATION_PLAN.md

## 1. Implementation Principles

The Starter Kit system is designed to accelerate participant progress without doing the learning for them. To achieve this, the implementation must optimize for:
- **Beginner usability:** Code and docs must be completely free of jargon and unnecessary abstractions.
- **Agent compatibility:** AI agents (Antigravity) must be able to read, understand, and integrate the kits flawlessly from standard prompts.
- **Mentor reliability:** Mentors need predictable failure states and standardized rescue paths.
- **Fast integration:** Kits should be "drop-in" ready for the Golden Path.
- **Security by default:** No open rules, no leaked keys. Security is never an "exercise for the reader."
- **Clear failure recovery:** Every kit anticipates its own failure and provides immediate fallback/rescue instructions.
- **Fresh-project reproducibility:** A kit must work when dropped into a brand new, empty React/Firebase/Vercel project.

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

## 3. Implementation Order

Kits will be built in the exact order participants need them to achieve the Golden Path.

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

**Why this order is technically correct:**
You cannot deploy a UI if you have no deployment pipeline (Phase 1). You cannot submit a form to a database if you have no form or UI layout (Phase 2). You cannot securely save user-scoped data to Firestore without Authentication (Phase 3). You cannot securely call an AI API without a functioning backend and frontend pipeline (Phase 4).

## 4. Kit Specifications

### 01 Vercel Deployment Starter
- **Purpose:** Ensure predictable, instant deployment (Ghost Deploy).
- **Target learner:** Level 2 Product Architect.
- **Prerequisites:** GitHub repo, basic React/Vite app.
- **Dependencies:** Vercel CLI/GitHub Integration.
- **Supported surfaces:** Web / PWA.
- **Installation steps:** Link GitHub repo to Vercel.
- **Integration steps:** Configure build commands, add `.env`.
- **Expected result:** Live `.vercel.app` URL.
- **Timing tier:** Quick Win (5–15 min).
- **Failure modes:** Build fails due to TS errors; White screen due to missing `.env`.
- **Rescue Lane procedure:** Verify build command locally; check Vercel logs; hardcode non-secret variables temporarily if `.env` fails.
- **Security considerations:** Ensure no secrets are committed to the git repo.
- **Agent integration points:** Agent reads `vercel.json` and package scripts.
- **Testing requirements:** Push triggers green build.
- **Modify:** Project name, environment variables.
- **Do NOT modify:** Build output directory structure without mentor oversight.
- **Mentor escalation triggers:** Two consecutive failed builds on Vercel.

### 02 Responsive UI Starter
- **Purpose:** Provide a minimal, mobile-first flexbox container layout.
- **Target learner:** Level 3 AI Builder.
- **Prerequisites:** Phase 1 Vercel Deploy.
- **Dependencies:** None.
- **Supported surfaces:** Web / PWA.
- **Installation steps:** Copy CSS/layout component.
- **Integration steps:** Wrap `App.tsx` or main routes in the layout container.
- **Expected result:** Legible app on a 320px screen width.
- **Timing tier:** Quick Win (5–15 min).
- **Failure modes:** Horizontal scrolling; absolute positioning breaking out of containers.
- **Rescue Lane procedure:** Remove custom CSS overrides, revert to kit defaults.
- **Security considerations:** N/A.
- **Agent integration points:** `// AGENT: Inject main content here`.
- **Testing requirements:** Resize browser window to mobile width, verify no horizontal scroll.
- **Modify:** Colors, padding variables.
- **Do NOT modify:** Core flexbox container boundaries.
- **Mentor escalation triggers:** Complete layout collapse unresolvable by agent.

### 03 Dashboard Starter
- **Purpose:** Provide a reusable shell, navigation, and summary cards.
- **Target learner:** Level 3 AI Builder.
- **Prerequisites:** Phase 2 Responsive UI.
- **Dependencies:** React Router (or equivalent).
- **Supported surfaces:** Web / PWA.
- **Installation steps:** Copy dashboard components.
- **Integration steps:** Configure navigation links and route wrapper.
- **Expected result:** A functional sidebar/top-nav shell.
- **Timing tier:** Quick Win (5–15 min).
- **Failure modes:** Router misconfiguration causing blank pages.
- **Rescue Lane procedure:** Check React Router DOM hierarchy.
- **Security considerations:** N/A (UI only).
- **Agent integration points:** `// AGENT: Add navigation links here`.
- **Testing requirements:** Clicking links updates URL and view without full reload.
- **Modify:** Link names, icons, routing paths.
- **Do NOT modify:** Core routing state wrapper without mentor.
- **Mentor escalation triggers:** Routing completely breaks the React tree.

### 04 Form Starter
- **Purpose:** Create a reusable, controlled form pattern with validation.
- **Target learner:** Level 3 AI Builder.
- **Prerequisites:** Phase 2 UI.
- **Dependencies:** React (controlled components).
- **Supported surfaces:** Web / PWA.
- **Installation steps:** Copy form component and hook.
- **Integration steps:** Define fields, validation rules, and submit payload action.
- **Expected result:** Form validates, shows loading state, and successfully submits payload.
- **Timing tier:** Quick Win (5–15 min).
- **Failure modes:** `e.preventDefault()` missing causing page reload.
- **Rescue Lane procedure:** Check `onSubmit` handler binding.
- **Security considerations:** Input sanitization conceptually, though handled mainly by backend.
- **Agent integration points:** `// AGENT: Define form fields array here`.
- **Testing requirements:** Empty submit blocks execution; valid submit logs payload.
- **Modify:** Fields, validation logic, UI.
- **Do NOT modify:** Core controlled component state architecture.
- **Mentor escalation triggers:** Infinite render loops on input change.

### 05 Firebase Auth Starter
- **Purpose:** Provide Sign Up / Login → Authenticated State → Logout.
- **Target learner:** Level 4 MVP Creator.
- **Prerequisites:** Phase 1 Vercel Deploy.
- **Dependencies:** `firebase` SDK.
- **Supported surfaces:** Web / PWA / Expo.
- **Installation steps:** Copy Firebase config and Auth hook/context.
- **Integration steps:** Wrap app in Auth Provider, protect specific routes.
- **Expected result:** App restricts access to protected routes unless logged in.
- **Timing tier:** Standard (15–30 min).
- **Failure modes:** Missing `FIREBASE_API_KEY`, unwhitelisted domains.
- **Rescue Lane procedure:** Verify Firebase console settings. If persistently blocked, reduce scope to anonymous MVP.
- **Security considerations:** Firebase config is public, but must be properly formatted. No hardcoded mock users.
- **Agent integration points:** `// AGENT: Protect this route using useAuth`.
- **Testing requirements:** Successful login redirect, logout redirect, protected route bounce.
- **Modify:** Login UI, redirect paths.
- **Do NOT modify:** Auth context provider logic.
- **Mentor escalation triggers:** Firebase console authentication provider issues.

### 06 Firestore CRUD Starter
- **Purpose:** Establish the minimum useful data loop (Create → Read).
- **Target learner:** Level 4 MVP Creator.
- **Prerequisites:** Phase 3 Auth Starter.
- **Dependencies:** `firebase` SDK.
- **Supported surfaces:** Web / PWA / Expo.
- **Installation steps:** Copy collection hooks and security rules.
- **Integration steps:** Connect Form Starter to Create hook, Dashboard to Read hook.
- **Expected result:** User can save data and see it rendered immediately.
- **Timing tier:** Standard (15–30 min).
- **Failure modes:** Security rules blocking read/write; missing indexes.
- **Rescue Lane procedure:** Verify `userId` matches auth token. Deploy standard user-scoped security rules.
- **Security considerations:** MUST use user-scoped security rules (`users/{userId}/...`). No open/test mode.
- **Agent integration points:** `// AGENT: Adapt data model interfaces here`.
- **Testing requirements:** Data persists across page reloads.
- **Modify:** Data schemas, collection names.
- **Do NOT modify:** Security rule architecture.
- **Mentor escalation triggers:** Infinite render loops caused by bad `useEffect` dependency arrays on data fetch.

### 07 AI Feature Starter
- **Purpose:** Demonstrate a secure pattern for calling AI APIs.
- **Target learner:** Level 3/4.
- **Prerequisites:** Phase 1 Vercel, Phase 3 Firebase (for Functions).
- **Dependencies:** Firebase Cloud Functions, Gemini SDK.
- **Supported surfaces:** Web / PWA / Expo.
- **Installation steps:** Deploy Cloud Function template, integrate frontend request UI.
- **Integration steps:** Add Gemini API Key to Cloud Function secrets.
- **Expected result:** User clicks "Generate", Cloud Function securely calls Gemini, returns result to UI.
- **Timing tier:** Complex (30–45 min).
- **Failure modes:** CORS errors, function timeout, leaked keys.
- **Rescue Lane procedure:** Check Cloud Function logs. Verify Secret Manager.
- **Security considerations:** Server-side AI secrets ONLY. No `NEXT_PUBLIC` or equivalent.
- **Agent integration points:** `// AGENT: Modify the Gemini prompt instruction here`.
- **Testing requirements:** Network tab shows NO API keys in the request payload to the Cloud Function.
- **Modify:** Prompts, UI display of results.
- **Do NOT modify:** Separation of client/server architecture.
- **Mentor escalation triggers:** Suspected API key leak in frontend.

## 5. Kit Dependency Matrix

| Kit | Required Kits | Optional Kits | Blocks/Conflicts | Can Operate Independently? | Recommended Order |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01 Vercel Deploy** | None | None | None | Yes | 1 |
| **02 Responsive UI** | 01 Vercel | None | None | Yes | 2 |
| **03 Dashboard** | 01 Vercel | 02 Resp. UI | None | Yes | 3 |
| **04 Form** | 01 Vercel | 02 Resp. UI | None | Yes | 4 |
| **05 Auth** | 01 Vercel | 03 Dashboard | None | Yes | 5 |
| **06 Firestore** | 01 Vercel, 05 Auth | 04 Form | None | No | 6 |
| **07 AI Feature** | 01 Vercel | 05 Auth | None | Yes (if anon) | 7 |

## 6. The Golden Path

The canonical Web path layers build upon each other:

1. **Vercel:** Establishes the live production environment and CI/CD.
2. **Responsive UI:** Establishes the layout container so things don't break on mobile.
3. **Dashboard:** Adds the navigation shell and user-facing structure.
4. **Form:** Allows structured user input.
5. **Firebase Auth:** Secures the app and identifies the user.
6. **Firestore:** Persists the user's input safely based on their identity.
7. **AI Feature:** Enhances the persisted data or input using secure server-side AI.

## 7. The Experimental Mobile Path

The bootcamp formally recognizes **React Native / Expo** as an experimental implementation surface. 
*Note: No mobile code will be built in the initial Starter Kit system.*

- **Entry requirements:** Team must explicitly opt-in and possess prior JavaScript familiarity.
- **Technical checkpoint:** Team must prove the app runs locally, renders a screen, connects to Firebase, executes the core flow, and demos on a device/emulator.
- **Supported surface-agnostic kits:** 05 Auth, 06 Firestore, 07 AI Feature (Backend).
- **Unsupported web-specific kits:** 01 Vercel, 02 Responsive UI, 03 Dashboard, 04 Form.
- **Fallback to Web/PWA:** If the checkpoint fails, the team must immediately transition to the Web/PWA Golden Path to ensure Demo Day success.

## 8. Testing Strategy

Every Kit must pass the following checks before being released to participants:

1. **Fresh Project Test:** Kit code drops into a blank React/Firebase project and compiles. (PASS: No fatal compile errors).
2. **Installation Test:** Documentation steps are accurate. (PASS: A user following steps exactly achieves the expected state).
3. **Integration Test:** Kits work with their dependencies. (PASS: Form Starter successfully writes to Firestore Starter).
4. **Agent Test:** AI can implement it. (PASS: See section 9).
5. **Beginner Usability Test:** Can a beginner integrate it in the expected timing tier? (PASS: < 15/30/45 mins without mentor help).
6. **Failure Recovery Test:** Deliberately break the kit. Does the Rescue Lane procedure fix it? (PASS: Mentor can fix it in < 5 mins).
7. **Deployment Test:** (PASS: Builds on Vercel without environment/TS errors).

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
- **Dependencies:** Vercel CLI (optional for local, mainly GitHub integration).
- **Vite configuration:** Standard Vite build (`dist` output).
- **Build command:** `npm run build`
- **Deploy command:** Triggered via Git push.
- **Environment strategy:** Configure in Vercel Dashboard BEFORE first deployment.
- **Expected output:** Live URL rendering the React app.
- **Failure recovery:** If white screen on refresh, check `vercel.json` rewrites. If build fails, check TypeScript strictness.
- **Agent instructions:** "Review `vercel.json` configuration and ensure package.json build scripts are standard."
- **Test checklist:** Push to main -> Build green -> URL loads -> Refresh page doesn't 404.
- **Mentor notes:** Most common failure is forgetting to add Firebase config to Vercel environment variables.

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
