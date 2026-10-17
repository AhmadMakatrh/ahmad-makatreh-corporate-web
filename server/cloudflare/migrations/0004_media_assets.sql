-- codeguard:components:start
-- Source: server/cloudflare/migrations/0004_media_assets.sql
-- Declarations and references retain their native language names and order.
-- codeguard:components:end
CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/png','image/jpeg','image/webp','application/pdf')),
  sha256 TEXT NOT NULL CHECK (length(sha256)=64 AND sha256 NOT GLOB '*[^0-9a-f]*'),
  size INTEGER NOT NULL CHECK (size BETWEEN 12 AND 10485760),
  created_at_utc TEXT NOT NULL,
  actor TEXT NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0,1))
);
CREATE INDEX ix_media_assets_page ON media_assets (archived,created_at_utc DESC,id DESC);
