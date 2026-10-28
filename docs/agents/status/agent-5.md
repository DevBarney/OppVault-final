# Agent 5 - Events & Student Offers - status

Only Agent 5 edits this file. Keep it short and honest; newest entry at the top.

**Current state:** In progress. Pages, components, styles and sample rows are built. Student offers CSV is converted and passes `check:csv`. Still waiting for the raw events CSV.
**Last updated:** 2026-10-27
**Build check on my last push:** `npm run typecheck` and `npm run build` both pass locally. Not pushed yet: this session has no GitHub credentials, so the commit is local.

## Log

- 2026-10-27: At Barnabas's direct request, added a form to enter one listing by hand and an edit-before-approve step for visitor suggestions. This touched Agent 1's admin files; details are in the message in `docs/agents/inbox/to-agent-1/`. Tested with a stubbed database (14 cases: auth, new, replace warning, duplicate-link warning, address clash, drafts, approving a suggestion, approving twice, unknown suggestion, database not connected), plus a real build and a signed-in render of `/admin`. Nothing was written to the live Supabase project.
- 2026-10-27: Built `/events` and `/student-offers` (list and `[slug]` detail), with their own cards, styles and sample rows.
  - Events: upcoming first, soonest date first, undated last. Past events come after a "Past events" divider and carry a "Past event" badge. A "Plan your attendance" block (travel, visa, joining online, funding) changes with the format: in person, online, hybrid or unknown. It is general advice only and never states a fact about a specific event. Funded places get their own line. It is hidden on past events.
  - Student offers: what the offer is, who can use it, what you get, how to verify student status (steps taken from `how_to_apply`), and a "Check before you buy" note on every offer. Every offer page and the list say OppVault does not sell, test or endorse offers. An ended offer shows an "ended" note and hides its coupon code. Ended offers are left out of the list.
  - Samples: 7 sample events (including one undated, one hybrid, one past) and 5 sample offers (including one with a code, one ended). All are marked sample, have no official link, and the codes are not real.
  - Checked by running the built site: list order, divider, filters, noindex on samples, 404s, sitemap has no sample entries, other routes still return 200.

## CSV mapping

Student offers (2026-10-27): `content/csv/convert-student-offers.py` turns Barnabas's snapshot (`content/csv/source/student-offers-original.csv`, 596 rows, taken 2026-10-27T02:10:28Z as he stated) into `content/csv/student-offers.csv` (543 rows, 513 published, 30 drafts). `npm run check:csv` reports 0 problems. **Rule from Barnabas: always leave URLs exactly as they are.** Every `link` equals the snapshot's `claim_url` byte for byte (checked). 53 rows are left out: 43 with no link (listed in `student-offers-missing-links.csv` for manual curation), 8 Instagram pages, 2 exact duplicates. 3 workers.dev redirect rows are in as drafts with the link untouched. Links with referral or tracking parameters are listed in the notes, not changed. His other decisions are at the end of `content/csv/student-offers-notes.md` and in the script header. The script is re-runnable: ids stay the same, so a new snapshot updates listings. Run it with `--snapshot-at <time>`.

Events: not started. No events CSV yet.

## Assumptions to check

- Events: the page treats `deadline` as the **event date**. It counts "In N days" and labels a past date "Past event". If Barnabas's events CSV holds a registration closing date instead, the labels will be wrong for those rows. I will say which it is in `content/csv/events-notes.md` once I see the file.
- Student offers: `deadline` is treated as the date the offer ends. An empty date shows "No end date listed", not "ongoing".
- `how_to_apply` is stored as one string by the importer, with steps separated by `|` or new lines. The student-offer page splits it into numbered steps itself.

## Handoff notes for other agents

- Agent 1: two messages in your inbox. One about card wording ("Closes in N days" on event and offer cards outside my pages). One asking for two new fields for student offers: `topic` (from `category_main`) and `offer_type` (free, free_trial, discount, credit).
- Agent 7: if the Home page shows events or offers in a shared card, "Closes in N days" is the wrong wording for an event. `components/events/EventCard.tsx` and `components/student-offers/OfferCard.tsx` use the right wording and can be imported.

## Open questions

- For Barnabas: please attach the raw events CSV.
- For Barnabas: 3 redirect rows (Apple Education, scite, Taskade) are drafts. Open them to see where they go, then publish them or tell me to drop them.
- For Barnabas: in the events file, is the date column the event date or the registration closing date?
