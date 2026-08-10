# MENTOR_NOTES.md

## Expected Failure Modes & Rescue Procedures

### 1. Vercel Build Fails (TypeScript Errors)
- **Symptom:** Vercel deployment fails during the `npm run build` phase with `tsc` errors.
- **Cause:** Beginners often write code that works locally during `npm run dev` but fails strict type-checking during the production build.
- **Rescue Lane Procedure:**
  1. Open the Vercel Build Logs and identify the exact TypeScript error.
  2. Have the participant run `npm run build` locally in their terminal to reproduce it.
  3. Guide them (or have them ask Antigravity) to fix the typing error.
  4. Push the fix and redeploy. 
  5. **DO NOT** instruct them to remove `tsc &&` from their build script. "Ship Ugly" does not mean "Ship Broken."

### 2. The "White Screen of Death"
- **Symptom:** Build succeeds, but visiting the URL shows a completely blank white page.
- **Cause:** A runtime JavaScript error occurred on mount. Because there are no environment variables required for this starter, it is usually a malformed import or a React error.
- **Rescue Lane Procedure:**
  1. Open Chrome Developer Tools (F12) -> Console.
  2. Read the red runtime error.
  3. Work backwards into the React component tree to fix the crash.

### 3. 404 NOT_FOUND on Page Refresh
- **Symptom:** Clicking links works, but refreshing the page shows a Vercel 404 page.
- **Cause:** The `vercel.json` file is either missing, misplaced (e.g., inside `/src`), or malformed.
- **Rescue Lane Procedure:** Ensure `vercel.json` is at the absolute root of the repository, next to `package.json`, and contains the exact SPA rewrite rules.

### 4. "Missing Environment Variables" Panic
- **Symptom:** Participant asks where to put their Firebase keys to make Vercel work.
- **Cause:** Skipping ahead in the Golden Path.
- **Rescue Lane Procedure:** Remind the participant that the Vercel Deployment Starter requires **zero** environment variables. Firebase integration happens later in Kit 05. Keep them focused on deploying the basic UI shell first.
