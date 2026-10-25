# OppVault preview landing page

A single-page Next.js site (App Router, TypeScript) where people can subscribe to OppVault updates by email
and join the WhatsApp community. It is built to go live **before** the main OppVault product, as its own small
project, and to be easy to retire or fold into the main app later.

- Brand: Poppins (bundled, so no calls to Google Fonts), navy / royal / sky / teal, gold for "opportunity" moments.
- No database and no analytics. Sign-ups go straight to the email service you choose.
- Pages: `/` (the landing page) and `/privacy` (short privacy notice).

## Run it on your computer

Needs Node 20.9 or newer.

```bash
npm install
cp .env.example .env.local     # then fill in the values (see below)
npm run dev                    # http://localhost:3000
```

With no email service configured, sign-ups in development are only logged to the terminal, so you can try the form
straight away. In production the form says sign-ups are not open yet until a service is configured, so nobody is
told they subscribed when they did not.

## Settings you need to fill in

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_WHATSAPP_URL` | Optional. The community link already defaults to `https://chat.whatsapp.com/EvaSDdZLs1VEK7fSP7zzr1` (set in `lib/config.ts`); set this only to use a different one. |
| `NEXT_PUBLIC_SITE_URL` | The address the site lives at, for share previews. Defaults to `https://oppvault.app`. |
| `EMAIL_PROVIDER` | Optional. `webhook`, `buttondown` or `mailchimp`. If unset, the first one with its variables filled in is used. |

Choose **one** way to receive sign-ups:

- **Webhook** (Zapier, Make, n8n, a Google Apps Script that writes to a Sheet, your own API): set
  `NEWSLETTER_WEBHOOK_URL`, and optionally `NEWSLETTER_WEBHOOK_SECRET`. Each sign-up is sent as JSON:
  `{ "email", "source", "site", "subscribedAt" }`. This is the most flexible option if your email automation is still being decided.
- **Buttondown**: set `BUTTONDOWN_API_KEY`.
- **Mailchimp**: set `MAILCHIMP_API_KEY` (it ends in `-us21` or similar) and `MAILCHIMP_LIST_ID`. New contacts are
  added as "pending", so Mailchimp sends them a confirmation email. Set `NEWSLETTER_DOUBLE_OPT_IN=false` only if you have
  turned that off, so the page's wording matches.

## Put it online (Vercel)

1. Push this folder to a GitHub repository.
2. In Vercel choose **Add New > Project**, import the repository, and keep the defaults.
3. Under **Settings > Environment Variables** add the variables above, then redeploy.
4. Under **Settings > Domains** add `oppvault.app` (or a subdomain such as `join.oppvault.app` if the root domain is
   saved for the main product) and follow Vercel's DNS instructions.

Any host that runs Next.js works. The `/api/subscribe` route needs a server runtime, so a plain static export will not
work without changes.

## Tracking where sign-ups come from

Add `?utm_source=...` (or `?ref=...`) to the links you post, for example `https://oppvault.app/?utm_source=instagram_bio`.
The tag is sent with each sign-up (webhook: `source`; Mailchimp: a `src-...` tag; Buttondown: metadata).

## Editing the page

- Wording for the "what we plan to bring together" list and the three steps: the top of `app/page.tsx`.
- Contact details and the tagline: `lib/config.ts`.
- Colours and spacing: `app/globals.css` (brand colours are the variables at the top).
- Privacy notice: `app/privacy/page.tsx`.

## Before you announce it

- [ ] Add an email service (the WhatsApp link is already set), then submit a real test address and check it arrives.
- [ ] Read `/privacy` and have someone you trust review it. It is a plain-language draft, not legal advice.
- [ ] Check the share preview (paste the link into WhatsApp or X). The image is `public/og.png`.
- [ ] The Mailchimp, Buttondown and webhook connections were written to those services' documented APIs and tested
      against a stand-in server, not against live accounts. Test with a real sign-up first.

## What was tested

The page, form and sign-up API were exercised in a real browser against a stand-in email service: invalid and valid
addresses, the hidden spam field, rate limiting, provider errors, duplicate sign-ups, keyboard use, and layouts from
320px to 1920px wide. `next build` itself was not run where this was written, so run `npm run build` once on your computer
before deploying.

## Logos and motion

- Logos are your supplied artwork, trimmed and resized only: `public/logo-horizontal.png` (nav, footer), `public/logo-stacked.png` (hero), `public/mark.png`, `app/icon.png`, `app/apple-icon.png`, `public/og.png`.
- The header is `components/Nav.tsx`: sticky, shrinks on scroll, scroll-progress line, active-section highlight, mobile menu.
- Animations are triggered by the visitor (scrolling, hovering, pressing, submitting). They use only transform and opacity, and all switch off when the device asks for reduced motion. Edit them in the "Motion and interaction" section of `app/globals.css`.

## Newsletter with Resend

Set `RESEND_API_KEY` (full access) and `RESEND_SEGMENT_ID` in Vercel. New sign-ups become Resend contacts in that segment, ready for broadcasts. Repeat sign-ups show the same success message and are not emailed twice. To send a welcome email as well, verify your domain in Resend, then set `RESEND_FROM` (for example `OppVault <hello@oppvault.app>`). Until then, leave `RESEND_FROM` unset: sign-ups still work, just without the welcome email.
