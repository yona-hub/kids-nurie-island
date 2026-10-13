-- Asset revisions can change without changing a saved work's project version.
-- Each derived image keeps both identities; a delayed old client cannot replace
-- an image generated from newer assets. Legacy version paths remain compatible.
create or replace function private.thumbnail_owner(p_name text, p_writing boolean default false) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := auth.uid(); deleting_account boolean;
begin
  if uid is null or split_part(p_name,'/',1) <> uid::text
    or p_name !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}(\.v[1-9][0-9]{0,15}(\.r[0-9a-f]{64})?\.thumb|\.thumb|\.webp)$'
    or not exists (select 1 from auth.users where id = uid) then return false; end if;
  select deleting into deleting_account from private.accounts where user_id = uid for share;
  if not found or deleting_account then return false; end if;
  return not p_writing or exists (
    select 1 from public.projects
    where user_id = uid and deleted_at is null
      and id::text = split_part(split_part(p_name,'/',2),'.',1)
      and 'v' || version::text = split_part(split_part(p_name,'/',2),'.',2)
  );
end;
$$;
revoke all on function private.thumbnail_owner(text,boolean) from public, anon;
grant execute on function private.thumbnail_owner(text,boolean) to authenticated;
