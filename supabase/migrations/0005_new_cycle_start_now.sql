-- Anchor new cycles to the selected reset day (not the moment of setup).
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
