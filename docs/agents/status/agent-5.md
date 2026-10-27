# Agent 5 - Events & Student Offers - status

Only Agent 5 edits this file. Keep it short and honest; newest entry at the top.

**Current state:** In progress. Pages, components, styles and sample rows are built. Student offers CSV is converted and passes `check:csv`. Still waiting for the raw events CSV.
**Last updated:** 2026-10-27
**Build check on my last push:** `npm run typecheck` and `npm run build` both pass locally. Not pushed yet: this session has no GitHub credentials, so the commit is local.

## Log

- 2026-10-27: Built `/events` and `/student-offers` (list and `[slug]` detail), with their own cards, styles and sample rows.
  - Events: upcoming first, soonest date first, undated last. Past events come after a "Past events" divider and carry a "Past event" badge. A "Plan your attendance" block (travel, visa, joining online, funding) changes with the format: in person, online, hybrid or unknown. It is general advice only and never states a fact about a specific event. Funded places get their own line. It is hidden on past events.
  - Student offers: what the offer is, who can use it, what you get, how to verify student status (steps taken from `how_to_apply`), and a "Check before you buy" note on every offer. Every offer page and the list say OppVault does not sell, test or endorse offers. An ended offer shows an "ended" note and hides its coupon code. Ended offers are left out of the list.
  - Samples: 7 sample events (including one undated, one hybrid, one past) and 5 sample offers (including one with a code, one ended). All are marked sample, have no official link, and the codes are not real.
  - Checked by running the built site: list order, divider, filters, noindex on samples, 404s, sitemap has no sample entries, other routes still return 200.

## CSV mapping

Student offers (2026-10-27): `content/csv/convert-student-offers.py` turns Barnabas's snapshot (`content/csv/source/student-offers-original.csv`, 596 rows) into `content/csv/student-offers.csv` (538 rows, 511 published, 27 drafts). `npm run check:csv` reports 0 problems. 58 rows are left out: 43 with no link, 10 with referral/affiliate/tracking codes, 3 behind a third-party redirect, 2 exact duplicates. The full mapping, every held-out row and five open questions are in `content/csv/student-offers-notes.md`. The script is re-runnable: ids stay the same, so a new snapshot updates listings.

Events: not started. No events CSV yet.

## Assumptions to check

- Events: the page treats `deadline` as the **event date**. It counts "In N days" and labels a past date "Past event". If Barnabas's events CSV holds a registration closing date instead, the labels will be wrong for those rows. I will say which it is in `content/csv/events-notes.md` once I see the file.
- Student offers: `deadline` is treated as the date the offer ends. An empty date shows "No end date listed", not "ongoing".
- `how_to_apply` is stored as one string by the importer, with steps separated by `|` or new lines. The student-offer page splits it into numbered steps itself.

## Handoff notes for other agents

- Agent 1: two messages in your inbox. One about card wording ("Closes in N days" on event and offer cards outside my pages). One asking for a category field for student offers (`category_main` has 15 values and 538 rows would benefit from a filter).
- Agent 7: if the Home page shows events or offers in a shared card, "Closes in N days" is the wrong wording for an event. `components/events/EventCard.tsx` and `components/student-offers/OfferCard.tsx` use the right wording and can be imported.

## Open questions

- For Barnabas: please attach the raw events CSV.
- For Barnabas: five questions at the end of `content/csv/student-offers-notes.md` (referral links, 43 rows with no link, "Credit" funding, a last-checked date, discount-site links).
- For Barnabas: in the events file, is the date column the event date or the registration closing date?
