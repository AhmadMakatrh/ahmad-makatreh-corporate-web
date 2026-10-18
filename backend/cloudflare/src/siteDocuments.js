// codeguard:components:start
// codeguard:defines: getDocument, saveDraft, publishDocument, listDocumentHistory, getDocumentVersion, readDocumentBackup
import { decodeDocumentBody as decodeDocumentBodyRef } from './documentBodies.js';
const historyInsertRef = historyInsert;


const maximum = 9223372036854775807n;
const maximumRef = maximum;
const writable = revision => typeof revision === 'bigint' && revision >= 0n && revision < maximumRef;
const writableRef = writable;
// Legacy publications have no digest. Their indexed immutable parts still permit exact equality.
const equalBodies = (left, right, leftHash, rightHash) => `(${left} = ${right} OR
  (${leftHash} IS NOT NULL AND ${rightHash} IS NOT NULL AND ${leftHash} = ${rightHash}) OR
  ((${leftHash} IS NULL OR ${rightHash} IS NULL)
   AND (SELECT COUNT(*) FROM site_document_chunks WHERE body_id=${left}) > 0
   AND (SELECT COUNT(*) FROM site_document_chunks WHERE body_id=${left}) = (SELECT COUNT(*) FROM site_document_chunks WHERE body_id=${right})
   AND NOT EXISTS (SELECT 1 FROM site_document_chunks l LEFT JOIN site_document_chunks r
     ON r.body_id=${right} AND r.part_number=l.part_number
     WHERE l.body_id=${left} AND (r.content IS NULL OR l.content != r.content))))`;
const equalBodiesRef = equalBodies;
const samePublication = equalBodiesRef('d.draft_body_id', 'd.published_body_id', 'd.draft_sha256', 'd.published_sha256');
const samePublicationRef = samePublication;

export async function getDocument(db, key) {
  const { results } = await db.prepare(`SELECT d.key, CAST(d.revision AS TEXT) AS revision,
    d.draft_body_id, d.published_at_utc, d.previous_published_body_id,
    (d.published_body_id IS NOT NULL AND ${samePublicationRef}) AS is_published, c.part_number,c.content
    FROM site_documents d LEFT JOIN site_document_chunks c ON c.body_id=d.draft_body_id
    WHERE d.key=? ORDER BY c.part_number LIMIT 11`).bind(key).all();
  const row = results[0];
  return { key, revision: row ? BigInt(row.revision) : 0n,
    draft: row?.draft_body_id ? decodeDocumentBodyRef(results).data : null,
    publishedAtUtc: row?.published_at_utc ?? null, hasPrevious: Boolean(row?.previous_published_body_id), isPublished: Boolean(row?.is_published) };
}

function historyInsert(db, key, mutation, action, actor, time, bodyColumn = 'draft_body_id') {
  return db.prepare(`INSERT INTO site_document_versions (document_key,revision,action,actor,created_at_utc,body_id)
    SELECT key,revision,?,?,?,${bodyColumn} FROM site_documents WHERE key=? AND mutation_id=?`).bind(action, actor, time, key, mutation);
}

export async function saveDraft(db, key, prepared, expectedRevision, actor, time, { action = 'save', existingBodyId = null } = {}) {
  if (!writableRef(expectedRevision)) return false;
  const mutation = crypto.randomUUID(), bodyId = existingBodyId ?? crypto.randomUUID(), statements = [];
  if (!existingBodyId) for (const [index, part] of prepared.parts.entries()) {
    statements.push(db.prepare(`INSERT INTO site_document_chunks (body_id,part_number,content)
      SELECT ?,?,? WHERE COALESCE((SELECT revision FROM site_documents WHERE key=?),0)=CAST(? AS INTEGER)`)
      .bind(bodyId, index, part, key, String(expectedRevision)));
  }
  statements.push(db.prepare(`INSERT INTO site_documents (key,revision,draft_body_id,draft_sha256,updated_at_utc,mutation_id)
    SELECT ?,1,?,?,?,? WHERE CAST(? AS INTEGER)=0
    ON CONFLICT(key) DO UPDATE SET revision=site_documents.revision+1,draft_body_id=excluded.draft_body_id,
      draft_sha256=excluded.draft_sha256,updated_at_utc=excluded.updated_at_utc,mutation_id=excluded.mutation_id
      WHERE site_documents.revision=CAST(? AS INTEGER)`)
    .bind(key, bodyId, prepared.sha256, time, mutation, String(expectedRevision), String(expectedRevision)));
  // An UPDATE is needed for nonzero revisions because an empty INSERT SELECT never enters the UPSERT.
  if (expectedRevision !== 0n) statements[statements.length - 1] = db.prepare(`UPDATE site_documents SET revision=revision+1,
    draft_body_id=?,draft_sha256=?,updated_at_utc=?,mutation_id=? WHERE key=? AND revision=CAST(? AS INTEGER)`)
    .bind(bodyId, prepared.sha256, time, mutation, key, String(expectedRevision));
  statements.push(historyInsertRef(db, key, mutation, action, actor, time));
  const result = await db.batch(statements);
  return result[result.length - 1].meta.changes === 1;
}

