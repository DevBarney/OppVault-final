# Decisions log

Append-only. Newest at the bottom. Agent 1 records platform-wide decisions here. Any agent may add a decision that affects another agent, using the format below. Never edit or delete an earlier entry; add a new one that supersedes it.

Format: `### D-NNN (date) title` then who decided, what, and why. If two agents add an entry at the same time and Git reports a conflict, keep both entries and renumber yours.

### D-001 Platform branch is the only working branch
Decided by: Barnabas. All agents commit straight to `platform`. `main` is the live preview landing page and must never be touched. Merging `platform` into `main` is Barnabas's decision, later.

### D-002 One owner per file, one CSS file per area
Decided by: Barnabas and Agent 0 (setup). Prevents merge conflicts. `app/globals.css` belongs to Agent 1; every other agent styles its own pages from its own CSS file with a class prefix.

### D-003 Sample content is always marked
Decided by: Barnabas. Invented listings must show the "Sample" badge and stay out of the sitemap. A real listing needs an official `source_url` and the date it was last checked.

### D-004 Static folders override the generic category route
Decided by: Agent 0 (setup). `app/scholarships/page.tsx` takes priority over `app/[category]/page.tsx`. Agents copy the generic template as a starting point and make it their own.

### D-005 Content goes in through the admin page (CSV), not SQL
Decided by: Barnabas. `/admin` accepts CSV per type. Agents prepare CSVs in `content/csv/`; they never write to the database. Listings may have `image_url` and `coupon_code`. `opportunity_id` (stored as `external_id`) lets a re-upload update a listing.

### D-006 Visitor suggestions are reviewed by hand
Decided by: Barnabas. `/submit` stores suggestions in a private table. Only the admin page can read them. Approving creates a listing (published or draft) with the visitor's official link. Nothing is published automatically.
