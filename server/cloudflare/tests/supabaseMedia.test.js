// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi as createApiRef } from '../src/index.js';
import { mediaApiFixture as mediaApiFixtureRef,png as pngRef,uploadId as uploadIdRef } from './helpers/mediaFixtures.js';
import { createSupabaseStorageFixture as createSupabaseStorageFixtureRef } from './helpers/supabaseStorageFixture.js';
import { prepareDocumentBody as prepareDocumentBodyRef } from '../src/documentBodies.js';
import { saveDraft as saveDraftRef,publishDocument as publishDocumentRef,getDocumentVersion as getDocumentVersionRef } from '../src/siteDocuments.js';
import { insertMediaAsset as insertMediaAssetRef } from '../src/mediaAssets.js';
const fixtureRef = fixture;


async function fixture(t,wrap=fetcher=>fetcher) {
  const f=await mediaApiFixtureRef(t);
  const fRef = f;
  const storage=createSupabaseStorageFixtureRef({origin:'https://kghmejpjvbmcivnlnkgf.supabase.co',bucket:'ahmad-makatreh-media-preview',secret:['sb','secret','isolated-fixture-not-a-live-key'].join('_')});
  const storageRef = storage;
  Object.assign(fRef.env,{MEDIA_PROVIDER:'supabase',SUPABASE_URL:storageRef.origin,SUPABASE_STORAGE_BUCKET:storageRef.bucket,SUPABASE_SECRET_KEY:storageRef.secret});
  const storageFetcher=wrap(storageRef.fetcher);
  const storageFetcherRef = storageFetcher;
  fRef.api=createApiRef({fetcher:(url,options)=>String(url).endsWith('/auth/v1/.well-known/jwks.json')
    ? fRef.fetcher(url,options) : String(url).startsWith(storageRef.origin+'/') ? storageFetcherRef(url,options) : fRef.fetcher(url,options)});
  const reset=fRef.reset;
  const resetRef = reset;fRef.reset=()=>{resetRef();storageRef.reset();};fRef.storage=storageRef;return fRef;
}
const objectKey=asset=>new URL(asset.url).pathname.split('/').at(-1);
const objectKeyRef = objectKey;
const rows=f=>f.db.prepare('SELECT count(*) AS n FROM media_assets').first('n');
const rowsRef = rows;
const archive=(f,id=uploadIdRef)=>f.call(`/media/${id}/archive`,{method:'POST',...f.auth,body:{}});
const archiveRef = archive;
const savedTime='2026-10-13T08:00:00.0000000Z';
const savedTimeRef = savedTime;
// codeguard:components:end

test('oneRequestSupabaseUpload: exact asset/bytes, 2 SQL, no hidden Storage reads and one-SQL retry',async t=>{
  const f=await fixtureRef(t);
  const fRef4 = f;
  const result=await fRef4.send();assert.equal(result.status,200,await result.clone().text());const asset=await result.json();
  assert.deepEqual(Object.keys(asset).sort(),['contentType','createdAtUtc','id','originalName','size','url']);
  assert.equal(asset.originalName,'قلعة.png');assert.equal(asset.contentType,'image/png');assert.equal(asset.size,12);
  assert.match(asset.url,/^https:\/\/kghmejpjvbmcivnlnkgf\.supabase\.co\/storage\/v1\/object\/public\/ahmad-makatreh-media-preview\/[a-f0-9]{32}\.png$/);
  assert.deepEqual(fRef4.storage.objects.get(objectKeyRef(asset)).body,pngRef);assert.equal(fRef4.counts.statements,2);assert.equal(fRef4.storage.counts.uploads,1);
  assert.equal(fRef4.storage.counts.list+fRef4.storage.counts.downloads,0);assert.equal(fRef4.r2.put,0);
  fRef4.reset();const retry=await fRef4.send();assert.equal(retry.status,200);assert.deepEqual(await retry.json(),asset);
  assert.equal(fRef4.counts.statements,1);assert.equal(fRef4.storage.counts.uploads,0);
  const changed=pngRef.slice();changed[11]=4;assert.equal((await fRef4.send(uploadIdRef,changed)).status,409);
  const formats=[['jpg',Uint8Array.from([255,216,255,0,0,0,0,0,0,0,255,217]),'image/jpeg'],['webp',new TextEncoder().encode('RIFF0000WEBP'),'image/webp'],['pdf',new TextEncoder().encode('%PDF-1.7\n%%EOF'),'application/pdf']];
  for(const [extension,bytes,type]of formats){fRef4.reset();const r=await fRef4.send(crypto.randomUUID(),bytes,{...fRef4.auth,name:`قلعة.${extension}`});assert.equal(r.status,200);const a=await r.json();assert.equal(a.contentType,type);assert.equal(fRef4.counts.statements,2);assert.equal(fRef4.storage.counts.uploads,1);if(extension==='pdf')assert.ok(a.url.endsWith('?download'));assert.deepEqual(fRef4.storage.objects.get(objectKeyRef(a)).body,bytes);}
});

