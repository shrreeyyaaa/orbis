-- Prevent self-promotion and make household invitations single-use and email-bound.

create or replace function public.can_update_own_member_row(
  p_household_id uuid,
  p_user_id uuid,
  p_role public.member_role
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members existing
    where existing.household_id = p_household_id
      and existing.user_id = auth.uid()
      and p_user_id = auth.uid()
      and existing.role = p_role
  );
$$;

revoke all on function public.can_update_own_member_row(uuid, uuid, public.member_role) from public;
grant execute on function public.can_update_own_member_row(uuid, uuid, public.member_role) to authenticated;

drop policy if exists "members_update" on public.household_members;
create policy "members_update" on public.household_members
  for update
  using (public.is_household_admin(household_id) or user_id = auth.uid())
  with check (
    public.is_household_admin(household_id)
    or public.can_update_own_member_row(household_id, user_id, role)
  );

create or replace function public.accept_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  v_inv public.household_invites;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select *
    into v_inv
    from public.household_invites
    where token = p_token
    for update;

  if not found then
    raise exception 'invalid invite';
  end if;
  if v_inv.accepted_at is not null then
    raise exception 'invite already accepted';
  end if;
  if v_inv.expires_at < now() then
    raise exception 'invite expired';
  end if;
  if v_email = '' or v_email <> lower(trim(v_inv.email)) then
    raise exception 'invite email does not match authenticated user';
  end if;

  insert into public.household_members (household_id, user_id, role)
    values (v_inv.household_id, v_user, v_inv.role)
    on conflict (household_id, user_id) do nothing;

  update public.household_invites
    set accepted_at = now()
    where id = v_inv.id
      and accepted_at is null;

  return v_inv.household_id;
end;
$$;

revoke all on function public.accept_invite(text) from public;
grant execute on function public.accept_invite(text) to authenticated;
