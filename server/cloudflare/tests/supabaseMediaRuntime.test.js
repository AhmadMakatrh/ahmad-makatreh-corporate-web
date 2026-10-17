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
import { createAdminClient as createAdminClientRef } from '../../../client/src/admin/adminApi.js';
import { insertMediaAsset as insertMediaAssetRef } from '../src/mediaAssets.js';
// codeguard:components:end

test('compiledSupabaseMediaLifecycle: existing client, private HTTP fixture and bounded real D1',async t=>{
  const clientRef = client;

  const root=fileURLToPathRef(new URL('../',import.meta.url)),workspace=fileURLToPathRef(new URL('../../../.superpowers/sdd/2026-10-13-supabase-storage-phase-5b/',import.meta.url));
  await mkdirRef(workspace,{recursive:true});const directory=await mkdtempRef(`${workspace}runtime-`),configPath=`${directory}/wrangler.json`;
  const fixture=await createAdminFixtureRef();
  const fixtureRef = fixture;
  const secret=['sb','secret','isolated-fixture-not-a-live-key'].join('_');
  const vars=Object.fromEntries(Object.entries(fixtureRef.env).filter(([,value])=>typeof value==='string'));
  await writeFileRef(configPath,JSON.stringify({name:'isolated-supabase-runtime',main:fileURLToPathRef(new URL('./helpers/supabaseRuntimeWorker.js',import.meta.url)).replaceAll('\\','/'),compatibility_date:'2026-09-05',dev:{local_protocol:'https'},
    vars:{...vars,TEST_PUBLIC_JWKS:fixtureRef.publicJwks,MEDIA_PROVIDER:'supabase',SUPABASE_URL:'https://kghmejpjvbmcivnlnkgf.supabase.co',SUPABASE_STORAGE_BUCKET:'ahmad-makatreh-media-preview',SUPABASE_SECRET_KEY:secret},
    d1_databases:[{binding:'DB',database_name:'isolated-supabase-runtime',migrations_dir:fileURLToPathRef(new URL('../migrations',import.meta.url))}],
    ratelimits:[['ADMIN_RATE_LIMITER','10122301',120],['ADMIN_UPLOAD_RATE_LIMITER','10122302',6],['ADMIN_REPLY_RATE_LIMITER','10122303',6]].map(([name,namespace_id,limit])=>({name,namespace_id,simple:{limit,period:60}})),
  }));
  await promisifyRef(execFileRef)(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy','--dry-run','--config',configPath,'--outdir',`${directory}/dist`],{cwd:root});
  const server=createTestHarnessRef({root:directory,workers:[{configPath: configPath,prebuiltWorkerDir:`${directory}/dist`}]});
  const serverRef = server;t.after(()=>serverRef.close());await serverRef.listen();
  const worker=serverRef.getWorker();await worker.applyD1Migrations('DB');const env=await worker.getEnv();
  const stats=async()=>(await serverRef.fetch('https://admin.example.test/__test/supabase-stats',{headers:{Connection:'close'}})).json();
  const statsRef = stats;
  async function client(email='owner@example.test'){
    const token=await fixtureRef.token({email});let cookie=(await fixtureRef.session.seal({accessToken:token,refreshToken:'isolated-refresh',signedInAt:Date.now()},fixtureRef.env)).split(';')[0];const hits=[];
    const api=createAdminClientRef(async(path,options)=>{
      hits.push(path);const headers={...options.headers,Connection:'close',Cookie:cookie};
      if(options.method&&options.method!=='GET')headers.Origin='https://admin.example.test';
      const r=await serverRef.fetch('https://admin.example.test'+path,{...options,headers: headers});
      if(r.headers.has('Set-Cookie'))cookie=`${cookie}; ${r.headers.get('Set-Cookie').split(';')[0]}`;return r;
    });
    const apiRef = api;await apiRef.session();return {api: apiRef,hits: hits};
  }
  const {api,hits}=await clientRef(),measured={};
  await api.get('/media');measured.list=await statsRef();assert.equal(measured.list.statements,1);assert.equal(measured.list.storage.list,0);
  const formats=[['png',pngRef,'image/png'],['jpg',Uint8Array.from([255,216,255,0,0,0,0,0,0,0,255,217]),'image/jpeg'],['webp',new TextEncoder().encode('RIFF0000WEBP'),'image/webp'],['pdf',new TextEncoder().encode('%PDF-1.7\n%%EOF'),'application/pdf']];
  const assets=[];
  for(const [extension,bytes,type]of formats){
    const asset=await api.upload(assets.length?crypto.randomUUID():uploadIdRef,new File([bytes],`قلعة.${extension}`,{type:'text/html'}));assets.push(asset);
    measured[extension]=await statsRef();assert.equal(measured[extension].statements,2);assert.equal(measured[extension].storage.uploads,1);assert.equal(measured[extension].storage.list,0);assert.equal(measured[extension].missingMetadata,0);
    assert.equal((await serverRef.fetch(asset.url,{headers:{Connection:'close'}})).status,400);
    const r=await serverRef.fetch(asset.url.replace('/object/public/','/object/authenticated/'),{headers:{apikey:secret,Connection:'close'}});
    assert.equal(r.headers.get('Content-Type'),type);assert.deepEqual(new Uint8Array(await r.arrayBuffer()),bytes);assert.equal(r.headers.get('Content-Disposition'),extension==='pdf'?'attachment':'inline');
  }
  assert.equal(hits.filter(p=>p==='/api/admin/media').length,1);
  await api.upload(uploadIdRef,new File([pngRef],'retry.png'));measured.retry=await statsRef();assert.equal(measured.retry.statements,1);assert.equal(measured.retry.storage.uploads,0);
  await api.write('/documents/content','PUT',{expectedRevision:0,data:{assets:{heroImageUrl:assets[0].url}}});
  await assert.rejects(api.write(`/media/${uploadIdRef}/archive`,'POST',{}),e=>e.status===409);
  await api.write('/documents/content','PUT',{expectedRevision:1,data:{assets:{}}});
  await api.write(`/media/${uploadIdRef}/archive`,'POST',{});measured.archive=await statsRef();assert.equal(measured.archive.statements,4);assert.equal(measured.archive.storage.removals,0);
  assert.equal(hits.filter(p=>p==='/api/admin/media').length,1);
  await api.write('/documents/content/restore','POST',{expectedRevision:2,revision:1});await api.write('/documents/content/publish','POST',{expectedRevision:3});
  assert.equal((await serverRef.fetch(assets[0].url.replace('/object/public/','/object/authenticated/'),{headers:{apikey:secret,Connection:'close'}})).status,200);
  const large=(await clientRef('large@example.test')).api;
  const largeRef = large;
  const bytes=new Uint8Array(10485760);
  bytes.set(pngRef);
  await largeRef.upload(crypto.randomUUID(),new File([bytes],'large.png'));measured.large=await statsRef();assert.equal(measured.large.storage.uploads,1);
  await assert.rejects(largeRef.upload(crypto.randomUUID(),new File([new Uint8Array(10485761)],'too-big.png')),e=>e.status===413);assert.equal((await statsRef()).statements,0);
  for(let i=0;i<27;i++)await insertMediaAssetRef(env.DB,{id:crypto.randomUUID(),objectKey:`fixture-${i}.png`,url:`https://kghmejpjvbmcivnlnkgf.supabase.co/storage/v1/object/public/ahmad-makatreh-media-preview/fixture-${i}.png`,originalName:'قلعة.png',contentType:'image/png',sha256:'a'.repeat(64),size:12,createdAtUtc:'2026-10-13T08:00:00.0000000Z',actor:'owner@example.test'});
  const first=await api.get('/media',true);assert.equal(first.items.length,25);assert.ok(first.nextCursor);const second=await api.get('/media?cursor='+encodeURIComponent(first.nextCursor));assert.equal(second.items.length,6);
  assert.equal(new Set([...first.items,...second.items].map(a=>a.id)).size,31);assert.equal((await statsRef()).storage.list,0);
  await writeFileRef(`${directory}/budgets.json`,JSON.stringify(measured,null,2));t.diagnostic(`Measured local D1/Storage: ${JSON.stringify(measured)}`);
});
