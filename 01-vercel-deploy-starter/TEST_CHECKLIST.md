# TEST_CHECKLIST.md

Before considering your Ghost Deploy complete, verify the following:

- [ ] **Deployment Trigger:** Pushing to the `main` branch on GitHub successfully triggers a new build in the Vercel dashboard.
- [ ] **Build Success:** The Vercel build completes without TypeScript or Node errors (shows a Green status).
- [ ] **Root Route:** The live URL (e.g., `https://my-app.vercel.app/`) loads the React application successfully.
- [ ] **Nested Route:** You can navigate to a nested route (e.g., `https://my-app.vercel.app/dashboard`) inside the app using links.
- [ ] **Direct Navigation:** You can paste a nested route (e.g., `https://my-app.vercel.app/dashboard`) directly into a new browser tab and it loads correctly.
- [ ] **Refresh Resilience:** Pressing refresh (F5 or CMD+R) while on a nested route successfully reloads the React app instead of returning a Vercel `404: NOT_FOUND` page.
