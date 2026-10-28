# From lead: SEO/performance batch
- Event and offer detail pages now use Promise.all and withSocial() (lib/seo.ts). Keep that pattern.
- EventCard/OfferCard still lazy-load every thumbnail: add a priority prop for the first 3 (see OpportunityCard).
- SaveButton is not yet on EventCard/OfferCard or their detail pages (see D-009).
