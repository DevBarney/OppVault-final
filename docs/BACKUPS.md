# Database backups

Every night at 02:30 UTC (03:30 in Lagos) a GitHub Action copies the live OppVault database into a second, separate Supabase project called **oppvault-backup** (region eu-central-1, project ref `fuozxctyqidpaqzcartb`). It also keeps an encrypted file copy for 90 days, so there are two independent backups.
The backup project is rebuilt from scratch every night: never edit it and never point the site at it unless the live project is lost.
You can also run it by hand: GitHub, Actions, "Nightly database backup", Run workflow.

## What is in a backup

- `public.sql`: all the site's tables, policies, functions and data (listings, blog posts, reviews, saved and applied lists, submissions, admin users, click counts).
- `auth-users.sql`: the sign-in accounts (users and identities), which the saved and applied lists point at. It contains private details. The file is encrypted, so keep the passphrase safe.

## What is not in a backup

- **Uploaded photos** (review photos and avatars in the Supabase storage bucket). The rows that point to them are saved, the picture files are not.
- **Supabase settings** (email templates, SMTP, redirect URLs). They are written down in `docs/AUTH_EMAILS.md`.
- **Vercel and Resend settings.**

## One-time setup (you do this, in GitHub)

1. For **each** of the two Supabase projects (the live one and `oppvault-backup`): Project Settings, Database, Connect, copy the **Session pooler** connection string (the direct one does not work from GitHub because it needs IPv6) and put that project's database password in it. If you do not know the backup project's password, reset it under Project Settings, Database.
2. GitHub repository, Settings, Secrets and variables, Actions, New repository secret:
   - `SUPABASE_DB_URL`: the live project's string.
   - `BACKUP_DB_URL`: the `oppvault-backup` project's string. The job refuses to run if the two are the same.
   - `BACKUP_PASSPHRASE`: a long random passphrase. Also store it in a password manager. Without it a backup cannot be opened.
3. Run the workflow once by hand and check it goes green. Then open the backup project's Table editor and check `opportunities` has the same rows as the live one.

Do not paste these values into a chat or into the code.

## Using the backup project if the live one is lost

1. In Vercel, point the Supabase environment variables (URL, publishable key, service role key) at `oppvault-backup`, then redeploy.
2. In the backup project, set up Auth again: SMTP, email templates, redirect URLs and social providers (see `docs/AUTH_EMAILS.md`).
3. Visitors' sign-in sessions will need a fresh sign-in, but their accounts, saved items and applied marks are there.

## Download and restore from a file

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
