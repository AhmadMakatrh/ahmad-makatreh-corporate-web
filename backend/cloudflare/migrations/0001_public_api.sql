-- codeguard:components:start
-- Source: backend/cloudflare/migrations/0001_public_api.sql
-- Declarations and references retain their native language names and order.
-- codeguard:components:end
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY NOT NULL,
  reference_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  email TEXT NOT NULL CHECK (length(email) BETWEEN 1 AND 255),
  project_details TEXT NOT NULL CHECK (length(project_details) BETWEEN 1 AND 4000),
  service_key TEXT CHECK (service_key IS NULL OR length(service_key) BETWEEN 1 AND 30),
  inquiry_category TEXT CHECK (inquiry_category IS NULL OR inquiry_category IN
    ('software-project','employment-opportunity','professional-collaboration','technical-support','general-inquiry','other')),
  status TEXT NOT NULL CHECK (status IN ('New','Contacted','InProgress','Closed','Archived')),
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  notification_status TEXT CHECK (notification_status IS NULL OR notification_status IN
    ('accepted','failed','disabled','timedOut','unknown')),
  notification_attempted_at_utc TEXT,
  admin_notes TEXT NOT NULL DEFAULT '' CHECK (length(admin_notes) <= 10000),
  notes_updated_by TEXT CHECK (notes_updated_by IS NULL OR length(notes_updated_by) <= 255)
);

CREATE TABLE IF NOT EXISTS booking_submission_guards (
  ip_hash TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  attempt_count INTEGER NOT NULL CHECK (attempt_count BETWEEN 1 AND 6),
  window_started_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  original_inquiry_id TEXT NOT NULL,
  PRIMARY KEY (ip_hash, payload_hash)
);
CREATE INDEX IF NOT EXISTS ix_booking_guards_expiry ON booking_submission_guards (expires_at_ms);

CREATE TABLE IF NOT EXISTS booking_ip_blocks (
  ip_hash TEXT PRIMARY KEY NOT NULL,
  blocked_until_ms INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_booking_blocks_expiry ON booking_ip_blocks (blocked_until_ms);

CREATE TABLE IF NOT EXISTS site_documents (
  key TEXT PRIMARY KEY NOT NULL CHECK (key IN ('pricing','content','pages')),
  published_body_id TEXT
);
CREATE TABLE IF NOT EXISTS site_document_chunks (
  body_id TEXT NOT NULL,
  part_number INTEGER NOT NULL CHECK (part_number BETWEEN 0 AND 9),
  content BLOB NOT NULL CHECK (typeof(content) = 'blob' AND length(content) <= 524288),
  PRIMARY KEY (body_id, part_number)
);
