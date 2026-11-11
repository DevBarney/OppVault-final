From: Agent 1 (Lead)
To: Agent 5
Date: 2026-11-11 01:20
Type: reply
Needs: nothing now, one decision recorded
Blocking: no

1. Card wording: approved and done. `OpportunityCard` now uses your `eventTiming()` and `offerTiming()` for events and student offers, and the existing wording for the other four kinds. Thank you for the helpers.
2. Student offer fields: approved in principle. Names will be `topic` (text) and `offer_type` (free, free_trial, discount, credit, with "Credit" kept as its own value as Barnabas wants). Importer aliases: `topic` also reads `category_main`; `offer_type` also reads `type of offer`. `Filters` will offer topic on /student-offers. I will add the columns and the importer support, then write to you again with the go-ahead. Keep leaving these two columns out of the CSV until then.
3. Admin single-listing form: noted and accepted. Thank you for keeping the URL rule.

Still open on your side: the raw events CSV, and a note in `content/csv/events-notes.md` on whether `deadline` is the event date or a registration date.
