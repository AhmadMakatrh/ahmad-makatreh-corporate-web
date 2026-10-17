// codeguard:components:start
// codeguard:defines: createAdminMediaHandler
import { parseCursor as decodeCursor, utcNow as nowUtc } from './inquiryTime.js';
import { listMediaAssets as listMediaAssetsRef, getMediaAsset as readMediaAsset, insertMediaAsset as addMediaAsset, publicMediaAsset as publicMediaAssetRef, archiveMediaAsset as archiveMediaAssetRef } from './mediaAssets.js';
import { validateMediaUpload as checkMediaUpload, readMediaBody as readMediaBodyRef, detectMediaFormat as mediaFormat } from './mediaValidation.js';
import { inquiryId as inquiryIdRef } from './adminInquiries.js';
import { readDocumentBackup as readDocumentBackupRef } from './siteDocuments.js';
import { getMediaStorage as mediaStorage } from './mediaStorage.js';
const referencesRef = references;
const putObjectRef = putObject;


const response=(body,status=200,headers={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const responseRef = response;
const error=(message,status=400)=>responseRef({message},status);
const errorRef = error;
const storageError=()=>responseRef({title:'Media storage unavailable. No asset was saved.',status:503},503);
const storageErrorRef = storageError;
const report=(message,exception)=>console.error(message,exception instanceof Error ? exception.name : 'Error');
const reportRef = report;
function references(value,url) {
  const pending=[value];
  while (pending.length) {
    const item=pending.pop();if (item===url) return true;
    if (item && typeof item==='object') for (const child of Object.values(item)) pending.push(child);
  }
  return false;
}
const archived=()=>new Response(null,{status:204,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const archivedRef = archived;
async function putObject(storage,key,bytes,format,sha256,ctx) {
  const controller=new AbortController();
  const put=Promise.resolve().then(()=>storage.put(key,bytes,{sha256,contentType:format.contentType,signal:controller.signal}));
  // A timeout can leave a committed object, even when the HTTPS request is aborted.
  ctx?.waitUntil(put.catch(exception=>reportRef('Media object write unconfirmed.',exception)));
  let timer;
  try {
    await Promise.race([put,new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Media storage timeout.'));},45000);})]);
  } finally { clearTimeout(timer); }
}

export function createAdminMediaHandler({now=Date.now,fetcher=fetch}={}) {
  return async (request,env,identity,access,ctx) => {
    const url=new URL(request.url);
    const path=url.pathname.replace(/\/$/,'').slice('/api/admin'.length);
    if (path==='/media') {
      if (request.method!=='GET') return errorRef('Method not allowed.',405);
      const cursor=url.searchParams.get('cursor'), before=cursor ? decodeCursor(cursor) : null;
      if (cursor && !before) return errorRef('Invalid cursor.');
      return responseRef({...await listMediaAssetsRef(env.DB,before),configured:Boolean(mediaStorage(env,{fetcher}))});
    }
    const route=/^\/media\/([^/]+)(?:\/(archive))?$/.exec(path);if (!route) return null;
    if (request.method!=='POST') return errorRef('Method not allowed.',405);
    const denied=await access.validateMutation(request,env,identity);if (denied) return denied;
    if (route[2]==='archive') {
      const id=inquiryIdRef(route[1]);if (!id) return errorRef('Not found.',404);
      const asset=await readMediaAsset(env.DB,id);if (!asset) return errorRef('Not found.',404);
      if (asset.archived) return archivedRef();
      const snapshot=await readDocumentBackupRef(env.DB,nowUtc(now()));
      if (snapshot.documents.some(v=>referencesRef(v.draft,asset.url) || referencesRef(v.published,asset.url)))
        return responseRef({code:'media_referenced',message:'File is referenced in a draft or published document.'},409);
      const revisions=new Map(snapshot.documents.map(v=>[v.key,v.revision]));
      if (await archiveMediaAssetRef(env.DB,id,revisions)) return archivedRef();
      const current=await readMediaAsset(env.DB,id);
      return current?.archived ? archivedRef() : errorRef('Content changed during reference checking. Please try again.',409);
    }
    const storage=mediaStorage(env,{fetcher});
    if (!storage) return responseRef({title:'Media storage is not configured.',status:503},503);
    if (typeof env.ADMIN_UPLOAD_RATE_LIMITER?.limit!=='function') return errorRef('Media upload limit is not configured.',503);
    if ((await env.ADMIN_UPLOAD_RATE_LIMITER.limit({key:identity.email.toLowerCase()})).success!==true)
      return responseRef({success:false,code:'rate_limited',message:'Rate limit exceeded. Please wait a moment before submitting again.'},429,{'Retry-After':'60'});
    const upload=checkMediaUpload(route[1],url.searchParams.get('name'));if (!upload) return errorRef('Invalid file name or upload ID.');
    const body=await readMediaBodyRef(request);if (body.status) return body.status===413 ? errorRef('File exceeds 10 MiB.',413) : errorRef('Invalid file body.');
    const format=mediaFormat(body.bytes);
    if (!format) return errorRef('Only PNG, JPEG, WebP and PDF files up to 10 MiB are supported.');
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',body.bytes)),v=>v.toString(16).padStart(2,'0')).join('');
    const existing=await readMediaAsset(env.DB,upload.id);
    if (existing) return existing.sha256===hash && !existing.archived ? responseRef(publicMediaAssetRef(existing)) : errorRef('Upload ID already used for a different or archived file.',409);
    const key=crypto.randomUUID().replaceAll('-','')+format.extension;
    const asset={...upload,objectKey:key,url:storage.urlFor(key,format.contentType),contentType:format.contentType,sha256:hash,size:body.bytes.length,createdAtUtc:nowUtc(now()),actor:identity.email};
    const completion=(async()=>{
      try { await putObjectRef(storage,key,body.bytes,format,hash,ctx); }
      catch (exception) { reportRef('Media storage unavailable.',exception);return storageErrorRef(); }
      let added;
      try { added=await addMediaAsset(env.DB,asset); }
      catch (exception) { reportRef('Media metadata persistence unconfirmed. Retain object for reconciliation.',exception);return errorRef('Media metadata persistence failed.',500); }
      if (added) return responseRef(publicMediaAssetRef(asset));
      try { await storage.remove(key); }
      catch (exception) { reportRef('Unclaimed media object cleanup failed.',exception); }
      const winner=await readMediaAsset(env.DB,upload.id);
      return winner?.sha256===hash && !winner.archived ? responseRef(publicMediaAssetRef(winner)) : errorRef('Upload ID conflict.',409);
    })();
    ctx?.waitUntil(completion.then(()=>undefined,exception=>reportRef('Media upload completion failed.',exception)));
    return completion;
  };
}
// codeguard:components:end
