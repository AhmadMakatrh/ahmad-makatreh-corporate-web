// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import test from 'node:test';
import assert from 'node:assert/strict';
import { adminApiFixture as adminApiFixtureRef } from './helpers/adminFixtures.js';
import { applyMediaMigration as applyMediaMigrationRef } from './helpers/d1.js';
import { mediaApiFixture as mediaApiFixtureRef, png as pngRef, uploadId as uploadIdRef } from './helpers/mediaFixtures.js';
import { prepareDocumentBody as prepareDocumentBodyRef } from '../src/documentBodies.js';
import { saveDraft as saveDraftRef, publishDocument as publishDocumentRef, getDocumentVersion as getDocumentVersionRef } from '../src/siteDocuments.js';
// codeguard:components:end

test('oneRequestUpload: stores actual bytes and projection with 2 SQL and 1 PUT',async t=>{
  const f=await mediaApiFixtureRef(t);
  const fRef = f;
  const result=await fRef.send();assert.equal(result.status,200,await result.clone().text());
  const asset=await result.json();assert.equal(asset.originalName,'قلعة.png');assert.equal(asset.contentType,'image/png');assert.equal(asset.size,12);
  assert.deepEqual(Object.keys(asset).sort(),['contentType','createdAtUtc','id','originalName','size','url']);
  assert.match(asset.url,/^https:\/\/media\.example\.test\/[0-9a-f]{32}\.png$/);
  assert.equal(fRef.counts.statements,2);assert.equal(fRef.r2.put,1);assert.equal(fRef.r2.list,0);
  const object=await fRef.bucket.get(asset.url.split('/').at(-1));assert.deepEqual(new Uint8Array(await object.arrayBuffer()),pngRef);
  assert.equal(object.httpMetadata.contentType,'image/png');assert.equal(object.httpMetadata.contentDisposition,'inline');
  assert.equal(object.httpMetadata.cacheControl,'public, max-age=31536000, immutable');
  const row=await fRef.db.prepare('SELECT sha256 FROM media_assets WHERE id=?').bind(uploadIdRef).first();
  assert.equal(row.sha256,Buffer.from(await crypto.subtle.digest('SHA-256',pngRef)).toString('hex'));
  fRef.reset();const retry=await fRef.send();assert.equal(retry.status,200);assert.deepEqual(await retry.json(),asset);assert.equal(fRef.counts.statements,1);assert.equal(fRef.r2.put,0);
  const other=pngRef.slice();other[11]=1;assert.equal((await fRef.send(uploadIdRef,other)).status,409);
});
test('duplicateAndConcurrentUpload: twenty concurrent requests have one owner and only its object',async t=>{
  const f=await mediaApiFixtureRef(t);
  const fRef2 = f;
  const results=await Promise.all(Array.from({length:20},()=>fRef2.send()));
  assert.ok(results.every(v=>v.status===200));const assets=await Promise.all(results.map(v=>v.json()));
  assert.equal(new Set(assets.map(v=>v.url)).size,1);assert.equal(await fRef2.db.prepare('SELECT count(*) AS n FROM media_assets').first('n'),1);
  const objects=await fRef2.bucket.list();assert.equal(objects.objects.length,1);assert.equal(objects.objects[0].key,assets[0].url.split('/').at(-1));
  const different=pngRef.slice();different[10]=3;const mixed=await Promise.all([fRef2.send(crypto.randomUUID()),fRef2.send(uploadIdRef,different)]);
  assert.deepEqual(mixed.map(v=>v.status),[200,409]);
});
test('partialUploadFailures: PUT failure saves no metadata; ambiguous INSERT keeps bytes and retry recovers',async t=>{
  const f=await mediaApiFixtureRef(t);
  const fRef3 = f;
  const storage=fRef3.env.MEDIA,db=fRef3.env.DB;
  const dbRef = db;
  const logs=[];
  t.mock.method(console,'error',(...a)=>logs.push(a));
  fRef3.env.MEDIA={put:async()=>{throw new Error('storage failed');},delete:storage.delete};
  assert.equal((await fRef3.send()).status,503);assert.equal(await fRef3.db.prepare('SELECT count(*) AS n FROM media_assets').first('n'),0);assert.equal(fRef3.counts.statements,1);
  fRef3.env.MEDIA=storage;
  const intercept=(commit)=>({prepare(sql){const s=dbRef.prepare(sql);
  const sRef = s;if(!sql.startsWith('INSERT INTO media_assets'))return sRef;return {bind(...args){const b=sRef.bind(...args);return {async run(){if(commit)await b.run();throw new Error('write result unknown');}};}};}});
  const interceptRef = intercept;
  fRef3.env.DB=interceptRef(false);assert.equal((await fRef3.send()).status,500);assert.equal((await fRef3.bucket.list()).objects.length,1);
  fRef3.env.DB=interceptRef(true);assert.equal((await fRef3.send()).status,500);assert.equal(await fRef3.db.prepare('SELECT count(*) AS n FROM media_assets').first('n'),1);
  fRef3.env.DB=dbRef;fRef3.reset();assert.equal((await fRef3.send()).status,200);assert.equal(fRef3.r2.put,0);assert.equal(fRef3.counts.statements,1);
  assert.ok(logs.length>0);assert.ok(!JSON.stringify(logs).includes('قلعة'));
});
test('missing insert change metadata never deletes an object whose record committed',async t=>{
  const f=await mediaApiFixtureRef(t);
  const fRef4 = f;
  const db=fRef4.env.DB;
  const dbRef2 = db;t.mock.method(console,'error',()=>{});
  fRef4.env.DB={prepare(sql){const s=dbRef2.prepare(sql);
  const sRef2 = s;if(!sql.startsWith('INSERT INTO media_assets'))return sRef2;return {bind(...args){const b=sRef2.bind(...args);return {async run(){await b.run();return {meta:{}};}};}};}};
  assert.equal((await fRef4.send()).status,500);assert.equal(fRef4.r2.delete,0);
  const row=await fRef4.db.prepare('SELECT object_key FROM media_assets WHERE id=?').bind(uploadIdRef).first();assert.ok(await fRef4.bucket.get(row.object_key));
});
test('uploadAuthorizationBudget: invalid identity, CSRF, config, limiter or file writes nothing',async t=>{
  const f=await mediaApiFixtureRef(t);
  const fRef5 = f;
  assert.equal((await fRef5.send(uploadIdRef,pngRef,{})).status,403);
  assert.equal((await fRef5.send(uploadIdRef,pngRef,{...fRef5.auth,headers:{Cookie:'__Host-AdminSession=invalid'}})).status,401);
  for(const base of ['http://media.example.test','https://user:pass@media.example.test','https://media.example.test?x=1','https://media.example.test#x']){
    fRef5.env.MEDIA_PUBLIC_BASE_URL=base;assert.equal((await fRef5.send()).status,503);
  }
  fRef5.env.MEDIA_PUBLIC_BASE_URL='https://media.example.test';fRef5.env.ADMIN_UPLOAD_RATE_LIMITER={limit:async()=>({success:false})};
  const limited=await fRef5.send();assert.equal(limited.status,429);assert.equal(limited.headers.get('Retry-After'),'60');
  fRef5.env.ADMIN_UPLOAD_RATE_LIMITER=undefined;assert.equal((await fRef5.send()).status,503);
  fRef5.env.ADMIN_UPLOAD_RATE_LIMITER={limit:async()=>({success:true})};
  assert.equal((await fRef5.send('00000000-0000-0000-0000-000000000000')).status,400);
  assert.equal((await fRef5.send(uploadIdRef,new TextEncoder().encode('<svg>unsafe</svg>'))).status,400);
  assert.equal((await fRef5.send(uploadIdRef,new Uint8Array(10485761))).status,413);
  assert.equal(fRef5.counts.statements,0);assert.equal(fRef5.r2.put,0);
});
test('latePutAndClientDisconnect: timeout skips INSERT even if object completes later',async t=>{
  const f=await mediaApiFixtureRef(t);
  const fRef6 = f;let release,started;
  const logs=[];
  t.mock.method(console,'error',(...a)=>logs.push(a));
  const start=new Promise(resolve=>{started=resolve;});
  const put=new Promise(resolve=>{release=resolve;});
  fRef6.env.MEDIA={put(){started();return put;},delete:fRef6.env.MEDIA.delete};
  t.mock.timers.enable({apis:['setTimeout']});
  const pending=fRef6.send();await Promise.race([start,pending.then(r=>assert.equal(r.status,503))]);
  t.mock.timers.tick(45000);const result=await pending;assert.equal(result.status,503);
  release({key:'late'});await Promise.allSettled(fRef6.work);t.mock.timers.reset();
  assert.equal(fRef6.counts.statements,1);assert.equal(await fRef6.db.prepare('SELECT count(*) AS n FROM media_assets').first('n'),0);
  assert.ok(logs.length>0);
});
test('accepted upload registers completion independent of an aborted client signal',async t=>{
  const f=await mediaApiFixtureRef(t);
  const fRef7 = f;
  const storage=fRef7.env.MEDIA,controller=new AbortController();
  let started,release;
  const start=new Promise(resolve=>{started=resolve;});
  const gate=new Promise(resolve=>{release=resolve;});
  fRef7.env.MEDIA={async put(...args){started();await gate;return storage.put(...args);},delete:storage.delete};
  const pending=fRef7.api.fetch(new Request(fRef7.request(uploadIdRef,pngRef),{signal:controller.signal}),fRef7.env,fRef7.ctx);
  await Promise.race([start,pending.then(r=>assert.equal(r.status,200))]);assert.ok(fRef7.work.length>=1);
  controller.abort();release();await Promise.allSettled(fRef7.work);assert.equal((await pending).status,200);
  assert.equal(await fRef7.db.prepare('SELECT count(*) AS n FROM media_assets').first('n'),1);assert.equal(fRef7.r2.put,1);
});
test('cleanupFailure: simultaneous different bytes preserve winner and retain unclaimed loser',async t=>{
  const f=await mediaApiFixtureRef(t);
  const fRef8 = f;
  const storage=fRef8.env.MEDIA;let count=0,release;
  const gate=new Promise(resolve=>{release=resolve;});
  const logs=[];
  t.mock.method(console,'error',(...a)=>logs.push(a));
  fRef8.env.MEDIA={async put(...args){const object=await storage.put(...args);if(++count===2)release();await gate;return object;},async delete(){throw new Error('delete failed');}};
  const different=pngRef.slice();different[11]=7;
  const results=await Promise.all([fRef8.send(),fRef8.send(uploadIdRef,different)]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  assert.equal(await fRef8.db.prepare('SELECT count(*) AS n FROM media_assets').first('n'),1);
  assert.equal((await fRef8.bucket.list()).objects.length,2);assert.equal(logs.length,1);
});

test('authenticated pagedLibrary and invalid cursor budget',async t=>{
  const f=await adminApiFixtureRef(t);
  const fRef9 = f;await applyMediaMigrationRef(fRef9.db);
  const result=await fRef9.call('/media');assert.equal(result.status,200);
  assert.deepEqual(await result.json(),{items:[],configured:false,nextCursor:null});assert.equal(fRef9.counts.statements,1);
  assert.equal(result.headers.get('Cache-Control'),'no-store');
  const invalid=await fRef9.call('/media?cursor=no');assert.equal(invalid.status,400);assert.equal(fRef9.counts.statements,1);
});

const mediaTime='2026-10-12T08:00:00.0000000Z';
const mediaTimeRef = mediaTime;
const save=async(f,key,data,revision)=>saveDraftRef(f.db,key,await prepareDocumentBodyRef(JSON.stringify(data)),revision,'owner@example.test',mediaTimeRef);
const saveRef = save;
const archive=(f,id=uploadIdRef)=>f.call(`/media/${id}/archive`,{method:'POST',...f.auth,body:{}});
const archiveRef = archive;
test('archiveReferenceAndHistory: current references block, historic objects and restore remain safe',async t=>{
  const f=await mediaApiFixtureRef(t);
  const fRef10 = f;
  const asset=await (await fRef10.send()).json();
  for(const key of ['pricing','content','pages']) {
    await saveRef(fRef10,key,{nested:{image:asset.url}},0n);assert.equal((await archiveRef(fRef10)).status,409);
    await saveRef(fRef10,key,{nested:{image:asset.url+'?thumbnail'}},1n);
  }
  await saveRef(fRef10,'content',{assets:{heroImageUrl:asset.url}},2n);
  await publishDocumentRef(fRef10.db,'content',3n,false,'owner@example.test',mediaTimeRef);
  await saveRef(fRef10,'content',{assets:{}},4n);
  const referenced=await archiveRef(fRef10);assert.equal(referenced.status,409);assert.equal((await referenced.json()).code,'media_referenced');
  await publishDocumentRef(fRef10.db,'content',5n,false,'owner@example.test',mediaTimeRef);
  fRef10.reset();assert.equal((await archiveRef(fRef10)).status,204);assert.equal(fRef10.counts.statements,6);assert.equal(fRef10.r2.delete,0);
  fRef10.reset();assert.equal((await archiveRef(fRef10)).status,204);assert.equal(fRef10.counts.statements,1);
  const historical=await getDocumentVersionRef(fRef10.db,'content',3n);
  await saveDraftRef(fRef10.db,'content',await prepareDocumentBodyRef(historical.json),6n,'owner@example.test',mediaTimeRef,{existingBodyId:historical.bodyId,action:'restore:3'});
  await publishDocumentRef(fRef10.db,'content',7n,false,'owner@example.test',mediaTimeRef);
  const object=await fRef10.bucket.get(asset.url.split('/').at(-1));assert.deepEqual(new Uint8Array(await object.arrayBuffer()),pngRef);
  assert.equal((await fRef10.send()).status,409);
});
test('archiveDatabaseBudget: empty and six-body snapshots are bounded; corrupt chunks fail closed',async t=>{
  const f=await mediaApiFixtureRef(t);
  const fRef11 = f;await fRef11.send();fRef11.reset();assert.equal((await archiveRef(fRef11)).status,204);assert.equal(fRef11.counts.statements,3);
  fRef11.reset();assert.equal((await archiveRef(fRef11,crypto.randomUUID())).status,404);assert.equal(fRef11.counts.statements,1);
  const id=crypto.randomUUID();await fRef11.send(id);
  for(const key of ['pricing','content','pages']) {
    await saveRef(fRef11,key,{label:'published'},0n);await publishDocumentRef(fRef11.db,key,1n,false,'owner@example.test',mediaTimeRef);
    await saveRef(fRef11,key,{label:'draft'},2n);
  }
  fRef11.reset();assert.equal((await archiveRef(fRef11,id)).status,204);assert.equal(fRef11.counts.statements,9);assert.equal(fRef11.r2.put+fRef11.r2.delete,0);
  const corruptId=crypto.randomUUID();await fRef11.send(corruptId);
  await fRef11.db.prepare('DELETE FROM site_document_chunks WHERE body_id=(SELECT draft_body_id FROM site_documents WHERE key=?)').bind('pages').run();
  const errors=[];
  t.mock.method(console,'error',(...args)=>errors.push(args));
  assert.equal((await archiveRef(fRef11,corruptId)).status,500);assert.equal((await fRef11.db.prepare('SELECT archived FROM media_assets WHERE id=?').bind(corruptId).first()).archived,0);
});
test('archiveRevisionRace: newly saved/created/published references conflict without archiving',async t=>{
  const f=await mediaApiFixtureRef(t);
  const fRef12 = f;
  const asset=await (await fRef12.send()).json(),tracked=fRef12.env.DB;
  const trackedRef = tracked;
  for(const action of ['create','save','publish']) {
    if(action==='save')await saveRef(fRef12,'content',{assets:{}},1n);
    if(action==='publish')await saveRef(fRef12,'content',{assets:{}},3n);
    let changed=false;
    fRef12.env.DB={prepare(sql){const s=trackedRef.prepare(sql);
    const sRef3 = s;if(!sql.startsWith('UPDATE media_assets'))return sRef3;return {bind(...args){const b=sRef3.bind(...args);return {async run(){
      if(!changed){changed=true;if(action==='create')await saveRef(fRef12,'content',{assets:{heroImageUrl:asset.url}},0n);
        else if(action==='save')await saveRef(fRef12,'content',{assets:{heroImageUrl:asset.url}},2n);
        else await publishDocumentRef(fRef12.db,'content',4n,false,'owner@example.test',mediaTimeRef);}
      return b.run();}};}};}};
    assert.equal((await archiveRef(fRef12)).status,409);
    assert.equal((await fRef12.db.prepare('SELECT archived FROM media_assets WHERE id=?').bind(uploadIdRef).first()).archived,0);
  }
});
