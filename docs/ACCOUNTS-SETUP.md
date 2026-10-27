# Visitor accounts: what to switch on

The code is ready. These steps happen in dashboards, because only you can create the sign-in apps and the secrets stay out of chat and code. Nothing here touches `main`.

## 1. Tell Supabase where the site lives (needed for every sign-in method)

Supabase, project `fsznoimnvntxkvvfqpng`, **Authentication, URL Configuration**:

- **Site URL:** the address visitors will use, for example `https://oppvault.app` once launched. While testing, the platform preview address.
- **Redirect URLs** (add each): 
  - `https://oppvaultfinal-git-platform-barntech7427-8984s-projects.vercel.app/**`
  - `https://oppvault.app/**` (when it is live)
  
  Without these, social sign-in and the email links send people to the wrong place.

## 2. Email and password

**Authentication, Sign In / Providers, Email** is on by default. Keep **Confirm email** on, so nobody can sign up with an address that is not theirs.

- Out of the box, Supabase sends the confirm and reset emails itself, with a low hourly limit. That is fine for testing.
- For launch, set your own sender: **Authentication, Emails, SMTP Settings**, Resend SMTP (host `smtp.resend.com`, port `465`, user `resend`, password = a Resend API key). This works once the `oppvault.app` domain shows Verified in Resend.
- Optional: **Authentication, Policies**, set minimum password length to 10 (the site already requires 10).

## 3. Google

1. Google Cloud console, create a project, **APIs & Services, OAuth consent screen** (External), add your app name and `hello@oppvault.app`.
2. **Credentials, Create credentials, OAuth client ID**, type Web application.
3. **Authorised redirect URI:** `https://fsznoimnvntxkvvfqpng.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client Secret into Supabase, **Authentication, Sign In / Providers, Google**, switch it on.

## 4. LinkedIn

1. LinkedIn Developer portal, **Create app** (it needs a LinkedIn Page).
2. **Products:** request **Sign In with LinkedIn using OpenID Connect**.
3. **Auth** tab, **Authorized redirect URLs:** `https://fsznoimnvntxkvvfqpng.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret into Supabase, **Providers, LinkedIn (OIDC)**, switch it on.

## 5. X

1. X Developer portal, create a Project and App, enable **OAuth 2.0** (user authentication).
2. **Callback URI:** `https://fsznoimnvntxkvvfqpng.supabase.co/auth/v1/callback`
3. Copy the OAuth 2.0 Client ID and Client Secret into Supabase, **Providers, X / Twitter (OAuth 2.0)**, switch it on.
4. X does not always share a visitor's email. If sign-in with X fails for that reason, hide the X button (see below) until it is sorted.

## 6. Show only the buttons that are ready

In Vercel (Preview, branch `platform`) set `NEXT_PUBLIC_AUTH_PROVIDERS` to the ones that work, for example `google`, then redeploy. Unset shows all three. A button for a provider that is not switched on shows a friendly "not switched on yet" message.

## 7. Vercel variables

Already set for the platform preview: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (used only by "Delete my account"). When you launch, add the same three to Production.

## How it behaves

- Visitors can browse without an account. The heart on a card asks them to sign in, then saves that opportunity for them.
- **My saved** lists their saves, newest first. Sample listings cannot be saved.
- They can sign out, reset a forgotten password, or delete their account and saved list for good.
- Passwords are handled by Supabase Auth and never stored by OppVault code. Sessions are HttpOnly cookies.
- The privacy notice should mention accounts: email, optional name, the sign-in provider used, and the saved list (note sent to Agent 7).
