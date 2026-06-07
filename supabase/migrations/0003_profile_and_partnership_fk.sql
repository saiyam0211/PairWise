-- Fix partnerships.creator_id FK: profile must exist before partnership insert.

drop policy if exists "profiles_insert" on public.profiles;

create policy "profiles_insert" on public.profiles
  for insert with check (id = auth.uid());

create or replace function public.ensure_profile(p_display_name text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (auth.uid(), p_display_name)
  on conflict (id) do update
  set display_name = coalesce(excluded.display_name, profiles.display_name);
end;
$$;

grant execute on function public.ensure_profile(text) to authenticated;

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
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, display_name)
  values (auth.uid(), p_display_name)
  on conflict (id) do update set display_name = excluded.display_name;

  insert into public.partnerships (
    creator_id,
    monthly_budget_cents,
    cycle_start_day,
    currency_code,
    invite_token,
    partner_name
  )
  values (
    auth.uid(),
    p_monthly_budget_cents,
    p_cycle_start_day,
    p_currency_code,
    upper(trim(p_invite_token)),
    p_partner_name
  )
  returning id into v_partnership_id;

  update public.profiles
  set partnership_id = v_partnership_id
  where id = auth.uid();

  return v_partnership_id;
end;
$$;

grant execute on function public.create_partnership(integer, integer, text, text, text, text) to authenticated;

-- Invite join: ensure profile row exists before linking partnership.
create or replace function public.join_partnership(token text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_partnership_id uuid;
  v_member_count   integer;
begin
  insert into public.profiles (id) values (auth.uid()) on conflict (id) do nothing;

  select id into v_partnership_id
  from public.partnerships
  where invite_token = upper(trim(token));

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
