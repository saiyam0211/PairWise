-- Google Sheets picker: store OAuth first, then let user pick or create a spreadsheet.

alter table public.partnerships
  add column if not exists google_spreadsheet_name text;

create or replace function public.google_sheets_status()
returns table (
  connected boolean,
  oauth_ready boolean,
  enabled boolean,
  spreadsheet_id text,
  spreadsheet_name text,
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
    return query select false, false, false, null::text, null::text, null::text;
    return;
  end if;

  return query
  select
    (
      exists (select 1 from public.partnership_secrets ps where ps.partnership_id = v_partnership_id)
      and p.google_spreadsheet_id is not null
    ),
    exists (select 1 from public.partnership_secrets ps where ps.partnership_id = v_partnership_id),
    p.google_sheets_enabled,
    p.google_spreadsheet_id,
    p.google_spreadsheet_name,
    p.google_sheets_cycle_tab
  from public.partnerships p
  where p.id = v_partnership_id;
end;
$$;

create or replace function public.save_google_oauth_token(p_refresh_token text)
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

  if p_refresh_token is null or length(trim(p_refresh_token)) = 0 then
    raise exception 'Google authorization is required.';
  end if;

  insert into public.partnership_secrets (partnership_id, google_refresh_token, updated_at)
  values (v_partnership_id, trim(p_refresh_token), now())
  on conflict (partnership_id) do update
  set google_refresh_token = excluded.google_refresh_token, updated_at = now();
end;
$$;

create or replace function public.set_google_spreadsheet(
  p_spreadsheet_id text,
  p_spreadsheet_name text
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

  if not exists (
    select 1 from public.partnership_secrets where partnership_id = v_partnership_id
  ) then
    raise exception 'Sign in with Google first.';
  end if;

  if p_spreadsheet_id is null or length(trim(p_spreadsheet_id)) = 0 then
    raise exception 'Spreadsheet is required.';
  end if;

  update public.partnerships
  set
    google_spreadsheet_id = trim(p_spreadsheet_id),
    google_spreadsheet_name = nullif(trim(p_spreadsheet_name), ''),
    google_sheets_enabled = true,
    google_sheets_cycle_tab = null
  where id = v_partnership_id;
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
begin
  perform public.save_google_oauth_token(p_refresh_token);
  perform public.set_google_spreadsheet(p_spreadsheet_id, null);
end;
$$;

grant execute on function public.save_google_oauth_token(text) to authenticated;
grant execute on function public.set_google_spreadsheet(text, text) to authenticated;

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
    google_spreadsheet_name = null,
    google_sheets_enabled = false,
    google_sheets_cycle_tab = null
  where id = v_partnership_id;
end;
$$;
