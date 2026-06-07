-- Budget cycle lifecycle: active cycles, snapshots, close & restart.

alter table public.partnerships
  add column if not exists cycle_active boolean not null default true,
  add column if not exists current_cycle_start_at timestamptz;

create table if not exists public.cycle_snapshots (
  id                 uuid primary key default gen_random_uuid(),
  partnership_id     uuid references public.partnerships(id) on delete cascade not null,
  cycle_start_at     timestamptz not null,
  cycle_end_at       timestamptz not null,
  budget_cents       integer not null,
  total_spent_cents  integer not null,
  saved_cents        integer not null,
  member_spends      jsonb not null default '[]',
  close_reason       text not null check (close_reason in ('manual', 'natural')),
  closed_at          timestamptz default now() not null
);

create index if not exists cycle_snapshots_partnership_idx
  on public.cycle_snapshots (partnership_id, closed_at desc);

alter table public.cycle_snapshots enable row level security;

drop policy if exists "cycle_snapshots_select" on public.cycle_snapshots;
create policy "cycle_snapshots_select" on public.cycle_snapshots
  for select using (partnership_id = public.current_partnership_id());

-- Compute cycle start date from reset day (mirrors app getCycleWindow).
create or replace function public.cycle_start_for_day(p_cycle_start_day integer, p_ref timestamptz default now())
returns timestamptz language plpgsql stable set search_path = public as $$
declare
  v_day integer := extract(day from p_ref at time zone 'UTC')::integer;
  v_month integer := extract(month from p_ref at time zone 'UTC')::integer;
  v_year integer := extract(year from p_ref at time zone 'UTC')::integer;
  v_start_month integer := v_month;
  v_start_year integer := v_year;
begin
  if v_day < p_cycle_start_day then
    v_start_month := v_start_month - 1;
    if v_start_month < 1 then
      v_start_month := 12;
      v_start_year := v_start_year - 1;
    end if;
  end if;
  return make_timestamptz(v_start_year, v_start_month, p_cycle_start_day, 0, 0, 0, 'UTC');
end;
$$;

create or replace function public.cycle_end_from_start(p_start timestamptz, p_cycle_start_day integer)
returns timestamptz language plpgsql stable set search_path = public as $$
declare
  v_y integer := extract(year from p_start at time zone 'UTC')::integer;
  v_m integer := extract(month from p_start at time zone 'UTC')::integer;
  v_next timestamptz;
begin
  v_next := make_timestamptz(v_y, v_m + 1, p_cycle_start_day, 0, 0, 0, 'UTC');
  return v_next - interval '1 millisecond';
end;
$$;

-- Backfill existing partnerships.
update public.partnerships
set current_cycle_start_at = public.cycle_start_for_day(cycle_start_day, now())
where current_cycle_start_at is null;

alter table public.partnerships
  alter column current_cycle_start_at set default now();

create or replace function public._build_cycle_snapshot(
  p_partnership_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_budget_cents integer,
  p_reason text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_total integer := 0;
  v_saved integer;
  v_members jsonb := '[]'::jsonb;
  v_snapshot_id uuid;
begin
  select coalesce(sum(t.amount_cents), 0) into v_total
  from public.transactions t
  where t.partnership_id = p_partnership_id
    and t.occurred_at >= p_start
    and t.occurred_at <= p_end;

  v_saved := p_budget_cents - v_total;

  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', p.id,
    'display_name', coalesce(p.display_name, 'Partner'),
    'spent_cents', coalesce(spent.sum, 0)
  ) order by coalesce(spent.sum, 0) desc), '[]'::jsonb)
  into v_members
  from public.profiles p
  left join lateral (
    select sum(t.amount_cents) as sum
    from public.transactions t
    where t.partnership_id = p_partnership_id
      and t.user_id = p.id
      and t.occurred_at >= p_start
      and t.occurred_at <= p_end
  ) spent on true
  where p.partnership_id = p_partnership_id;

  insert into public.cycle_snapshots (
    partnership_id, cycle_start_at, cycle_end_at, budget_cents,
    total_spent_cents, saved_cents, member_spends, close_reason
  )
  values (p_partnership_id, p_start, p_end, p_budget_cents, v_total, v_saved, v_members, p_reason)
  returning id into v_snapshot_id;

  return v_snapshot_id;
