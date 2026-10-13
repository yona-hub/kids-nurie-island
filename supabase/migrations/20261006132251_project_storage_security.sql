-- Data ownership and version enforcement live in PostgreSQL, never in client claims.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create table private.accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  project_count integer not null default 0 check (project_count between 0 and 500),
  deleting boolean not null default false
);
alter table private.accounts enable row level security;
revoke all on private.accounts from public, anon, authenticated;

create table public.projects (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  template_id text generated always as (payload ->> 'templateId') stored,
  status text generated always as (payload ->> 'status') stored,
  regions jsonb generated always as (payload -> 'regions') stored,
  background_id text generated always as (payload ->> 'backgroundId') stored,
  frame_id text generated always as (payload ->> 'frameId') stored,
  version bigint not null check (version > 0),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  constraint payload_id_matches check (payload ->> 'id' = id::text),
  constraint payload_owner_matches check (payload ->> 'userId' = user_id::text),
  constraint payload_version_matches check ((payload ->> 'version')::bigint = version),
  constraint payload_size check (octet_length(payload::text) <= 262144)
);
create index projects_owner_updated_idx on public.projects(user_id, updated_at desc);
create index projects_owner_live_idx on public.projects(user_id) where deleted_at is null;
alter table public.projects enable row level security;
revoke all on public.projects from public, anon, authenticated;
grant select on public.projects to authenticated;
grant all on public.projects to service_role;
create policy projects_read_own on public.projects for select to authenticated
  using ((select auth.uid()) = user_id);
-- Mutations use the authenticated RPC below. Direct table writes are deliberately ungranted.

create table private.operation_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  project_id uuid not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, operation_id)
);
alter table private.operation_receipts enable row level security;
revoke all on private.operation_receipts from public, anon, authenticated;
create index operation_receipts_user_project_idx on private.operation_receipts(user_id, project_id);

