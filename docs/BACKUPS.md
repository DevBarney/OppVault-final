# Database backups

Every night at 02:30 UTC (03:30 in Lagos) a GitHub Action dumps the OppVault database, encrypts it, and keeps it for 90 days.
You can also run it by hand: GitHub, Actions, "Nightly database backup", Run workflow.

## What is in a backup

- `public.sql`: all the site's tables, policies, functions and data (listings, blog posts, reviews, saved and applied lists, submissions, admin users, click counts).
- `auth-users.sql`: the sign-in accounts (users and identities), which the saved and applied lists point at. It contains private details. The file is encrypted, so keep the passphrase safe.

## What is not in a backup

- **Uploaded photos** (review photos and avatars in the Supabase storage bucket). The rows that point to them are saved, the picture files are not.
- **Supabase settings** (email templates, SMTP, redirect URLs). They are written down in `docs/AUTH_EMAILS.md`.
- **Vercel and Resend settings.**

## One-time setup (you do this, in GitHub)

1. Supabase, Project Settings, Database, Connect: copy the **Session pooler** connection string (the direct one does not work from GitHub because it needs IPv6). Put your database password in it.
2. GitHub repository, Settings, Secrets and variables, Actions, New repository secret:
   - `SUPABASE_DB_URL`: that connection string.
   - `BACKUP_PASSPHRASE`: a long random passphrase. Also store it in a password manager. Without it a backup cannot be opened.
3. Run the workflow once by hand and check it goes green.

Do not paste these values into a chat or into the code.

## Download and restore

1. GitHub, Actions, pick a run, download the artifact (a `.gpg` file).
2. Decrypt and unpack:
   ```
   gpg --decrypt oppvault-backup-YYYY-MM-DD.tar.gz.gpg > backup.tar.gz
   tar -xzf backup.tar.gz
   ```
3. Restore into an empty Supabase project (never straight over the live one without a second look):
   ```
   psql "$NEW_DB_URL" -f auth-users.sql   # only if the new project has no users yet
   psql "$NEW_DB_URL" -f public.sql
   ```
   Restore the users first so the saved lists find their owners. Then check the row counts and sign in once.
4. Point the site at the new project by changing the Supabase environment variables in Vercel.

## Check it now and then

Once a month, open the latest run to confirm it is green, and once a quarter practise a restore into a throwaway project, so you know it works before you need it.
