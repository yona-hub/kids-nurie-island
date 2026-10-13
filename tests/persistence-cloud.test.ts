import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { SupabaseCloud } from '../packages/persistence/src/cloud';
import { USER_A } from './sync.helpers';

function storageFixture() {
  const objects = new Map<string, Blob>();
  const requested: string[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    requested.push(`${init?.method ?? 'GET'} ${url.pathname}`);
    const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } });
    if (url.pathname.endsWith('/object/list/thumbnails')) {
      const body = JSON.parse(String(init?.body)) as { prefix: string; search: string; offset: number; limit: number };
      const names = [...objects.keys()].filter(path => path.startsWith(`${body.prefix}/`)).map(path => path.slice(body.prefix.length + 1)).filter(name => name.includes(body.search)).sort();
      return json(names.slice(body.offset,body.offset + body.limit).map(name => ({ name, id: crypto.randomUUID(), metadata: {} })));
    }
    if (init?.method === 'DELETE') {
      const body = JSON.parse(String(init.body)) as { prefixes: string[] };
      for (const path of body.prefixes) objects.delete(path);
      return json([]);
    }
    const marker = '/thumbnails/';
    const path = decodeURIComponent(url.pathname.slice(url.pathname.indexOf(marker) + marker.length));
    if (init?.method === 'POST') { objects.set(path, new Blob(['uploaded'], { type: 'image/png' })); return json({ Key: `thumbnails/${path}` }); }
    const blob = objects.get(path);
    return blob ? new Response(blob) : new Response(JSON.stringify({ message: 'not found', statusCode: '404' }), { status: 404, headers: { 'content-type': 'application/json' } });
  };
  const client = createClient('https://fixture.supabase.co', 'sb_publishable_test', { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetcher } });
  return { cloud: new SupabaseCloud(client), objects, requested };
}
describe('Supabase Storage adapter version contract', () => {
  it('separates asset fingerprints at one project version and removes them on deletion', async () => {
    const { cloud, objects, requested } = storageFixture(); const id = crypto.randomUUID();
    const older = 'a'.repeat(64), newer = 'b'.repeat(64);
    await cloud.uploadThumbnail(USER_A, id, 1, new Blob(['new'], { type: 'image/png' }), newer);
    await cloud.uploadThumbnail(USER_A, id, 1, new Blob(['old'], { type: 'image/png' }), older);
    expect(objects.has(`${USER_A}/${id}.v1.r${newer}.thumb`)).toBe(true);
    expect(objects.has(`${USER_A}/${id}.v1.r${older}.thumb`)).toBe(true);
    await cloud.downloadThumbnail(USER_A, id, 1, newer);
    expect(requested.at(-1)).toContain(`${id}.v1.r${newer}.thumb`);
    expect(await cloud.downloadThumbnail(USER_A, id, 1)).toBeUndefined();
    await expect(cloud.downloadThumbnail(USER_A, id, 1, '../bad')).rejects.toMatchObject({ code: 'VALIDATION' });
    await cloud.uploadThumbnail(USER_A, id, 2, new Blob(['v2'], { type: 'image/png' }), newer);
    expect([...objects.keys()]).toEqual([`${USER_A}/${id}.v2.r${newer}.thumb`]);
    await cloud.deleteThumbnail(USER_A, id); expect(objects.size).toBe(0);
  });
  it('requests exactly the project version, prunes only older versions, and preserves a concurrent newer upload', async () => {
    const { cloud, objects, requested } = storageFixture(); const id = crypto.randomUUID(); const other = crypto.randomUUID();
    for (const suffix of ['.thumb','.v1.thumb','.v2.thumb','.v4.thumb']) objects.set(`${USER_A}/${id}${suffix}`, new Blob([suffix], { type: 'image/png' }));
    objects.set(`${USER_A}/${other}.v1.thumb`, new Blob(['other']));
    await cloud.uploadThumbnail(USER_A, id, 3, new Blob(['new'], { type: 'image/png' }));
    expect(objects.has(`${USER_A}/${id}.thumb`)).toBe(false); expect(objects.has(`${USER_A}/${id}.v1.thumb`)).toBe(false);
    expect(objects.has(`${USER_A}/${id}.v2.thumb`)).toBe(false); expect(objects.has(`${USER_A}/${id}.v4.thumb`)).toBe(true);
    expect(objects.has(`${USER_A}/${other}.v1.thumb`)).toBe(true);
    expect(await cloud.downloadThumbnail(USER_A,id,2)).toBeUndefined();
    expect(await (await cloud.downloadThumbnail(USER_A,id,3))?.text()).toBe('uploaded');
    expect(requested.some(path => path.includes(`${id}.v3.thumb`))).toBe(true);
    expect(requested.some(path => path.includes(`${id}.thumb`))).toBe(false);
  });
  it('drains more than one page of versions on project deletion without touching another work', async () => {
    const { cloud, objects } = storageFixture(); const id = crypto.randomUUID(); const other = crypto.randomUUID();
    for (let version = 1; version <= 205; version++) objects.set(`${USER_A}/${id}.v${version}.thumb`, new Blob(['old']));
    objects.set(`${USER_A}/${id}.thumb`, new Blob(['legacy'])); objects.set(`${USER_A}/${other}.v1.thumb`, new Blob(['keep']));
    await cloud.deleteThumbnail(USER_A,id);
    expect([...objects.keys()]).toEqual([`${USER_A}/${other}.v1.thumb`]);
  });
});
