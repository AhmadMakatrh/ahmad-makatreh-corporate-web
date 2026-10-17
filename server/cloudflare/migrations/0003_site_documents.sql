-- codeguard:components:start
-- Source: server/cloudflare/migrations/0003_site_documents.sql
-- Declarations and references retain their native language names and order.
-- codeguard:components:end
ALTER TABLE site_documents ADD COLUMN revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0);
ALTER TABLE site_documents ADD COLUMN draft_body_id TEXT;
ALTER TABLE site_documents ADD COLUMN previous_published_body_id TEXT;
ALTER TABLE site_documents ADD COLUMN draft_sha256 TEXT;
ALTER TABLE site_documents ADD COLUMN published_sha256 TEXT;
ALTER TABLE site_documents ADD COLUMN previous_published_sha256 TEXT;
ALTER TABLE site_documents ADD COLUMN updated_at_utc TEXT;
ALTER TABLE site_documents ADD COLUMN published_at_utc TEXT;
ALTER TABLE site_documents ADD COLUMN mutation_id TEXT;
UPDATE site_documents SET revision = 1, draft_body_id = published_body_id WHERE published_body_id IS NOT NULL;
CREATE TABLE site_document_versions (
  document_key TEXT NOT NULL CHECK (document_key IN ('pricing','content','pages')),
  revision INTEGER NOT NULL CHECK (revision > 0),
  action TEXT NOT NULL CHECK (action IN ('save','publish','rollbackPublished') OR action GLOB 'restore:[0-9]*'),
  actor TEXT NOT NULL CHECK (length(actor) BETWEEN 1 AND 255),
  created_at_utc TEXT NOT NULL,
  body_id TEXT NOT NULL,
  PRIMARY KEY (document_key, revision),
  FOREIGN KEY (document_key) REFERENCES site_documents(key)
);
