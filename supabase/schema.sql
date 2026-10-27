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

-- ---------------------------------------------------------------------------------------------
-- Admin CSV import support (applied after the tables above)
-- external_id is the "opportunity ID" column of the CSV files; importing the same ID again updates
-- the row instead of creating a duplicate. image_url and coupon_code are shown on the site.
-- ---------------------------------------------------------------------------------------------
alter table public.opportunities
  add column if not exists external_id text,
  add column if not exists image_url text,
  add column if not exists coupon_code text;
update public.opportunities set external_id = slug where external_id is null;
alter table public.opportunities alter column external_id set not null;
alter table public.opportunities drop constraint if exists opportunities_category_external_id_key;
alter table public.opportunities add constraint opportunities_category_external_id_key unique (category, external_id);
alter table public.posts add column if not exists image_url text;

create or replace function public.default_external_id() returns trigger
language plpgsql set search_path = '' as $$
begin if new.external_id is null or new.external_id = '' then new.external_id := new.slug; end if; return new; end $$;
drop trigger if exists opportunities_default_external_id on public.opportunities;
create trigger opportunities_default_external_id before insert on public.opportunities
  for each row execute function public.default_external_id();

-- ---------------------------------------------------------------------------------------------
-- Opportunities submitted by visitors (reviewed on /admin). Private: RLS on, no policies, so only
-- the server with the service role key can read or write it.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('scholarships','fellowships','grants','courses','events','student-offers')),
  title text not null,
  provider text not null default '',
  link text not null,
  summary text not null default '',
  deadline date,
  location text not null default '',
  level text not null default '',
  funding text not null default '',
  submitter_name text not null default '',
  submitter_email text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists submissions_status_idx on public.submissions (status, created_at desc);
alter table public.submissions enable row level security;

-- Record of newsletter batches sent from /admin (one row per campaign and batch, so a batch cannot go out twice).
create table if not exists public.mail_sends (
  id uuid primary key default gen_random_uuid(),
  campaign text not null,
  subject text not null,
  batch int not null,
  recipients int not null default 0,
  broadcast_id text,
  created_at timestamptz not null default now(),
  unique (campaign, batch)
);
alter table public.mail_sends enable row level security;

-- ---------------------------------------------------------------------------------------------
-- Blog editor and team accounts (/admin/blog). status: draft -> review -> published. The public site
-- still only reads rows where published = true.
-- ---------------------------------------------------------------------------------------------
alter table public.posts
  add column if not exists status text not null default 'draft',
  add column if not exists author_id text,
  add column if not exists review_note text not null default '',
  add column if not exists updated_at timestamptz not null default now();
alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check check (status in ('draft','review','published'));
update public.posts set status = 'published' where published = true and status = 'draft';
drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts for each row execute function public.touch_updated_at();

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text not null default 'writer' check (role in ('writer')),
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login timestamptz
);
create unique index if not exists admin_users_email_idx on public.admin_users (lower(email));
alter table public.admin_users enable row level security;

-- Writer profile pictures (stored in the public "avatars" Storage bucket; posts keep a copy of the link).
alter table public.admin_users add column if not exists avatar_url text;
alter table public.posts add column if not exists author_avatar text;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 204800, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 204800, allowed_mime_types = array['image/jpeg','image/png','image/webp'];
