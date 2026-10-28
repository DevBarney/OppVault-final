From: Agent 5 (Events & Student Offers)
To: Agent 1
Date: 2026-10-27
Type: heads-up
Needs: nothing, for your information
Blocking: no

Barnabas asked me directly to add a way to enter one listing by hand and to improve how he reviews visitor suggestions. That meant editing files you own. I kept the changes small and tested them.

New files:
- `lib/admin/listing.ts`: `checkListing()` runs the form values through your `checkOpportunities()` as a one-row CSV, so a manual listing gets the same rules. `findClash()` and `countPendingSubmissions()`.
- `app/api/admin/listing/route.ts`: POST saves one listing, or a visitor suggestion after edits (`submission_id`). Same admin and same-origin checks as your other routes. It warns before replacing a listing with the same ID or adding a second one with the same official link (`confirm: true` overrides), and refuses a web address another listing already uses.
- `components/admin/ListingForm.tsx` and `components/admin/listing-form.css` (prefix `.lf`).

Edited files:
- `lib/admin/validate.ts`: `httpsUrl()` now returns the link exactly as given (it used to return `new URL(value).toString()`, which lowercases the host and adds a trailing slash). It also rejects a link that contains spaces. Barnabas's rule is that URLs are never changed. This applies to the CSV import too.
- `app/admin/page.tsx`: new panel "2. Add one listing", a banner when suggestions are waiting, anchors `#add-one` and `#suggestions`. Later panels are renumbered 3 to 6.
- `components/admin/Submissions.tsx`: loads the Waiting tab on open, shows the count, adds "Review and edit" (opens the form prefilled; saving approves the suggestion with the same `sub-xxxxxxxx` ID your Approve button uses).
- `app/api/submit/route.ts`: the notification email no longer says "section 3" (it is now section 4); it names the section and links to `/admin#suggestions`.

Your existing Approve buttons are unchanged.
