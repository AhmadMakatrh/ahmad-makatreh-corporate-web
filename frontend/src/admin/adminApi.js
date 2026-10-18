// codeguard:components:start
// codeguard:defines: AdminApiError, createAdminClient, adminApi
const createAdminClientRef = createAdminClient;
export class AdminApiError extends Error {
  constructor(status, message) { super(message); this.name = 'AdminApiError'; this.status = status; }
}
const AdminApiErrorRef = AdminApiError;

export function createAdminClient(fetcher = (...args) => fetch(...args)) {
  const rememberRef = remember;
  const renewSessionRef = renewSession;
  const requestRef = request;
  const getRef = get;

  const cache = new Map();
  const pending = new Map();
  let csrfToken = null;
  let refreshPromise = null;
  let generation = 0;
  const maxEntries = 40;
  const maxEntriesRef = maxEntries;
  function remember(path, data) {
    cache.delete(path);
    cache.set(path, { data, expires: Date.now() + 60000 });
    if (cache.size > maxEntriesRef) cache.delete(cache.keys().next().value);
    return data;
  }
  function renewSession() {
    if (!refreshPromise) refreshPromise = (async () => {
      try {
        const response = await fetcher('/auth/refresh', { method: 'POST', body: '{}',
          headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', redirect: 'error',
          signal: AbortSignal.timeout(15000) });
        return response.ok;
      } catch { return false; }
    })().finally(() => { refreshPromise = null; });
    return refreshPromise;
  }
  async function request(path, options = {}) {
    const headers = { ...options.headers };
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    if (options.method && options.method !== 'GET') headers['X-Admin-CSRF'] = csrfToken ?? '';
    const send = () => fetcher(`/api/admin${path}`, { ...options, headers: headers, credentials: 'same-origin', redirect: 'error', signal: AbortSignal.timeout(path.startsWith('/media/') || path.endsWith('/replies') ? 60000 : 15000) });
    const sendRef = send;
    let response;
    try {
      response = await sendRef();
      if (response.status === 401 && (!options.method || options.method === 'GET') && await renewSessionRef()) response = await sendRef();
    }
    catch { throw new AdminApiErrorRef(0, 'تعذر الاتصال بالخادم. تحقق من الاتصال ثم أعد المحاولة.'); }
    if (!response.ok) {
      const problem = await response.json().catch(() => null);
      if (response.status === 401 || response.status === 403) { generation++; cache.clear(); csrfToken = null; }
      throw new AdminApiErrorRef(response.status, response.status === 409
        ? problem?.code === 'media_referenced' ? 'الملف مستخدم في مسودة أو نسخة منشورة. أزل مرجعه أولًا قبل إزالته من المكتبة.' : 'تم تعديل البيانات من جلسة أخرى. حدّث البيانات قبل الحفظ.'
        : response.status === 401 && options.method && options.method !== 'GET' ? 'انتهت الجلسة. أعد الدخول قبل إعادة الحفظ.'
        : response.status === 401 || response.status === 403 ? 'يلزم الدخول بحساب الإدارة المصرح له.'
        : response.status === 400 ? `تحقق من بيانات الحقول. ${problem?.message ?? ''}`
        : response.status === 429 ? 'طلبات كثيرة. انتظر قليلاً ثم حاول مجدداً.'
        : 'تعذر إتمام العملية. حاول مجدداً.');
    }
    return response.status === 204 ? null : response.json();
  }
  function get(path, refresh = false) {
    if (pending.has(path)) return pending.get(path);
    const saved = cache.get(path);
    if (!refresh && saved && saved.expires > Date.now()) return Promise.resolve(saved.data);
    const startedGeneration = generation;
    const promise = requestRef(path).then(data => startedGeneration === generation ? rememberRef(path, data) : data).finally(() => pending.delete(path));
    pending.set(path, promise);
    return promise;
  }
  return {
    get: getRef,
    async session(refresh = false) { const session = await getRef('/session', refresh); csrfToken = session.csrfToken; return session; },
    async write(path, method, data) {
      const result = await requestRef(path, { method, body: JSON.stringify(data) });
      if (path === '/inquiries/export') return result;
      generation++;
      const documentPath = path.startsWith('/documents/') ? path.split('/').slice(0, 3).join('/') : null;
      const detailPath = path.startsWith('/inquiries/') ? path.split('/').slice(0, 3).join('/') : null;
      for (const key of cache.keys()) {
        if (path.startsWith('/media/') && (key === '/media' || key.startsWith('/media?'))) cache.delete(key);
        if (documentPath && (key === documentPath || key.startsWith(`${documentPath}/`) || key === '/backup/documents')) cache.delete(key);
        if (detailPath && (key === detailPath || key.startsWith(`${detailPath}/`) || (!path.endsWith('/replies') && (key === '/inquiries' || key.startsWith('/inquiries?'))))) cache.delete(key);
      }
      return result;
    },
    async upload(id, file) {
      const result = await requestRef(`/media/${id}?name=${encodeURIComponent(file.name)}`, { method: 'POST', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
      generation++;
      for (const key of cache.keys()) if (key === '/media' || key.startsWith('/media?')) cache.delete(key);
      return result;
    },
    remember: rememberRef,
    clear() { generation++; cache.clear(); csrfToken = null; }
  };
}

export const adminApi = createAdminClientRef();
// codeguard:components:end
