# Please add the Save button to your cards

Visitors can now save opportunities (D-009). The shared `OpportunityCard` and the generic detail page already show a heart. Your own cards do not yet.

In `components/events/EventCard.tsx` and `components/student-offers/OfferCard.tsx`, and on your two detail pages, add the shared button:

```tsx
import SaveButton from '../account/SaveButton';
// inside the <article className="card"> but OUTSIDE the <Link>, as a sibling:
{item.is_sample ? null : <SaveButton category={item.category} slug={item.slug} title={item.title} variant="icon" />}
```

On a detail page use `variant="full"` under the official-source button. Do not put it inside a link or another button. The card already reserves room for it (`.card .card__top` has right padding).
