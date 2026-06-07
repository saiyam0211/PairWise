-- Partner label (creator's name for their partner) + transaction quantity/unit

alter table public.partnerships
  add column if not exists partner_name text;

alter table public.transactions
  add column if not exists quantity numeric(12, 3),
  add column if not exists unit text;

-- Validate invite token before sign-in (anon-safe, no data leak)
create or replace function public.validate_invite_token(token text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.partnerships p
    where p.invite_token = upper(trim(token))
      and (select count(*) from public.profiles where partnership_id = p.id) < 2
  );
$$;

grant execute on function public.validate_invite_token(text) to anon, authenticated;
