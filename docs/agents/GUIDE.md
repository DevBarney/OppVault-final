# Guide for Barnabas: running 7 Claude Code accounts as one team

This is for you, not for the agents. Follow it top to bottom once.

## 1. What you are setting up

Seven Claude Code sessions, each with a different job, all working on the **`platform` branch** of `DevBarney/OppVault-final`. They never touch `main` (your preview landing page). They coordinate through Markdown files in `docs/agents/`, which they read and write like a shared notice board.

| Agent | Job | Prompt file |
|---|---|---|
| 1 | Lead: shared UI, data layer, build health, integration | `docs/agents/prompts/agent-1.md` |
| 2 | Scholarships | `docs/agents/prompts/agent-2.md` |
| 3 | Fellowships and Grants | `docs/agents/prompts/agent-3.md` |
| 4 | Courses | `docs/agents/prompts/agent-4.md` |
| 5 | Events and Student Offers | `docs/agents/prompts/agent-5.md` |
| 6 | Blog | `docs/agents/prompts/agent-6.md` |
| 7 | Home, About, Search, Contact, Terms, Privacy, SEO | `docs/agents/prompts/agent-7.md` |

Why this does not collide: every agent owns different files (`OWNERSHIP.md`), styles live in per-agent CSS files, sample data is split per category, and messages are one file each.

## 2. Before you start (10 minutes)

1. **Repo access.** Every Claude account must be able to push to `DevBarney/OppVault-final`. In GitHub: repo, Settings, Collaborators, add each GitHub account the Claude sessions use, or connect the same GitHub account to all seven sessions. (Seven sessions pushing as the same account is fine.)
2. **Optional safety net.** In GitHub, Settings, Branches, add a protection rule on `main` that blocks direct pushes. Leave `platform` unprotected so agents can push.
3. **Vercel preview.** Vercel already deploys every branch of this repo. Each push to `platform` gives a preview build:
   - Vercel dashboard, project `oppvault_final`, Deployments, filter Branch = `platform`.
   - The stable preview address looks like `oppvault-final-git-platform-<team>.vercel.app`.
   - To see real Supabase data in previews, check Settings, Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SITE_URL` must include the **Preview** environment. Without them the preview shows the "Sample" content, which is fine for design review.
4. **Check the preview is not public by accident.** Vercel previews are protected by default (login required). That is what you want while the work is unfinished.

## 3. Launch order

1. **Start Agent 1 first.** Open a new Claude Code session on the repo, paste the whole code block from `docs/agents/prompts/agent-1.md`. Wait until its status file says the build passes (usually a few minutes).
2. **Start Agents 2 to 7** in any order, each in its own session, each with its own prompt block. You can start them one minute apart; they do not depend on each other.
3. Leave them to work. Each pushes small commits to `platform`.

How to paste a prompt: open the prompt file on GitHub (branch `platform`), copy only the text inside the ` ```text ` box, and paste it as the first message of a fresh session.

## 4. Checking progress

- **Board:** `docs/agents/BOARD.md` on GitHub (branch `platform`). Agent 1 keeps the summary table up to date.
- **Status:** `docs/agents/status/agent-N.md` for detail.
- **Commits:** GitHub, Commits, branch `platform`. Messages start with `[agent-N]`.
- **Preview:** open the Vercel branch preview URL and click around: Home, each category, a detail page, Blog, About, Search, Contact. Look at it on your phone as well.
- **Problems:** `docs/agents/inbox/` shows what agents are asking each other. A pile of unanswered blocking requests means someone is stuck.

## 5. When something goes wrong

| Symptom | What to do |
|---|---|
| Preview build is red | Open the failed deployment in Vercel, copy the error, paste it into Agent 1's session with "fix this build error". |
| An agent edits a file it does not own | Tell that agent: "Revert your change to `<file>` and send a request to the owner instead. Re-read AGENTS.md section 1." |
| Two agents disagree | Decide yourself and ask Agent 1 to record it in `DECISIONS.md`. |
| An agent stops mid-task (limit reached) | Start a fresh session with the same prompt. It will read its status file and continue where it left off. |
| Push rejected | Normal. The agent should run `git pull --rebase origin platform` and push again. |
| An agent seems to make things up | Check `source_url` on any listing it calls real. Anything unverified must be marked sample. |

## 6. Integration checklist (Agent 1 runs this, you can too)

- Build and typecheck pass on `platform`.
- Every nav link works. Every footer link works.
- Each of the six categories: list page, filters, pagination, empty state, detail page.
- 320px, 375px, 768px, 1280px: no sideways scrolling.
- `/sitemap.xml` lists real pages only, no sample entries.
- Newsletter form still works (sample submit shows success or a clear error).
- One `h1` per page, titles and descriptions present.
- Copy review: British spelling, no guarantees, no invented facts.

## 7. Adding real opportunities (the admin page)

The site has an admin page at `/admin` where you upload CSV files, one type at a time (courses, scholarships, fellowships, grants, events, student offers, a mixed "all opportunities" file, and blog posts).

One-time setup, in Vercel (Settings, Environment Variables, tick Production and Preview):
- `ADMIN_PASSWORD`: choose a long password (12+ characters). Only you know it.
- `SUPABASE_SERVICE_ROLE_KEY`: in Supabase, Project settings, API keys, copy the **secret** key. It is only ever used on the server. Never paste it into chat or code.
Then redeploy.

Daily use:
1. Open `/admin` on the preview (or live) site and sign in.
2. Pick the type, download the template, fill it in with Excel or Google Sheets, save as CSV.
3. Upload, press **Check file** (nothing is saved yet; you see every problem by row number), then **Import**.
4. Uploading the same `opportunity_id` again updates that listing. Use `published = no` for drafts.
5. The "Manage what is live" section lets you hide, show or delete listings.

Columns include opportunity_id, title (or course_name), link (or course_link), image_url (thumbnail), coupon_code, summary, description, provider, location, level, funding (or cost), deadline, eligibility, benefits, how_to_apply, featured, published. Several eligibility or benefit items are separated by a `|` character.

The agents prepare ready-to-upload CSV files in `content/csv/` from verified official sources only. You review them, then upload them here. Nothing is shown to the public until `published` is yes.

## 8. Finishing and merging into `main`

Do this only when you are happy with the `platform` preview.

1. Ask Agent 1 to write `docs/agents/RELEASE.md` (what is ready, what is sample, what to do first).
2. Set Supabase and Resend environment variables for the **Production** environment, and add `RESEND_FROM` once the `oppvault.app` domain is verified.
3. Decide how to launch: either merge `platform` into `main` (the preview landing page is replaced), or point a new Vercel project or domain at `platform` and keep `main` as it is. The second option is safer for a soft launch.
4. Ask me (in a normal session) to do the merge when you are ready. I will check the build and the sitemap first.

## 9. Limits to be aware of

- Agents cannot see the live preview themselves. They rely on typecheck, build and their own checks, so your visual review matters.
- Each Claude session has its own usage limit. If one stops, restart it with the same prompt.
- Seven agents will produce a lot of commits. That is normal. Do not squash or force-push while they are working.
