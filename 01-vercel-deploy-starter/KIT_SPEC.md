# KIT_SPEC.md (Agent Integration Contract)

## Agent Overview
This specification provides technical context for Antigravity (or any AI agent) integrating the `01-vercel-deploy-starter` kit.

## Kit Boundary
- **Responsibility:** Configure Single-Page Application (SPA) routing for a Vite-based React app deployed to Vercel.
- **Exclusions:** This kit MUST NOT introduce Firebase, Firestore, Authentication, Cloud Functions, Gemini, Expo, or any environment variables.

## Integration Point
- Target file: `vercel.json` at the absolute root of the participant's repository.
- Required contents: A `rewrites` array catching all routes `/(.*)` and redirecting them to `/index.html`.

## Agent Workflow
1. Verify the project is using React + Vite.
2. Verify the project's `package.json` contains the standard `"build": "tsc && vite build"` or `"build": "vite build"` script.
3. Place the `vercel.json` file in the project root.
4. Instruct the participant to push to GitHub and import the project into Vercel using the Vercel Dashboard.
5. If the participant asks to add environment variables to bypass a deployment error, remind them that this starter requires zero variables. Help them diagnose the actual build error (typically a TypeScript strictness failure).
