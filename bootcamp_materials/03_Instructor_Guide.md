# Instructor & Mentor Guide

## 1. Running the Experience
Your primary goal is to run a high-energy product building experience, not to lecture. Participants learn by doing. Focus on maintaining momentum, removing blockers, and enforcing the Builder Rules (e.g., the 15-minute rule).

## 2. Team Structure & Mentor Ratio
- **Instructor Role:** Leads the room, sets the pace, runs pitch clinics, and enforces checkpoints.
- **Mentor Role:** Circulates among teams, unblocks technical issues, and verifies evidence for level progression. Mentors verify evidence, not subjective progress.
- **Ratio:** 1 Instructor + 2-3 Mentors per 40 participants (approx. 10 teams).

## 3. Checkpoint System & Level Verification
Mentors must physically or digitally verify a team's Definition of Done before awarding a badge.
- **L1 - Problem Hunter:** Verify the team can articulate "Who has the problem, what is it, and why does it matter?" (MVP Canvas).
- **L2 - Product Architect:** Verify the team has a working basic shell deployed publicly (Ghost Deploy / First Ship).
- **L3 - AI Builder:** Verify a user can complete the main product flow from start to finish, even with mock data.
- **L4 - MVP Creator:** Verify the core data loop works: User → Auth → Create → Firestore → Read.
- **L5 - Founder:** Verify the live Vercel URL, mobile responsiveness, security, and a completed 3-minute pitch deck.

## 4. Rescue Lane & Starter Kits
If a team is stuck on a bug for >15 minutes:
1. 15-minute self/debug attempt.
2. Ask Agent.
3. Ask Mentor.
4. **Use Starter Kit (Accelerator).**
5. Simplify scope.
6. Continue.

**Starter Kit Philosophy:** Treat them as Accelerators. There is ZERO judging penalty for using a Starter Kit. Do not treat them as failure recovery; celebrate teams that use them to move faster.

## 5. Firebase Troubleshooting
Do not teach Firebase comprehensively. Focus entirely on Auth + Create + Firestore + Read. Use the dedicated 75-minute block plus the 30-45 minute Open Build Lab to ensure every team crosses the Connected MVP threshold.

## 6. Ghost Deploy Support (First Ship)
On Day 1, aggressively support the "Ghost Deploy." The product can be empty or ugly. The goal is to eliminate Day 3 deployment panic. Instructors should celebrate the first deployed URLs.

## 7. Agent-First Coaching
If participants are blindly copy-pasting, intervene. Coach them on the official loop:
`CONTEXT → PROMPT → AGENT → REVIEW → TEST → ITERATE`

## 8. Team Formation Support
Avoid random assignment. Use the Day 1 Idea Marketplace to form teams organically around strong ideas. Target 3-4 people per team.

## 9. Security Checkpoint (Day 3)
Ensure participants understand:
- Safe: Firebase Client Config
- NEVER Safe: OpenAI API keys, Service Account Credentials.
Mentors must verify repositories do not expose secrets before Demo Day.

## 10. Demo Day Preparation
Ensure teams follow the "Ship Ugly" philosophy—they should demo what works. Do not let teams spend hours on visual polish at the expense of a broken core flow.

## 11. What Instructors Should NOT Do
- Do not write code for them (unless deploying a Starter Kit).
- Do not let teams stay stuck for more than 15 minutes.
- Do not judge UX/UI over functional core flows.
- Do not introduce alternative progression systems (e.g., Bronze/Silver). Use the 5 official levels.
