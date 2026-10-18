// codeguard:components:start
// codeguard:defines: openTestDatabase, applyInitialMigration, applyAdminMigration, applyDocumentMigration, applyMediaMigration, sampleInquirySql, seedInquiry
import { getPlatformProxy as getPlatformProxyRef } from 'wrangler';
import { readFile as readFileRef } from 'node:fs/promises';
import { fileURLToPath as fileURLToPathRef } from 'node:url';

export async function openTestDatabase() {
  const platform = await getPlatformProxyRef({
    configPath: fileURLToPathRef(new URL('../wrangler.test.jsonc', import.meta.url)),
    persist: false,
    remoteBindings: false,
    envFiles: [],
  });
  return { db: platform.env.DB, bucket: platform.env.MEDIA, dispose: () => platform.dispose() };
}

export async function applyInitialMigration(db) {
  const sql = await readFileRef(new URL('../../migrations/0001_public_api.sql', import.meta.url), 'utf8');
  await db.batch(sql.split(';').map(part => part.trim()).filter(Boolean).map(part => db.prepare(part)));
}

export async function applyAdminMigration(db) {
  const sql = await readFileRef(new URL('../../migrations/0002_admin_inquiries.sql', import.meta.url), 'utf8');
  await db.batch(sql.split(';').map(part => part.trim()).filter(Boolean).map(part => db.prepare(part)));
}

export async function applyDocumentMigration(db) {
  const sql = await readFileRef(new URL('../../migrations/0003_site_documents.sql', import.meta.url), 'utf8');
  await db.batch(sql.split(';').map(part => part.trim()).filter(Boolean).map(part => db.prepare(part)));
}

export async function applyMediaMigration(db) {
  const sql = await readFileRef(new URL('../../migrations/0004_media_assets.sql', import.meta.url), 'utf8');
  await db.batch(sql.split(';').map(part => part.trim()).filter(Boolean).map(part => db.prepare(part)));
}

export const sampleInquirySql = `INSERT INTO inquiries
  (id, reference_id, name, email, project_details, status, created_at_utc, updated_at_utc)
  VALUES (?, ?, 'Ahmad', 'owner@example.test', 'A real project', 'New', ?, ?)`;
const sampleInquirySqlRef = sampleInquirySql;

export async function seedInquiry(db, id = '11111111-1111-4111-8111-111111111111', ref = 'REQ-20261012-ABCDEF') {
  await db.prepare(sampleInquirySqlRef).bind(id, ref, '2026-10-12T08:00:00.000Z', '2026-10-12T08:00:00.000Z').run();
}
// codeguard:components:end
