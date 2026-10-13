import type { SupabaseClient } from '@supabase/supabase-js';
import type { Project } from '../../shared-types/src/index';
import { PersistenceError, type CloudAdapter, type CloudRecord, type CommitResult } from './types';
import { validateProject } from './validation';

function cloudError(error: { message?: string; code?: string }): never {
  if (error.message?.includes('PROJECT_LIMIT')) throw new PersistenceError('LIMIT', '作品が500件になりました。作品を整理してから、もう一度保存してください。');
  throw new PersistenceError('CLOUD', 'この端末に保存済みです。クラウドへ同期できていません。');
}
function commitResult(data: unknown): CommitResult {
  const value = data as { kind?: string; project?: unknown } | null;
  if (!value || !['saved', 'conflict'].includes(String(value.kind))) throw new PersistenceError('CLOUD', '保存結果を確認できませんでした。もう一度同期してください。');
  if (value.kind === 'conflict') return { kind: 'conflict', project: value.project ? validateProject(value.project) : null };
  return { kind: 'saved', project: validateProject(value.project) };
}
export class SupabaseCloud implements CloudAdapter {
  constructor(private client: SupabaseClient) {}
  async list(userId: string): Promise<CloudRecord[]> {
    const records: CloudRecord[] = [];
    // Tombstones do not count toward the 500 live-work quota and can exceed one response page.
    let cursor: string | undefined;
    for (;;) {
      let query = this.client.from('projects').select('id,payload,deleted_at').eq('user_id', userId).order('id').limit(1000);
      if (cursor) query = query.gt('id', cursor);
      const { data, error } = await query;
      if (error) cloudError(error);
      records.push(...(data ?? []).map(row => ({ project: validateProject(row.payload), deleted: row.deleted_at !== null })));
      if (!data || data.length < 1000) return records;
      cursor = data[data.length - 1].id as string;
    }
  }
  async save(project: Project, expectedVersion: number, operationId: string) {
    const { data, error } = await this.client.rpc('save_project', { p_project: project, p_expected_version: expectedVersion, p_operation_id: operationId });
    if (error) cloudError(error);
    return commitResult(data);
  }
  async delete(userId: string, id: string, expectedVersion: number, operationId: string) {
    const { data, error } = await this.client.rpc('delete_project', { p_user_id: userId, p_id: id, p_expected_version: expectedVersion, p_operation_id: operationId });
    if (error) cloudError(error);
    return commitResult(data);
  }
  private thumbnailPath(userId: string, id: string, version: number, renderKey?: string) {
    if (renderKey !== undefined && !/^[a-f0-9]{64}$/.test(renderKey)) throw new PersistenceError('VALIDATION', '画像の素材情報を確認できませんでした。');
    return `${userId}/${id}.v${version}${renderKey === undefined ? '' : `.r${renderKey}`}.thumb`;
  }
  async uploadThumbnail(userId: string, id: string, version: number, blob: Blob, renderKey?: string) {
    if (!Number.isSafeInteger(version) || version < 1) throw new PersistenceError('VALIDATION', '作品の保存を確認してから、サムネイルを保存してください。');
    const { error } = await this.client.storage.from('thumbnails').upload(this.thumbnailPath(userId, id, version, renderKey), blob, { contentType: blob.type, upsert: true });
    if (error) cloudError(error);
    await this.pruneThumbnailVersions(userId, id, version);
  }
  async downloadThumbnail(userId: string, id: string, version: number, renderKey?: string) {
    if (!Number.isSafeInteger(version) || version < 1) return undefined;
    const { data, error } = await this.client.storage.from('thumbnails').download(this.thumbnailPath(userId, id, version, renderKey));
    if (error) return undefined; // A thumbnail is derived and optional; the project state remains authoritative.
    return data ?? undefined;
  }
  async deleteThumbnail(userId: string, id: string) {
    // Versions stay in a flat user folder, so account cleanup also drains every version safely.
    for (;;) {
      const { data, error } = await this.client.storage.from('thumbnails').list(userId, { search: `${id}.`, limit: 100, offset: 0 });
      if (error) cloudError(error);
      const paths = (data ?? []).filter(file => file.name === `${id}.thumb` || file.name === `${id}.webp` || new RegExp(`^${id}\\.v[1-9][0-9]*(?:\\.r[a-f0-9]{64})?\\.thumb$`).test(file.name)).map(file => `${userId}/${file.name}`);
      if (!paths.length) return;
      const { error: removeError } = await this.client.storage.from('thumbnails').remove(paths);
      if (removeError) cloudError(removeError);
    }
  }
  private async pruneThumbnailVersions(userId: string, id: string, version: number) {
    let offset = 0;
    for (;;) {
      const { data, error } = await this.client.storage.from('thumbnails').list(userId, { search: `${id}.`, limit: 100, offset, sortBy: { column: 'name', order: 'asc' } });
      if (error) cloudError(error);
      const files = data ?? [];
      const obsolete = files.filter(file => {
        if (file.name === `${id}.thumb` || file.name === `${id}.webp`) return true;
        const match = new RegExp(`^${id}\\.v([1-9][0-9]*)(?:\\.r[a-f0-9]{64})?\\.thumb$`).exec(file.name);
        return match !== null && BigInt(match[1]) < BigInt(version);
      }).map(file => `${userId}/${file.name}`);
      if (obsolete.length) {
        const { error: removeError } = await this.client.storage.from('thumbnails').remove(obsolete);
        if (removeError) cloudError(removeError);
        // Deletion shifts subsequent entries. Re-read this offset, preserving current/newer versions.
      } else if (files.length < 100) return;
      else offset += files.length;
    }
  }
  async deleteAccountData(expectedUserId: string, signal: AbortSignal) {
    const { data, error: sessionError } = await this.client.auth.getSession();
    if (signal.aborted || sessionError || data.session?.user.id !== expectedUserId) throw new PersistenceError('AUTH', 'アカウントが変わりました。削除するアカウントをもう一度確認してください。');
    // Explicit Authorization cannot be replaced by a later SDK session read.
    const { error } = await this.client.functions.invoke('delete-account-data', {
      body: { confirmation: 'DELETE_MY_DATA', expectedUserId },
      headers: { Authorization: `Bearer ${data.session.access_token}` },
      signal,
    });
    if (signal.aborted) throw new PersistenceError('AUTH', 'アカウントが変わったため、削除処理を中止しました。');
    if (error) cloudError(error);
  }
}
