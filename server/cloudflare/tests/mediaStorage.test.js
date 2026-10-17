// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import test from 'node:test';
import assert from 'node:assert/strict';
import { getMediaStorage as getMediaStorageRef } from '../src/mediaStorage.js';

const origin='https://kghmejpjvbmcivnlnkgf.supabase.co';
const originRef = origin;
const bucket='ahmad-makatreh-media-preview';
const bucketRef = bucket;
const secret=['sb','secret','isolated-fixture-not-a-live-key'].join('_');
const secretRef = secret;
const key='11111111111141118111111111111111.png';
const keyRef = key;
const bytes=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
const bytesRef = bytes;
const hash='a'.repeat(64);
const hashRef = hash;
const env={MEDIA_PROVIDER:'supabase',SUPABASE_URL:originRef,SUPABASE_STORAGE_BUCKET:bucketRef,SUPABASE_SECRET_KEY:secretRef};
const envRef = env;
const opts={sha256:hashRef,contentType:'image/png'};
const optsRef = opts;
const accepted=()=>Response.json({Id:'11111111-1111-4111-8111-111111111111',Key:`${bucketRef}/${keyRef}`});
const acceptedRef = accepted;
// codeguard:components:end

test('providerSelectionFailsClosed: configuration never makes a request or falls back to R2',async()=>{
  let calls=0,r2Calls=0;const fetcher=()=>{calls++;throw new Error('Unexpected request.');};
  const fetcherRef = fetcher;
  const r2={put(){r2Calls++;return {};},delete(){r2Calls++;}};
  const r2Ref = r2;
  for(const change of [
    {MEDIA_PROVIDER:'unknown'},{SUPABASE_SECRET_KEY:''},{SUPABASE_SECRET_KEY:'publishable-key'},
    {SUPABASE_SECRET_KEY:secretRef+'\n'},{SUPABASE_STORAGE_BUCKET:'../bucket'},
    {SUPABASE_URL:'http://kghmejpjvbmcivnlnkgf.supabase.co'},
    {SUPABASE_URL:'https://supabase.co.attacker.test'},
    {SUPABASE_URL:originRef+'/path'},{SUPABASE_URL:originRef+'?secret=1'},
    {SUPABASE_URL:originRef+'#fragment'},{SUPABASE_URL:originRef.replace('https://','https://user:pass@')},
    {SUPABASE_URL:originRef+':444'},{SUPABASE_URL:originRef+'\\path'},
  ]) assert.equal(getMediaStorageRef({...envRef,MEDIA:r2Ref,MEDIA_PUBLIC_BASE_URL:'https://media.example.test',...change},{fetcher: fetcherRef}),null);
  const storage=getMediaStorageRef({...envRef,MEDIA:r2Ref},{fetcher:async()=>new Response('unavailable',{status:503})});
  const storageRef = storage;
  await assert.rejects(storageRef.put(keyRef,bytesRef,optsRef));
  assert.equal(calls,0);assert.equal(r2Calls,0);
});

test('supabaseBinaryUploadAndUrl: safe request, UTF-8 metadata, stable public address and PDF download',async()=>{
  const requests=[];
  const storage=getMediaStorageRef(envRef,{fetcher:async(url,options)=>{
    const request=new Request(url,options);
    requests.push(request);
    assert.equal(request.url,`${originRef}/storage/v1/object/${bucketRef}/${keyRef}`);
    assert.equal(request.method,'POST');assert.equal(request.redirect,'manual');
    assert.equal(request.headers.get('apikey'),secretRef);assert.equal(request.headers.has('Authorization'),false);
    assert.equal(request.headers.get('x-upsert'),'false');assert.equal(request.headers.get('Content-Type'),'image/png');
    assert.equal(request.headers.get('Cache-Control'),'public, max-age=31536000, immutable');
    assert.deepEqual(JSON.parse(Buffer.from(request.headers.get('x-metadata'),'base64').toString('utf8')),{label:'قلعة',sha256:hashRef});
    assert.deepEqual(new Uint8Array(await request.arrayBuffer()),bytesRef);
    return acceptedRef();
  }});
  const storageRef2 = storage;
  assert.equal(storageRef2.urlFor(keyRef,'image/png'),`${originRef}/storage/v1/object/public/${bucketRef}/${keyRef}`);
  assert.equal(storageRef2.urlFor('folder/قلعة.pdf','application/pdf'),`${originRef}/storage/v1/object/public/${bucketRef}/folder/%D9%82%D9%84%D8%B9%D8%A9.pdf?download`);
  await storageRef2.put(keyRef,bytesRef,{...optsRef,metadata:{label:'قلعة'},signal:new AbortController().signal});
  assert.equal(requests.length,1);
  for(const invalid of ['../secret.png','folder/./x.png','/x.png','x//y.png','x\\y.png','x\u0000.png']) {
    assert.throws(()=>storageRef2.urlFor(invalid,'image/png'));
    await assert.rejects(storageRef2.put(invalid,bytesRef,optsRef));
  }
  assert.equal(requests.length,1);
});