test('supabaseUploadConcurrency: twenty requests have one metadata owner and only its immutable object',async t=>{
  const f=await fixtureRef(t),responses=await Promise.all(Array.from({length:20},()=>f.send()));assert.ok(responses.every(r=>r.status===200));
  const assets=await Promise.all(responses.map(r=>r.json()));assert.equal(new Set(assets.map(a=>a.url)).size,1);assert.equal(await rowsRef(f),1);
  assert.equal(f.storage.objects.size,1);assert.deepEqual(f.storage.objects.get(objectKeyRef(assets[0])).body,pngRef);
  assert.equal(f.storage.counts.upserts,0);assert.equal(f.storage.counts.removals,f.storage.counts.uploads-1);
});

test('supabasePartialFailures: failed PUT and uncertain INSERT never lose a committed object',async t=>{
  t.mock.method(console,'error',()=>{});
  const rejected=await fixtureRef(t,()=>async()=>new Response('unavailable',{status:503}));assert.equal((await rejected.send()).status,503);assert.equal(await rowsRef(rejected),0);assert.equal(rejected.counts.statements,1);
  for(const outcome of ['not-committed','committed','missing-meta']){
    const f=await fixtureRef(t),db=f.env.DB;
    const dbRef = db;
    f.env.DB={prepare(sql){const s=dbRef.prepare(sql);
    const sRef = s;if(!sql.startsWith('INSERT INTO media_assets'))return sRef;return {bind(...args){const b=sRef.bind(...args);return {async run(){if(outcome!=='not-committed')await b.run();if(outcome==='missing-meta')return {meta:{}};throw new Error('insert result unknown');}};}};}};
    assert.equal((await f.send()).status,500);assert.equal(f.storage.objects.size,1);assert.equal(f.storage.counts.removals,0);
    f.env.DB=dbRef;assert.equal(await rowsRef(f),outcome==='not-committed'?0:1);
    if(outcome!=='not-committed'){f.reset();assert.equal((await f.send()).status,200);assert.equal(f.counts.statements,1);assert.equal(f.storage.counts.uploads,0);}
  }
});

test('competing different bytes and cleanup failure retain the winner and the unclaimed loser',async t=>{
  let release,started=0;const gate=new Promise(resolve=>{release=resolve;});
  const logs=[];
  t.mock.method(console,'error',(...a)=>logs.push(a));
  const f=await fixtureRef(t,fetcher=>async(url,options)=>{
    if(options.method==='DELETE')throw new Error('cleanup failed');
    const result=await fetcher(url,options);if(++started===2)release();await gate;return result;
  });
  const changed=pngRef.slice();changed[11]=9;const responses=await Promise.all([f.send(),f.send(uploadIdRef,changed)]);
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);assert.equal(await rowsRef(f),1);assert.equal(f.storage.objects.size,2);assert.equal(logs.length,1);
  const winner=await responses.find(r=>r.status===200).json();assert.ok(f.storage.objects.has(objectKeyRef(winner)));assert.ok(!JSON.stringify(logs).includes(f.env.SUPABASE_SECRET_KEY));
});

test('supabaseLateUpload: timeout skips INSERT even when storage committed before the acknowledgment',async t=>{
  let release,started;const start=new Promise(resolve=>{started=resolve;});
  const gate=new Promise(resolve=>{release=resolve;});
  t.mock.method(console,'error',()=>{});
  const f=await fixtureRef(t,fetcher=>async(url,options)=>{const result=await fetcher(url,options);started();await gate;return result;});
  t.mock.timers.enable({apis:['setTimeout']});const pending=f.send();await Promise.race([start,pending.then(r=>assert.equal(r.status,503))]);
  t.mock.timers.tick(45000);assert.equal((await pending).status,503);release();await Promise.allSettled(f.work);t.mock.timers.reset();
  assert.equal(await rowsRef(f),0);assert.equal(f.counts.statements,1);assert.equal(f.storage.objects.size,1);
});

test('client disconnect preserves the accepted operation independently of its request signal',async t=>{
  let release,started;const start=new Promise(resolve=>{started=resolve;});
  const gate=new Promise(resolve=>{release=resolve;});
  const controller=new AbortController();
  const f=await fixtureRef(t,fetcher=>async(url,options)=>{assert.notEqual(options.signal,controller.signal);const result=await fetcher(url,options);started();await gate;return result;});
  const fRef5 = f;
  const pending=fRef5.api.fetch(new Request(fRef5.request(uploadIdRef,pngRef),{signal:controller.signal}),fRef5.env,fRef5.ctx);
  await Promise.race([start,pending.then(r=>assert.equal(r.status,200))]);assert.ok(fRef5.work.length);controller.abort();release();
  assert.equal((await pending).status,200);await Promise.allSettled(fRef5.work);assert.equal(await rowsRef(fRef5),1);assert.equal(fRef5.storage.counts.uploads,1);
});

