# CAMP OS EVENT SYSTEM

The Event System relies on Firebase Firestore `onSnapshot` listeners to propagate state changes instantly across all connected clients.

## Core Events

### 1. Phase Change Event
- **Trigger:** Organizer changes phase in `/organizer`.
- **Action:** Updates `camp/current` document (`currentPhase` field).
- **Subscribers:**
  - `Projector`: Re-renders entire screen view (e.g., swaps from "Build" view to "Demo Day" view).
  - `Participant`: UI adapts (e.g., "Time is up! Submissions closed").
  - `Mentor`: Dashboards update to reflect the new global state.

### 2. Task Completion Event
- **Trigger:** Participant submits a task in `/participant`.
- **Action:** Writes to `teams/{teamId}/tasks` and increments `progressPercentage` on `teams/{teamId}`.
- **Subscribers:**
  - `Projector`: Leaderboard progress bar dynamically moves forward.
  - `Mentor`: Dashboard progress bar updates; pushes team to the top of the "active" list.

### 3. Checkpoint Request Event
- **Trigger:** Participant clicks "Request Checkpoint".
- **Action:** Updates `checkpointStatus` to `pending` on `teams/{teamId}`.
- **Subscribers:**
  - `Mentor`: Dashboard flashes yellow/red for that team; adds them to an "Action Required" queue.
  - `Projector`: (Optional) Shows an indicator that a team is at a checkpoint.

### 4. Checkpoint Approval Event
- **Trigger:** Mentor clicks "Approve".
- **Action:** Updates `checkpointStatus` to `approved` and bumps `currentStage`.
- **Subscribers:**
  - `Participant`: UI unlocks the next stage of tasks.

### 5. Live Scoring Event (Demo Day)
- **Trigger:** Judge submits a score for `activeDemoTeamId`.
- **Action:** Writes to `demoDayScores` collection.
- **Subscribers:**
  - `Projector`: (Optional) Displays real-time aggregate score build-up.
  - `Organizer`: Sees that Judge X has completed scoring.
