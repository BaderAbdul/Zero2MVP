# CAMP OS 7.0 — LIVE CAMP OPERATIONS GUIDE
**PROGRAM:** FROM ZERO TO MVP (3-DAY AI PRODUCT BUILDER CAMP)
**TARGET AUDIENCE:** CAMP ORGANIZERS & FACILITATORS

---

## 1. Before Camp Setup

1. **Infrastructure & Network:**
   - Ensure the auditorium projector monitor is connected to a dedicated laptop running `/projector` in full-screen mode.
   - Verify organizer device is logged into `/organizer`.
   - Test room Wi-Fi connectivity for participant devices.

2. **Default Program Verification:**
   - Confirm global camp code `Z2MVP` is active.
   - Check that the canonical 3-day Run of Show (`DEFAULT_ZERO2MVP_SESSIONS`) is loaded.

---

## 2. Day 1 Operational Flow — THINK (Idea Explorer → Product Thinker)

1. **09:00 — Welcome & Onboarding:**
   - Activate `Welcome & Onboarding` session in `CAMP CONTROL`.
   - Participants open `/`, enter `Z2MVP`, enter their name, and create or join their squad (`Z2MVP-XX`).
   - Late arrivals: Click `+ إنشاء فريق جديد` in `/organizer` to generate instant team codes.

2. **09:20 — Idea Explorer Mission:**
   - Activate `Idea Explorer`.
   - Participants see dominant mission card: "صياغة المشكلة وقيمة الذكاء الاصطناعي" and `DONE WHEN` criteria.
   - Teams submit problem definitions. Organizers review in `PEOPLE & TEAMS` using feedback presets.

3. **10:45 — Product Thinker (MVP Scope):**
   - Activate `MVP Scope`.
   - Teams define core flow and list NOT building features.

---

## 3. Day 2 Operational Flow — BUILD (AI Builder Sprint)

1. **09:00 — AI Builder Sprint (90 min):**
   - Activate `AI Builder Sprint` in `CAMP CONTROL`.
   - Start countdown timer `90:00`.
   - Monitor `NEEDS ATTENTION` queue for technical help requests (`🚨 نحتاج مساعدة المنظم`).
   - Use `+5 MIN` or `+10 MIN` extension buttons if teams need extra time.

2. **Operational Break:**
   - Broadcast announcement `"بعد الاستراحة نبدأ مرحلة الإطلاق"` and activate `BREAK`.
   - Participant and projector screens switch to break mode displaying countdown timer.

3. **Deliverable Review & Feedback:**
   - Open pending submissions in `NEEDS ATTENTION`.
   - Click `[ APPROVE ]` or `[ REQUEST CHANGES ]` with one-click feedback notes.

---

## 4. Day 3 Operational Flow — SHIP & DEMO DAY

1. **Pitch Mission (45 min):**
   - Teams prepare pitch decks and live demo links.
   - Submit deliverable link for final review.

2. **Demo Day Mode:**
   - Activate `Demo Day` session in `CAMP CONTROL`.
   - Select active presenting team in `/organizer`.
   - Projector displays active presenting team name, project title, and live demo URL.
   - Switch to next team seamlessly (`▶️ NEXT TEAM`).

---

## 5. Emergency & Failure Recovery Protocol

1. **Participant Reload or Browser Closure:**
   - Participant session is saved in `localStorage`/`sessionStorage`. Reopening `/` or `/participant` automatically restores their team workspace.

2. **Organizer Device Interruption:**
   - State resides in server Firestore / synchronized state. Any staff member opening `/organizer` instantly resumes control.

3. **Projector Reload:**
   - Reopening `/projector` automatically syncs with current live session, timer, and announcement state.

---

## 6. After Camp Protocol

1. Export final team submissions and pitch links from team directory.
2. Archive camp logs and celebrate team accomplishments!
