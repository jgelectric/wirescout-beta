# WireScout Beta — Accounts + Cloud Sync

Offline-first electrician jobsite walkthrough PWA with private user accounts and Supabase cloud backup.

## What is included

- Everything from the previous multiple-choice/PDF-fix beta
- Email + password Create Account / Sign In
- Each user gets a separate private job list
- Local/offline job cache remains available on the jobsite
- Background cloud sync when online
- Jobs stored under the signed-in user
- Photos and voice notes backed up to a private cloud bucket
- Multi-device job access after sign-in
- Account management / Sign Out in Settings
- Existing guest/local jobs migrate to the first account that signs in on that device
- Row Level Security (RLS) SQL so users cannot read another user's jobs or files

## One-time Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and run the full `supabase-schema.sql` file included in this ZIP.
3. In Supabase, open **Project Settings / API** and copy the Project URL and publishable (anon) key.
4. Open `js/config.js` and replace:
   - `YOUR_SUPABASE_URL`
   - `YOUR_SUPABASE_PUBLISHABLE_KEY`
5. In Supabase Auth settings, keep Email/Password enabled. If email confirmation is enabled, new users must confirm their email before signing in.
6. Upload all files to the root of the `wirescout-beta` GitHub repository and replace the old files.
7. Wait for GitHub Pages to redeploy, then hard-refresh/reopen WireScout.

## Security

The browser uses only the Supabase publishable key. The included SQL enables Row Level Security and uses the authenticated user's ID to isolate profiles, jobs, file metadata, and private storage paths. Never put a Supabase `service_role` / secret key in `js/config.js` or any GitHub Pages file.

## Offline behavior

WireScout saves locally first. If the internet is unavailable, work continues on the device. When the user is signed in and connectivity returns, WireScout syncs the local jobs to that user's cloud account.
