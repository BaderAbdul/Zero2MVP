# FROM ZERO TO MVP: CANONICAL PROGRAM ARCHITECTURE V2 (LOCKED)

## 1. Program Identity
**Program:** From Zero to MVP
**Positioning:** AI Product Builder Experience

## 2. Core Promise
"Turn a real problem into a live digital product in 3 days using AI."

The program is NOT primarily an AI tools course. It is a product-building experience where participants move from:
**Problem → Product → Prototype → MVP → Live Product → Pitch**

AI tools are the engine, not the destination.

## 3. Design Principles
- **Build small.** Scope must be aggressively reduced.
- **Ship ugly.** Visual polish is secondary to functional core loops.
- **Test early.** Get it working before making it pretty.
- **Ask AI, don't worship AI.** Use AI to accelerate, but maintain builder agency.
- **Use the 15-minute rule.** Never stay stuck on a single bug for more than 15 minutes.
- **Demo what works.** Only show functioning software, no vaporware.
- **Use Starter Kits without shame.** Accelerators are valid tools.
- **Focus on the core user flow.** One primary journey is all that matters.

## 4. Builder Journey
There is ONLY ONE participant-facing progression system. The unified journey moves through five distinct missions:
1. Discover
2. Design + First Ship
3. Build
4. Connect
5. Ship + Pitch

## 5. Five Levels
The participant-facing levels and their corresponding badges are:
- **LEVEL 1:** 🎯 Problem Hunter
- **LEVEL 2:** 📐 Product Architect
- **LEVEL 3:** ⚙️ AI Builder
- **LEVEL 4:** 🌐 MVP Creator
- **LEVEL 5:** 🏆 Founder

*(Note: Terms like Bronze / Silver / Gold / Platinum exist ONLY as internal technical/product states and are never presented as participant levels.)*

## 6. Missions
- **Problem Hunter:** DISCOVER - Find a real problem worth solving.
- **Product Architect:** DESIGN / FIRST SHIP - Turn the validated problem into a buildable product scope.
- **AI Builder:** BUILD - Build the core product experience.
- **MVP Creator:** CONNECT - Turn the prototype into a connected product.
- **Founder:** SHIP + PITCH - Turn the MVP into something the team can confidently demonstrate.

## 7. Definition of Done
- **Problem Hunter:** The team can clearly explain: "Who has the problem, what is the problem, and why does it matter?"
- **Product Architect:** The team has a working project deployed publicly, even if it is only a basic shell (FIRST SHIP).
- **AI Builder:** A user can complete the main product flow from beginning to end, even if data persistence is not yet connected.
- **MVP Creator:** The core product data persists successfully. The minimum successful data loop should be: User → Auth → Create → Firestore → Read.
- **Founder:** The team has a live product URL and can demonstrate the core user journey successfully.

## 8. Product States (Internal Technical Architecture)
The internal technical progression maps to the participant journey but remains behind the scenes:
- **IDEA / VALIDATED PROBLEM** (Maps to Problem Hunter)
- **DEPLOYED SHELL / BRONZE** (Maps to Product Architect)
- **FUNCTIONAL PROTOTYPE / SILVER** (Maps to AI Builder)
- **CONNECTED MVP / GOLD** (Maps to MVP Creator)
- **LIVE PRODUCT / PLATINUM** (Maps to Founder)

## 9. Daily Architecture
### DAY 0 — PRE-CAMP
**Mission:** GET READY
**Objective:** Arrive ready to build.
- GitHub, Vercel, Firebase, Antigravity access
- Technical preflight
- Initial idea submission
- Idea Marketplace

### DAY 1 — DISCOVER & DESIGN
**Mission:** FIND → DEFINE → FIRST SHIP
**Progression:** Problem Hunter → Product Architect
- Mission Brief
- Idea Matching
- Problem Validation
- MVP Canvas
- Agent-First Building introduction
- First Build Sprint
- Ghost Deploy (First Ship checkpoint)
- Checkpoint

