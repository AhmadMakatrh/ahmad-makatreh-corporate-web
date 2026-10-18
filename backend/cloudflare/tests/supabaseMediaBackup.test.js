// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir as mkdirRef,mkdtemp as mkdtempRef,readFile as readFileRef,writeFile as writeFileRef,readdir as readdirRef } from 'node:fs/promises';
import { fileURLToPath as fileURLToPathRef } from 'node:url';
import { execFile as execFileRef } from 'node:child_process';
import { promisify as promisifyRef } from 'node:util';
import { createSupabaseStorageFixture as createSupabaseStorageFixtureRef } from './helpers/supabaseStorageFixture.js';
import { getMediaStorage as getMediaStorageRef } from '../src/mediaStorage.js';
import { backupSupabaseMedia as backupSupabaseMediaRef,restoreSupabaseMedia as restoreSupabaseMediaRef,probeSupabaseMedia as probeSupabaseMediaRef } from '../scripts/supabaseMediaTools.js';
import { getPlatformProxy as getPlatformProxyRef } from 'wrangler';
import { applyInitialMigration as applyInitialMigrationRef,applyAdminMigration as applyAdminMigrationRef,applyDocumentMigration as applyDocumentMigrationRef,applyMediaMigration as applyMediaMigrationRef,seedInquiry as seedInquiryRef } from './helpers/d1.js';
import { insertMediaAsset as insertMediaAssetRef } from '../src/mediaAssets.js';
import { prepareDocumentBody as prepareDocumentBodyRef } from '../src/documentBodies.js';
import { saveDraft as saveDraftRef,publishDocument as publishDocumentRef,getDocumentVersion as getDocumentVersionRef,getDocument as getDocumentRef } from '../src/siteDocuments.js';
import { addReply as addReplyRef } from '../src/inquiryReplies.js';
const fixtureRef = fixture;


