-- ChadWallet Supabase setup.
-- Run this once in your Supabase project → SQL Editor → New query → Run.
-- Safe to re-run (idempotent).

-- ─────────────────────────────────────────────────────────────────────────────
-- Trades (logged whenever a swap is executed in the trade panel)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.trades (
  id            uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  type          text not null check (type in ('buy', 'sell')),
  token_address text not null,
  amount_sol    numeric,
  amount_token  numeric,
  created_at    timestamptz not null default now()
);
create index if not exists trades_wallet_idx on public.trades (wallet_address);

-- ─────────────────────────────────────────────────────────────────────────────
-- Profiles (one per wallet; seeded "top traders" have is_seed = true)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  wallet_address text primary key,
  handle         text unique not null,
  username       text,
  bio            text,
  avatar_seed    text,
  is_seed        boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists profiles_handle_idx on public.profiles (lower(handle));

-- ─────────────────────────────────────────────────────────────────────────────
-- Follow graph
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.follows (
  follower   text not null,
  following  text not null,
  created_at timestamptz not null default now(),
  primary key (follower, following)
);
create index if not exists follows_following_idx on public.follows (following);
create index if not exists follows_follower_idx  on public.follows (follower);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security: permissive policies (this app authenticates with Privy,
-- not Supabase Auth, so the anon key performs reads/writes directly).
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.trades   enable row level security;
alter table public.profiles enable row level security;
alter table public.follows  enable row level security;

drop policy if exists "trades read"   on public.trades;
drop policy if exists "trades insert" on public.trades;
create policy "trades read"   on public.trades for select using (true);
create policy "trades insert" on public.trades for insert with check (true);

drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "profiles insert" on public.profiles;
drop policy if exists "profiles update" on public.profiles;
create policy "profiles read"   on public.profiles for select using (true);
create policy "profiles insert" on public.profiles for insert with check (true);
create policy "profiles update" on public.profiles for update using (true) with check (true);

drop policy if exists "follows read"   on public.follows;
drop policy if exists "follows insert" on public.follows;
drop policy if exists "follows delete" on public.follows;
create policy "follows read"   on public.follows for select using (true);
create policy "follows insert" on public.follows for insert with check (true);
create policy "follows delete" on public.follows for delete using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed "top traders" so the Follow rail isn't empty on a fresh deployment.
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.profiles (wallet_address, handle, username, bio, avatar_seed, is_seed) values
  ('seed_darkuwu',           'darkuwu',           'dark 🦄',          'degen since genesis',        'darkuwu',           true),
  ('seed_surveillor',        'surveillor',        'surveillor',       'watching every candle',      'surveillor',        true),
  ('seed_leyten',            'leyten',            'leyten',           'small caps only',            'leyten',            true),
  ('seed_zhynx',             'zhynx',             'zhynx',            'risk it for the biscuit',    'zhynx',             true),
  ('seed_juicycooks',        'Juicycooks',        'juicy',            'cooking',                    'juicycooks',        true),
  ('seed_sillysmalloctopus', 'SillySmallOctopus', 'SillySmallOctopus','8 arms, 8 positions',        'sillysmalloctopus', true),
  ('seed_inyourwalls',       'inyourwalls',       'inyourwalls',      'always watching',            'inyourwalls',       true),
  ('seed_remusofmars',       'remusofmars',       'remus (rtrd/acc)', 'to the red planet',          'remusofmars',       true),
  ('seed_fibs',              'fibs',              'fibs',             '0.618 enjoyer',              'fibs',              true),
  ('seed_0xfalcs',           '0xFalcs',           'Falcs',            'gm',                         '0xfalcs',           true)
on conflict (wallet_address) do nothing;