test('portable cache directives can be restored without changing the normal upload default',async()=>{
  let directive;
  const storage=getMediaStorageRef(envRef,{fetcher:async(_url,options)=>{directive=new Headers(options.headers).get('Cache-Control');return acceptedRef();}});
  const storageRef3 = storage;
  await storageRef3.put(keyRef,bytesRef,{...optsRef,cacheControl:'max-age=3600'});assert.equal(directive,'max-age=3600');
  await assert.rejects(storageRef3.put(keyRef,bytesRef,{...optsRef,cacheControl:'max-age=3600\r\nX-Injected: yes'}));
});

test('storageErrorsAndSecretSafety: HTTP, acknowledgment, abort and oversized bodies cannot claim success',async t=>{
  const failures=[
    async()=>new Response(`private error ${secretRef}`,{status:503}),
    async()=>new Response(null,{status:302,headers:{Location:'https://attacker.test'}}),
    async()=>new Response('not-json'),async()=>Response.json({}),
    async()=>Response.json({Id:'wrong',Key:`${bucketRef}/different.png`}),
    async()=>{throw new Error(`private transport ${secretRef}`);},
  ];
  for(const fetcher of failures) {
    const storage=getMediaStorageRef(envRef,{fetcher});
    const storageRef4 = storage;
    await assert.rejects(storageRef4.put(keyRef,bytesRef,optsRef),exception=>!String(exception).includes(secretRef)&&!String(exception).includes('private'));
  }
  let canceled=false;
  const oversized=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(16385));},cancel(){canceled=true;}});
  await assert.rejects(getMediaStorageRef(envRef,{fetcher:async()=>new Response(oversized)}).put(keyRef,bytesRef,optsRef));assert.equal(canceled,true);
  const controller=new AbortController();
  controller.abort();
  await assert.rejects(getMediaStorageRef(envRef,{fetcher:async(_url,options)=>{
    assert.equal(options.signal,controller.signal);options.signal.throwIfAborted();return acceptedRef();
  }}).put(keyRef,bytesRef,{...optsRef,signal:controller.signal}));
  const logs=[];
  t.mock.method(console,'error',(...args)=>logs.push(args));
  await assert.rejects(getMediaStorageRef(envRef,{fetcher:failures[0]}).put(keyRef,bytesRef,optsRef));assert.equal(logs.length,0);
});

test('boundedCleanup: deletes exactly the losing key and aborts after three seconds without retry',async t=>{
  const calls=[];
  const storage=getMediaStorageRef(envRef,{fetcher:async(url,options)=>{
    calls.push({url,options});assert.equal(url,`${originRef}/storage/v1/object/${bucketRef}`);
    assert.equal(options.method,'DELETE');assert.equal(options.redirect,'manual');
    assert.deepEqual(JSON.parse(options.body),{prefixes:[keyRef]});return Response.json([{name:keyRef}]);
  }});
  const storageRef5 = storage;
  await storageRef5.remove(keyRef);assert.equal(calls.length,1);
  let started,signal,attempts=0;
  const start=new Promise(resolve=>{started=resolve;});
  const blocked=getMediaStorageRef(envRef,{fetcher:async(_url,options)=>new Promise((_resolve,reject)=>{
    attempts++;signal=options.signal;signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true});started();
  })});
  const blockedRef = blocked;
  t.mock.timers.enable({apis:['setTimeout']});
  const pending=blockedRef.remove(keyRef),rejected=assert.rejects(pending);await start;
  t.mock.timers.tick(2999);assert.equal(signal.aborted,false);
  t.mock.timers.tick(1);await rejected;assert.equal(signal.aborted,true);assert.equal(attempts,1);t.mock.timers.reset();
});

test('r2AdapterCompatibility: existing conditional write, metadata and public base remain intact',async()=>{
  let put,removed;
  const r2={async put(...args){put=args;return {key: keyRef};},async delete(value){removed=value;}};
  const r2Ref2 = r2;
  const legacy={MEDIA:r2Ref2,MEDIA_PUBLIC_BASE_URL:'https://media.example.test/asset-root/'};
  for(const selection of [{},{MEDIA_PROVIDER:'r2'}]) {
    const storage=getMediaStorageRef({...legacy,...selection});
    const storageRef6 = storage;
    assert.equal(storageRef6.urlFor(keyRef,'image/png'),`https://media.example.test/asset-root/${keyRef}`);
    await storageRef6.put(keyRef,bytesRef,optsRef);assert.equal(put[0],keyRef);assert.deepEqual(put[1],bytesRef);
    assert.equal(put[2].onlyIf.get('If-None-Match'),'*');assert.equal(put[2].sha256,hashRef);
    assert.deepEqual(put[2].httpMetadata,{contentType:'image/png',contentDisposition:'inline',cacheControl:'public, max-age=31536000, immutable'});
    await storageRef6.remove(keyRef);assert.equal(removed,keyRef);
  }
  r2Ref2.put=async()=>null;await assert.rejects(getMediaStorageRef(legacy).put(keyRef,bytesRef,optsRef));
  for(const base of ['http://media.example.test','https://user:password@media.example.test','https://media.example.test?token=x'])
    assert.equal(getMediaStorageRef({...legacy,MEDIA_PUBLIC_BASE_URL:base}),null);
});
