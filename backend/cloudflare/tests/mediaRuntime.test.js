// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile as execFileRef } from 'node:child_process';
import { promisify as promisifyRef } from 'node:util';
import { mkdir as mkdirRef,mkdtemp as mkdtempRef,writeFile as writeFileRef } from 'node:fs/promises';
import { fileURLToPath as fileURLToPathRef } from 'node:url';
import { createTestHarness as createTestHarnessRef } from 'wrangler';
import { createAdminFixture as createAdminFixtureRef } from './helpers/adminFixtures.js';
import { png as pngRef,uploadId as uploadIdRef } from './helpers/mediaFixtures.js';
import { createAdminClient as createAdminClientRef } from '../../../frontend/src/admin/adminApi.js';
import { insertMediaAsset as insertMediaAssetRef } from '../src/mediaAssets.js';
// codeguard:components:end

test('compiledMediaLifecycle: actual R2 bytes, existing client and bounded SQL',async t=>{
  const clientRef = client;

  const root=fileURLToPathRef(new URL('../',import.meta.url)),workspace=fileURLToPathRef(new URL('../../../.superpowers/sdd/2026-10-12-cloudflare-phase-4/',import.meta.url));
  await mkdirRef(workspace,{recursive:true});const directory=await mkdtempRef(`${workspace}runtime-`),configPath=`${directory}/wrangler.json`;
  const fixture=await createAdminFixtureRef();
  const fixtureRef = fixture;
  const vars=Object.fromEntries(Object.entries(fixtureRef.env).filter(([,value])=>typeof value==='string'));
  const entry=fileURLToPathRef(new URL('./helpers/mediaRuntimeWorker.js',import.meta.url)).replaceAll('\\','/');
  await writeFileRef(configPath,JSON.stringify({name:'isolated-media-runtime',main:entry,compatibility_date:'2026-09-05',dev:{local_protocol:'https'},
    vars:{...vars,TEST_PUBLIC_JWKS:fixtureRef.publicJwks,MEDIA_PUBLIC_BASE_URL:'https://media.example.test'},
    d1_databases:[{binding:'DB',database_name:'isolated-media-runtime',migrations_dir:fileURLToPathRef(new URL('../migrations',import.meta.url))}],
    r2_buckets:[{binding:'MEDIA',bucket_name:'isolated-media-runtime'}],
    ratelimits:[['ADMIN_RATE_LIMITER','10122101',120],['ADMIN_REPLY_RATE_LIMITER','10122102',6],['ADMIN_UPLOAD_RATE_LIMITER','10122103',6]].map(([name,namespace_id,limit])=>({name,namespace_id,simple:{limit,period:60}})),
  }));
  await promisifyRef(execFileRef)(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy','--dry-run','--config',configPath,'--outdir',`${directory}/dist`],{cwd:root});
  const server=createTestHarnessRef({root:directory,workers:[{configPath: configPath,prebuiltWorkerDir:`${directory}/dist`}]});
  const serverRef = server;t.after(()=>serverRef.close());await serverRef.listen();
  const worker=serverRef.getWorker();await worker.applyD1Migrations('DB');await worker.applyD1Migrations('DB');const env=await worker.getEnv();
  assert.equal(await env.DB.prepare('SELECT count(*) AS n FROM d1_migrations').first('n'),4);
  const stats=async()=> (await serverRef.fetch('https://admin.example.test/__test/media-stats',{headers:{Connection:'close'}})).json();
  const statsRef = stats;
  async function client(email='owner@example.test'){
    const token=await fixtureRef.token({email});let cookie=(await fixtureRef.session.seal({accessToken:token,refreshToken:'isolated-refresh',signedInAt:Date.now()},fixtureRef.env)).split(';')[0];const hits=[];
    const api=createAdminClientRef(async(path,options)=>{
      hits.push(path);const headers={...options.headers,Connection:'close',Cookie:cookie};
      if(options.method && options.method!=='GET')headers.Origin='https://admin.example.test';
      const r=await serverRef.fetch(`https://admin.example.test${path}`,{...options,headers: headers});
      if(r.headers.has('Set-Cookie'))cookie=`${cookie}; ${r.headers.get('Set-Cookie').split(';')[0]}`;return r;
    });
    const apiRef = api;await apiRef.session();return {api: apiRef,hits: hits};
  }
  const {api,hits}=await clientRef();const measured={};
  await api.get('/media');measured.list=await statsRef();assert.equal(measured.list.statements,1);
  const formats=[['png',pngRef,'image/png'],['jpg',Uint8Array.from([255,216,255,0,0,0,0,0,0,0,255,217]),'image/jpeg'],
    ['webp',new TextEncoder().encode('RIFF0000WEBP'),'image/webp'],['pdf',new TextEncoder().encode('%PDF-1.7\n%%EOF'),'application/pdf']];
  const assets=[];
  for(const [extension,bytes,type]of formats){
    const asset=await api.upload(assets.length ? crypto.randomUUID():uploadIdRef,new File([bytes],`قلعة.${extension}`,{type:'text/html'}));assets.push(asset);
    measured[extension]=await statsRef();assert.equal(measured[extension].statements,2);assert.equal(measured[extension].put,1);assert.equal(measured[extension].missingMetadata,0);
    const actual=await serverRef.fetch(asset.url);assert.equal(actual.headers.get('Content-Type'),type);assert.deepEqual(new Uint8Array(await actual.arrayBuffer()),bytes);
    assert.equal(actual.headers.get('Content-Disposition'),extension==='pdf'?'attachment':'inline');
  }
  assert.equal(hits.filter(p=>p==='/api/admin/media').length,1);
  await api.upload(uploadIdRef,new File([pngRef],'retry.png'));measured.retry=await statsRef();assert.equal(measured.retry.statements,1);assert.equal(measured.retry.put,0);
  await api.write('/documents/content','PUT',{expectedRevision:0,data:{assets:{heroImageUrl:assets[0].url}}});
  await assert.rejects(api.write(`/media/${uploadIdRef}/archive`,'POST',{}),error=>error.status===409);
  measured.reference=await statsRef();assert.equal(measured.reference.statements,3);
  await api.write('/documents/content','PUT',{expectedRevision:1,data:{assets:{}}});
  await api.write(`/media/${uploadIdRef}/archive`,'POST',{});measured.archive=await statsRef();assert.equal(measured.archive.statements,4);assert.equal(measured.archive.delete,0);
  assert.equal(hits.filter(p=>p==='/api/admin/media').length,1);
  await api.write('/documents/content/restore','POST',{expectedRevision:2,revision:1});
  await api.write('/documents/content/publish','POST',{expectedRevision:3});assert.equal((await serverRef.fetch(assets[0].url)).status,200);
  const large=(await clientRef('large@example.test')).api;
  const largeRef = large;
  const bytes=new Uint8Array(10485760);
  bytes.set(pngRef);
  await largeRef.upload(crypto.randomUUID(),new File([bytes],'large.png'));await assert.rejects(largeRef.upload(crypto.randomUUID(),new File([new Uint8Array(10485761)],'too-big.png')),e=>e.status===413);
  const rejected=await statsRef();assert.equal(rejected.statements,0);assert.equal(rejected.put,0);
  for(let i=0;i<27;i++)await insertMediaAssetRef(env.DB,{id:crypto.randomUUID(),objectKey:`fixture-${i}.png`,url:`https://media.example.test/fixture-${i}.png`,originalName:'fixture.png',contentType:'image/png',sha256:'a'.repeat(64),size:12,createdAtUtc:'2026-10-12T08:00:00.0000000Z',actor:'owner@example.test'});
  const first=await api.get('/media',true);assert.equal(first.items.length,25);assert.ok(first.nextCursor);
  const second=await api.get(`/media?cursor=${encodeURIComponent(first.nextCursor)}`);assert.equal(second.items.length,6);
  assert.equal(new Set([...first.items,...second.items].map(v=>v.id)).size,31);
  if(Date.now()%60000>50000)await new Promise(resolve=>setTimeout(resolve,60000-Date.now()%60000+50));
  const limited=(await clientRef('limited@example.test')).api;
  const limitedRef = limited;
  for(let i=0;i<6;i++)await limitedRef.upload(crypto.randomUUID(),new File([pngRef],'limited.png'));
  await assert.rejects(limitedRef.upload(crypto.randomUUID(),new File([pngRef],'limited.png')),e=>e.status===429);assert.equal((await statsRef()).statements,0);
  await writeFileRef(`${directory}/budgets.json`,JSON.stringify(measured,null,2));t.diagnostic(`Measured media SQL/R2: ${JSON.stringify(measured)}`);
});
