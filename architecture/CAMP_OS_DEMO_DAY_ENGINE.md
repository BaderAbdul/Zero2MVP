# CAMP OS DEMO DAY ENGINE

The Demo Day is the climax of the bootcamp. It requires tight synchronization between the Organizer, the Projector, and the Judges.

## State Machine

The Engine operates based on the `globalState` document when `currentPhase == 'demo_day'`.

### 1. The Queue
The Organizer dashboard displays a drag-and-drop list of all teams.
When the Organizer selects a team to present, they click "Up Next: Team Alpha".
- **Action:** `globalState.activeDemoTeamId` is set to `Team Alpha ID`.
- **Projector:** Transitions to a cinematic intro screen: "TEAM ALPHA IS READY".
- **Judge App:** The Judge UI unlocks, displaying "Scoring: Team Alpha".

### 2. The Pitch
The team pitches. Judges evaluate on their devices.
- **Judge App:** Judges adjust 5 sliders (Problem, Product, Execution, AI, Pitch).
- **Projector:** Displays a clean timer, or the team's MVP URL/Screenshots.

### 3. Score Submission
Judges click "Submit Score".
- **Action:** A new document is written to the `demoDayScores` collection.
- **Organizer:** Sees a real-time tally (e.g., "3/5 Judges have scored").

### 4. The Reveal
Once all judges submit, the Organizer clicks "Reveal Score".
- **Action:** A flag in `globalState` (`revealScores: true`) is flipped.
- **Projector:** Triggers a dynamic, suspenseful counting animation summing up the total score.
- **Action:** Cloud Function (or client-side calculation) updates `teams/{teamId}.demoDayTotalScore`.

### 5. Leaderboard / Winner
Organizer switches to "Final Results".
- **Projector:** Renders the final podium of teams based on `demoDayTotalScore`.
