// codeguard:components:start
// codeguard:defines: publicMediaAsset, getMediaAsset, listMediaAssets, insertMediaAsset, archiveMediaAsset
import { cursorFor as cursorForRef } from './inquiryTime.js';
const publicMediaAssetRef = publicMediaAsset;


const columns = 'id,object_key AS objectKey,url,original_name AS originalName,content_type AS contentType,sha256,size,created_at_utc AS createdAtUtc,actor,archived';
const columnsRef = columns;
export function publicMediaAsset({id,url,originalName,contentType,size,createdAtUtc}) { return {id,url,originalName,contentType,size,createdAtUtc}; }
export async function getMediaAsset(db,id) {
  const row=await db.prepare(`SELECT ${columnsRef} FROM media_assets WHERE id=?`).bind(id).first();
  return row ? {...row, archived:row.archived===1} : null;
}
export async function listMediaAssets(db,before) {
  const query=db.prepare(`SELECT ${columnsRef} FROM media_assets WHERE archived=0${before ? ' AND (created_at_utc<? OR (created_at_utc=? AND id<?))' : ''}
    ORDER BY created_at_utc DESC,id DESC LIMIT 26`);
  const queryRef = query;
  const {results}=await (before ? queryRef.bind(before.beforeUtc,before.beforeUtc,before.beforeId) : queryRef).all();
  const items=results.slice(0,25).map(publicMediaAssetRef), last=items.at(-1);
  return {items,nextCursor:results.length>25 ? cursorForRef(last.createdAtUtc,last.id) : null};
}

export async function insertMediaAsset(db,asset) {
  const result=await db.prepare(`INSERT INTO media_assets (id,object_key,url,original_name,content_type,sha256,size,created_at_utc,actor,archived)
    VALUES (?,?,?,?,?,?,?,?,?,0) ON CONFLICT(id) DO NOTHING`).bind(asset.id,asset.objectKey,asset.url,asset.originalName,
    asset.contentType,asset.sha256,asset.size,asset.createdAtUtc,asset.actor).run();
  if (result.meta?.changes!==0 && result.meta?.changes!==1) throw new Error('Media insert outcome unconfirmed.');
  return result.meta.changes===1;
}

export async function archiveMediaAsset(db,id,revisions) {
  const result=await db.prepare(`UPDATE media_assets SET archived=1 WHERE id=? AND archived=0
    AND COALESCE((SELECT revision FROM site_documents WHERE key='pricing'),0)=CAST(? AS INTEGER)
    AND COALESCE((SELECT revision FROM site_documents WHERE key='content'),0)=CAST(? AS INTEGER)
    AND COALESCE((SELECT revision FROM site_documents WHERE key='pages'),0)=CAST(? AS INTEGER)`)
    .bind(id,...['pricing','content','pages'].map(key=>String(revisions.get(key)??0n))).run();
  return result.meta.changes===1;
}
// codeguard:components:end
