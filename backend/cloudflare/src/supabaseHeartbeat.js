// codeguard:components:start
// codeguard:defines: createSupabaseHeartbeat
export function createSupabaseHeartbeat({ fetcher = fetch } = {}) {
  return async function heartbeat(env) {
    const value = env.SUPABASE_URL, key = env.SUPABASE_SECRET_KEY;
    if (typeof value !== 'string' || typeof key !== 'string' || !key.startsWith('sb_secret_')
      || key.length <= 10 || /[\p{Cc}\p{White_Space}]/u.test(key))
      throw new Error('Supabase heartbeat configuration is invalid.');

    let origin;
    try { origin = new URL(value); } catch { throw new Error('Supabase heartbeat configuration is invalid.'); }
    if (origin.protocol !== 'https:' || origin.port || !/^[a-z0-9-]+\.supabase\.co$/.test(origin.hostname)
      || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash)
      throw new Error('Supabase heartbeat configuration is invalid.');

    const response = await fetcher(`${origin.origin}/rest/v1/rpc/project_heartbeat`, {
      method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: '{}', redirect: 'error', signal: AbortSignal.timeout(10000),
    });
    if (!response?.ok) {
      await response?.body?.cancel();
      throw new Error(`Supabase heartbeat request failed (${response?.status ?? 'unknown'}).`);
    }
    let result;
    try { result = await response.json(); } catch { throw new Error('Supabase heartbeat response was invalid.'); }
    if (result !== true) throw new Error('Supabase heartbeat response was unconfirmed.');
  };
}
// codeguard:components:end
