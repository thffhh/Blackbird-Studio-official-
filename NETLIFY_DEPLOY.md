# BlackBird Studio — Netlify + Render deployment

This project has an Express API and local JSON/file storage. Netlify hosts the Vite frontend; Render runs the Express backend. Deploying only to Netlify will NOT run the API, admin login, application processing, or uploads.

## 1. Create the backend on Render

1. Push this project to a private GitHub repository.
2. In Render, choose **New > Blueprint** and connect that repository. Render reads `render.yaml`.
3. When prompted, enter `ADMIN_PASSWORD` as a unique password with at least 12 characters. Do not reuse another site's password. Keep it in a password manager.
4. Deploy the service and wait until it is live. Copy its hostname, for example `blackbird-studio-api.onrender.com` (without `https://`).
5. The Blueprint attaches a persistent disk at `/var/data`; this is required because the current application stores its JSON database and uploaded files on disk. Do not remove the disk.

If you create the service manually instead of using the Blueprint, use:
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment: `NODE_ENV=production`, `DATA_DIR=/var/data/data`, `UPLOADS_DIR=/var/data/uploads`, `ADMIN_EMAIL=your-admin-email`, `ADMIN_PASSWORD=your-unique-password`
- Attach a persistent disk mounted at `/var/data`.

## 2. Connect Netlify to the backend

1. Open `netlify.toml` in this repository.
2. Replace BOTH occurrences of `BACKEND_HOST` with the Render hostname copied above. Example: if Render gives `blackbird-studio-api.onrender.com`, the destination should become `https://blackbird-studio-api.onrender.com/api/:splat` and the uploads destination should use the same hostname.
3. Commit and push the change.
4. In Netlify choose **Add new site > Import an existing project**, connect the same GitHub repository, and use:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Deploy. The `netlify.toml` proxy routes `/api/*` and `/uploads/*` to Render and sends other routes to the React app.

## 3. Admin login

- Open the deployed Netlify website.
- Tap/click **Admin Login** in the site navigation (on mobile, open the menu first if needed).
- Enter the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values configured in the Render service environment.
- After successful login, choose **Admin Dashboard**.

There is no built-in universal/default password in this fixed build. If `ADMIN_PASSWORD` is left blank, the server generates a one-time password and prints it in the Render service logs at first startup. Prefer setting your own password in Render before the first deploy. Never put the password in Netlify environment variables or frontend source code.

## 4. Important notes

- Keep the Render persistent disk attached. Without it, data and uploads can be lost on restart/redeploy.
- Back up `/var/data` regularly before upgrades.
- If you change the Render hostname, update both proxy destinations in `netlify.toml` and redeploy Netlify.
- The current JSON store is suitable for a small single-instance deployment with persistent storage. For larger traffic or multiple backend instances, migrate to PostgreSQL/Supabase before scaling.
- The first Render deployment can take a few minutes. If the backend is asleep or still starting, the first API request may take longer.
