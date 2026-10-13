// Build-time declarations only. Production uses Deno's runtime and pinned npm imports.
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};
declare module 'npm:@supabase/supabase-js@2.117.2' {
  export const createClient: typeof import('@supabase/supabase-js')['createClient'];
}
