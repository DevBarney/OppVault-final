-- OppVault platform schema. Run once in the Supabase SQL editor (or via the Supabase connector).
-- Visitors can only READ published rows with the public anon key. Writing is done by you in the
-- Supabase dashboard (Table Editor) or with the service role key, never from the website.

create extension if not exists pgcrypto;

create table if not exists public.opportunities (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null,
  category      text not null check (category in ('scholarships','fellowships','internships','grants','courses','events','student-offers')),
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

-- Student offers: a topic (for the filter) and an offer type that keeps Credit as its own value.
alter table public.opportunities add column if not exists topic text, add column if not exists offer_type text;
alter table public.opportunities drop constraint if exists opportunities_offer_type_check;
alter table public.opportunities add constraint opportunities_offer_type_check
  check (offer_type is null or offer_type in ('free','free_trial','discount','credit'));
create index if not exists opportunities_category_topic_idx on public.opportunities (category, topic) where topic is not null;

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
  category text not null check (category in ('scholarships','fellowships','internships','grants','courses','events','student-offers')),
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

-- ---------------------------------------------------------------------------
-- Visitor accounts: saved opportunities (migrations saved_items, saved_items_tighten_grants)
-- Visitors sign in through Supabase Auth. Each can only see and change their own rows.
-- ---------------------------------------------------------------------------
create table if not exists public.saved_items (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, category, slug),
  constraint saved_items_category_ok check (category in ('scholarships','fellowships','internships','grants','courses','events','student-offers')),
  constraint saved_items_slug_len check (char_length(slug) between 1 and 200)
);
create index if not exists saved_items_user_created on public.saved_items (user_id, created_at desc);
alter table public.saved_items enable row level security;
drop policy if exists "saved_select_own" on public.saved_items;
drop policy if exists "saved_insert_own" on public.saved_items;
drop policy if exists "saved_delete_own" on public.saved_items;
create policy "saved_select_own" on public.saved_items for select to authenticated using (user_id = (select auth.uid()));
create policy "saved_insert_own" on public.saved_items for insert to authenticated with check (user_id = (select auth.uid()));
create policy "saved_delete_own" on public.saved_items for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.saved_items from authenticated, anon, public;
grant select, insert, delete on public.saved_items to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Visitor reviews (public form at /reviews). Every review waits for approval in /admin. The public
-- can only read approved rows, and only these columns; writes go through the server (service role).
-- ---------------------------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  body text not null check (char_length(body) between 20 and 800),
  avatar_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists reviews_status_idx on public.reviews (status, created_at desc);
alter table public.reviews enable row level security;
drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews for select to anon, authenticated using (status = 'approved');
revoke all on public.reviews from anon, authenticated;
grant select (id, name, body, avatar_url, created_at) on public.reviews to anon, authenticated;

-- Reviews: star rating (1-5) and what the person used OppVault for.
alter table public.reviews
  add column if not exists rating smallint check (rating between 1 and 5),
  add column if not exists used_for text not null default '' check (char_length(used_for) <= 60);
grant select (rating, used_for) on public.reviews to anon, authenticated;

-- ---------------------------------------------------------------------------
-- "I applied": a visitor marks an opportunity as applied. Rows are private to the visitor; only a
-- count per listing is public, through applied_count() below.
-- ---------------------------------------------------------------------------
create table if not exists public.applied_items (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, category, slug),
  constraint applied_items_category_ok check (category in ('scholarships','fellowships','internships','grants','courses','events','student-offers')),
  constraint applied_items_slug_len check (char_length(slug) between 1 and 200)
);
create index if not exists applied_items_listing on public.applied_items (category, slug);
alter table public.applied_items enable row level security;
drop policy if exists "applied_select_own" on public.applied_items;
drop policy if exists "applied_insert_own" on public.applied_items;
drop policy if exists "applied_delete_own" on public.applied_items;
create policy "applied_select_own" on public.applied_items for select to authenticated using (user_id = (select auth.uid()));
create policy "applied_insert_own" on public.applied_items for insert to authenticated with check (user_id = (select auth.uid()));
create policy "applied_delete_own" on public.applied_items for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.applied_items from authenticated, anon, public;
grant select, insert, delete on public.applied_items to authenticated;

