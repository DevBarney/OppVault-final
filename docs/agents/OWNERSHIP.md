# Ownership map

One owner per file. **You may only edit files your agent owns.** If you need a change anywhere else, write a request (see `AGENTS.md`, section "Asking for changes").

| Agent | Role | Owns |
|---|---|---|
| **Agent 1** | Lead & Foundation | `app/layout.tsx`<br>`app/globals.css`<br>app/[category]/** (generic list and detail templates)<br>`app/api/**`<br>`app/admin/**`, `components/admin/**`, `lib/admin/**` (the CSV admin area)<br>components/*.tsx (shared: Nav, Footer, NewsletterBand, SubscribeForm, WhatsAppButton, Interactions, Reveal, Icons, PageHeader, Pagination, Filters, OpportunityCard)<br>`lib/data.ts, lib/types.ts, lib/categories.ts, lib/config.ts, lib/dates.ts, lib/subscribe.ts, lib/rateLimit.ts, lib/seed/index.ts, lib/seed/_shared.ts`<br>`supabase/schema.sql`<br>`package.json, next.config.mjs, tsconfig.json, .env.example, README.md`<br>`docs/agents/BOARD.md, DECISIONS.md and everything in docs/agents/ not listed for another agent` |
| **Agent 2** | Scholarships | app/scholarships/** (create it)<br>`components/scholarships/**`<br>`lib/seed/scholarships.ts`<br>`content/csv/scholarships.csv`<br>`docs/agents/status/agent-2.md` |
| **Agent 3** | Fellowships & Grants | app/fellowships/** and app/grants/** (create them)<br>`components/fellowships/**, components/grants/**`<br>`lib/seed/fellowships.ts, lib/seed/grants.ts`<br>`content/csv/fellowships.csv, content/csv/grants.csv`<br>`docs/agents/status/agent-3.md` |
| **Agent 4** | Courses | app/courses/** (create it)<br>`components/courses/**`<br>`lib/seed/courses.ts`<br>`content/csv/courses.csv`<br>`docs/agents/status/agent-4.md` |
| **Agent 5** | Events & Student Offers | app/events/** and app/student-offers/** (create them)<br>`components/events/**, components/student-offers/**`<br>`lib/seed/events.ts, lib/seed/student-offers.ts`<br>`content/csv/events.csv, content/csv/student-offers.csv`<br>`docs/agents/status/agent-5.md` |
| **Agent 6** | Blog | app/blog/** (existing; you own it now)<br>app/feed.xml/route.ts (create: RSS feed)<br>`components/blog/**`<br>`components/Prose.tsx`<br>`lib/seed/posts.ts`<br>`content/csv/posts.csv`<br>`docs/agents/status/agent-6.md` |
| **Agent 7** | Home, About & Site Pages | `app/page.tsx`<br>`app/about/**`<br>`app/search/**`<br>`app/privacy/**`<br>app/terms/** and app/contact/** (create them)<br>app/sitemap.ts, app/robots.ts, app/opengraph-image.* (create if useful)<br>`components/home/**, components/about/**`<br>`docs/agents/status/agent-7.md` |

## Team files with a built-in exception

`docs/agents/BOARD.md` and `docs/agents/DECISIONS.md` belong to Agent 1, but every agent may edit **its own section** of the board and **append** to the decisions log. Nothing else in `docs/agents/` may be edited by a non-owner, except the owner's own status file and inbox messages (new files only).

## Shared files that nobody edits directly except the owner

`app/globals.css` is owned by Agent 1. Everyone else puts styles in their own CSS file and imports it from their own page or component. In the Next.js App Router a CSS file can be imported from any component, for example `import './scholarships.css';` at the top of `app/scholarships/page.tsx`.

## New files

A file nobody owns yet belongs to whoever creates it, as long as it sits inside that agent's folders above. Anything outside those folders needs a request to Agent 1 first.
