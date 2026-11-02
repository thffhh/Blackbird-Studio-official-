# BlackBird Studio — security setup

## First launch

1. Copy `.env.example` to `.env`.
2. Set `ADMIN_EMAIL` to the administrator email.
3. Either set `ADMIN_PASSWORD` to a unique password of at least 12 characters, or leave it blank. When blank, the server generates a cryptographically random one-time password and prints it to the server startup log. Save it immediately.
4. Keep `.env`, `data/`, and `uploads/` private. Never commit `.env` or live database files.
5. Use HTTPS in production.

Existing installations using the publicly known demo password are automatically rotated on startup. If the server generates a replacement password, it prints it once in the startup log. Existing member, project, application, settings, and customization data are retained.

## What was hardened

- Removed demo credentials and auto-fill from the Admin login UI.
- Replaced predictable session tokens with cryptographically random tokens and an eight-hour expiry.
- Added login, application submission, tracking, and upload rate limits.
- Added upload MIME/extension checks and file-signature checks; SVG uploads are disabled.
- Added request-size limits and basic security response headers.
- Added atomic database-file writes.
- Restricted Admin update endpoints to editable fields and made application approval idempotent.
- Password changes require 12+ characters and invalidate all active sessions.
- Reset-to-defaults preserves the current administrator credentials.

## Storage note

This release deliberately retains the existing JSON data store to avoid breaking or discarding the site's current data and admin workflows. For multi-instance hosting or high-volume production, migrate to PostgreSQL/Supabase with a verified backup and migration plan. Keep the hosting disk persistent because `data/` and `uploads/` are stored locally.
