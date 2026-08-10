# DECISIONS & ASSUMPTIONS

This document logs the technical decisions and assumptions made for the Camp OS MVP.

## 1. Real-time Infrastructure
- **Decision:** Use Firebase Firestore instead of WebSockets or custom socket.io servers.
- **Rationale:** Firestore's `onSnapshot` provides robust, production-ready real-time sync out of the box, which is critical for the Projector and Organizer dashboards. It handles reconnects gracefully, ensuring reliability during a live physical bootcamp.

## 2. Authentication & Roles
- **Decision:** Use Firebase Auth. Roles will be stored in a `users` Firestore collection rather than Custom Claims.
- **Rationale:** Custom claims require Cloud Functions and token refreshes, which can add latency or complexity during rapid development. Reading from a `users` collection on login is fast and simple enough for an MVP.

## 3. Styling & Animations
- **Decision:** Use standard CSS Modules combined with Framer Motion for specific transitions.
- **Rationale:** The Projector needs to look highly premium and dynamic. Framer Motion handles complex layout animations (like Leaderboards shifting order) easily.

## 4. Deferred Features (MVP Scope)
- **Assumption:** The AI Camp Assistant (Gemini integration) and granular Gamification (Badges, detailed XP) are NOT required for the first end-to-end MVP.
- **Rationale:** The critical path is proving the 5-actor operational loop. AI and Gamification can be added iteratively in Phase 2 once the core event system is stable.

## 5. Security Rules
- **Assumption:** For the MVP, Firestore security rules will be relatively open but restricted by authentication, and the Projector will have read-only access. Strict per-field validation will be deferred unless time permits.
