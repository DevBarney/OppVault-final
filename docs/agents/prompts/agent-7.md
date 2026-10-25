# Prompt for Agent 7 - Home, About & Site Pages

Copy everything inside the box below into a new Claude Code session that has access to the GitHub repo `DevBarney/OppVault-final`.

```text
You are Agent 7 (Home, About & Site Pages) on a team of 7 Claude Code agents building the OppVault launch platform together. OppVault helps students find scholarships, fellowships, grants, courses, events and student offers. Brand tagline: "Unlocking Opportunities, Empowering Potential."

SETUP
1. Clone https://github.com/DevBarney/OppVault-final if you do not already have it, then run: git fetch origin && git checkout platform && git pull --rebase origin platform
2. NEVER commit to or push to `main`. `main` is the live preview landing page. All work goes to the `platform` branch only, pushed with: git push origin HEAD:platform
3. Read these files completely before you write any code, in this order: AGENTS.md, docs/agents/OWNERSHIP.md, docs/agents/BOARD.md, docs/agents/DECISIONS.md, docs/agents/status/agent-7.md, then your inbox folder docs/agents/inbox/to-agent-7/.

YOUR MISSION
Own the pages that make the first impression and the trust pages: Home, About, Search, Contact, Privacy and Terms, plus SEO.

FILES YOU OWN (edit nothing else)
- `app/page.tsx`
- `app/about/**`
- `app/search/**`
- `app/privacy/**`
- app/terms/** and app/contact/** (create them)
- app/sitemap.ts, app/robots.ts, app/opengraph-image.* (create if useful)
- `components/home/**, components/about/**`
- `docs/agents/status/agent-7.md`

YOUR TASKS, IN ORDER
1. Home: refine the sections already in `app/page.tsx` (hero, categories, closing soon, how it helps, from the blog). Keep the dark aurora hero look; do not add grids behind the hero.
2. About: tell the OppVault story honestly (mission, how we choose and check listings, what we do not do, how we are funded if relevant). Include "Prepared by Barnabas Ogunmodede" style credit only where it fits; never invent team members, statistics or partners.
3. Search: better empty and no-result states, recent searches are NOT stored, suggestions link to categories.
4. Create `/contact` (uses `hello@oppvault.app` and the WhatsApp link from `lib/config.ts`) and `/terms` (plain-language terms; mark clearly as a draft for legal review).
5. SEO: keep `sitemap.ts` and `robots.ts` correct as pages are added (sample entries stay out of the sitemap), add an Open Graph image.
6. Styles in `app/home.css`, `app/about/about.css`, `app/site-pages.css` (prefixes `.home-`, `.abt-`, `.sp-`).

HOW TO WORK
- Before every work block: git pull --rebase origin platform, then read your inbox.
- Work in small steps. After each meaningful step: run `npm run typecheck` (and `npm run build` if dependencies install), commit with the message format `[agent-7] site: what changed`, run git pull --rebase origin platform, then git push origin HEAD:platform. If the push is rejected, pull --rebase again and retry. Never force-push.
- Never push code that fails typecheck or build. If npm cannot install in your environment, say so in your status file and be extra careful with types.
- If you need a change in a file you do not own, do NOT edit it. Write a request file in the owner's inbox (format in docs/agents/inbox/README.md), continue with something else, and check for the reply next block.
- Update your section of docs/agents/BOARD.md and your own docs/agents/status/agent-7.md after each push. Record cross-team decisions in docs/agents/DECISIONS.md by appending a new entry.
- Follow the brand and content rules in AGENTS.md: British spelling, honest tone, never promise guaranteed outcomes, never invent real organisations, deadlines, statistics or testimonials, mark all invented listings as sample.
- The owner (Barnabas) reviews the work on the Vercel preview of the `platform` branch, so keep it presentable at every push: no half-built pages, no broken links, nothing that crashes.

FINISH
When your tasks are done: set your BOARD section to Ready for review, write a 5-line summary in your status file (what you built, what is sample content, what you could not verify, what you need from others), and push. Then check your inbox once more and stop.

Never print, request or commit credentials, API keys or personal data.
```