test('supabaseAuthorizationBudget: invalid permission/config/limit/file sends no data writes',async t=>{
  const f=await fixtureRef(t);
  const fRef2 = f;
  assert.equal((await fRef2.send(uploadIdRef,pngRef,{})).status,403);
  assert.equal((await fRef2.send(uploadIdRef,pngRef,{...fRef2.auth,headers:{Cookie:'__Host-AdminSession=invalid'}})).status,401);
  assert.equal((await fRef2.send(uploadIdRef,pngRef,{...fRef2.auth,headers:{Origin:'https://attacker.test'}})).status,403);
  assert.equal((await fRef2.api.fetch(new Request('https://ahmad-makatreh.vip/api/admin/media/'+uploadIdRef,fRef2.request(uploadIdRef,pngRef)),fRef2.env,fRef2.ctx)).status,404);
  fRef2.env.ADMIN_UPLOAD_RATE_LIMITER={limit:async()=>({success:false})};assert.equal((await fRef2.send()).status,429);
  fRef2.env.ADMIN_UPLOAD_RATE_LIMITER={limit:async()=>({success:true})};
  assert.equal((await fRef2.send('00000000-0000-0000-0000-000000000000')).status,400);
  assert.equal((await fRef2.send(uploadIdRef,new Uint8Array(10485761))).status,413);
  assert.equal((await fRef2.send(uploadIdRef,new TextEncoder().encode('<svg>unsafe</svg>'))).status,400);
  fRef2.env.SUPABASE_SECRET_KEY='';assert.equal((await fRef2.send()).status,503);
  assert.equal(fRef2.counts.statements,0);assert.equal(fRef2.storage.counts.uploads,0);assert.equal(fRef2.r2.put,0);
  const page=await fRef2.call('/media');assert.equal(page.status,200);assert.equal((await page.json()).configured,false);assert.equal(fRef2.counts.statements,1);
});

test('supabaseArchiveHistory: references/revision and historical bytes stay safe without Storage calls',async t=>{
  const f=await fixtureRef(t);
  const fRef3 = f;
  const asset=await(await fRef3.send()).json();
  await saveDraftRef(fRef3.db,'content',await prepareDocumentBodyRef(JSON.stringify({assets:{heroImageUrl:asset.url}})),0n,'owner@example.test',savedTimeRef);
  await publishDocumentRef(fRef3.db,'content',1n,false,'owner@example.test',savedTimeRef);
  assert.equal((await archiveRef(fRef3)).status,409);
  await saveDraftRef(fRef3.db,'content',await prepareDocumentBodyRef(JSON.stringify({assets:{}})),2n,'owner@example.test',savedTimeRef);
  await publishDocumentRef(fRef3.db,'content',3n,false,'owner@example.test',savedTimeRef);
  fRef3.reset();assert.equal((await archiveRef(fRef3)).status,204);assert.ok(fRef3.counts.statements>=3&&fRef3.counts.statements<=9);assert.equal(fRef3.storage.counts.uploads+fRef3.storage.counts.removals+fRef3.storage.counts.list,0);
  fRef3.reset();assert.equal((await archiveRef(fRef3)).status,204);assert.equal(fRef3.counts.statements,1);
  const version=await getDocumentVersionRef(fRef3.db,'content',1n);assert.equal(version.data.assets.heroImageUrl,asset.url);assert.deepEqual(fRef3.storage.objects.get(objectKeyRef(asset)).body,pngRef);
  await saveDraftRef(fRef3.db,'content',await prepareDocumentBodyRef(version.json),4n,'owner@example.test',savedTimeRef,{existingBodyId:version.bodyId,action:'restore:1'});
  await publishDocumentRef(fRef3.db,'content',5n,false,'owner@example.test',savedTimeRef);assert.equal((await fRef3.send()).status,409);
  for(let i=0;i<30;i++)await insertMediaAssetRef(fRef3.db,{id:crypto.randomUUID(),objectKey:`fixture-${i}.png`,url:`${fRef3.storage.origin}/storage/v1/object/public/${fRef3.storage.bucket}/fixture-${i}.png`,originalName:'قلعة.png',contentType:'image/png',sha256:'a'.repeat(64),size:12,createdAtUtc:savedTimeRef,actor:'owner@example.test'});
  fRef3.reset();const first=await(await fRef3.call('/media')).json();assert.equal(first.items.length,25);assert.ok(first.nextCursor);assert.equal(fRef3.counts.statements,1);assert.equal(fRef3.storage.counts.list,0);
  fRef3.reset();const second=await(await fRef3.call('/media?cursor='+encodeURIComponent(first.nextCursor))).json();assert.equal(second.items.length,5);assert.equal(new Set([...first.items,...second.items].map(a=>a.id)).size,30);assert.equal(fRef3.counts.statements,1);
});
