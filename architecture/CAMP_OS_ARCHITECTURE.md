# CAMP OS ARCHITECTURE (END-TO-END)

## Overview
Camp OS is a real-time orchestrator for the "From Zero to MVP" bootcamp. It acts as the backbone of the physical and virtual space, connecting the Organizer, Participants, Mentors, Judges, and the main Projector screen.

## Stack
- **Framework:** Next.js (App Router)
- **Database:** Firebase Firestore (Real-time)
- **Auth:** Firebase Auth
- **Styling:** CSS Modules / Vanilla CSS
- **Animations:** Framer Motion (only where it adds visceral value, e.g., Projector transitions)
- **Deployment:** Vercel

## Core Flow
1. **Organizer Central Command:** The Organizer modifies the `globalState` document in Firestore.
2. **Real-time Propagation:** Firestore pushes the update (`onSnapshot`) to all active clients (Projector, Mentors, Participants).
3. **Role-based Reactions:** 
   - **Projector:** Changes view entirely (e.g., from Build to Demo Day).
   - **Participants:** See UI changes (e.g., Checkpoint submission unlocks).
   - **Mentors:** Dashboard flashes alerts for Teams needing help.

## Project Structure
```text
camp-os/
├── app/
│   ├── (auth)/login/
│   ├── organizer/     (Control Center)
│   ├── participant/   (Journey & Build Tasks)
│   ├── mentor/        (Team Dashboard)
│   ├── judge/         (Demo Day Scoring)
│   ├── projector/     (Live Public Screen)
│   └── page.tsx       (Landing/Role routing)
├── lib/
│   ├── firebase.ts    (Init & Auth)
│   └── firestore.ts   (Queries & Listeners)
├── components/
│   ├── ui/
│   ├── roles/
│   └── shared/
└── styles/
```
