import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { makeProject, USER_A, USER_B } from './sync.helpers';
import type { Project } from '../packages/shared-types/src/index';

let db: PGlite;
const USER_QUOTA = '33333333-3333-4333-8333-333333333333';
const USER_DELETE = '44444444-4444-4444-8444-444444444444';
async function asUser(userId: string, sql: string, params: unknown[] = []) {
  return db.transaction(async tx => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [userId]);
    return tx.query(sql, params);
  });
}
async function save(project: Project, expectedVersion = 0, operationId = crypto.randomUUID(), userId = project.userId) {
  const response = await asUser(userId, 'select public.save_project($1::jsonb,$2::bigint,$3::uuid) as result', [JSON.stringify(project), expectedVersion, operationId]);
  return (response.rows[0] as { result: { kind: string; project: Project | null } }).result;
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid; $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    create schema storage;
    create table storage.buckets (id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text not null,metadata jsonb,unique(bucket_id,name));
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated, service_role;
    grant select,insert,update,delete on storage.objects to authenticated, service_role;
  `);
  await db.query('insert into auth.users(id) values ($1),($2),($3),($4)', [USER_A, USER_B, USER_QUOTA, USER_DELETE]);
  const directory = new URL('../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(directory)).filter(file => file.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, directory), 'utf8'));
}, 60_000);
afterAll(async () => { await db?.close(); });

describe('actual PostgreSQL migration and RLS (PGlite roles)', () => {
  it('has RLS on every app table, no public definer endpoint, and an owner index', async () => {
    const tables = await db.query<{ relname: string; relrowsecurity: boolean }>("select relname,relrowsecurity from pg_class where relname in ('projects','accounts','operation_receipts')");
    expect(tables.rows).toHaveLength(3); expect(tables.rows.every(row => row.relrowsecurity)).toBe(true);
    const unsafe = await db.query("select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef");
    expect(unsafe.rows).toHaveLength(0);
    const indexes = await db.query("select indexname from pg_indexes where tablename='projects' and indexdef like '%user_id%'");
    expect(indexes.rows.length).toBeGreaterThanOrEqual(1);
  });
  it('A can read their own work; B and anon cannot read it', async () => {
    const project = makeProject(); await save(project);
    expect((await asUser(USER_A, 'select id from public.projects where id=$1', [project.id])).rows).toHaveLength(1);
    expect((await asUser(USER_B, 'select id from public.projects where id=$1', [project.id])).rows).toHaveLength(0);
    await expect(db.transaction(async tx => { await tx.exec('set local role anon'); return tx.query('select * from public.projects'); })).rejects.toThrow(/permission denied/);
  });
  it('rejects user spoofing and cross-user RPC updates/deletion even with a known project UUID', async () => {
    const project = makeProject(); await save(project);
    await expect(save({ ...project, title: 'spoofed' }, 1, crypto.randomUUID(), USER_B)).rejects.toThrow(/FORBIDDEN/);
    await expect(save({ ...project, userId: USER_B }, 1, crypto.randomUUID(), USER_B)).rejects.toThrow(/FORBIDDEN/);
    await expect(asUser(USER_B, 'select public.delete_project($1,$2,1,$3)', [USER_A,project.id,crypto.randomUUID()])).rejects.toThrow(/FORBIDDEN/);
    await expect(asUser(USER_B, 'select public.delete_project($1,$2,1,$3)', [USER_B,project.id,crypto.randomUUID()])).rejects.toThrow(/FORBIDDEN/);
    const unchanged = await asUser(USER_A, 'select payload from public.projects where id=$1', [project.id]);
    expect((unchanged.rows[0] as { payload: Project }).payload.title).toBe(project.title);
  });
  it('denies direct table writes, including attempts to bypass version checks or reassign owner', async () => {
    const project = makeProject(); await save(project);
    await expect(asUser(USER_A, 'update public.projects set user_id=$1 where id=$2', [USER_B,project.id])).rejects.toThrow(/permission denied/);
    await expect(asUser(USER_A, 'update public.projects set version=999 where id=$1', [project.id])).rejects.toThrow(/permission denied/);
    await expect(asUser(USER_B, 'delete from public.projects where id=$1', [project.id])).rejects.toThrow(/permission denied/);
  });
  it('enforces server-authored version CAS and idempotency, stripping transient UI fields', async () => {
    const project = makeProject(); const operation = crypto.randomUUID();
    const initial = await save({ ...project, version: 999, ...{ zoom: 4, undo: [] } }, 0, operation);
    expect(initial.project?.version).toBe(1); expect(initial.project).not.toHaveProperty('zoom'); expect(initial.project).not.toHaveProperty('undo');
    expect((await save(project, 0, operation)).project?.version).toBe(1);
    const updated = await save({ ...project, title: 'new' }, 1);
    expect(updated.project?.version).toBe(2);
    const stale = await save({ ...project, title: 'old' }, 1);
    expect(stale.kind).toBe('conflict'); expect(stale.project?.title).toBe('new'); expect(stale.project?.version).toBe(2);
  });
  it('enforces a transactionally locked 500-work quota without blocking edits or deletes', async () => {
    await asUser(USER_QUOTA, `do $$ declare i int; p jsonb; begin for i in 1..500 loop
      p := jsonb_build_object('schemaVersion',1,'id',gen_random_uuid(),'userId',auth.uid(),'templateId','ocean','title','うみ','status','draft','regions','{}'::jsonb,'backgroundId','white','frameId','none','metadata','{}'::jsonb);
      perform public.save_project(p,0,gen_random_uuid()); end loop; end $$;`);
    await expect(save(makeProject(USER_QUOTA))).rejects.toThrow(/PROJECT_LIMIT/);
    const first = (await asUser(USER_QUOTA, 'select payload from public.projects limit 1')).rows[0] as { payload: Project };
    expect((await save({ ...first.payload, status: 'completed' }, 1)).project?.version).toBe(2);
    await asUser(USER_QUOTA, 'select public.delete_project($1,$2,2,$3)', [USER_QUOTA,first.payload.id,crypto.randomUUID()]);
    expect((await save(makeProject(USER_QUOTA))).kind).toBe('saved');
    const count = await asUser(USER_QUOTA, 'select count(*)::int as count from public.projects where deleted_at is null');
    expect((count.rows[0] as { count: number }).count).toBe(500);
  });
  it('keeps a tombstone so an offline create or stale save cannot revive a deleted UUID', async () => {
    const project = makeProject();
    await asUser(USER_A, 'select public.delete_project($1,$2,0,$3)', [USER_A,project.id,crypto.randomUUID()]);
    const attempted = await save(project);
    expect(attempted).toEqual({ kind: 'conflict', project: null });
    expect((await asUser(USER_A, 'select id from public.projects where id=$1 and deleted_at is null', [project.id])).rows).toHaveLength(0);
  });
  it('rejects malformed paint data at the database boundary', async () => {
    for (const patch of [{ regions: { fish: { color: 'javascript:bad', paintType: 'smooth' } } }, { metadata: { any: [] } }, { status: null }, { title: null }, { schemaVersion: null }]) {
      await expect(save({ ...makeProject(), ...patch } as unknown as Project)).rejects.toThrow(/INVALID_PROJECT/);
    }
  });
  it('scopes all Storage operations to the owner and supports owned upsert', async () => {
    const project = makeProject(); await save(project); const name = `${USER_A}/${project.id}.v1.thumb`;
    await asUser(USER_A, "insert into storage.objects(bucket_id,name) values ('thumbnails',$1)", [name]);
    await asUser(USER_A, "insert into storage.objects(bucket_id,name,metadata) values ('thumbnails',$1,'{\"v\":2}') on conflict (bucket_id,name) do update set metadata=excluded.metadata", [name]);
    expect((await asUser(USER_A, 'select name from storage.objects where name=$1', [name])).rows).toHaveLength(1);
    expect((await asUser(USER_B, 'select name from storage.objects where name=$1', [name])).rows).toHaveLength(0);
    await expect(asUser(USER_B, "insert into storage.objects(bucket_id,name) values ('thumbnails',$1)", [`${USER_A}/${crypto.randomUUID()}.v1.thumb`])).rejects.toThrow(/row-level security/);
    await expect(asUser(USER_A, 'update storage.objects set name=$1 where name=$2', [`${USER_B}/${project.id}.v1.thumb`,name])).rejects.toThrow(/row-level security/);
    expect((await asUser(USER_B, "update storage.objects set metadata='{}' where name=$1 returning name", [name])).rows).toHaveLength(0);
    expect((await asUser(USER_B, 'delete from storage.objects where name=$1 returning name', [name])).rows).toHaveLength(0);
    expect((await asUser(USER_A, 'delete from storage.objects where name=$1 returning name', [name])).rows).toHaveLength(1);
  });
  it('fences writes and uploads during account deletion; only service role can finish', async () => {
    const project = makeProject(USER_DELETE); await save(project);
    await asUser(USER_DELETE, 'select public.begin_account_deletion()');
    await expect(save({ ...project, title: 'in flight' }, 1)).rejects.toThrow(/ACCOUNT_DELETING/);
    await expect(asUser(USER_DELETE, "insert into storage.objects(bucket_id,name) values ('thumbnails',$1)", [`${USER_DELETE}/${project.id}.v1.thumb`])).rejects.toThrow(/row-level security/);
    await expect(asUser(USER_DELETE, 'select public.finish_account_deletion($1)', [USER_DELETE])).rejects.toThrow(/permission denied/);
    await db.transaction(async tx => { await tx.exec('set local role service_role'); await tx.query('select public.finish_account_deletion($1)', [USER_DELETE]); });
    expect((await asUser(USER_DELETE, 'select id from public.projects')).rows).toHaveLength(0);
    await db.query('delete from auth.users where id=$1', [USER_DELETE]);
    await expect(save(makeProject(USER_DELETE))).rejects.toThrow(/FORBIDDEN/);
  });
  it('binds asset-keyed Storage images to their owner and current project version', async () => {
    const project = makeProject(); await save(project);
    const key = 'a'.repeat(64), name = `${USER_A}/${project.id}.v1.r${key}.thumb`;
    await asUser(USER_A, "insert into storage.objects(bucket_id,name) values ('thumbnails',$1)", [name]);
    expect((await asUser(USER_B, 'select name from storage.objects where name=$1', [name])).rows).toHaveLength(0);
    expect((await asUser(USER_B, 'delete from storage.objects where name=$1 returning name', [name])).rows).toHaveLength(0);
    for (const invalid of [`${USER_B}/${project.id}.v1.r${key}.thumb`, `${USER_A}/${project.id}.v1.rBAD.thumb`, `${USER_A}/${project.id}.v2.r${key}.thumb`])
      await expect(asUser(USER_A, "insert into storage.objects(bucket_id,name) values ('thumbnails',$1)", [invalid])).rejects.toThrow(/row-level security/);
    await save({ ...project, title: '次の版' }, 1);
    await expect(asUser(USER_A, "update storage.objects set metadata='{}' where name=$1", [name])).rejects.toThrow(/row-level security/);
    expect((await asUser(USER_A, 'delete from storage.objects where name=$1 returning name', [name])).rows).toHaveLength(1);
  });
  it('only writes thumbnails for the current project version; prior and unversioned paths cannot be overwritten', async () => {
    const project = makeProject(); await save(project);
    const oldName = `${USER_A}/${project.id}.v1.thumb`; const nextName = `${USER_A}/${project.id}.v2.thumb`;
    await asUser(USER_A, "insert into storage.objects(bucket_id,name) values ('thumbnails',$1)", [oldName]);
    await save({ ...project, frameId: 'stars' }, 1);
    await expect(asUser(USER_A, "update storage.objects set metadata='{\"old\":true}' where name=$1", [oldName])).rejects.toThrow(/row-level security/);
    await expect(asUser(USER_A, "insert into storage.objects(bucket_id,name) values ('thumbnails',$1)", [`${USER_A}/${project.id}.thumb`])).rejects.toThrow(/row-level security/);
    await expect(asUser(USER_A, "insert into storage.objects(bucket_id,name) values ('thumbnails',$1)", [`${USER_A}/${project.id}.v3.thumb`])).rejects.toThrow(/row-level security/);
    await asUser(USER_A, "insert into storage.objects(bucket_id,name) values ('thumbnails',$1)", [nextName]);
    expect((await asUser(USER_A, 'select name from storage.objects where name=$1', [nextName])).rows).toHaveLength(1);
    expect((await asUser(USER_A, 'delete from storage.objects where name=$1 returning name', [oldName])).rows).toHaveLength(1);
  });
});
