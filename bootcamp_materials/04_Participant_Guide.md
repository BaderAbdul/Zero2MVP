# Builder Handbook

Welcome to **From Zero to MVP**. You are here to build a real product, not to listen to theory.
What are you doing? Building a live digital product in 3 days using AI.
Why are you doing it? To move past the idea phase and become a Founder.
What do you need to finish? A working MVP deployed on the internet.
How do you level up? By completing missions and passing mentor checkpoints.

## 🧑‍🚀 The Builder Rules
1. **Build small.** Scope must be aggressively reduced.
2. **Ship ugly.** Visual polish is secondary to functional core loops.
3. **Test early.** Get it working before making it pretty.
4. **Ask AI, don't worship AI.** Use AI to accelerate, but maintain your agency.
5. **Use the 15-minute rule.** Never stay stuck on a single bug for more than 15 minutes.
6. **Demo what works.** Only show functioning software, no vaporware.
7. **Use Starter Kits without shame.** Accelerators are valid tools.
8. **Focus on the core user flow.** One primary journey is all that matters.

## 🚀 The Builder Journey & Missions
Your journey consists of 5 levels. Each level unlocks a badge upon mentor verification:
- **🎯 L1: Problem Hunter** (Mission: DISCOVER)
- **📐 L2: Product Architect** (Mission: DESIGN / FIRST SHIP)
- **⚙️ L3: AI Builder** (Mission: BUILD)
- **🌐 L4: MVP Creator** (Mission: CONNECT)
- **🏆 L5: Founder** (Mission: SHIP + PITCH)

## 🧠 Agent-First Development
Do not blindly copy-paste. Work WITH the AI using this standard loop:
`CONTEXT → PROMPT → AGENT → REVIEW → TEST → ITERATE`

### Prompt Framework
When writing prompts, include:
- **Context:** What are we building?
- **User:** Who is using it?
- **Problem:** What are they trying to solve?
- **Goal:** What is the immediate objective?
- **Core Flow:** What is the step-by-step journey?
- **Constraints:** What should the AI NOT do?
- **Tech:** e.g., Next.js, Tailwind, Firebase.
- **Acceptance Criteria:** How do we know it works?

## 🎯 MVP Canvas
Before writing code, define:
1. Who has the problem?
2. What is the problem?
3. Why does it matter?
4. What is the current solution?

## 🚢 First Ship (Ghost Deploy)
At the end of Day 1, you will deploy your project to Vercel. It doesn't matter if it's an empty shell. The goal is to prove you can deploy early, eliminating deployment panic on Demo Day.

## 🗄️ Firebase Minimum Architecture
To become an MVP Creator, you must achieve this minimum successful data loop:
`User → Auth → Create → Firestore → Read`

## 🚑 Rescue Lane & Starter Kits
Stuck for 15 minutes? Use the Rescue Lane. Ask an Agent, ask a Mentor, or use a Starter Kit. Starter Kits are Accelerators. There is ZERO penalty for using them. Your goal is to finish.

## 🔒 Security Basics
Never expose API Keys (e.g., OpenAI) or Service Account Credentials in your frontend code. Firebase Client Config is safe to expose. Mentors will verify this before Demo Day.

## 🏆 Demo Day & Judging
You will have 3 minutes to pitch, followed by 1 minute of Q&A.
Judges prioritize execution over aesthetics ("Ship Ugly").
- **Problem:** 20%
- **Core User Flow:** 15%
- **MVP Execution:** 25%
- **AI Integration:** 20%
- **Pitch:** 20%

## ✅ Definition of Done
To unlock your badges, you must prove to a mentor:
- **Problem Hunter:** Clearly explain who has the problem, what it is, and why it matters.
- **Product Architect:** Deploy a basic working shell publicly.
- **AI Builder:** A user can complete the main flow (even without a database).
- **MVP Creator:** Core data loop works and persists in Firebase.
- **Founder:** Live Vercel URL, mobile-ready, secure, and pitch ready.
