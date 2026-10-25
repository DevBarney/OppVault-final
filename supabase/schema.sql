-- OppVault platform schema. Run once in the Supabase SQL editor (or via the Supabase connector).
-- Visitors can only READ published rows with the public anon key. Writing is done by you in the
-- Supabase dashboard (Table Editor) or with the service role key, never from the website.

create extension if not exists pgcrypto;

create table if not exists public.opportunities (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null,
  category      text not null check (category in ('scholarships','fellowships','grants','courses','events','student-offers')),
  title         text not null,
  provider      text not null,
  summary       text not null,
  description   text not null default '',
  eligibility   jsonb not null default '[]'::jsonb,   -- ["Must be ...", "..."]
  benefits      jsonb not null default '[]'::jsonb,
  how_to_apply  text not null default '',
  location      text not null default 'Global',
  level         text not null default 'All levels',
  funding       text not null default '',
  deadline      date,                                  -- null = rolling / no fixed date
  source_url    text,                                  -- the official announcement
  featured      boolean not null default false,
  published     boolean not null default false,        -- set true to show it on the site
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (category, slug)
);

create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  excerpt       text not null,
  body          text not null,                         -- "## Heading", "- bullet", blank-line paragraphs
  author        text not null default 'OppVault team',
  tags          jsonb not null default '[]'::jsonb,
  read_minutes  int  not null default 4,
  published     boolean not null default false,
  published_at  date not null default current_date,
  created_at    timestamptz not null default now()
);

create index if not exists opportunities_category_deadline_idx on public.opportunities (category, deadline);
create index if not exists opportunities_published_idx on public.opportunities (published);
create index if not exists posts_published_idx on public.posts (published, published_at desc);

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists opportunities_touch on public.opportunities;
create trigger opportunities_touch before update on public.opportunities
  for each row execute function public.touch_updated_at();

-- Row level security: the public can read published rows only.
alter table public.opportunities enable row level security;
alter table public.posts enable row level security;

drop policy if exists "Public can read published opportunities" on public.opportunities;
create policy "Public can read published opportunities" on public.opportunities
  for select to anon, authenticated using (published = true);

drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts" on public.posts
  for select to anon, authenticated using (published = true);
