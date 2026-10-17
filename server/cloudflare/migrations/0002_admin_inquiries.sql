-- codeguard:components:start
-- Source: server/cloudflare/migrations/0002_admin_inquiries.sql
-- Declarations and references retain their native language names and order.
-- codeguard:components:end
CREATE TABLE IF NOT EXISTS inquiry_replies (
  id TEXT PRIMARY KEY NOT NULL,
  inquiry_id TEXT NOT NULL REFERENCES inquiries(id),
  subject TEXT NOT NULL CHECK (length(subject) BETWEEN 1 AND 200),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 10000),
  actor TEXT NOT NULL CHECK (length(actor) BETWEEN 1 AND 255),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','failed','unknown')),
  created_at_utc TEXT NOT NULL,
  completed_at_utc TEXT
);
UPDATE inquiries SET created_at_utc=substr(created_at_utc,1,23)||'0000Z'
  WHERE length(created_at_utc)=24 AND substr(created_at_utc,20,1)='.' AND substr(created_at_utc,24,1)='Z';
UPDATE inquiries SET updated_at_utc=substr(updated_at_utc,1,23)||'0000Z'
  WHERE length(updated_at_utc)=24 AND substr(updated_at_utc,20,1)='.' AND substr(updated_at_utc,24,1)='Z';
UPDATE inquiries SET notification_attempted_at_utc=substr(notification_attempted_at_utc,1,23)||'0000Z'
  WHERE length(notification_attempted_at_utc)=24 AND substr(notification_attempted_at_utc,20,1)='.' AND substr(notification_attempted_at_utc,24,1)='Z';
CREATE INDEX IF NOT EXISTS ix_inquiries_created_id ON inquiries (created_at_utc DESC,id DESC);
CREATE INDEX IF NOT EXISTS ix_replies_inquiry_created_id ON inquiry_replies (inquiry_id,created_at_utc DESC,id DESC);