const origin='https://kghmejpjvbmcivnlnkgf.supabase.co';
const originRef = origin;
const secret=['sb','secret','isolated-fixture-not-a-live-key'].join('_');
const secretRef = secret;
const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
const pngRef = png;
const hash=async bytes=>Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex');
const hashRef = hash;
const environment=bucket=>({MEDIA_PROVIDER:'supabase',SUPABASE_URL:originRef,SUPABASE_STORAGE_BUCKET:bucket,SUPABASE_SECRET_KEY:secretRef,SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fixture'});
const environmentRef = environment;
async function fixture(){
  const root=fileURLToPathRef(new URL('../../../.superpowers/sdd/2026-10-13-supabase-storage-phase-5b/',import.meta.url));await mkdirRef(root,{recursive:true});
  const directory=await mkdtempRef(root+'operator-'),source=createSupabaseStorageFixtureRef({origin: originRef,bucket:'source-preview',secret: secretRef});
  const sourceRef = source;
  const destination=createSupabaseStorageFixtureRef({origin: originRef,bucket:'restore-preview',secret: secretRef});
  const destinationRef = destination;
  const sourceEnv=environmentRef(sourceRef.bucket),destinationEnv=environmentRef(destinationRef.bucket),adapter=getMediaStorageRef(sourceEnv,{fetcher:sourceRef.fetcher});
  const adapterRef = adapter;
  await adapterRef.put('folder/قلعة.png',pngRef,{sha256:await hashRef(pngRef),contentType:'image/png',cacheControl:'max-age=3600',metadata:{label:'قلعة',state:'archived'}});
  return {directory,source: sourceRef,destination: destinationRef,sourceEnv,destinationEnv,adapter: adapterRef};
}
// codeguard:components:end
test('storageBackupAndEmptyRestore: every page, folder, orphan byte and portable metadata comes from the destination',async()=>{
  const f=await fixtureRef();for(let i=0;i<102;i++)await f.adapter.put(`retained-orphan-${String(i).padStart(3,'0')}.png`,pngRef,{sha256:await hashRef(pngRef),contentType:'image/png'});
  f.source.reset();const directory=f.directory+'/backup',saved=await backupSupabaseMediaRef({env:f.sourceEnv,directory,fetcher:f.source.fetcher});
  assert.equal(JSON.parse(await readFileRef(directory+'/manifest.json','utf8')).files.find(v=>v.key==='folder/قلعة.png').metadata.label,'قلعة');
  assert.equal(saved.files,103);assert.equal(f.source.counts.list,3);assert.equal(f.source.counts.info,103);assert.equal(saved.httpRequests,210);assert.equal(saved.bytes,1236);
  const manifest=JSON.parse(await readFileRef(directory+'/manifest.json','utf8'));assert.equal(manifest.format,'ahmad-site-supabase-media');assert.equal(manifest.version,1);assert.ok(!JSON.stringify(manifest).includes(secretRef));
  f.source.reset();const restored=await restoreSupabaseMediaRef({env:f.destinationEnv,directory,fetcher:f.destination.fetcher});assert.equal(restored.files,103);
  assert.equal(restored.httpRequests,314);assert.equal(f.destination.counts.info,103);
  assert.equal(f.source.counts.uploads+f.source.counts.downloads+f.source.counts.list,0);assert.equal(f.destination.counts.upserts+f.destination.counts.removals,0);
  for(const [key,value]of f.source.objects){const actual=f.destination.objects.get(key);assert.deepEqual(actual.body,value.body);assert.equal(actual.cacheControl,value.cacheControl);assert.equal(actual.contentType,value.contentType);assert.deepEqual(actual.userMetadata,value.userMetadata);}
  await assert.rejects(restoreSupabaseMediaRef({env:f.destinationEnv,directory,fetcher:f.destination.fetcher}));
  const uploads=f.source.counts.uploads;await assert.rejects(backupSupabaseMediaRef({env:f.sourceEnv,directory,fetcher:f.source.fetcher}));assert.equal(f.source.counts.uploads,uploads);
});
test('destination metadata field order is immaterial and upload keeps its deadline signal',async t=>{
  const f=await fixtureRef(),directory=f.directory+'/backup';await backupSupabaseMediaRef({env:f.sourceEnv,directory,fetcher:f.source.fetcher});
  const fetcher=async(url,options)=>{
    if(options.method==='POST'&&!String(url).includes('/list/'))assert.equal(options.signal,controller.signal);
    const result=await f.destination.fetcher(url,options);
    if(String(url).includes('/object/info/')){const item=await result.json();return Response.json({...item,metadata:Object.fromEntries(Object.entries(item.metadata).reverse())});}
    return result;
  };
  const fetcherRef = fetcher;
  const controller=new AbortController();
  t.mock.method(AbortSignal,'timeout',()=>controller.signal);
  assert.equal((await restoreSupabaseMediaRef({env:f.destinationEnv,directory,fetcher: fetcherRef})).files,1);
});
test('public production source requires explicit backup mode and preserves its bytes',async()=>{
  const f=await fixtureRef();f.source.settings.public=true;
  await assert.rejects(backupSupabaseMediaRef({env:f.sourceEnv,directory:f.directory+'/private-mode',fetcher:f.source.fetcher}));
  const directory=f.directory+'/public-mode';
  const saved=await backupSupabaseMediaRef({env:f.sourceEnv,directory,fetcher:f.source.fetcher,allowPublicRead:true});
  assert.equal(saved.files,1);assert.equal(saved.bytes,pngRef.length);
  assert.equal(JSON.parse(await readFileRef(directory+'/manifest.json','utf8')).files[0].key,'folder/قلعة.png');
});
test('restoreRefusesUnsafeTarget: source, nonempty/public destination and CLI mismatch never overwrite',async()=>{
  const f=await fixtureRef(),directory=f.directory+'/backup';await backupSupabaseMediaRef({env:f.sourceEnv,directory,fetcher:f.source.fetcher});
  f.source.reset();await assert.rejects(restoreSupabaseMediaRef({env:f.sourceEnv,directory,fetcher:f.source.fetcher}));assert.equal(f.source.counts.uploads+f.source.counts.list,0);
  f.destination.objects.set('existing.png',f.source.objects.values().next().value);await assert.rejects(restoreSupabaseMediaRef({env:f.destinationEnv,directory,fetcher:f.destination.fetcher}));assert.equal(f.destination.counts.uploads,0);
  f.destination.objects.clear();f.destination.settings.public=true;await assert.rejects(restoreSupabaseMediaRef({env:f.destinationEnv,directory,fetcher:f.destination.fetcher}));assert.equal(f.destination.counts.uploads,0);
  const tool=fileURLToPathRef(new URL('../scripts/supabaseMediaTools.js',import.meta.url));
  await assert.rejects(promisifyRef(execFileRef)(process.execPath,[tool,'backup','--project-ref','wrong','--bucket','source-preview','--directory',f.directory+'/unexpected'],{env:{...process.env,...f.sourceEnv}}),e=>!String(e).includes(secretRef));
});
test('corruptManifestOrBytesFails: complete validation before any destination upload',async()=>{
  for(const change of [m=>{m.files[0].file='../outside';},m=>{m.files.push(m.files[0]);},m=>{m.files[0].sha256='b'.repeat(64);},m=>{m.files[0].size=10485761;},m=>{m.files[0].contentType='text/html';},m=>{m.files[0].metadata=[];},m=>{m.source.projectRef='invalid/path';},m=>{m.version=2;}]){
    const f=await fixtureRef(),directory=f.directory+'/backup';await backupSupabaseMediaRef({env:f.sourceEnv,directory,fetcher:f.source.fetcher});
    const m=JSON.parse(await readFileRef(directory+'/manifest.json','utf8'));change(m);await writeFileRef(directory+'/manifest.json',JSON.stringify(m));
    await assert.rejects(restoreSupabaseMediaRef({env:f.destinationEnv,directory,fetcher:f.destination.fetcher}));assert.equal(f.destination.counts.uploads+f.destination.counts.list,0);
  }
  const f=await fixtureRef(),directory=f.directory+'/backup';await backupSupabaseMediaRef({env:f.sourceEnv,directory,fetcher:f.source.fetcher});const m=JSON.parse(await readFileRef(directory+'/manifest.json','utf8'));
  await writeFileRef(directory+'/'+m.files[0].file,'bad');await assert.rejects(restoreSupabaseMediaRef({env:f.destinationEnv,directory,fetcher:f.destination.fetcher}));assert.equal(f.destination.counts.uploads,0);
});
test('probePoliciesAndSize: all types and 10MiB verified, anonymous permission failures must be real denials',async()=>{
  const f=await fixtureRef(),directory=f.directory+'/probe';f.source.objects.clear();const result=await probeSupabaseMediaRef({env:f.sourceEnv,directory,fetcher:f.source.fetcher});
  assert.equal(result.files,5);assert.equal(f.source.objects.size,5);assert.ok([...f.source.objects.values()].some(v=>v.body.length===10485760));
  assert.equal(result.httpRequests,15);assert.equal(f.source.counts.keyChecks,1);
  const calls=f.source.counts.uploads;await assert.rejects(probeSupabaseMediaRef({env:f.sourceEnv,directory,fetcher:f.source.fetcher}));assert.equal(f.source.counts.uploads,calls);
  await assert.rejects(probeSupabaseMediaRef({env:{...f.sourceEnv,SUPABASE_PUBLISHABLE_KEY:''},directory:f.directory+'/missing',fetcher:f.source.fetcher}));
  for(const status of [200,503]){
    const other=await fixtureRef();const fetcher=(url,options)=>new Headers(options.headers).get('apikey')===secretRef||new URL(url).pathname==='/storage/v1/bucket'?other.source.fetcher(url,options):Promise.resolve(new Response(null,{status}));
    const fetcherRef2 = fetcher;
    await assert.rejects(probeSupabaseMediaRef({env:other.sourceEnv,directory:other.directory+'/unsafe',fetcher: fetcherRef2}));assert.equal(other.source.objects.size,2);
  }
});
test('invalid publishable key is not successful policy evidence, and no write runs before its positive check',async()=>{
  const f=await fixtureRef();f.source.objects.clear();f.source.reset();
  const fetcher=(url,options)=>new Headers(options.headers).get('apikey')===secretRef?f.source.fetcher(url,options):Promise.resolve(new Headers(options.headers).has('apikey')?Response.json({message:'Invalid API key'},{status:401}):new Response(null,{status:403}));
  const fetcherRef3 = fetcher;
  await assert.rejects(probeSupabaseMediaRef({env:{...f.sourceEnv,SUPABASE_PUBLISHABLE_KEY:'sb_publishable_wrong_project'},directory:f.directory+'/invalid-key',fetcher: fetcherRef3}));assert.equal(f.source.counts.uploads,0);
});
test('unrelated HTTP400, authentication codes and malformed denial bodies never pass policy checks',async()=>{
  for(const body of [{statusCode:'403',code:'InvalidJWT'},{statusCode:'400',code:'InvalidRequest'},{statusCode:'413',code:'EntityTooLarge'},{statusCode:'403'},null]){
    const f=await fixtureRef(),fetcher=(url,options)=>new Headers(options.headers).get('apikey')===secretRef||new URL(url).pathname==='/storage/v1/bucket'?f.source.fetcher(url,options):Promise.resolve(Response.json(body,{status:400}));
    const fetcherRef4 = fetcher;
    await assert.rejects(probeSupabaseMediaRef({env:f.sourceEnv,directory:f.directory+'/not-policy',fetcher: fetcherRef4}));
  }
});
test('fullD1AndSupabaseRecovery: closed SQL snapshot keeps all 8 tables, Arabic, history and exact Int64',async t=>{
  const openRef = open;

  const f=await fixtureRef(),configs={};
  const root=fileURLToPathRef(new URL('../',import.meta.url));let source,destination;
  async function open(name){
    const folder=f.directory+'/'+name;await mkdirRef(folder,{recursive:true});const configPath=folder+'/wrangler.json';configs[name]=configPath;
    await writeFileRef(configPath,JSON.stringify({name:'isolated-supabase-backup-'+name,compatibility_date:'2026-09-05',d1_databases:[{binding:'DB',database_name:'isolated-supabase-backup-'+name}]}));
    return getPlatformProxyRef({configPath,persist:{path:folder+'/.wrangler/state/v3'},remoteBindings:false,envFiles:[]});
  }
  source=await openRef('source');t.after(async()=>{await source?.dispose();await destination?.dispose();});const db=source.env.DB;
  const dbRef = db;
  const time='2026-10-13T08:00:00.0000000Z';
  const timeRef = time;
  const actor='owner@example.test';
  const actorRef = actor;
  await applyInitialMigrationRef(dbRef);await seedInquiryRef(dbRef);await applyAdminMigrationRef(dbRef);await applyDocumentMigrationRef(dbRef);await applyMediaMigrationRef(dbRef);
  await dbRef.prepare("INSERT INTO booking_submission_guards VALUES ('ip-fixture','payload-fixture',1,1,2,'11111111-1111-4111-8111-111111111111')").run();
  await dbRef.prepare("INSERT INTO booking_ip_blocks VALUES ('ip-fixture',2)").run();
  await addReplyRef(dbRef,{id:crypto.randomUUID(),inquiryId:'11111111-1111-4111-8111-111111111111',subject:'رد تجريبي',body:'بيانات اختبار خاصة',actor: actorRef,createdAtUtc:timeRef});
  const keys=['folder/قلعة.png','وثيقة.pdf'];
  const keysRef = keys;
  const pdf=new TextEncoder().encode('%PDF-1.7\n%%EOF');
  await f.adapter.put(keysRef[1],pdf,{sha256:await hashRef(pdf),contentType:'application/pdf'});
  for(let i=0;i<101;i++)await f.adapter.put('orphan-'+i+'.png',pngRef,{sha256:await hashRef(pngRef),contentType:'image/png'});
  const urls=keysRef.map((key,i)=>f.adapter.urlFor(key,i?'application/pdf':'image/png')),assets=[];
  for(let i=0;i<2;i++){
    const data=i?pdf:pngRef,asset={id:crypto.randomUUID(),objectKey:keysRef[i],url:urls[i],originalName:keysRef[i],contentType:i?'application/pdf':'image/png',sha256:await hashRef(data),size:data.length,createdAtUtc:timeRef,actor: actorRef};
    await insertMediaAssetRef(dbRef,asset);assets.push(asset);
  }
  await saveDraftRef(dbRef,'content',await prepareDocumentBodyRef(JSON.stringify({assets:{heroImageUrl:urls[0]}})),0n,actorRef,timeRef);await publishDocumentRef(dbRef,'content',1n,false,actorRef,timeRef);
  await saveDraftRef(dbRef,'content',await prepareDocumentBodyRef(JSON.stringify({assets:{cvUrl:urls[1]}})),2n,actorRef,timeRef);await publishDocumentRef(dbRef,'content',3n,false,actorRef,timeRef);
  await dbRef.prepare('UPDATE media_assets SET archived=1 WHERE id=?').bind(assets[0].id).run();await dbRef.prepare("UPDATE site_documents SET revision=CAST('9007199254740993' AS INTEGER) WHERE key='content'").run();
  const tables=(await dbRef.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all()).results.map(v=>v.name).filter(v=>!v.startsWith('_cf_')&&!v.startsWith('sqlite_'));assert.equal(tables.length,8);
  const select=name=>`SELECT *${['site_documents','site_document_versions'].includes(name)?',CAST(revision AS TEXT) AS revision_wire':''} FROM ${name} ORDER BY rowid`;
  const selectRef = select;
  const snapshot={};
  for(const name of tables)snapshot[name]=(await dbRef.prepare(selectRef(name)).all()).results;
  await source.dispose();source=null;
  const databaseDir=f.directory+'/source/.wrangler/state/v3/d1/miniflare-D1DatabaseObject',files=(await readdirRef(databaseDir)).filter(v=>v.endsWith('.sqlite')&&v!=='metadata.sqlite');assert.equal(files.length,1);
  const sqlPath=f.directory+'/private-backup.sql';await promisifyRef(execFileRef)(process.platform==='win32'?'python':'python3',[fileURLToPathRef(new URL('./helpers/exportLocalDatabase.py',import.meta.url)),databaseDir+'/'+files[0],sqlPath]);
  assert.ok((await readFileRef(sqlPath,'utf8')).includes('9007199254740993'));const directory=f.directory+'/full-files';await backupSupabaseMediaRef({env:f.sourceEnv,directory,fetcher:f.source.fetcher});
  destination=await openRef('destination');await destination.dispose();destination=null;
  await promisifyRef(execFileRef)(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--file',sqlPath,'--config',configs.destination,'--yes'],{cwd:root,maxBuffer:10485760});
  destination=await getPlatformProxyRef({configPath:configs.destination,persist:{path:f.directory+'/destination/.wrangler/state/v3'},remoteBindings:false,envFiles:[]});
  f.source.reset();const restored=await restoreSupabaseMediaRef({env:f.destinationEnv,directory,fetcher:f.destination.fetcher});assert.equal(restored.files,103);assert.equal(f.source.counts.downloads+f.source.counts.list,0);
  for(const name of tables)assert.deepEqual((await destination.env.DB.prepare(selectRef(name)).all()).results,snapshot[name],name);
  const document=await getDocumentRef(destination.env.DB,'content');assert.equal(document.revision,9007199254740993n);assert.equal(document.draft.assets.cvUrl,urls[1]);
  const historical=await getDocumentVersionRef(destination.env.DB,'content',1n);assert.equal(historical.data.assets.heroImageUrl,urls[0]);
  await saveDraftRef(destination.env.DB,'content',await prepareDocumentBodyRef(historical.json),document.revision,actorRef,timeRef,{existingBodyId:historical.bodyId,action:'restore:1'});await publishDocumentRef(destination.env.DB,'content',9007199254740994n,false,actorRef,timeRef);
  const actual=await f.destination.fetcher(f.destinationEnv.SUPABASE_URL+'/storage/v1/object/authenticated/'+f.destination.bucket+'/'+keysRef[0].split('/').map(encodeURIComponent).join('/'),{headers:{apikey:secretRef},redirect:'manual'});assert.deepEqual(new Uint8Array(await actual.arrayBuffer()),pngRef);
  t.diagnostic('8 actual local D1 tables and 103 destination Storage objects recovered; source URLs unchanged. Publication to a different bucket requires separately reviewed URL mapping.');
});
