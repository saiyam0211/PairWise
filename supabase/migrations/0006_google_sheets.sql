-- Google Sheets integration (partnership-level, creator connects).

alter table public.partnerships
  add column if not exists google_spreadsheet_id text,
  add column if not exists google_sheets_enabled boolean not null default false,
  add column if not exists google_sheets_cycle_tab text;

alter table public.transactions
  add column if not exists google_sheets_synced_at timestamptz;

create table if not exists public.partnership_secrets (
  partnership_id uuid primary key references public.partnerships(id) on delete cascade,
  google_refresh_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.partnership_secrets enable row level security;
-- No policies: tokens are only accessible via security definer RPCs / service role.

create or replace function public.google_sheets_status()
returns table (
  connected boolean,
  enabled boolean,
  spreadsheet_id text,
  cycle_tab text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_partnership_id uuid := public.current_partnership_id();
begin
  if v_partnership_id is null then
    return query select false, false, null::text, null::text;
    return;
  end if;

  return query
  select
    exists (
      select 1 from public.partnership_secrets ps
      where ps.partnership_id = v_partnership_id
    ),
    p.google_sheets_enabled,
    p.google_spreadsheet_id,
    p.google_sheets_cycle_tab
  from public.partnerships p
  where p.id = v_partnership_id;
end;
$$;

create or replace function public.save_google_sheets_connection(
  p_spreadsheet_id text,
  p_refresh_token text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
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
    raise exception 'Only the budget creator can connect Google Sheets.';
  end if;

  if p_spreadsheet_id is null or length(trim(p_spreadsheet_id)) = 0 then
    raise exception 'Spreadsheet ID is required.';
  end if;

  if p_refresh_token is null or length(trim(p_refresh_token)) = 0 then
    raise exception 'Google authorization is required.';
  end if;

  update public.partnerships
  set
    google_spreadsheet_id = trim(p_spreadsheet_id),
    google_sheets_enabled = true
  where id = v_partnership_id;

  insert into public.partnership_secrets (partnership_id, google_refresh_token, updated_at)
  values (v_partnership_id, trim(p_refresh_token), now())
  on conflict (partnership_id) do update
  set google_refresh_token = excluded.google_refresh_token, updated_at = now();
end;
$$;

create or replace function public.set_google_sheets_enabled(p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
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
    raise exception 'Only the budget creator can change Google Sheets settings.';
  end if;

  if p_enabled and not exists (
    select 1 from public.partnership_secrets where partnership_id = v_partnership_id
  ) then
    raise exception 'Connect Google Sheets first.';
  end if;

  update public.partnerships
  set google_sheets_enabled = p_enabled
  where id = v_partnership_id;
end;
$$;

create or replace function public.disconnect_google_sheets()
returns void
language plpgsql
security definer
set search_path = public
as $$
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
    raise exception 'Only the budget creator can disconnect Google Sheets.';
  end if;

  delete from public.partnership_secrets where partnership_id = v_partnership_id;

  update public.partnerships
  set
    google_spreadsheet_id = null,
    google_sheets_enabled = false,
    google_sheets_cycle_tab = null
  where id = v_partnership_id;
end;
$$;

grant execute on function public.google_sheets_status() to authenticated;
grant execute on function public.save_google_sheets_connection(text, text) to authenticated;
grant execute on function public.set_google_sheets_enabled(boolean) to authenticated;
grant execute on function public.disconnect_google_sheets() to authenticated;

-- New cycles get a fresh Google Sheet tab.
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
    cycle_active = true,
    google_sheets_cycle_tab = null
  where id = v_partnership_id;
end;
$$;
