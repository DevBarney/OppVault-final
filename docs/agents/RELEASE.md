# Release notes (draft)

Written by Agent 1. Status as of 2026-11-11. This is a draft: it is finished when every area on the board is Done.

## Ready
- Home, About, Terms, Privacy, Search, Help and contact, Reviews, Submit.
- Sign in and create account: email and password, Google, GitHub, LinkedIn, X. My saved and I applied lists.
- All six category pages with filters, paging, detail pages, save, share and calendar links.
- Admin at `/admin`: CSV import (up to 10 MB, sent in parts), single listing form, manage list with select all, delete and hide.
- Student offers have a Topic filter and an offer type (free, free trial, discount, credit).
- Live content in the database: 15 scholarships, 125 fellowships, 17 grants, 761 courses, 49 events, 553 student offers.
- Speed: server functions in Dublin, cookie notice, search and analytics load after the page, below-the-fold home sections laid out on demand.
- Accessibility checks on the home, About and list pages: labels, headings, focus, reduced motion.

## Checked here
- Typecheck on the changed files. Importer date and column rules tested on sample input.
- Live preview: sitemap has real pages only and no double slashes, one `h1` per page, titles and descriptions present, no em dashes in the pages checked.

## Not checked, needs a person
- `next build` cannot run in the working environment. The Vercel preview build is the proof. Two early builds on 2026-11-11 failed and the next one passed.
- Colour contrast over the dark hero and gradient areas. Run Lighthouse in Chrome on the preview.
- Sign in, Terms and admin pages under a screen reader and keyboard only.
- Widths 320, 375, 768 and 1280 on every page.
- Copy review: British spelling, no guarantees, no invented facts. Listing text comes from CSV files and has not been read line by line.

## Must happen before launch (owner: Barnabas)
- Production environment variables: `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` (Sensitive), and `NEXT_PUBLIC_SITE_URL=https://oppvault.app`.
- Resend as the email sender in Supabase, so email sign-up is fast and reliable.
- Delete the test review row.
- LinkedIn app approval. X may not return an email address.
- Agent 5: events CSV (is the date the event date or the registration deadline) and the three redirect rows.
- Legal review of Terms and Privacy.
- Decide when `platform` is merged to `main`. After the merge, request Google sign-in branding verification (needs live `/privacy`, `/terms` and Search Console proof).

## Later
Deadline reminder emails, structured data for search, a social image per listing, a custom sign-in address on the oppvault.app domain.
