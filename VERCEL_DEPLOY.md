# BlackBird Studio — Vercel + Render deployment

This project uses a Vite/React frontend and an Express API with JSON-file storage and media uploads. Deploy the frontend to Vercel and keep the Express API on Render with its persistent disk. Do **not** deploy the current JSON-file backend as a Vercel serverless function: serverless filesystem writes and in-memory sessions are not durable.

## 1. Deploy the backend to Render first

1. Push this project to a GitHub repository.
2. In Render, create a **Blueprint** and select the repository. Render reads `render.yaml`.
3. Set `ADMIN_PASSWORD` when Render prompts for it. Use a unique password of at least 12 characters. `ADMIN_EMAIL` defaults to `admin@blackbirdstudio.com`; change it if desired.
4. Wait for the service to become healthy at `/api/public-data`.
5. Copy the service's public hostname, for example `blackbird-studio-api.onrender.com` (without `https://`).

The Render blueprint mounts a persistent disk at `/var/data` and stores the database and uploads there. Keep this disk attached; deleting it can delete stored content.

## 2. Connect Vercel to the backend

Open `vercel.json` and replace **both** occurrences of:

`YOUR-RENDER-SERVICE.onrender.com`

with the exact Render hostname from step 1. Keep the `https://` prefix already present in the file. Commit and push this change.

## 3. Deploy the frontend to Vercel

1. In Vercel, import the GitHub repository.
2. Set the Root Directory to `Blackbird-studio-main` only if the repository contains this project inside that folder. If the project files are at the repository root, leave Root Directory as `.`.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Deploy.

The `vercel.json` rewrites send `/api/*` and `/uploads/*` requests to Render, while all other paths serve the Vite single-page app. This keeps the existing frontend API paths working without browser CORS configuration.

## 4. Admin login

Use the email and password configured in Render environment variables. There is no safe universal/default password. After logging in, change the password in Admin Account Settings if the interface offers that option.

## Important notes

- Vercel hosts the frontend; Render hosts the Express API, database JSON file, and uploaded media.
- Keep the Render persistent disk enabled for data durability.
- Do not put `ADMIN_PASSWORD` or other secrets in Vercel frontend environment variables or source code.
- The Render service may sleep on a free plan (if using one), causing the first API request after inactivity to take longer. The supplied `render.yaml` currently requests the `starter` plan.
- Test public data, application submission, admin login, member/project edits, and media upload after deployment.
