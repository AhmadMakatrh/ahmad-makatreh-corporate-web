// codeguard:components:start
// codeguard:defines: createAdminDocumentHandler
import { readJson as parseJsonRequest } from './httpJson.js';
import { utcNow as nowUtc } from './inquiryTime.js';
import { parseDocumentRequest as parseDocumentRequestRef, parseDocumentRevision as parseDocumentRevisionRef, revisionJson as revisionJsonRef } from './siteDocumentWire.js';
import { validateSiteDocument as checkSiteDocument } from './siteDocumentValidator.js';
import { prepareDocumentBody as makeDocumentBody } from './documentBodies.js';
import { getDocument as readDocument, saveDraft as saveDraftRef, publishDocument as publishDocumentRef, listDocumentHistory as listDocumentHistoryRef, getDocumentVersion as readDocumentVersion, readDocumentBackup as readDocumentBackupRef } from './siteDocuments.js';

const maximum = 9223372036854775807n;
const maximumRef = maximum;
const response = (body, status = 200) => new Response(JSON.stringify(body, (_key, value) => typeof value === 'bigint' ? revisionJsonRef(value) : value), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});
const responseRef = response;
const error = (message, status = 400) => responseRef({ message }, status);
const errorRef = error;

export function createAdminDocumentHandler({ now = Date.now, siteReader } = {}) {
  return async (request, env, identity, access) => {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '').slice('/api/admin'.length);
    if (path === '/backup/documents') return request.method === 'GET' ? responseRef(await readDocumentBackupRef(env.DB, nowUtc(now()))) : errorRef('Method not allowed.', 405);
    if (!path.startsWith('/documents')) return null;
    const route = /^\/documents\/([^/]+)(?:\/(publish|history|restore))?$/.exec(path);
    if (!route || !['pricing','content','pages'].includes(route[1])) return errorRef('Not found.', 404);
    const [, key, action] = route;
    if (!(action === 'history' ? ['GET'] : action ? ['POST'] : ['GET','PUT']).includes(request.method)) return errorRef('Method not allowed.', 405);
    if (request.method === 'GET') {
      if (action !== 'history') return responseRef(await readDocument(env.DB, key));
      const cursor = url.searchParams.get('before'), before = cursor === null ? maximumRef : parseDocumentRevisionRef(cursor, 1n);
      return before === null ? errorRef('Invalid revision cursor.') : responseRef(await listDocumentHistoryRef(env.DB, key, before));
    }
    const denied = await access.validateMutation(request, env, identity); if (denied) return denied;
    const type = (request.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
    if (type !== 'application/json' && !type.endsWith('+json')) return errorRef('Invalid request data.', 415);
    const parsed = await parseJsonRequest(request, 6291456, parseDocumentRequestRef), body = parsed.value;
    if (parsed.oversized) return errorRef('Request body is too large.', 413);
    if (parsed.invalid || !body || typeof body !== 'object' || Array.isArray(body)) return errorRef('Invalid request data.');
    const expected = body.expectedRevision ?? (Object.hasOwn(body, 'expectedRevision') ? null : 0n);
    if (typeof expected !== 'bigint' || expected < 0n || expected >= maximumRef) return errorRef('Invalid revision.');
    const time = nowUtc(now());
    if (!action) {
      const json = JSON.stringify(body.data), invalid = checkSiteDocument(key, body.data, json);
      if (invalid) return errorRef(invalid);
      const saved = await saveDraftRef(env.DB, key, await makeDocumentBody(json), expected, identity.email, time);
      return saved ? responseRef({ revision: expected + 1n }) : errorRef('Document changed. Reload before saving.', 409);
    }
    if (action === 'publish') {
      if (expected < 1n) return errorRef('Save a draft before publishing.');
      if (Object.hasOwn(body, 'restorePrevious') && typeof body.restorePrevious !== 'boolean') return errorRef('Invalid request data.');
      const saved = await publishDocumentRef(env.DB, key, expected, body.restorePrevious === true, identity.email, time);
      if (!saved) return errorRef('Document changed, is already published, or previous publication is unavailable.', 409);
      siteReader?.invalidate();
      return responseRef({ revision: expected + 1n, publishedAtUtc: time });
    }
    if (expected < 1n || typeof body.revision !== 'bigint' || body.revision < 1n) return errorRef('Invalid revision.');
    const version = await readDocumentVersion(env.DB, key, body.revision);
    if (!version) return errorRef('Not found.', 404);
    const invalid = checkSiteDocument(key, version.data, version.json); if (invalid) return errorRef(invalid);
    const saved = await saveDraftRef(env.DB, key, await makeDocumentBody(version.json), expected, identity.email, time,
      { action: `restore:${body.revision}`, existingBodyId: version.bodyId });
    return saved ? responseRef({ revision: expected + 1n, draft: version.data }) : errorRef('Document changed. Reload before restoring.', 409);
  };
}
// codeguard:components:end
