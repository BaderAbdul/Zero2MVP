# CAMP OS ROLE MATRIX

## Roles & Permissions

| Role | Access Route | Permissions & Capabilities |
| :--- | :--- | :--- |
| **Organizer** | `/organizer` | - Read/Write `globalState` (Phase, Timer, Announcements)<br>- Create/Manage Teams<br>- Trigger Demo Day queue<br>- End Bootcamp |
| **Mentor** | `/mentor` | - Read all `teams` & progress<br>- Read `teamTasks`<br>- Approve/Reject Checkpoints (`teams` status)<br>- Flag team health (`healthStatus`) |
| **Participant** | `/participant` | - Read own `team`<br>- Write to own `teamTasks` (submit work)<br>- Read `globalState` (to know current phase)<br>- View own team's checkpoint status |
| **Judge** | `/judge` | - Read `globalState` to know current Demo Team<br>- Write to `demoDayScores`<br>- Read active team details |
| **Projector** | `/projector` | - **NO AUTH REQUIRED** (Public route)<br>- Read `globalState`<br>- Read `teams` (for leaderboard)<br>- Read `demoDayScores` (aggregated) |

## Role Routing Logic
Upon login (`/login`), the app fetches the user's document from the `users` collection and redirects them to their respective root route based on their `role` field.