end;
$$;

create or replace function public.close_cycle(p_reason text default 'manual')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_partnership public.partnerships%rowtype;
  v_start timestamptz;
  v_end timestamptz;
  v_snapshot_id uuid;
begin
  select * into v_partnership
  from public.partnerships
  where id = public.current_partnership_id()
  for update;

  if v_partnership.id is null then
    raise exception 'No partnership found.';
  end if;

  if not v_partnership.cycle_active then
    raise exception 'Cycle is already closed.';
  end if;

  if p_reason = 'manual' and v_partnership.creator_id <> auth.uid() then
    raise exception 'Only the budget creator can end a cycle early.';
  end if;

  v_start := v_partnership.current_cycle_start_at;
  v_end := least(now(), public.cycle_end_from_start(v_start, v_partnership.cycle_start_day));

  v_snapshot_id := public._build_cycle_snapshot(
    v_partnership.id, v_start, v_end,
    v_partnership.monthly_budget_cents, p_reason
  );

  update public.partnerships
  set cycle_active = false
  where id = v_partnership.id;

  return v_snapshot_id;
end;
$$;

create or replace function public.maybe_close_natural_cycle()
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_partnership public.partnerships%rowtype;
  v_end timestamptz;
begin
  select * into v_partnership
  from public.partnerships
  where id = public.current_partnership_id()
  for update;

  if v_partnership.id is null or not v_partnership.cycle_active then
    return null;
  end if;

  v_end := public.cycle_end_from_start(v_partnership.current_cycle_start_at, v_partnership.cycle_start_day);

  if now() <= v_end then
    return null;
  end if;

  return public.close_cycle('natural');
end;
$$;

create or replace function public.start_new_cycle(
  p_monthly_budget_cents integer,
  p_cycle_start_day integer
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_partnership_id uuid := public.current_partnership_id();
begin
  if v_partnership_id is null then
    raise exception 'No partnership found.';
  end if;

  if not exists (
    select 1 from public.partnerships
    where id = v_partnership_id and creator_id = auth.uid()
  ) then
    raise exception 'Only the budget creator can start a new cycle.';
  end if;

  if exists (
    select 1 from public.partnerships where id = v_partnership_id and cycle_active
  ) then
    raise exception 'A cycle is already active.';
  end if;

  update public.partnerships
  set
    monthly_budget_cents = p_monthly_budget_cents,
    cycle_start_day = p_cycle_start_day,
    current_cycle_start_at = public.cycle_start_for_day(p_cycle_start_day, now()),
    cycle_active = true
  where id = v_partnership_id;
end;
$$;

grant execute on function public.close_cycle(text) to authenticated;
grant execute on function public.maybe_close_natural_cycle() to authenticated;
grant execute on function public.start_new_cycle(integer, integer) to authenticated;

-- Block new spends when cycle is closed.
drop policy if exists "transactions_insert" on public.transactions;
create policy "transactions_insert" on public.transactions
  for insert with check (
    partnership_id = public.current_partnership_id()
    and user_id = auth.uid()
    and (select cycle_active from public.partnerships where id = public.current_partnership_id())
  );

-- Initialise cycle on partnership creation.
create or replace function public.create_partnership(
  p_monthly_budget_cents integer,
  p_cycle_start_day integer,
  p_currency_code text,
  p_invite_token text,
  p_display_name text,
  p_partner_name text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_partnership_id uuid;
  v_cycle_start timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_cycle_start := public.cycle_start_for_day(p_cycle_start_day, now());

  insert into public.profiles (id, display_name)
  values (auth.uid(), p_display_name)
  on conflict (id) do update set display_name = excluded.display_name;

  insert into public.partnerships (
    creator_id,
    monthly_budget_cents,
    cycle_start_day,
    currency_code,
    invite_token,
    partner_name,
    cycle_active,
    current_cycle_start_at
  )
  values (
    auth.uid(),
    p_monthly_budget_cents,
    p_cycle_start_day,
    p_currency_code,
    upper(trim(p_invite_token)),
    p_partner_name,
    true,
    v_cycle_start
  )
  returning id into v_partnership_id;

  update public.profiles
  set partnership_id = v_partnership_id
  where id = auth.uid();

  return v_partnership_id;
end;
$$;
