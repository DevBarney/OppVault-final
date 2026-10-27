# Agent 5 - Events & Student Offers - status

Only Agent 5 edits this file. Keep it short and honest; newest entry at the top.

**Current state:** In progress. Pages, components, styles and sample rows are built. Waiting for the raw events and student-offers CSV files from Barnabas.
**Last updated:** 2026-10-27
**Build check on my last push:** `npm run typecheck` and `npm run build` both pass locally. Not pushed yet: this session has no GitHub credentials, so the commit is local.

## Log

- 2026-10-27: Built `/events` and `/student-offers` (list and `[slug]` detail), with their own cards, styles and sample rows.
  - Events: upcoming first, soonest date first, undated last. Past events come after a "Past events" divider and carry a "Past event" badge. A "Plan your attendance" block (travel, visa, joining online, funding) changes with the format: in person, online, hybrid or unknown. It is general advice only and never states a fact about a specific event. Funded places get their own line. It is hidden on past events.
  - Student offers: what the offer is, who can use it, what you get, how to verify student status (steps taken from `how_to_apply`), and a "Check before you buy" note on every offer. Every offer page and the list say OppVault does not sell, test or endorse offers. An ended offer shows an "ended" note and hides its coupon code. Ended offers are left out of the list.
  - Samples: 7 sample events (including one undated, one hybrid, one past) and 5 sample offers (including one with a code, one ended). All are marked sample, have no official link, and the codes are not real.
  - Checked by running the built site: list order, divider, filters, noindex on samples, 404s, sitemap has no sample entries, other routes still return 200.

## CSV mapping

Not started. No CSV has been attached to this session yet. Needed: the raw events file and the raw student-offers file. When they arrive I will follow `docs/agents/CSV-GUIDE.md` and record the column mapping here.

## Assumptions to check

- Events: the page treats `deadline` as the **event date**. It counts "In N days" and labels a past date "Past event". If Barnabas's events CSV holds a registration closing date instead, the labels will be wrong for those rows. I will say which it is in `content/csv/events-notes.md` once I see the file.
- Student offers: `deadline` is treated as the date the offer ends. An empty date shows "No end date listed", not "ongoing".
- `how_to_apply` is stored as one string by the importer, with steps separated by `|` or new lines. The student-offer page splits it into numbered steps itself.

## Handoff notes for other agents

- Agent 1: I wrote a heads-up about card wording ("Closes in N days" on event and offer cards outside my pages).
- Agent 7: if the Home page shows events or offers in a shared card, "Closes in N days" is the wrong wording for an event. `components/events/EventCard.tsx` and `components/student-offers/OfferCard.tsx` use the right wording and can be imported.

## Open questions

- For Barnabas: please attach the raw events CSV and student-offers CSV.
- For Barnabas: in the events file, is the date column the event date or the registration closing date?
