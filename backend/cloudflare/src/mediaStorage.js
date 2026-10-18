// codeguard:components:start
// codeguard:defines: getMediaStorage
import { readJson as parseJsonRequest } from './httpJson.js';
const encodedKeyRef = encodedKey;
const uploadSettingsRef = uploadSettings;
const requestJsonRef = requestJson;
const supabaseStorageRef = supabaseStorage;
const r2StorageRef = r2Storage;


const defaultCache='public, max-age=31536000, immutable';
const defaultCacheRef = defaultCache;
const contentTypes=new Set(['image/png','image/jpeg','image/webp','application/pdf']);
const contentTypesRef = contentTypes;
const unsafe=/[\\\p{Cc}]/u;
const unsafeRef = unsafe;

function encodedKey(key) {
  if (typeof key!=='string' || !key || unsafeRef.test(key) || new TextEncoder().encode(key).length>1024)
    throw new Error('Invalid media object key.');
  const segments=key.split('/');
  if (segments.some(part=>!part || part==='.' || part==='..')) throw new Error('Invalid media object key.');
  return segments.map(encodeURIComponent).join('/');
}

function uploadSettings({sha256,contentType,cacheControl=defaultCacheRef}) {
  if (typeof sha256!=='string' || !/^[0-9a-f]{64}$/.test(sha256) || !contentTypesRef.has(contentType)
    || typeof cacheControl!=='string' || !cacheControl || cacheControl.length>512 || /[^\x20-\x7e]/.test(cacheControl))
    throw new Error('Invalid media storage metadata.');
  return {sha256,contentType,cacheControl};
}

async function requestJson(fetcher,url,options) {
  let result;
  try { result=await fetcher(url,{...options,redirect:'manual'}); }
  catch { throw new Error('Media storage request unavailable.'); }
  if (!result?.ok || result.redirected) {
    try { await result?.body?.cancel(); }
    catch { throw new Error('Media storage response cancellation failed.'); }
    throw new Error(`Media storage request failed (${result?.status??'unknown'}).`);
  }
  const parsed=await parseJsonRequest(result,16384);
  if (parsed.oversized || parsed.invalid) {
    try { await result.body?.cancel(); }
    catch { throw new Error('Media storage response cancellation failed.'); }
    throw new Error('Media storage response unconfirmed.');
  }
  return parsed.value;
}

function supabaseStorage(env,fetcher) {
  const value=env.SUPABASE_URL,secret=env.SUPABASE_SECRET_KEY,bucket=env.SUPABASE_STORAGE_BUCKET;
  if (typeof value!=='string' || unsafeRef.test(value) || /\p{White_Space}/u.test(value)
    || typeof secret!=='string' || !secret.startsWith('sb_secret_') || secret.length<=10
    || /[\p{Cc}\p{White_Space}]/u.test(secret) || typeof bucket!=='string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(bucket)) return null;
  let url;
  try { url=new URL(value); } catch { return null; }
  if (url.protocol!=='https:' || url.port || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)
    || url.username || url.password || url.pathname!=='/' || url.search || url.hash) return null;
  const base=`${url.origin}/storage/v1`;
  const headers={apikey:secret};
  return {
    urlFor(key,contentType) { return `${base}/object/public/${bucket}/${encodedKeyRef(key)}${contentType==='application/pdf'?'?download':''}`; },
    async put(key,bytes,options) {
      const path=encodedKeyRef(key),{sha256,contentType,cacheControl}=uploadSettingsRef(options);
      let metadata;
      try {
        if (options.metadata!==undefined && (!options.metadata || typeof options.metadata!=='object' || Array.isArray(options.metadata)))
          throw new Error('Invalid metadata.');
        const text=JSON.stringify({...options.metadata,sha256});
        metadata=btoa(Array.from(new TextEncoder().encode(text),v=>String.fromCharCode(v)).join(''));
      } catch { throw new Error('Invalid media custom metadata.'); }
      const result=await requestJsonRef(fetcher,`${base}/object/${bucket}/${path}`,{
        method:'POST',body:bytes,signal:options.signal,
        headers:{...headers,'Content-Type':contentType,'Cache-Control':cacheControl,'x-upsert':'false','x-metadata':metadata},
      });
      if (!result || typeof result!=='object' || typeof result.Id!=='string' || !result.Id || result.Key!==`${bucket}/${key}`)
        throw new Error('Media storage acknowledgment unconfirmed.');
    },
    async remove(key) {
      encodedKeyRef(key);
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),3000);
      try {
        const result=await requestJsonRef(fetcher,`${base}/object/${bucket}`,{
          method:'DELETE',body:JSON.stringify({prefixes:[key]}),signal:controller.signal,headers:{...headers,'Content-Type':'application/json'},
        });
        if (!Array.isArray(result) || result.some(item=>item?.name!==key)) throw new Error('Media cleanup acknowledgment unconfirmed.');
      } finally { clearTimeout(timer); }
    },
  };
}

function r2Storage(env) {
  const base=env.MEDIA_PUBLIC_BASE_URL;
  if (typeof env.MEDIA?.put!=='function' || typeof env.MEDIA?.delete!=='function' || typeof base!=='string' || unsafeRef.test(base)) return null;
  let url;
  try { url=new URL(base); } catch { return null; }
  if (url.protocol!=='https:' || url.username || url.password || url.search || url.hash) return null;
  const normalized=url.toString().replace(/\/$/,'');
  return {
    urlFor(key) { return `${normalized}/${encodedKeyRef(key)}`; },
    async put(key,bytes,options) {
      encodedKeyRef(key);const {sha256,contentType,cacheControl}=uploadSettingsRef(options);
      const result=await env.MEDIA.put(key,bytes,{
        onlyIf:new Headers({'If-None-Match':'*'}),sha256,
        httpMetadata:{contentType,contentDisposition:contentType==='application/pdf'?'attachment':'inline',cacheControl},
      });
      if (!result) throw new Error('Media object key conflict.');
    },
    async remove(key) { encodedKeyRef(key);await env.MEDIA.delete(key); },
  };
}

export function getMediaStorage(env,{fetcher=fetch}={}) {
  const provider=env.MEDIA_PROVIDER??'r2';
  if (provider==='r2') return r2StorageRef(env);
  if (provider==='supabase') return supabaseStorageRef(env,fetcher);
  return null;
}
// codeguard:components:end