### DAY 2 — BUILD & CONNECT
**Mission:** BUILD → CONNECT
**Progression:** AI Builder → MVP Creator
- Frontend/UI sprint
- Core interaction sprint
- Firebase sprint
- AI feature integration
- Rescue Lane
- Open Build Lab
- Architecture checkpoint

### DAY 3 — SHIP & PITCH
**Mission:** SHIP → PITCH
**Progression:** MVP Creator → Founder
- Pitch Clinic
- Final Build
- Production verification
- Mobile check
- Security check
- Gamma pitch deck
- Demo Day
- Judging
- Awards
- Graduation

## 10. Technical Architecture
The core technical stack is taught as a continuous action loop, not isolated lessons:
- **ANTIGRAVITY → BUILD**
- **FIREBASE → CONNECT**
- **VERCEL → SHIP**

The program language should consistently communicate: BUILD → CONNECT → SHIP

## 11. Agent-First Method
The program teaches participants to work WITH agents, not simply copy prompts. The standard loop is:
`CONTEXT → PROMPT → AGENT → REVIEW → TEST → ITERATE`

The Prompt Framework should include:
- Context
- User
- Problem
- Goal
- Core Flow
- Constraints
- Tech
- Acceptance Criteria

## 12. Firebase Strategy
Firebase is taught as a focused sprint to achieve the minimum useful data flow:
`Auth + Create + Firestore + Read`
- **Time Allocation:** 75 minutes dedicated Firebase build sprint PLUS 30–45 minutes Open Build Lab / Rescue Lane.
- **Scope:** Do not teach Firebase comprehensively. The objective is a working connected MVP. Do NOT require teams to build a full production-grade Firebase architecture.

## 13. Ghost Deploy Strategy (First Ship)
Introduce "FIRST SHIP" at the end of Day 1.
- Every team should deploy a basic working shell to Vercel.
- The product can be extremely simple. The objective is NOT visual quality.
- The objective is: "We shipped something publicly."
- This eliminates final-day deployment panic. Day 3 should be final verification and final push, not the first deployment.

## 14. Rescue Lane
A clear architecture to prevent a single technical bug from consuming the entire sprint. When a team is stuck:
1. 15-minute self/debug attempt
2. Ask Agent
3. Ask Mentor
4. Use Starter Kit
5. Simplify scope
6. Continue

## 15. Starter Kit Philosophy
Starter Kits must be treated as **ACCELERATORS**, NOT as failure recovery.
- Using a Starter Kit does NOT reduce judging score.
- Teams are expected to customize and understand what they use.

## 16. Builder Rules
The official Builder Rules include:
1. Build small.
2. Ship ugly.
3. Test early.
4. Ask AI, don't worship AI.
5. Use the 15-minute rule.
6. Demo what works.
7. Use Starter Kits without shame.
8. Focus on the core user flow.

## 17. Gamification
Use one visible progression system.
Participants progress:
🎯 Problem Hunter → 📐 Product Architect → ⚙️ AI Builder → 🌐 MVP Creator → 🏆 Founder

Each level should have:
- Mission
- Deliverable
- Definition of Done
- Evidence
- Badge
- Mentor checkpoint

Recommend a physical or digital Builder Leaderboard to show team progress without creating a punitive environment.

## 18. Team Formation
The Idea Marketplace should begin before Day 1 where possible.
- **Day 0:** Participants submit ideas digitally.
- **Day 1:** Use a structured physical Idea Marketplace to finalize teams.
- **Target:** 3–4 people per team.
- **Rule:** Avoid random team assignment whenever possible.

## 19. Demo Day Alignment
Demo Day judging must measure what participants were actually taught.
The program explicitly follows SHIP UGLY. Therefore visual polish should NOT dominate judging.
The important question is: "Does the product solve the stated problem and does the core flow actually work?"

## 20. Judging Framework
Create a clear judging rubric for each criterion:
- **Problem:** 20%
- **Core User Flow:** 15%
- **MVP Execution:** 25%
- **AI Integration:** 20%
- **Pitch:** 20%
*(Do NOT use generic "UX" scoring.)*

