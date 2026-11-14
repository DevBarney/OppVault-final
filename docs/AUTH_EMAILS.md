# Sign-in emails: setup checklist

The confirmation and password-reset emails are sent by Supabase. Out of the box they come from a shared address, look plain, and are limited to a handful per hour, which is not good enough for launch. Do these once in the Supabase dashboard.

## 1. Send from OppVault (SMTP)

Authentication, then Emails, then SMTP Settings. Switch on custom SMTP and use the Resend details:

- Host: `smtp.resend.com`, port `465`
- Username: `resend`
- Password: a Resend API key (enter it in Supabase yourself; never paste it into chat or the repo)
- Sender: an address on the verified domain, for example `accounts@oppvault.app`, sender name `OppVault`

Then Authentication, then Rate Limits: raise "emails sent per hour" to match your expected sign-ups.

## 2. Use the branded templates

Authentication, then Emails, then Templates. Paste the HTML from `supabase/email-templates/` and set the subject:

| Template | File | Subject |
| --- | --- | --- |
| Confirm sign up | `confirm-signup.html` | Confirm your OppVault email address |
| Reset password | `reset-password.html` | Choose a new password for OppVault |

Both use `{{ .ConfirmationURL }}`, which Supabase fills in.

## 3. URLs

Authentication, then URL Configuration:

- Site URL: `https://oppvault.app`
- Redirect URLs: `https://oppvault.app/**` and `https://www.oppvault.app/**`

## 4. Sessions

Authentication, then Sessions: keep the access-token lifetime at one hour or less.

## What the site already does

- Confirmation and reset links are sent again from the "Check your email" screen, with a 45 second wait and a server-side rate limit.
- Signing in with an unconfirmed address offers "Send the link again".
- Reset and resend answer identically whether or not an account exists, so they cannot be used to find out who has one.