create or replace function public.applied_count(p_category text, p_slug text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from public.applied_items where category = p_category and slug = p_slug;
$$;
revoke all on function public.applied_count(text, text) from public;
grant execute on function public.applied_count(text, text) to anon, authenticated;
-- Public, aggregate-only activity per listing: how many visitors marked it applied or saved it.
-- Used to offer a "Most applied" sort. No user ids are returned.
create or replace function public.listing_activity(p_category text default null)
returns table(category text, slug text, applied integer, saved integer)
language sql
stable
security definer
set search_path = public
as $$
  select k.category, k.slug,
         coalesce(a.n, 0)::integer as applied,
         coalesce(s.n, 0)::integer as saved
  from (
    select ai.category, ai.slug from public.applied_items ai
    union
    select si.category, si.slug from public.saved_items si
  ) k
  left join (select ai.category, ai.slug, count(*) as n from public.applied_items ai group by ai.category, ai.slug) a
    on a.category = k.category and a.slug = k.slug
  left join (select si.category, si.slug, count(*) as n from public.saved_items si group by si.category, si.slug) s
    on s.category = k.category and s.slug = k.slug
  where p_category is null or k.category = p_category;
$$;
revoke all on function public.listing_activity(text) from public;
grant execute on function public.listing_activity(text) to anon, authenticated;

-- Search text: one lower-cased column joining every searchable field, so site search reaches the full
-- description, eligibility, benefits and how to apply, not only the title. Trigram index keeps it fast.
create extension if not exists pg_trgm with schema extensions;
alter table public.opportunities
  add column if not exists search_text text generated always as (
    lower(
      coalesce(title, '') || ' ' || coalesce(provider, '') || ' ' || coalesce(summary, '') || ' ' ||
      coalesce(description, '') || ' ' || coalesce(location, '') || ' ' || coalesce(level, '') || ' ' ||
      coalesce(funding, '') || ' ' || coalesce(topic, '') || ' ' || coalesce(how_to_apply, '') || ' ' ||
      coalesce(eligibility::text, '') || ' ' || coalesce(benefits::text, '')
    )
  ) stored;
create index if not exists opportunities_search_text_trgm_idx
  on public.opportunities using gin (search_text extensions.gin_trgm_ops);

-- Application tracker: each "I applied" row also records where the application stands, when it was sent and a private note.
alter table public.applied_items
  add column if not exists status text not null default 'applied',
  add column if not exists applied_on date,
  add column if not exists note text not null default '',
  add column if not exists updated_at timestamptz not null default now();
update public.applied_items set applied_on = created_at::date where applied_on is null;
alter table public.applied_items alter column applied_on set default current_date;
alter table public.applied_items alter column applied_on set not null;
alter table public.applied_items drop constraint if exists applied_items_status_ok;
alter table public.applied_items add constraint applied_items_status_ok
  check (status in ('applied','shortlisted','interview','offer','not_selected','withdrawn'));
alter table public.applied_items drop constraint if exists applied_items_note_len;
alter table public.applied_items add constraint applied_items_note_len check (char_length(note) <= 600);
drop policy if exists "applied_update_own" on public.applied_items;
create policy "applied_update_own" on public.applied_items for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant update (status, applied_on, note, updated_at) on public.applied_items to authenticated;

-- Security hardening (migration security_hardening_rate_limits_and_grants)
-- Shared rate limiter: counts attempts per key across all server instances. Server (service role) only.
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  n integer not null default 1
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from public, anon, authenticated;

create or replace function public.rl_hit(p_key text, p_window integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v integer;
begin
  insert into public.rate_limits as r (key, window_start, n)
  values (left(p_key, 200), now(), 1)
  on conflict (key) do update set
    n = case when r.window_start < now() - make_interval(secs => p_window) then 1 else r.n + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window) then now() else r.window_start end
  returning n into v;
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;
  return v;
end;
$$;
revoke all on function public.rl_hit(text, integer) from public, anon, authenticated;
grant execute on function public.rl_hit(text, integer) to service_role;

-- Private tables: no direct access for the public API roles (RLS stays on as a second layer).
revoke all on public.admin_users, public.submissions, public.mail_sends from anon, authenticated;
-- Public content is read-only for the public API roles.
revoke insert, update, delete, truncate, references, trigger on public.opportunities, public.posts from anon, authenticated;

-- Ranking (migration listing_clicks_and_activity_ranking)
-- Anonymous click counts: how many times the "official site" button was used, per listing per day.
create table if not exists public.listing_clicks (
  category text not null check (category in ('scholarships','fellowships','internships','grants','courses','events','student-offers')),
  slug text not null,
  day date not null default current_date,
  n integer not null default 0,
  primary key (category, slug, day)
);
alter table public.listing_clicks enable row level security;
revoke all on public.listing_clicks from public, anon, authenticated;

create or replace function public.click_hit(p_category text, p_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.listing_clicks as c (category, slug, day, n)
  values (p_category, left(p_slug, 200), current_date, 1)
  on conflict (category, slug, day) do update set n = c.n + 1;
$$;
revoke all on function public.click_hit(text, text) from public, anon, authenticated;
grant execute on function public.click_hit(text, text) to service_role;

-- Public, aggregate-only activity per listing. clicks = official-site clicks in the last 30 days.
drop function if exists public.listing_activity(text);
create function public.listing_activity(p_category text default null)
returns table(category text, slug text, applied integer, saved integer, clicks integer)
language sql
stable
security definer
set search_path = public
as $$
  with a as (select ai.category, ai.slug, count(*)::integer as n from public.applied_items ai group by 1, 2),
       s as (select si.category, si.slug, count(*)::integer as n from public.saved_items si group by 1, 2),
       c as (select lc.category, lc.slug, sum(lc.n)::integer as n from public.listing_clicks lc where lc.day >= current_date - 30 group by 1, 2),
       k as (select a.category, a.slug from a union select s.category, s.slug from s union select c.category, c.slug from c)
  select k.category, k.slug, coalesce(a.n, 0), coalesce(s.n, 0), coalesce(c.n, 0)
  from k
  left join a on a.category = k.category and a.slug = k.slug
  left join s on s.category = k.category and s.slug = k.slug
  left join c on c.category = k.category and c.slug = k.slug
  where p_category is null or k.category = p_category;
$$;
revoke all on function public.listing_activity(text) from public;
grant execute on function public.listing_activity(text) to anon, authenticated;

-- Pending applications (migration pending_applications_status)
-- "pending": the visitor went to the official site from OppVault but has not said they applied yet.
alter table public.applied_items drop constraint if exists applied_items_status_ok;
alter table public.applied_items add constraint applied_items_status_ok
  check (status in ('pending','applied','shortlisted','interview','offer','not_selected','withdrawn'));
-- applied_count() and listing_activity() ignore pending rows (see the migration for the current bodies).

-- Community join link (migration join_clicks)
-- Anonymous count of opens of oppvault.app/join, per source (save, applied, closing, email, newsletter, flyer, video, site) per day.
create table if not exists public.join_clicks (
  src text not null check (src ~ '^[a-z]{2,20}$'),
  day date not null default current_date,
  n integer not null default 0,
  primary key (src, day)
);
alter table public.join_clicks enable row level security;
revoke all on public.join_clicks from public, anon, authenticated;

create or replace function public.join_hit(p_src text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.join_clicks as j (src, day, n)
  values (left(p_src, 20), current_date, 1)
  on conflict (src, day) do update set n = j.n + 1;
$$;
revoke all on function public.join_hit(text) from public, anon, authenticated;
grant execute on function public.join_hit(text) to service_role;

-- Impact report for /admin/impact (migration impact_stats)
-- Aggregate counts only: nothing here identifies a person. Callable by the server (service role) only.
create or replace function public.impact_stats(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  d integer := greatest(1, least(coalesce(p_days, 30), 730));
  since date := current_date - greatest(1, least(coalesce(p_days, 30), 730));
  prev date := current_date - 2 * greatest(1, least(coalesce(p_days, 30), 730));
  weeks date[];
  res jsonb;
begin
  select array_agg(w::date order by w) into weeks
  from generate_series(date_trunc('week', current_date) - interval '11 weeks', date_trunc('week', current_date), interval '1 week') w;

  select jsonb_build_object(
    'days', d,
    'generated_at', now(),
    'accounts', jsonb_build_object(
      'total', (select count(*) from auth.users),
      'period', (select count(*) from auth.users where created_at::date >= since),
      'previous', (select count(*) from auth.users where created_at::date >= prev and created_at::date < since)),
    'saves', jsonb_build_object(
      'total', (select count(*) from saved_items),
      'period', (select count(*) from saved_items where created_at::date >= since),
      'previous', (select count(*) from saved_items where created_at::date >= prev and created_at::date < since),
      'people', (select count(distinct user_id) from saved_items)),
    'applied', jsonb_build_object(
      'total', (select count(*) from applied_items),
      'period', (select count(*) from applied_items where created_at::date >= since),
      'previous', (select count(*) from applied_items where created_at::date >= prev and created_at::date < since),
      'people', (select count(distinct user_id) from applied_items)),
    'clicks', jsonb_build_object(
      'total', (select coalesce(sum(n), 0) from listing_clicks),
      'period', (select coalesce(sum(n), 0) from listing_clicks where day >= since),
      'previous', (select coalesce(sum(n), 0) from listing_clicks where day >= prev and day < since),
      'first_day', (select min(day) from listing_clicks)),
    'joins', jsonb_build_object(
      'total', (select coalesce(sum(n), 0) from join_clicks),
      'period', (select coalesce(sum(n), 0) from join_clicks where day >= since),
      'by_source', coalesce((select jsonb_agg(jsonb_build_object('src', src, 'n', n) order by n desc) from (select src, sum(n)::int n from join_clicks where day >= since group by src) j), '[]'::jsonb)),
    'listings', jsonb_build_object(
      'published', (select count(*) from opportunities where published),
      'by_category', coalesce((select jsonb_agg(jsonb_build_object('category', category, 'n', n) order by n desc) from (select category, count(*)::int n from opportunities where published group by category) c), '[]'::jsonb)),
    'visitor_suggestions', jsonb_build_object(
      'total', (select count(*) from submissions),
      'approved', (select count(*) from submissions where status = 'approved')),
    'reviews', jsonb_build_object('approved', (select count(*) from reviews where status = 'approved')),
    'clicks_by_category', coalesce((select jsonb_agg(jsonb_build_object('category', category, 'n', n) order by n desc) from (select category, sum(n)::int n from listing_clicks where day >= since group by category) c), '[]'::jsonb),
    'applied_by_category', coalesce((select jsonb_agg(jsonb_build_object('category', category, 'n', n) order by n desc) from (select category, count(*)::int n from applied_items where created_at::date >= since group by category) c), '[]'::jsonb),
    'top_clicked', coalesce((select jsonb_agg(t order by (t->>'n')::int desc) from (
        select jsonb_build_object('category', c.category, 'slug', c.slug, 'title', coalesce(o.title, c.slug), 'n', c.n) t
        from (select category, slug, sum(n)::int n from listing_clicks where day >= since group by category, slug order by 3 desc limit 10) c
        left join opportunities o on o.category = c.category and o.slug = c.slug) x), '[]'::jsonb),
    'top_applied', coalesce((select jsonb_agg(t order by (t->>'n')::int desc) from (
        select jsonb_build_object('category', c.category, 'slug', c.slug, 'title', coalesce(o.title, c.slug), 'n', c.n) t
        from (select category, slug, count(*)::int n from applied_items where created_at::date >= since group by category, slug order by 3 desc limit 10) c
        left join opportunities o on o.category = c.category and o.slug = c.slug) x), '[]'::jsonb),
    'weekly', (select jsonb_agg(jsonb_build_object(
        'week', w,
        'accounts', (select count(*) from auth.users where created_at::date >= w and created_at::date < w + 7),
        'saves', (select count(*) from saved_items where created_at::date >= w and created_at::date < w + 7),
        'applied', (select count(*) from applied_items where created_at::date >= w and created_at::date < w + 7),
        'clicks', (select coalesce(sum(n), 0) from listing_clicks where day >= w and day < w + 7),
        'joins', (select coalesce(sum(n), 0) from join_clicks where day >= w and day < w + 7)) order by w)
      from unnest(weeks) w)
  ) into res;
  return res;
end;
$$;
revoke all on function public.impact_stats(integer) from public, anon, authenticated;
grant execute on function public.impact_stats(integer) to service_role;

-- Anonymous people who clicked an official site button (migration click_visitors_and_impact_extra)
-- One row per person per day, keyed by a hash that changes every day, so nobody can be followed from one day to the next.
create table if not exists public.click_visitors (
  day date not null default current_date,
  h text not null check (char_length(h) between 16 and 64),
  primary key (day, h)
);
alter table public.click_visitors enable row level security;
revoke all on public.click_visitors from public, anon, authenticated;

create or replace function public.click_visitor(p_h text)
returns void
language sql
security definer
set search_path = public
as $$
  with gone as (delete from public.click_visitors where day < current_date - 400)
  insert into public.click_visitors (day, h) values (current_date, left(p_h, 64)) on conflict do nothing;
$$;
revoke all on function public.click_visitor(text) from public, anon, authenticated;
grant execute on function public.click_visitor(text) to service_role;

-- impact_extra(p_days): people reached and the month-by-month table for /admin/impact. See the migration for the body.
