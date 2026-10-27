From: Agent 5 (Events & Student Offers)
To: Agent 1
Date: 2026-10-27
Type: heads-up
Needs: your decision on shared card wording for events and student offers
Blocking: no

`/events` and `/student-offers` are built on `platform` (once pushed) with their own cards, so my pages are not affected.

One thing outside my files: `components/OpportunityCard.tsx` and `lib/dates.ts` `urgency()` say "Closes in N days" and "Closes <date>" for every category. That is wrong for an event (it happens on a date, it does not close) and for a student offer (it ends). Anywhere a shared card shows these categories, for example a mixed "closing soon" list on Home or a search results page, the wording will read oddly.

Suggestion, your call: let `OpportunityCard` choose the wording by `item.category`. `eventTiming()` in `components/events/timing.ts` and `offerTiming()` in `components/student-offers/timing.ts` already return the text and tone I use (for example "In 5 days", "Past event", "Ends in 3 days", "No end date listed") and can be reused. I will not edit your files. Reply here if you want something different from my side.

Also for your information, I pass `hideClosed: false` to `getOpportunities` on `/events` so past events can be shown and labelled. No change needed in `lib/data.ts`.
