import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

/** The digest names the exact published bytes; format/schema versions are separate. */
export function revisionUrl(kind, id, extension, contents) {
  if (!['templates', 'backgrounds', 'frames'].includes(kind) || !/^[a-z0-9-]+$/.test(id) || !['json', 'svg', 'png'].includes(extension)) throw new Error('素材の公開パスが不正です');
  const digest = createHash('sha256').update(contents).digest('hex');
  return `/content/${kind}/${id}.${digest}.${extension}`;
}

/** Saved region paints refer to logical IDs. Geometry changes require a new ID. */
export function assertCompatibleTemplate(previous, next) {
  if (!previous?.approved) return;
  const regions = template => template.regions.map(region => ({ id: region.id, path: region.path }));
  if (previous.id !== next.id || JSON.stringify(regions(previous)) !== JSON.stringify(regions(next))) {
    throw new Error(`${next.id}: 公開済み領域のID・順序・形状は変更できません。新しいtemplate IDを使用してください。`);
  }
}

/** Never overwrite an immutable URL, including revisions retained by older clients. */
export async function publishRevision(publicRoot, kind, id, extension, contents) {
  const url = revisionUrl(kind, id, extension, contents);
  const file = path.join(publicRoot, kind, path.posix.basename(url));
  try {
    await fs.writeFile(file, contents, { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const existing = await fs.readFile(file);
    if (!existing.equals(Buffer.from(contents))) throw new Error(`内容hashと公開ファイルが一致しません: ${url}`, { cause: error });
  }
  return url;
}
