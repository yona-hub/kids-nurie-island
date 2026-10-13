import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import type { Project } from '../packages/shared-types/src/index';
import { PersistenceError, type CloudRecord, type CommitResult } from '../packages/persistence/src/types';
import { MemoryCloud } from './sync.helpers';

/** Actual migration/RLS adapter: no quota or payload-validation simulation. */
export class SqlCloud extends MemoryCloud {
  constructor(readonly db: PGlite) { super(); }
  rejected: string[] = [];
  static async create() {
    const db = new PGlite();
    await db.exec(`
      create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
      create schema auth; create table auth.users (id uuid primary key);
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
    const directory = new URL('../supabase/migrations/', import.meta.url);
    for (const file of (await readdir(directory)).filter(file => file.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, directory), 'utf8'));
    return new SqlCloud(db);
  }
  async asUser<T>(userId: string, sql: string, params: unknown[] = []) {
    return this.db.transaction(async tx => {
      await tx.exec('set local role authenticated');
      await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [userId]);
      return tx.query<T>(sql, params);
    });
  }
  async seed(userId: string, count: number) {
    await this.db.query('insert into auth.users(id) values ($1)', [userId]);
    await this.asUser(userId, `do $$ declare i int; p jsonb; begin for i in 1..${count} loop
      p := jsonb_build_object('schemaVersion',1,'id',gen_random_uuid(),'userId',auth.uid(),'templateId','ocean','title','うみ','status','draft','regions','{}'::jsonb,'backgroundId','white','frameId','none','metadata','{}'::jsonb);
      perform public.save_project(p,0,gen_random_uuid()); end loop; end $$;`);
  }
  override async list(userId: string): Promise<CloudRecord[]> {
    const result = await this.asUser<{ payload: Project; deleted: boolean }>(userId, 'select payload, deleted_at is not null as deleted from public.projects order by id');
    return result.rows.map(row => ({ project: row.payload, deleted: row.deleted }));
  }
  private async commit(userId: string, sql: string, params: unknown[]): Promise<CommitResult> {
    try { return (await this.asUser<{ result: CommitResult }>(userId, sql, params)).rows[0].result; }
    catch (error) {
      this.rejected.push(String(error));
      if (String(error).includes('PROJECT_LIMIT')) throw new PersistenceError('LIMIT', '作品が500件です。作品を整理してください。');
      throw error;
    }
  }
  override async save(project: Project, expectedVersion: number, operationId: string): Promise<CommitResult> {
    this.saves++;
    return this.commit(project.userId, 'select public.save_project($1::jsonb,$2::bigint,$3::uuid) as result', [JSON.stringify(project), expectedVersion, operationId]);
  }
  override async delete(userId: string, id: string, expectedVersion: number, operationId: string): Promise<CommitResult> {
    return this.commit(userId, 'select public.delete_project($1::uuid,$2::uuid,$3::bigint,$4::uuid) as result', [userId, id, expectedVersion, operationId]);
  }
}