create function private.lock_active_account(p_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare deleting_account boolean;
begin
  if auth.uid() is null or auth.uid() <> p_user_id or not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  insert into private.accounts(user_id) values (p_user_id) on conflict do nothing;
  select deleting into deleting_account from private.accounts where user_id = p_user_id for update;
  if deleting_account then raise exception 'ACCOUNT_DELETING' using errcode = '42501'; end if;
end $$;
revoke all on function private.lock_active_account(uuid) from public, anon, authenticated;

create function private.valid_project(p jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare item record;
begin
  if jsonb_typeof(p) is distinct from 'object' or p ->> 'schemaVersion' is distinct from '1'
    or jsonb_typeof(p -> 'title') is distinct from 'string' or length(p ->> 'title') > 120
    or coalesce(p ->> 'status','') not in ('draft', 'completed')
    or coalesce(p ->> 'templateId', '') !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$'
    or coalesce(p ->> 'backgroundId', '') !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$'
    or coalesce(p ->> 'frameId', '') !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$'
    or jsonb_typeof(p -> 'regions') is distinct from 'object'
    or jsonb_typeof(p -> 'metadata') is distinct from 'object'
    or octet_length(p::text) > 262144 then return false; end if;
  if (select count(*) from jsonb_each(p -> 'regions')) > 2048 or (select count(*) from jsonb_each(p -> 'metadata')) > 64 then return false; end if;
  for item in select * from jsonb_each(p -> 'regions') loop
    if item.key !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$' or item.key in ('__proto__','constructor','prototype')
      or jsonb_typeof(item.value) <> 'object'
      or coalesce(item.value ->> 'color', '') !~ '^#[0-9a-fA-F]{6}$'
      or coalesce(item.value ->> 'paintType', '') not in ('smooth','crayon','pencil') then return false; end if;
  end loop;
  for item in select * from jsonb_each(p -> 'metadata') loop
    if item.key !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$' or item.key in ('__proto__','constructor','prototype')
      or jsonb_typeof(item.value) not in ('string','number','boolean')
      or length(item.value #>> '{}') > 256 then return false; end if;
  end loop;
  return true;
end $$;
revoke all on function private.valid_project(jsonb) from public, anon, authenticated;

create function private.save_project(p_project jsonb, p_expected_version bigint, p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  pid uuid;
  current_project public.projects%rowtype;
  answer jsonb;
  normalized jsonb;
  next_version bigint;
  created timestamptz;
  updated timestamptz := clock_timestamp();
begin
  if uid is null or p_operation_id is null or p_expected_version is null or p_expected_version < 0
    or p_project ->> 'userId' is distinct from uid::text then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if not private.valid_project(p_project) then raise exception 'INVALID_PROJECT' using errcode = '22023'; end if;
  pid := (p_project ->> 'id')::uuid;
  if pid is null then raise exception 'INVALID_PROJECT' using errcode = '22023'; end if;
  perform private.lock_active_account(uid);
  select result into answer from private.operation_receipts where user_id = uid and operation_id = p_operation_id and project_id = pid;
  if found then return answer; end if;
  select * into current_project from public.projects where id = pid for update;
  if found and current_project.user_id <> uid then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if current_project.id is not null and (current_project.deleted_at is not null or current_project.version <> p_expected_version) then
    return jsonb_build_object('kind', 'conflict', 'project', case when current_project.deleted_at is null then current_project.payload else null end);
  elsif current_project.id is null and p_expected_version <> 0 then
    return jsonb_build_object('kind', 'conflict', 'project', null);
  end if;
  if current_project.id is null then
    update private.accounts set project_count = project_count + 1 where user_id = uid and project_count < 500;
    if not found then raise exception 'PROJECT_LIMIT' using errcode = 'P0001'; end if;
    next_version := 1;
    created := coalesce((p_project ->> 'createdAt')::timestamptz, updated);
  else
    next_version := current_project.version + 1;
    created := current_project.created_at;
  end if;
  normalized := jsonb_build_object(
    'schemaVersion',1,'id',pid,'userId',uid,'templateId',p_project ->> 'templateId',
    'title',p_project ->> 'title','status',p_project ->> 'status','regions',p_project -> 'regions',
    'backgroundId',p_project ->> 'backgroundId','frameId',p_project ->> 'frameId',
    'createdAt',to_char(created at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'updatedAt',to_char(updated at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'version',next_version,'metadata',p_project -> 'metadata'
  );
  insert into public.projects(id,user_id,payload,version,created_at,updated_at)
    values (pid,uid,normalized,next_version,created,updated)
    on conflict (id) do update set payload = excluded.payload, version = excluded.version, updated_at = excluded.updated_at;
  answer := jsonb_build_object('kind','saved','project',normalized);
  insert into private.operation_receipts(user_id,operation_id,project_id,result) values (uid,p_operation_id,pid,answer);
  return answer;
end $$;
revoke all on function private.save_project(jsonb,bigint,uuid) from public, anon;
grant execute on function private.save_project(jsonb,bigint,uuid) to authenticated;

create function public.save_project(p_project jsonb, p_expected_version bigint, p_operation_id uuid) returns jsonb
language sql security invoker set search_path = '' as $$ select private.save_project(p_project,p_expected_version,p_operation_id); $$;
revoke all on function public.save_project(jsonb,bigint,uuid) from public, anon;
grant execute on function public.save_project(jsonb,bigint,uuid) to authenticated;

create function private.delete_project(p_user_id uuid, p_id uuid, p_expected_version bigint, p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current_project public.projects%rowtype; answer jsonb; normalized jsonb; updated timestamptz := clock_timestamp();
begin
  if auth.uid() is null or auth.uid() <> p_user_id or p_id is null or p_operation_id is null or p_expected_version is null or p_expected_version < 0 then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  perform private.lock_active_account(p_user_id);
  select result into answer from private.operation_receipts where user_id = p_user_id and operation_id = p_operation_id and project_id = p_id;
  if found then return answer; end if;
  select * into current_project from public.projects where id = p_id for update;
  if found and current_project.user_id <> p_user_id then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if current_project.id is not null and current_project.deleted_at is null and current_project.version <> p_expected_version then
    return jsonb_build_object('kind','conflict','project',current_project.payload);
  end if;
  if current_project.id is null then
    -- A delete of an offline creation also leaves a tombstone; an old in-flight create cannot revive it.
    normalized := jsonb_build_object('schemaVersion',1,'id',p_id,'userId',p_user_id,'templateId','deleted','title','','status','draft','regions','{}'::jsonb,'backgroundId','white','frameId','none','createdAt',to_char(updated at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'updatedAt',to_char(updated at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'version',1,'metadata','{}'::jsonb);
    insert into public.projects(id,user_id,payload,version,created_at,updated_at,deleted_at) values (p_id,p_user_id,normalized,1,updated,updated,updated);
  elsif current_project.deleted_at is null then
    normalized := current_project.payload || jsonb_build_object('version',current_project.version + 1,'updatedAt',to_char(updated at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
    update public.projects set deleted_at = updated, updated_at = updated, version = version + 1, payload = normalized where id = p_id;
    update private.accounts set project_count = project_count - 1 where user_id = p_user_id;
  else normalized := current_project.payload;
  end if;
  answer := jsonb_build_object('kind','saved','project',normalized);
  insert into private.operation_receipts(user_id,operation_id,project_id,result) values (p_user_id,p_operation_id,p_id,answer);
  return answer;
end $$;
revoke all on function private.delete_project(uuid,uuid,bigint,uuid) from public, anon;
grant execute on function private.delete_project(uuid,uuid,bigint,uuid) to authenticated;
create function public.delete_project(p_user_id uuid, p_id uuid, p_expected_version bigint, p_operation_id uuid) returns jsonb
language sql security invoker set search_path = '' as $$ select private.delete_project(p_user_id,p_id,p_expected_version,p_operation_id); $$;
revoke all on function public.delete_project(uuid,uuid,bigint,uuid) from public, anon;
grant execute on function public.delete_project(uuid,uuid,bigint,uuid) to authenticated;

create function private.thumbnail_owner(p_name text, p_writing boolean default false) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := auth.uid(); deleting_account boolean;
begin
  if uid is null or split_part(p_name,'/',1) <> uid::text or p_name !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.thumb$'
    or not exists (select 1 from auth.users where id = uid) then return false; end if;
  -- Hold a shared account lock until this Storage transaction finishes. Account deletion's
  -- exclusive fence waits for admitted uploads, so no upload can commit behind cleanup.
  select deleting into deleting_account from private.accounts where user_id = uid for share;
  if not found or deleting_account then return false; end if;
  return not p_writing or exists (select 1 from public.projects where user_id = uid and id::text || '.thumb' = split_part(p_name,'/',2) and deleted_at is null);
end;
$$;
revoke all on function private.thumbnail_owner(text,boolean) from public, anon;
grant execute on function private.thumbnail_owner(text,boolean) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('thumbnails','thumbnails',false,524288,array['image/webp','image/png'])
on conflict (id) do update set public = false,file_size_limit = 524288,allowed_mime_types = array['image/webp','image/png'];
create policy thumbnail_select_own on storage.objects for select to authenticated
  using (bucket_id = 'thumbnails' and private.thumbnail_owner(name,false));
create policy thumbnail_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'thumbnails' and private.thumbnail_owner(name,true));
create policy thumbnail_update_own on storage.objects for update to authenticated
  using (bucket_id = 'thumbnails' and private.thumbnail_owner(name,false))
  with check (bucket_id = 'thumbnails' and private.thumbnail_owner(name,true));
create policy thumbnail_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'thumbnails' and private.thumbnail_owner(name,false));

create function private.begin_account_deletion() returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null or not exists (select 1 from auth.users where id = uid) then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  insert into private.accounts(user_id,deleting) values (uid,true) on conflict (user_id) do update set deleting = true;
end $$;
revoke all on function private.begin_account_deletion() from public, anon;
grant execute on function private.begin_account_deletion() to authenticated;
create function public.begin_account_deletion() returns void language sql security invoker set search_path = '' as $$ select private.begin_account_deletion(); $$;
revoke all on function public.begin_account_deletion() from public, anon;
grant execute on function public.begin_account_deletion() to authenticated;

-- Only the Edge Function's service client can finish cleanup after Storage objects are removed.
create function private.finish_account_deletion(p_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from private.accounts where user_id = p_user_id and deleting) then raise exception 'DELETION_NOT_STARTED'; end if;
  delete from public.projects where user_id = p_user_id;
  delete from private.operation_receipts where user_id = p_user_id;
  update private.accounts set project_count = 0 where user_id = p_user_id;
end $$;
revoke all on function private.finish_account_deletion(uuid) from public, anon, authenticated;
grant execute on function private.finish_account_deletion(uuid) to service_role;
create function public.finish_account_deletion(p_user_id uuid) returns void language sql security invoker set search_path = '' as $$ select private.finish_account_deletion(p_user_id); $$;
revoke all on function public.finish_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.finish_account_deletion(uuid) to service_role;

create function private.account_deletion_state(p_user_id uuid) returns text
language sql security definer set search_path = '' as $$
  select case when not exists (select 1 from auth.users where id = p_user_id) then 'done'
    when exists (select 1 from private.accounts where user_id = p_user_id and deleting) then 'pending'
    else 'none' end;
$$;
revoke all on function private.account_deletion_state(uuid) from public, anon, authenticated;
grant execute on function private.account_deletion_state(uuid) to service_role;
create function public.account_deletion_state(p_user_id uuid) returns text language sql security invoker set search_path = '' as $$ select private.account_deletion_state(p_user_id); $$;
revoke all on function public.account_deletion_state(uuid) from public, anon, authenticated;
grant execute on function public.account_deletion_state(uuid) to service_role;
