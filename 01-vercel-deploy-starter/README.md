# 01 — Vercel Deployment Starter

## Purpose
This Starter Kit ensures a predictable, instant deployment (a "Ghost Deploy") for your React + Vite application on Day 1. It configures Vercel to properly handle client-side routing, preventing the common "404 on refresh" error.

**Important:** This kit contains NO business logic, NO Firebase configuration, and NO AI code. It does one job: gets your app live on the internet.

## Prerequisites
- A basic React + TypeScript + Vite project initialized.
- Your code is committed and pushed to a GitHub repository.

## Installation Steps (Ghost Deploy Workflow)

1. **Copy the Configuration**
   Copy the `vercel.json` file from the `code/` folder of this Starter Kit into the **root** of your React/Vite project (next to `package.json`).

2. **Commit and Push**
   Commit the new `vercel.json` file and push your code to your `main` branch on GitHub.
   ```bash
   git add vercel.json
   git commit -m "Add Vercel SPA routing config"
   git push origin main
   ```

3. **Link to Vercel**
   - Go to [Vercel.com](https://vercel.com) and log in.
   - Click **Add New...** → **Project**.
   - Import your GitHub repository.
   - Vercel will auto-detect "Vite". **Leave all default settings as they are.**
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - *Note: ZERO environment variables are required at this stage.*
   - Click **Deploy**.

## Expected Result
Within a minute, Vercel will provide you with a live `.vercel.app` URL. Your basic React shell is now live on the internet! 

## Troubleshooting
If your build fails, check the `TEST_CHECKLIST.md` and ask your AI Agent or a Mentor for help diagnosing the TypeScript errors. Do not bypass the build!
