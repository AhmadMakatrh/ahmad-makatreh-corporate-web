// codeguard:components:start
// codeguard:defines: createSiteReader
import { decodeDocumentBody as decodeDocumentBodyRef } from './documentBodies.js';
const loadPublishedRef = loadPublished;


/** @typedef {{json:string, etag:string, documents:Record<string,object>}} PublishedSnapshot */

/** @returns {{read(db:object):Promise<PublishedSnapshot>, invalidate():void}} */
export function createSiteReader({ now = Date.now } = {}) {
  let snapshot = null, expires = 0, pending = null, generation = 0;
  return {
    invalidate() { generation++; snapshot = null; pending = null; },
    async read(db) {
      if (snapshot && expires > now()) return snapshot;
      if (pending) return pending;
      const currentGeneration = generation;
      const current = loadPublishedRef(db).then(result => {
        if (currentGeneration === generation) { snapshot = result; expires = now() + 30000; }
        return result;
      }).finally(() => { if (pending === current) pending = null; });
      pending = current;
      return pending;
    },
  };
}

async function loadPublished(db) {
  try {
    const { results } = await db.prepare(`SELECT d.key, c.part_number, c.content
      FROM site_documents d LEFT JOIN site_document_chunks c ON c.body_id = d.published_body_id
      WHERE d.published_body_id IS NOT NULL AND d.key IN ('pricing','content','pages')
      ORDER BY d.key, c.part_number LIMIT 31`).all();
    if (results.length > 30) throw new Error('Chunk limit exceeded');
    const grouped = new Map();
    for (const row of results) {
      const parts = grouped.get(row.key) ?? [];
      parts.push(row); grouped.set(row.key, parts);
    }
    const documents = {};
    for (const [key, parts] of grouped) {
      documents[key] = decodeDocumentBodyRef(parts).data;
    }
    const json = JSON.stringify(documents);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json));
    const etag = '"' + Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('') + '"';
    return { json, etag, documents: documents };
  } catch (cause) {
    throw new Error('Published content unavailable.', { cause });
  }
}
// codeguard:components:end