## 21. Security Principles
Include a lightweight security checkpoint. Participants must understand:
- What can safely exist in frontend code?
- What must NEVER be exposed?
Do not teach advanced security. Teach only what is necessary to prevent beginners from exposing secrets or service credentials.

## 22. Mentor Checkpoints
Each progression state must have mentor verification. Mentors confirm the team meets the "Definition of Done" and checks the required deliverables/evidence before awarding the associated badge.

## 23. Participant Deliverables
Deliverables mapped across the journey:
- Specific target user, clearly defined problem, current solution, why the problem matters, MVP Canvas, Formed team.
- Core user flow, MVP scope, one primary user journey, technical feasibility check, initial working project (Public Vercel URL).
- Functional UI, core interactions, realistic mock data where necessary, one complete core user flow, AI-assisted implementation.
- Firebase connected, Authentication where required, Firestore persistence where required, at least one working data flow (can create/read successfully).
- Live Vercel application, mobile verification, basic production/security check, final working core flow, 3-minute pitch, Demo-ready product story.

## 24. Program Success Metrics
The focus is on progressing teams from Idea to Pitched Product. Success is mapped to the internal technical progression (Idea → Validated Problem → Deployed Shell → Functional Prototype → Connected MVP → Live Product → Pitched Product).

## 25. Official Terminology
- Participant-facing progression: Problem Hunter, Product Architect, AI Builder, MVP Creator, Founder.
- Internal technical/product states: Idea, Validated Problem, Deployed Shell (Bronze), Functional Prototype (Silver), Connected MVP (Gold), Live Product (Platinum).
- Core actions: Build (Antigravity), Connect (Firebase), Ship (Vercel).
- Starter Kits: Accelerators.

## 26. Document Hierarchy
This file is now the canonical architecture. The hierarchy should be:
1. `09_PROGRAM_ARCHITECTURE_V2_LOCKED.md` (This document)
2. `01_Program_Blueprint.md`
3. `02_3Day_Schedule.md`
4. `03_Instructor_Guide.md`
5. `04_Participant_Guide.md`
6. `05_Levels_and_Badges.md`
7. `06_DemoDay_and_Judging.md`
8. `07_Landing_Page_Copy.md`

All future documents must conform to this architecture. If an existing document conflicts with this architecture, the architecture wins.

## 27. Final End-to-End Journey
**Day 0:** Get Ready
**Day 1:** Discover & Design (Problem Hunter → Product Architect) culminating in a FIRST SHIP.
**Day 2:** Build & Connect (AI Builder → MVP Creator) focusing on core flow and Firebase sprint.
**Day 3:** Ship & Pitch (MVP Creator → Founder) focusing on Demo-ready verification and Demo Day execution.

==================================================
# ARCHITECTURE LOCK
==================================================
*Non-negotiable rules that all future program documents must follow:*

- **NO DUAL PARTICIPANT PROGRESSION:** There is ONLY ONE participant-facing progression system (Problem Hunter → Product Architect → AI Builder → MVP Creator → Founder). Bronze/Silver/Gold/Platinum are INTERNAL technical states only.
- **NO 20-MINUTE FIREBASE DEPENDENCY:** The Firebase sprint MUST be allocated 75 minutes + 30-45 minutes Open Lab, focused strictly on Auth + Create + Firestore + Read.
- **NO FIRST DEPLOYMENT ON DAY 3:** A "Ghost Deploy" (FIRST SHIP) must occur at the end of Day 1. Every team deploys a basic working shell.
- **NO UX JUDGING CONTRADICTION:** The program teaches "Ship Ugly". Demo Day judging must prioritize the core user flow working and solving the problem (Core User Flow 15%, MVP Execution 25%). Generic "UX" scoring is explicitly banned.
- **STARTER KITS = ACCELERATORS:** Starter kits are defined as Accelerators, not Failure Recovery. There is zero judging penalty for their use.
- **CANONICAL SUPREMACY:** If any existing legacy document (files 01-08) conflicts with this architecture, `09_PROGRAM_ARCHITECTURE_V2_LOCKED.md` wins automatically.