export async function publishDocument(db, key, expectedRevision, restorePrevious, actor, time) {
  if (!writableRef(expectedRevision) || expectedRevision < 1n) return false;
  const mutation = crypto.randomUUID();
  const update = restorePrevious
    ? `published_body_id=previous_published_body_id,previous_published_body_id=published_body_id,
       published_sha256=previous_published_sha256,previous_published_sha256=published_sha256`
    : `previous_published_body_id=published_body_id,previous_published_sha256=published_sha256,
       published_body_id=draft_body_id,published_sha256=draft_sha256`;
  const condition = restorePrevious ? 'd.previous_published_body_id IS NOT NULL' : `d.draft_body_id IS NOT NULL AND NOT (d.published_body_id IS NOT NULL AND ${samePublicationRef})`;
  const result = await db.batch([
    db.prepare(`UPDATE site_documents AS d SET ${update},revision=revision+1,updated_at_utc=?,published_at_utc=?,mutation_id=?
      WHERE key=? AND revision=CAST(? AS INTEGER) AND ${condition}`).bind(time, time, mutation, key, String(expectedRevision)),
    historyInsertRef(db, key, mutation, restorePrevious ? 'rollbackPublished' : 'publish', actor, time, 'published_body_id'),
  ]);
  return result[1].meta.changes === 1;
}

export async function listDocumentHistory(db, key, beforeRevision = maximumRef) {
  const { results } = await db.prepare(`SELECT CAST(v.revision AS TEXT) AS revision,action,actor,created_at_utc AS createdAtUtc
    FROM site_document_versions v WHERE document_key=? AND v.revision<CAST(? AS INTEGER) ORDER BY v.revision DESC LIMIT 26`)
    .bind(key, String(beforeRevision)).all();
  const items = results.slice(0, 25).map(row => ({ ...row, revision: BigInt(row.revision) }));
  return { items, nextBefore: results.length > 25 ? items[24].revision : null };
}

export async function getDocumentVersion(db, key, revision) {
  const { results } = await db.prepare(`SELECT CAST(v.revision AS TEXT) AS revision,v.body_id,c.part_number,c.content
    FROM site_document_versions v LEFT JOIN site_document_chunks c ON c.body_id=v.body_id
    WHERE v.document_key=? AND v.revision=CAST(? AS INTEGER) ORDER BY c.part_number LIMIT 11`).bind(key, String(revision)).all();
  return results.length ? { revision: BigInt(results[0].revision), bodyId: results[0].body_id, ...decodeDocumentBodyRef(results) } : null;
}

export async function readDocumentBackup(db, exportedAtUtc) {
  const readRef = read;

  const { results } = await db.prepare(`SELECT key,CAST(revision AS TEXT) AS revision,draft_body_id,published_body_id
    FROM site_documents WHERE key IN ('pricing','content','pages') AND draft_body_id IS NOT NULL ORDER BY key LIMIT 3`).all();
  const bodies = new Map();
  const documents = [];
  async function read(bodyId) {
    if (!bodyId) return null;
    if (!bodies.has(bodyId)) {
      const { results: rows } = await db.prepare('SELECT part_number,content FROM site_document_chunks WHERE body_id=? ORDER BY part_number LIMIT 11').bind(bodyId).all();
      bodies.set(bodyId, decodeDocumentBodyRef(rows).data);
    }
    return bodies.get(bodyId);
  }
  // Metadata pointers are captured together. Immutable bodies remain consistent even during a concurrent publication.
  for (const row of results) documents.push({ key: row.key, revision: BigInt(row.revision),
    draft: await readRef(row.draft_body_id), published: await readRef(row.published_body_id) });
  return { format: 'ahmad-site-documents', version: 1, exportedAtUtc, documents: documents };
}
// codeguard:components:end
