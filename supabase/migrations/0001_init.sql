-- ─── Tables ────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  partnership_id uuid,
  theme_pref    text default 'system',
  created_at    timestamptz default now() not null
);

create table public.partnerships (
  id                    uuid primary key default gen_random_uuid(),
  creator_id            uuid references public.profiles(id) on delete cascade not null,
  monthly_budget_cents  integer not null,
  cycle_start_day       integer not null check (cycle_start_day between 1 and 28),
  currency_code         text not null default 'USD',
  invite_token          text unique not null,
  created_at            timestamptz default now() not null
);

create table public.transactions (
  id              uuid primary key default gen_random_uuid(),
  partnership_id  uuid references public.partnerships(id) on delete cascade not null,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  amount_cents    integer not null check (amount_cents > 0),
  description     text,
  category        text,
  occurred_at     timestamptz not null,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

alter table public.profiles
  add constraint fk_profiles_partnership
  foreign key (partnership_id)
  references public.partnerships(id)
  on delete set null;

-- ─── Auto-create profile on signup ─────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── SECURITY DEFINER helpers (sub-50ms RLS) ───────────────────────────────

create or replace function public.current_partnership_id()
returns uuid language sql stable security definer set search_path = public as $$
  select partnership_id from public.profiles where id = auth.uid()
$$;

create or replace function public.join_partnership(token text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_partnership_id uuid;
  v_member_count   integer;
begin
  select id into v_partnership_id
  from public.partnerships
  where invite_token = token;

  if v_partnership_id is null then
    raise exception 'Invalid invite code.';
  end if;

  select count(*) into v_member_count
  from public.profiles
  where partnership_id = v_partnership_id;

  if v_member_count >= 2 then
    raise exception 'This partnership already has two members.';
  end if;

  update public.profiles
  set partnership_id = v_partnership_id
  where id = auth.uid();
end;
$$;

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.partnerships enable row level security;
alter table public.transactions enable row level security;

-- profiles: own row + partner's row (same partnership)
create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid()
    or partnership_id = public.current_partnership_id()
  );

create policy "profiles_update" on public.profiles
  for update using (id = auth.uid());

-- partnerships: only members can select; only creator can update budget
create policy "partnerships_select" on public.partnerships
  for select using (id = public.current_partnership_id());

create policy "partnerships_update" on public.partnerships
  for update using (creator_id = auth.uid());

create policy "partnerships_insert" on public.partnerships
  for insert with check (creator_id = auth.uid());

-- transactions: full CRUD within the same partnership
create policy "transactions_select" on public.transactions
  for select using (partnership_id = public.current_partnership_id());

create policy "transactions_insert" on public.transactions
  for insert with check (
    partnership_id = public.current_partnership_id()
    and user_id = auth.uid()
  );

create policy "transactions_update" on public.transactions
  for update using (
    partnership_id = public.current_partnership_id()
    and user_id = auth.uid()
  );

create policy "transactions_delete" on public.transactions
  for delete using (
    partnership_id = public.current_partnership_id()
    and user_id = auth.uid()
  );

-- ─── Realtime publication ───────────────────────────────────────────────────

alter publication supabase_realtime add table public.transactions;

-- ─── updated_at auto-bump ───────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();
