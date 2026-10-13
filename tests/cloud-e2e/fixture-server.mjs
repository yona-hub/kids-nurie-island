/* global Request */
import { createServer } from 'node:http';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { APP_ORIGIN, API_ORIGIN, BUILD_DIRECTORY, CONTROL_KEY, PUBLISHABLE_KEY, USER_ID, SOURCE_PREVIEW } from './fixture-config.mjs';
import { createFixtureDatabase, asUser } from './fixture-sql.mjs';

// This loopback-only service is test infrastructure; it is never part of the web build.
const db = await createFixtureDatabase(), root = path.resolve(BUILD_DIRECTORY);
const signingKey = crypto.getRandomValues(new Uint8Array(32));
const codes = new Map(), sessions = new Map(), thumbnails = new Map();
const blockedDevices = new Set();
let events = [], caseName = 'initial', failSaves = false, nextDevice = 0;
const user = () => ({ id: USER_ID, aud: 'authenticated', role: 'authenticated', email: 'cloud-e2e@example.invalid', app_metadata: { provider: 'google', providers: ['google'] }, user_metadata: { full_name: 'クラウド結合テスト' }, created_at: '2026-10-07T00:00:00Z' });
const encoded = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const signature = text => createHmac('sha256', signingKey).update(text).digest('base64url');
function issueSession(device = ++nextDevice) {
  const now = Math.floor(Date.now() / 1000), sessionId = randomUUID();
  const payload = `${encoded({ alg: 'HS256', typ: 'JWT' })}.${encoded({ sub: USER_ID, aud: 'authenticated', role: 'authenticated', exp: now + 3600, iat: now, iss: `${API_ORIGIN}/auth/v1`, session_id: sessionId })}`;
  const value = { access_token: `${payload}.${signature(payload)}`, refresh_token: randomUUID(), token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, user: user() };
  sessions.set(value.refresh_token, { sessionId, device, value }); return value;
}
function authenticated(req) {
  const token = req.headers.authorization?.replace(/^Bearer /, '') ?? '', parts = token.split('.');
  if (parts.length !== 3) throw new Error('UNAUTHORIZED');
  const expected = Buffer.from(signature(`${parts[0]}.${parts[1]}`)), actual = Buffer.from(parts[2]);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('UNAUTHORIZED');
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  const session = [...sessions.values()].find(value => value.sessionId === claims.session_id);
  if (claims.exp <= Date.now() / 1000 || claims.sub !== USER_ID || !session) throw new Error('UNAUTHORIZED');
  return { userId: claims.sub, device: session.device };
}
async function bytes(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 1024 * 1024) throw new Error('BODY_TOO_LARGE'); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
const jsonBody = async req => JSON.parse((await bytes(req)).toString() || '{}');
const json = (res, value, status = 200) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(value)); };
async function reset(name) {
  await db.exec('truncate auth.users cascade; truncate storage.objects;');
  await db.query('insert into auth.users(id) values($1)', [USER_ID]);
  codes.clear(); sessions.clear(); thumbnails.clear(); blockedDevices.clear(); nextDevice = 0; events = []; caseName = name; failSaves = false;
}
await reset('initial');
const api = createServer(async (req, res) => {
  const url = new URL(req.url, API_ORIGIN), pathname = url.pathname;
  res.setHeader('access-control-allow-origin', APP_ORIGIN);
  res.setHeader('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('access-control-allow-headers', 'authorization,apikey,x-client-info,x-supabase-api-version,content-type,content-profile,accept-profile,x-upsert,x-fixture-control,cache-control,prefer,range');
  res.setHeader('cache-control', 'no-store');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const event = { sequence: events.length + 1, at: new Date().toISOString(), method: req.method, path: pathname };
  if (!pathname.startsWith('/__control/')) { events.push(event); res.on('finish', () => { event.status = res.statusCode; }); }
  try {
    if (pathname === '/health') return json(res, { fixture: 'island-cloud-e2e', ready: true });
    if (pathname.startsWith('/__control/')) {
      if (req.headers['x-fixture-control'] !== CONTROL_KEY) return json(res, { error: 'fixture control required' }, 403);
      if (pathname.endsWith('/reset') && req.method === 'POST') { await reset(String((await jsonBody(req)).caseName)); return json(res, { ready: true }); }
      if (pathname.endsWith('/failures') && req.method === 'POST') { failSaves = (await jsonBody(req)).save === true; return json(res, { failSaves }); }
      if (pathname.endsWith('/connection') && req.method === 'POST') {
        const { device, online } = await jsonBody(req);
        if (!Number.isSafeInteger(device) || device < 1 || typeof online !== 'boolean') return json(res, { error: 'invalid device connection' }, 400);
        if (online) blockedDevices.delete(device); else blockedDevices.add(device);
        return json(res, { device, online });
      }
      if (pathname.endsWith('/app-network') && req.method === 'POST') {
        const available = (await jsonBody(req)).available === true;
        if (!available && app.listening) await new Promise(resolve => { app.close(resolve); app.closeAllConnections(); });
        if (available && !app.listening) await new Promise(resolve => app.listen(new URL(APP_ORIGIN).port, '127.0.0.1', resolve));
        return json(res, { listening: app.listening });
      }
      if (pathname.endsWith('/state') && req.method === 'GET') return json(res, { caseName, failSaves, userId: USER_ID, events, projects: (await db.query('select id,payload,deleted_at from public.projects order by id')).rows, receipts: (await db.query('select user_id,operation_id,project_id,result from private.operation_receipts order by created_at')).rows, thumbnails: [...thumbnails.keys()] });
      return json(res, { error: 'unknown control' }, 404);
    }
    if (pathname === '/auth/v1/authorize') {
      const challenge = url.searchParams.get('code_challenge');
      if (url.searchParams.get('provider') !== 'google' || url.searchParams.get('redirect_to') !== `${APP_ORIGIN}/auth/callback` || url.searchParams.get('code_challenge_method')?.toLowerCase() !== 's256' || !challenge) return json(res, { error: 'invalid PKCE authorization' }, 400);
      const code = randomUUID(); codes.set(code, { challenge, expiresAt: Date.now() + 300_000 });
      event.pkceChallenge = true; res.writeHead(302, { location: `${APP_ORIGIN}/auth/callback?code=${code}` }); res.end(); return;
    }
    if (req.headers.apikey !== PUBLISHABLE_KEY) return json(res, { error: 'fixture publishable key required' }, 401);
    if (pathname === '/auth/v1/token') {
      const body = await jsonBody(req);
      if (url.searchParams.get('grant_type') === 'pkce') {
        const request = codes.get(body.auth_code);
        const challenge = createHash('sha256').update(String(body.code_verifier)).digest('base64url');
        if (!request || request.expiresAt < Date.now() || challenge !== request.challenge) return json(res, { code: 'bad_code_verifier', msg: 'fixture PKCE mismatch' }, 400);
        codes.delete(body.auth_code); event.pkceVerified = true; return json(res, issueSession());
      }
      if (url.searchParams.get('grant_type') === 'refresh_token' && sessions.has(body.refresh_token)) {
        const { device } = sessions.get(body.refresh_token); event.device = device;
        if (blockedDevices.has(device)) { event.connectionClosed = true; req.socket.destroy(); return; }
        sessions.delete(body.refresh_token); event.refresh = true; return json(res, issueSession(device));
      }
      return json(res, { code: 'refresh_token_not_found', msg: 'fixture session unavailable' }, 400);
    }
    const { userId, device } = authenticated(req); event.userId = userId; event.device = device;
    if (blockedDevices.has(device)) { event.connectionClosed = true; req.socket.destroy(); return; }
    if (pathname === '/auth/v1/user') return json(res, user());
    if (pathname === '/auth/v1/logout') return json(res, {});
    if (pathname === '/rest/v1/projects' && req.method === 'GET') {
      const columns = (url.searchParams.get('select') ?? 'id,payload,deleted_at').split(',');
      if (!columns.length || columns.some(column => !['id', 'payload', 'deleted_at'].includes(column))) return json(res, { message: 'Unsupported fixture projection' }, 400);
      const requestedOwner = url.searchParams.get('user_id')?.replace(/^eq\./, '');
      const cursor = url.searchParams.get('id')?.replace(/^gt\./, '') ?? '00000000-0000-0000-0000-000000000000';
      return json(res, (await asUser(db, userId, `select ${columns.join(',')} from public.projects where user_id=$1 and id>$2 order by id limit 1000`, [requestedOwner, cursor])).rows);
    }
    if (pathname === '/rest/v1/rpc/save_project' && req.method === 'POST') {
      const body = await jsonBody(req); event.projectId = body.p_project?.id; event.expectedVersion = body.p_expected_version; event.operationId = body.p_operation_id;
      if (failSaves) { event.injectedFailure = true; return json(res, { code: 'FIXTURE_RETRYABLE', message: 'Deliberate temporary fixture outage' }, 503); }
      const result = (await asUser(db, userId, 'select public.save_project($1::jsonb,$2::bigint,$3::uuid) as result', [JSON.stringify(body.p_project), body.p_expected_version, body.p_operation_id])).rows[0].result;
      event.resultKind = result.kind; event.version = result.project?.version; return json(res, result);
    }
    if (pathname === '/rest/v1/rpc/delete_project' && req.method === 'POST') {
      const body = await jsonBody(req);
      const result = (await asUser(db, userId, 'select public.delete_project($1::uuid,$2::uuid,$3::bigint,$4::uuid) as result', [body.p_user_id, body.p_id, body.p_expected_version, body.p_operation_id])).rows[0].result;
      event.resultKind = result.kind; return json(res, result);
    }
    if (pathname === '/storage/v1/object/list/thumbnails' && req.method === 'POST') {
      const body = await jsonBody(req), prefix = `${body.prefix}/`;
      const visible = (await asUser(db, userId, "select name from storage.objects where bucket_id='thumbnails' order by name")).rows;
      return json(res, visible.filter(row => row.name.startsWith(prefix) && row.name.slice(prefix.length).includes(body.search ?? '')).slice(body.offset ?? 0, (body.offset ?? 0) + (body.limit ?? 100)).map(row => ({ name: row.name.slice(prefix.length), id: randomUUID(), metadata: {} })));
    }
    if (pathname === '/storage/v1/object/thumbnails' && req.method === 'DELETE') {
      const body = await jsonBody(req);
      for (const name of body.prefixes ?? []) { const removed = await asUser(db, userId, "delete from storage.objects where bucket_id='thumbnails' and name=$1 returning name", [name]); if (removed.rows.length) thumbnails.delete(name); }
      return json(res, []);
    }
    const storage = /^\/storage\/v1\/object\/(?:authenticated\/)?thumbnails\/(.+)$/.exec(pathname);
    if (storage) {
      const name = decodeURIComponent(storage[1]);
      if (req.method === 'POST' || req.method === 'PUT') {
        const raw = await bytes(req); let blob = { bytes: raw, type: req.headers['content-type'] ?? 'application/octet-stream' };
        if (String(req.headers['content-type']).startsWith('multipart/')) {
          const form = await new Request(url, { method: 'POST', headers: { 'content-type': req.headers['content-type'] }, body: raw }).formData();
          const file = [...form.values()].find(value => typeof value !== 'string');
          if (!file) throw new Error('NO_UPLOAD'); blob = { bytes: Buffer.from(await file.arrayBuffer()), type: file.type };
        }
        if (!['image/png', 'image/webp'].includes(blob.type) || blob.bytes.length > 512 * 1024) return json(res, { message: 'fixture thumbnail limits' }, 400);
        await asUser(db, userId, "insert into storage.objects(bucket_id,name,metadata) values('thumbnails',$1,$2::jsonb) on conflict(bucket_id,name) do update set metadata=excluded.metadata", [name, JSON.stringify({ mimetype: blob.type, size: blob.bytes.length })]);
        thumbnails.set(name, blob); return json(res, { Key: `thumbnails/${name}` });
      }
      if (req.method === 'GET') {
        const visible = await asUser(db, userId, "select name from storage.objects where bucket_id='thumbnails' and name=$1", [name]), blob = thumbnails.get(name);
        if (!visible.rows.length || !blob) return json(res, { message: 'not found' }, 404);
        res.writeHead(200, { 'content-type': blob.type }); res.end(blob.bytes); return;
      }
    }
    return json(res, { error: `Unhandled fixture endpoint ${req.method} ${pathname}` }, 404);
  } catch (error) { event.error = error.message; return json(res, { code: error.code ?? 'FIXTURE_ERROR', message: error.message }, error.message === 'UNAUTHORIZED' ? 401 : 500); }
});
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
// Standard local source preview for SDK regression while new artwork awaits
// release approval. Never disables the production asset-approval build plugin.
let sourcePreview;
const app = createServer(async (req, res) => {
  if(sourcePreview){
    // A source preview has no production SW. Serve unchanged public assets with
    // normal fresh HTTP caching so an offline SDK scenario does not accidentally
    // test Vite's no-cache development image responses. Modules still go through
    // Vite; no browser error is suppressed and no app asset is synthesized.
    const publicRoot=path.resolve('apps/web/public');
    const pathname=decodeURIComponent(new URL(req.url,APP_ORIGIN).pathname),filename=path.resolve(publicRoot,`.${pathname}`);
    if(filename.startsWith(`${publicRoot}${path.sep}`)&&(await stat(filename).catch(()=>undefined))?.isFile()){
      res.writeHead(200,{'content-type':mime[path.extname(filename)]??'application/octet-stream','cache-control':'public, max-age=3600'});res.end(await readFile(filename));return;
    }
    sourcePreview.middlewares(req,res,()=>{res.writeHead(404);res.end();});return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, APP_ORIGIN).pathname), filename = path.resolve(root, `.${pathname}`);
    if (filename !== root && !filename.startsWith(`${root}${path.sep}`)) { res.writeHead(403); res.end(); return; }
    const info = await stat(filename).catch(() => undefined);
    const target = info?.isFile() ? filename : path.extname(pathname) ? undefined : path.join(root, 'index.html');
    if (!target) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': mime[path.extname(target)] ?? 'application/octet-stream', 'cache-control': 'no-cache' }); res.end(await readFile(target));
  } catch (error) { res.writeHead(500); res.end(error.message); }
});
if(SOURCE_PREVIEW)sourcePreview=await(await import('vite')).createServer({server:{middlewareMode:true,hmr:false,ws:{server:app}}});
await Promise.all([new Promise(resolve => api.listen(new URL(API_ORIGIN).port, '127.0.0.1', resolve)), new Promise(resolve => app.listen(new URL(APP_ORIGIN).port, '127.0.0.1', resolve))]);
console.log(`Cloud E2E fixture ready: ${APP_ORIGIN} / ${API_ORIGIN}`);
const close = () => { api.close(); app.close(); api.closeAllConnections(); app.closeAllConnections(); void Promise.all([db.close(),sourcePreview?.close()]).finally(() => process.exit(0)); };
process.once('SIGTERM', close); process.once('SIGINT', close);
