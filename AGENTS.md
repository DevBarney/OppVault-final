# OppVault platform: team rules for AI agents

You are one of seven Claude Code agents building the OppVault launch platform in the **same repository** (`DevBarney/OppVault-final`) at the same time. This file is the rulebook. Read it fully before you touch anything.

## 1. The golden rules

1. **Branch:** work only on `platform`. Never commit, push, merge or open a pull request into `main`. `main` is the live preview landing page.
2. **Ownership:** edit only files your agent owns (`docs/agents/OWNERSHIP.md`). Everything else is read-only for you.
3. **Communicate in files:** the Markdown files under `docs/agents/` are how the team talks. Nothing important lives only in your head or in chat.
4. **Never break the build:** do not push anything that fails `npm run typecheck` or `npm run build`.
5. **No secrets:** never print, request or commit credentials, keys or personal data. Environment variables are set in Vercel by Barnabas.
6. **Honesty:** OppVault is a trust product. No invented real organisations, deadlines, statistics, testimonials, rankings or guarantees.

## 2. The project in 60 seconds

- Next.js App Router (TypeScript, React 19), plain CSS, Poppins font. No UI library. No database SDK.
- Data comes from Supabase over its REST API (`lib/data.ts`). With no Supabase env vars the site shows clearly marked **Sample** content from `lib/seed/`. Sample entries are `noindex` and excluded from the sitemap.
- Categories live in `lib/categories.ts`: scholarships, fellowships, grants, courses, events, student-offers.
- `app/[category]/page.tsx` and `app/[category]/[slug]/page.tsx` are the generic list and detail templates. A real folder such as `app/courses/` overrides the generic route for that category (static folders win over dynamic ones), so the URLs stay `/courses` and `/courses/<slug>`.
- Sample data is split per category in `lib/seed/` so agents never edit the same file.
- Content is added through the admin page (`/admin`, owned by Agent 1): Barnabas uploads CSV files that are saved to Supabase. Listings can carry `image_url` (thumbnail) and `coupon_code`, which the shared card and detail templates already show. Agents prepare CSVs in `content/csv/`, they do not write to the database.
- Newsletter sign-up posts to `app/api/subscribe` (Resend). The WhatsApp community link is in `lib/config.ts`.

## 3. Brand and content rules

- Colours (CSS variables already defined in `app/globals.css`): navy `#04106B`, royal `#0332B3`, sky `#0DB4F8`, teal `#1BDBE3`, gold `#FBB800`. Gold is only for "opportunity" moments (a closing-soon flag, a featured star). Do not add new brand colours.
- Font: Poppins, already loaded. Do not add other fonts.
- Voice: warm, clear, honest. British spelling (programme, organisation, colour). No hype, no "guaranteed".
- Tagline: "Unlocking Opportunities, Empowering Potential."
- Contact: hello@oppvault.app. Social: Instagram `oppvault_official`, X `@oppvault`.
- Never copy text or images from other websites. Write original copy and link to official sources instead.
- A real listing requires an official `source_url`, accurate dates, and a note of when it was last checked. If you cannot verify it, it is not a real listing: keep it a marked sample.

## 4. Design and code rules

- Reuse the shared components (`PageHeader`, `OpportunityCard`, `Filters`, `Pagination`, `Reveal`) rather than copying them. If one lacks something, ask Agent 1.
- Your styles go in **your own CSS file** with your class prefix (see `OWNERSHIP.md` and your prompt). Never edit `app/globals.css`. In the App Router you can import a CSS file from any component, for example `import './courses.css';`.
- Motion: only `transform` and `opacity`. Respect `prefers-reduced-motion`. Wrap hover effects in `@media (hover: hover)`.
- Mobile first. Check 320px, 375px, 768px and 1280px widths. No horizontal scrolling, tap targets at least 44px.
- Accessibility: semantic headings (one `h1` per page), visible focus states, alt text, text contrast of at least 4.5:1.
- Every page needs `metadata` (title and description). Detail pages for sample content must stay `noindex`.
- TypeScript strict. No `any`. No new dependencies without a request to Agent 1.
- `params` and `searchParams` are Promises in this Next.js version: `await` them.
- Do not call Supabase directly from pages. Use the functions in `lib/data.ts`.

## 5. Git workflow (follow exactly)

```bash
# once
git clone https://github.com/DevBarney/OppVault-final.git && cd OppVault-final
git fetch origin && git checkout platform

# before every work block
git pull --rebase origin platform

# after each small step
npm run typecheck            # and npm run build whenever you can
git add <only your own files>
git commit -m "[agent-N] area: what changed"
git pull --rebase origin platform
git push origin HEAD:platform
```

- Stage only your own files by path. Never `git add .` or `git add -A`.
- If `git push` is rejected: `git pull --rebase origin platform`, then push again. Never `--force`.
- If a rebase reports a conflict in a file you own, resolve it. If it is in a file you do not own, you edited something you should not have: `git rebase --abort`, undo your change to that file, and send a request instead.
- Commit small and often (at least after each finished task). Big, rare pushes cause conflicts.
- Commit messages: `[agent-N] area: short summary`, for example `[agent-4] courses: add learning path strip`.

## 6. Asking for changes (the inbox)

Need a change in a file you do not own? Write one file in the owner's inbox:
`docs/agents/inbox/to-agent-<owner>/<YYYYMMDD-HHMM>-from-agent-<you>-<topic>.md`.
Template and rules: `docs/agents/inbox/README.md`.

- Read your own inbox at the start of every work block.
- Do not sit idle waiting: switch to another task and check back.
- Agent 1 decides on changes to shared files. If a request is declined, Agent 1 explains why in a reply.

## 7. Status and board

- `docs/agents/status/agent-N.md`: your own log. Update after every push.
- `docs/agents/BOARD.md`: tick your tasks and set your Status line (edit only your section).
- `docs/agents/DECISIONS.md`: append-only record of decisions that affect others.

## 8. If the build is broken on `platform`

Barnabas watches the preview. A broken build blocks everyone.

1. Check whether your last push caused it. If so, fix or revert it immediately (`git revert <sha>`) and push.
2. If someone else caused it, write a `heads-up` in their inbox **and** Agent 1's inbox with the error text.
3. If it stays broken for more than one work block, Agent 1 may make the minimal fix in the other agent's file and records it in `DECISIONS.md`.

## 9. Definition of done for an area

- Typecheck and build pass.
- List and detail pages work at 320, 375, 768 and 1280px, with and without results (empty state checked).
- No broken links. Outbound links to official sources open in a new tab with `rel="noopener noreferrer"`.
- Copy follows the brand and honesty rules. No invented facts presented as real.
- Your BOARD section says `Ready for review` and your status file has the 5-line summary.
