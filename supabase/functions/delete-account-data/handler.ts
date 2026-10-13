export interface DeletionBackend {
  userForToken(token: string): Promise<string | null>;
  verifiedSubject(token: string): Promise<string | null>;
  state(userId: string): Promise<'none' | 'pending' | 'done'>;
  begin(token: string): Promise<void>;
  listThumbnails(userId: string): Promise<string[]>;
  removeThumbnails(paths: string[]): Promise<void>;
  finish(userId: string): Promise<void>;
  revokeSessions(token: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
}

/** The actual HTTP authorization and cleanup sequence is also exercised in offline tests. */
export async function deleteAccountRequest(request: Request, origins: string[], backend: DeletionBackend): Promise<Response> {
  const origin = request.headers.get('origin') ?? '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', 'Vary': 'Origin' };
  const respond = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers });
  if (!origins.length) return respond(503, { error: 'FUNCTION_CONFIGURATION' });
  if (!origins.includes(origin)) return respond(403, { error: 'ORIGIN_NOT_ALLOWED' });
  headers['Access-Control-Allow-Origin'] = origin;
  headers['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type, x-client-info';
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return respond(405, { error: 'METHOD_NOT_ALLOWED' });
  const authorization = request.headers.get('authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) return respond(401, { error: 'AUTH_REQUIRED' });
  let expectedUserId: string;
  try {
    const reader = request.body?.getReader();
    const decoder = new TextDecoder();
    let bytes = 0, text = '';
    if (reader) for (;;) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 1024) { await reader.cancel(); return respond(400, { error: 'INVALID_BODY' }); }
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
    const body = JSON.parse(text);
    if (body.confirmation !== 'DELETE_MY_DATA') return respond(400, { error: 'CONFIRMATION_REQUIRED' });
    if (typeof body.expectedUserId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.expectedUserId)) return respond(400, { error: 'EXPECTED_USER_REQUIRED' });
    expectedUserId = body.expectedUserId;
  } catch { return respond(400, { error: 'INVALID_BODY' }); }
  const token = authorization.slice(7);
  try {
    let userId = await backend.userForToken(token);
    let resuming = false;
    if (!userId) {
      // Verification checks signature/expiry. Decoding an incoming JWT is never sufficient.
      userId = await backend.verifiedSubject(token);
      if (!userId) return respond(401, { error: 'AUTH_REQUIRED' });
      if (userId !== expectedUserId) return respond(403, { error: 'ACCOUNT_CHANGED' });
      const state = await backend.state(userId);
      if (state === 'done') return respond(200, { deleted: true });
      if (state !== 'pending') return respond(401, { error: 'AUTH_REQUIRED' });
      resuming = true;
    }
    if (userId !== expectedUserId) return respond(403, { error: 'ACCOUNT_CHANGED' });
    if (!resuming) await backend.begin(token);
    for (;;) {
      const files = await backend.listThumbnails(userId);
      if (!files.length) break;
      await backend.removeThumbnails(files.map(file => `${userId}/${file}`));
    }
    await backend.finish(userId);
    await backend.revokeSessions(token);
    await backend.deleteUser(userId);
    return respond(200, { deleted: true });
  } catch {
    return respond(503, { error: 'DELETION_PENDING', message: '削除を完了できませんでした。もう一度お試しください。' });
  }
}
