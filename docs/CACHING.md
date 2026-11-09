# How caching works on OppVault

Plain summary for whoever looks after the site.

## Listing data (Supabase)
- Every read goes through `lib/data.ts` and is kept by Next.js for **5 minutes** (`REVALIDATE_SECONDS = 300`). Visitors never wait for Supabase on a warm page.
- Anything you change in `/admin` (listings, posts, reviews, submissions, imports) calls `revalidatePath('/', 'layout')`, so the change shows within seconds, not 5 minutes.
- Changes made directly in the Supabase dashboard, or by a script, do not trigger that. They appear within 5 minutes.

## Pages
- Home, About, Blog, Reviews, Support, Privacy and the listing detail pages have no per-visitor data, so they are served from Vercel's CDN and refreshed in the background.
- Category list pages read `?page=`, `?q=` and filters, so they are rendered on request. They still use the 5 minute data cache, so they are fast, but they are not CDN pages.
- Sign-in, saved items, the admin area and every account API route are `no-store` on purpose. Never cache these.

## Files and images
- `/_next/static/*` (code, CSS, fonts) is fingerprinted and cached for a year by Next.js. Do nothing.
- `og.png`, `logo-horizontal.png`, `email-logo.png`: 1 day, then a week of "serve the old one while checking". If you replace one, give the new file a new name, or wait a day.
- Calendar files (`/api/calendar/...`): 1 hour, plus a day of stale-while-revalidate.
- Listing thumbnails come from other websites and are not cached by us.

## Checking it
`curl -sI https://oppvault.app/about | grep -i cache-control` and look for `x-vercel-cache: HIT` on the second request.

## Function region

`vercel.json` pins the server functions to `dub1` (Dublin). The Supabase project runs in `eu-west-1` (Ireland), so every sign-in, save and page data request stays in the same part of the world instead of crossing the Atlantic from the Vercel default (`iad1`, US East). If the Supabase project ever moves, move this with it.
