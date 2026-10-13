import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { deleteAccountRequest, type DeletionBackend } from './handler.ts';

Deno.serve(async (request: Request) => {
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const secretKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !secretKey) return new Response(JSON.stringify({ error: 'FUNCTION_CONFIGURATION' }), { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const origins = (Deno.env.get('APP_ORIGINS') ?? '').split(',').map(value => value.trim()).filter(Boolean);
  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const backend: DeletionBackend = {
    async userForToken(token) {
      const { data, error } = await admin.auth.getUser(token);
      return error ? null : data.user?.id ?? null;
    },
    async verifiedSubject(token) {
      const { data, error } = await admin.auth.getClaims(token);
      return error ? null : data?.claims.sub ?? null;
    },
    async state(userId) {
      const { data, error } = await admin.rpc('account_deletion_state', { p_user_id: userId });
      if (error) throw error;
      return data;
    },
    async begin(token) {
      const scoped = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
      const { error } = await scoped.rpc('begin_account_deletion');
      if (error) throw error;
    },
    async listThumbnails(userId) {
      const { data, error } = await admin.storage.from('thumbnails').list(userId, { limit: 100, offset: 0 });
      if (error) throw error;
      return (data ?? []).map(file => file.name);
    },
    async removeThumbnails(paths) {
      const { error } = await admin.storage.from('thumbnails').remove(paths);
      if (error) throw error;
    },
    async finish(userId) {
      const { error } = await admin.rpc('finish_account_deletion', { p_user_id: userId });
      if (error) throw error;
    },
    async revokeSessions(token) {
      const { error } = await admin.auth.admin.signOut(token, 'global');
      if (error && ![401,403,404].includes(error.status ?? 0)) throw error;
    },
    async deleteUser(userId) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
  };
  return deleteAccountRequest(request, origins, backend);
});
