# OppVault platform

The full OppVault site: Home, Scholarships, Fellowships, Grants, Courses, Events, Student Offers, Blog and About,
plus search, filters, detail pages and the newsletter sign-up. Next.js (App Router) with Supabase for content.

## Run it

```
npm install
cp .env.example .env.local     # add the Supabase anon key (see below)
npm run dev
```

With no Supabase variables set, the site shows clearly labelled **Sample** listings so you can see the layout.
With them set, it shows only what is in your database and **no samples**.

## Content lives in Supabase

Tables (created by `supabase/schema.sql`, already applied to your project):

- `opportunities`: one row per listing. Set `published = true` to show it. `category` is one of
  `scholarships`, `fellowships`, `grants`, `courses`, `events`, `student-offers`. `deadline` empty means rolling.
  `eligibility` and `benefits` are JSON lists, for example `["Must be a student", "Under 30"]`.
  Always fill `source_url` with the official announcement.
- `posts`: blog articles. `body` accepts `## Heading`, `- bullet` lines and blank-line separated paragraphs.

Add and edit rows in the Supabase dashboard (Table Editor). Pages refresh within about five minutes.
Visitors can only read published rows; they can never write.

## Environment variables (Vercel > Settings > Environment Variables)

| Name | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fsznoimnvntxkvvfqpng.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the anon (or publishable) key from Supabase > Project Settings > API |
| `NEXT_PUBLIC_SITE_URL` | `https://oppvault.app` |
| `RESEND_API_KEY`, `RESEND_SEGMENT_ID`, `RESEND_FROM` | newsletter, as on the preview page |

## Honesty rules built in

Every listing links to its official source, shows its deadline, and carries the "we cannot guarantee any outcome"
note. Sample listings are marked, excluded from the sitemap and set to `noindex`.
