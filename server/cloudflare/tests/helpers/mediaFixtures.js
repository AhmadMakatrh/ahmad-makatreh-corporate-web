// codeguard:components:start
// codeguard:defines: png, uploadId, mediaApiFixture
import assert from 'node:assert/strict';
import { createApi as createApiRef } from '../../src/index.js';
import { createAdminFixture as createAdminFixtureRef, adminRequest as adminRequestRef, trackDatabase as trackDatabaseRef } from './adminFixtures.js';
import { openTestDatabase as openTestDatabaseRef, applyInitialMigration as applyInitialMigrationRef, applyAdminMigration as applyAdminMigrationRef, applyDocumentMigration as applyDocumentMigrationRef, applyMediaMigration as applyMediaMigrationRef } from './d1.js';

export const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
const pngRef = png;
export const uploadId='11111111-1111-4111-8111-111111111111';
const uploadIdRef = uploadId;
export async function mediaApiFixture(t) {
  const {db: dbRef,bucket: bucketRef,dispose: disposeRef}=await openTestDatabaseRef(), work=[];
  t.after(async()=>{await Promise.allSettled(work);await disposeRef();});
  await applyInitialMigrationRef(dbRef);await applyAdminMigrationRef(dbRef);await applyDocumentMigrationRef(dbRef);await applyMediaMigrationRef(dbRef);
  const f=await createAdminFixtureRef();
  const fRef = f;
  const {tracked: trackedRef,counts}=trackDatabaseRef(dbRef),r2={put:0,delete:0,get:0,list:0};
  const r2Ref = r2;
  Object.assign(fRef,{db: dbRef,bucket: bucketRef,counts,r2: r2Ref,work: work});
  fRef.env.DB=trackedRef;fRef.env.MEDIA_PUBLIC_BASE_URL='https://media.example.test';
  fRef.env.MEDIA=new Proxy(bucketRef,{get(target,key){const value=target[key];
  const valueRef = value;return typeof valueRef==='function'? (...args)=>{if(key in r2Ref)r2Ref[key]++;return valueRef.apply(target,args);}:valueRef;}});
  fRef.env.ADMIN_UPLOAD_RATE_LIMITER={limit:async()=>({success:true})};
  fRef.api=createApiRef({fetcher:fRef.fetcher});fRef.ctx={waitUntil(p){work.push(p);}};
  fRef.call=(path,options)=>fRef.api.fetch(adminRequestRef(fRef,path,options),fRef.env,fRef.ctx);
  const session=await fRef.call('/session');assert.equal(session.status,200);
  fRef.auth={cookie:session.headers.get('Set-Cookie').split(';')[0],csrf:(await session.json()).csrfToken};
  fRef.request=(id,bytes,{name='قلعة.png',headers={},...auth}=fRef.auth)=>new Request(`${fRef.env.ADMIN_ORIGIN}/api/admin/media/${id}?name=${encodeURIComponent(name)}`,{
    method:'POST',body:bytes,headers:{Origin:fRef.env.ADMIN_ORIGIN,'Content-Type':'text/html',
      Cookie:[fRef.sessionCookie,auth.cookie].filter(Boolean).join('; '),...(auth.csrf ? {'X-Admin-CSRF':auth.csrf}:{}),...headers},
  });
  fRef.send=(id=uploadIdRef,bytes=pngRef,options=fRef.auth)=>fRef.api.fetch(fRef.request(id,bytes,options),fRef.env,fRef.ctx);
  fRef.reset=()=>{for(const key of Object.keys(counts))counts[key]=0;for(const key of Object.keys(r2Ref))r2Ref[key]=0;};
  return fRef;
}
// codeguard:components:end
