# CAMP OS DATA MODEL

All data is stored in Firebase Firestore. We optimize for fast reads and real-time listeners.

## Collections

### 1. `globalState` (Single Document: `camp/current`)
Controls the macro-state of the entire bootcamp.
- `currentPhase` (enum: setup, welcome, ideation, build, checkpoint, demo_day, finished)
- `activeDemoTeamId` (string, null if not demo day)
- `announcement` (string, optional broadcast message)
- `timerEndTime` (timestamp, optional)

### 2. `users`
- `id` (uid)
- `name` (string)
- `email` (string)
- `role` (enum: participant, mentor, organizer, judge)
- `teamId` (string, optional, for participants)

### 3. `teams`
- `id` (string)
- `name` (string)
- `projectIdea` (string)
- `currentStage` (string, e.g., 'ideation', 'core_flow', 'mvp_build')
- `progressPercentage` (number 0-100)
- `healthStatus` (enum: green, yellow, red)
- `checkpointStatus` (enum: idle, pending, approved, rejected)
- `demoDayTotalScore` (number)

### 4. `teamTasks` (Subcollection under `teams/{teamId}/tasks`)
- `taskId` (string)
- `status` (enum: pending, completed)
- `submittedWork` (string/json)
- `completedAt` (timestamp)

### 5. `demoDayScores`
- `id` (auto-generated)
- `teamId` (string)
- `judgeId` (string)
- `scores`: {
    `problem`: number (1-10),
    `product`: number (1-10),
    `execution`: number (1-10),
    `ai`: number (1-10),
    `pitch`: number (1-10)
  }
- `totalScore`: number
- `notes`: string

### 6. `mentorInterventions` (Optional/Phase 2)
- `teamId`, `mentorId`, `notes`, `timestamp`
