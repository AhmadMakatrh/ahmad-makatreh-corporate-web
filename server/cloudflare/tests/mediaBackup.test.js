// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile as execFileRef } from 'node:child_process';
import { promisify as promisifyRef } from 'node:util';
import { mkdir as mkdirRef,mkdtemp as mkdtempRef,readFile as readFileRef,writeFile as writeFileRef,readdir as readdirRef } from 'node:fs/promises';
import { fileURLToPath as fileURLToPathRef } from 'node:url';
import { getPlatformProxy as getPlatformProxyRef } from 'wrangler';
import { applyInitialMigration as applyInitialMigrationRef,applyAdminMigration as applyAdminMigrationRef,applyDocumentMigration as applyDocumentMigrationRef,applyMediaMigration as applyMediaMigrationRef,seedInquiry as seedInquiryRef } from './helpers/d1.js';
import { png as pngRef } from './helpers/mediaFixtures.js';
import { insertMediaAsset as insertMediaAssetRef } from '../src/mediaAssets.js';
import { prepareDocumentBody as prepareDocumentBodyRef } from '../src/documentBodies.js';
import { saveDraft as saveDraftRef,publishDocument as publishDocumentRef,getDocumentVersion as getDocumentVersionRef,getDocument as getDocumentRef } from '../src/siteDocuments.js';
import { addReply as addReplyRef } from '../src/inquiryReplies.js';

const digest=async bytes=>Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex');
const digestRef = digest;
const time='2026-10-12T08:00:00.0000000Z';
const timeRef = time;
const actor='owner@example.test';
const actorRef = actor;
// codeguard:components:end

test('fullDatabaseAndR2Recovery: real SQL export plus bytes/metadata restore into empty resources',async t=>{
  const openRef = open;

  const root=fileURLToPathRef(new URL('../',import.meta.url)),workspace=fileURLToPathRef(new URL('../../../.superpowers/sdd/2026-10-12-cloudflare-phase-4/',import.meta.url));
  await mkdirRef(workspace,{recursive:true});const directory=await mkdtempRef(`${workspace}backup-`),configs={};
  async function open(name){
    const folder=`${directory}/${name}`;
    await mkdirRef(folder,{recursive:true});const configPath=`${folder}/wrangler.json`;
    configs[name]=configPath;
    await writeFileRef(configPath,JSON.stringify({name:`isolated-media-backup-${name}`,compatibility_date:'2026-09-05',
      d1_databases:[{binding:'DB',database_name:`isolated-media-backup-${name}`}],r2_buckets:[{binding:'MEDIA',bucket_name:`isolated-media-backup-${name}`}]}));
    return getPlatformProxyRef({configPath: configPath,persist:{path:`${folder}/.wrangler/state/v3`},remoteBindings:false,envFiles:[]});
  }
  let source=await openRef('source'),destination; t.after(async()=>{await source?.dispose();await destination?.dispose();});
  const db=source.env.DB;
  const dbRef = db;
  const bucket=source.env.MEDIA;
  await applyInitialMigrationRef(dbRef);await seedInquiryRef(dbRef);await applyAdminMigrationRef(dbRef);await applyDocumentMigrationRef(dbRef);await applyMediaMigrationRef(dbRef);
  await addReplyRef(dbRef,{id:crypto.randomUUID(),inquiryId:'11111111-1111-4111-8111-111111111111',subject:'رد تجريبي',body:'بيانات اختبار خاصة',actor: actorRef,createdAtUtc:timeRef});
  const assets=[];
  for(const [bytes,contentType,extension]of [[pngRef,'image/png','.png'],[new TextEncoder().encode('%PDF-1.7\n%%EOF'),'application/pdf','.pdf']]){
    const key=crypto.randomUUID().replaceAll('-','')+extension;
    await bucket.put(key,bytes,{httpMetadata:{contentType,contentDisposition:extension==='.pdf'?'attachment':'inline',cacheControl:'public, max-age=31536000, immutable'},customMetadata:{fixture:'public'}});
    const asset={id:crypto.randomUUID(),objectKey:key,url:`https://media.example.test/${key}`,originalName:'قلعة'+extension,contentType,sha256:await digestRef(bytes),size:bytes.length,createdAtUtc:timeRef,actor: actorRef};
    await insertMediaAssetRef(dbRef,asset);assets.push(asset);
  }
  const first=await prepareDocumentBodyRef(JSON.stringify({assets:{heroImageUrl:assets[0].url}})),second=await prepareDocumentBodyRef(JSON.stringify({assets:{cvUrl:assets[1].url}}));
  await saveDraftRef(dbRef,'content',first,0n,actorRef,timeRef);await publishDocumentRef(dbRef,'content',1n,false,actorRef,timeRef);await saveDraftRef(dbRef,'content',second,2n,actorRef,timeRef);await publishDocumentRef(dbRef,'content',3n,false,actorRef,timeRef);
  await dbRef.prepare('UPDATE media_assets SET archived=1 WHERE id=?').bind(assets[0].id).run();
  await dbRef.prepare("UPDATE site_documents SET revision=CAST('9007199254740993' AS INTEGER) WHERE key='content'").run();
  for(let i=0;i<101;i++)await bucket.put(`retained-orphan-${i}.png`,pngRef,{httpMetadata:{contentType:'image/png'}});
  const tables=(await dbRef.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all()).results.map(r=>r.name).filter(name=>!name.startsWith('_cf_')&&!name.startsWith('sqlite_'));
  const snapshot={};
  for(const name of tables)snapshot[name]=(await dbRef.prepare(`SELECT *${name.startsWith('site_document')&&name!=='site_document_chunks'?',CAST(revision AS TEXT) AS revision_wire':''} FROM ${name} ORDER BY rowid`).all()).results;
  await source.dispose();source=null;
  const cli=async args=>promisifyRef(execFileRef)(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{cwd:root,maxBuffer:10*1024*1024});
  const cliRef = cli;
  const sqlPath=`${directory}/private-backup.sql`;
  const wranglerPath=`${directory}/wrangler-export.sql`;
  await cliRef(['d1','export','DB','--local','--output',wranglerPath,'--config',configs.source]);
  // Local Wrangler/Miniflare export converts SQLite integers through JS Number; preserve exact source values with stdlib SQLite.
  const databaseDir=`${directory}/source/.wrangler/state/v3/d1/miniflare-D1DatabaseObject`;
  const files=(await readdirRef(databaseDir)).filter(name=>name.endsWith('.sqlite')&&name!=='metadata.sqlite');assert.equal(files.length,1);
  await promisifyRef(execFileRef)(process.platform==='win32'?'python':'python3',[fileURLToPathRef(new URL('./helpers/exportLocalDatabase.py',import.meta.url)),`${databaseDir}/${files[0]}`,sqlPath]);
  assert.ok((await readFileRef(sqlPath,'utf8')).includes('9007199254740993'));
  source=await getPlatformProxyRef({configPath:configs.source,persist:{path:`${directory}/source/.wrangler/state/v3`},remoteBindings:false,envFiles:[]});
  const objectDir=`${directory}/private-objects`;
  await mkdirRef(objectDir);const manifest=[];
  let cursor,pages=0;
  do{
    const page=await source.env.MEDIA.list({limit:100,...(cursor?{cursor}:{})});pages++;
    for(const summary of page.objects){const object=await source.env.MEDIA.get(summary.key);assert.ok(object);const bytes=new Uint8Array(await object.arrayBuffer());
      const file=Buffer.from(summary.key).toString('hex');await writeFileRef(`${objectDir}/${file}`,bytes);
      manifest.push({key:object.key,file,size:object.size,sha256:await digestRef(bytes),httpMetadata:object.httpMetadata,customMetadata:object.customMetadata});}
    cursor=page.truncated?page.cursor:null;
  }while(cursor);
  assert.equal(pages,2);assert.equal(manifest.length,103);await writeFileRef(`${directory}/private-manifest.json`,JSON.stringify(manifest));
  destination=await openRef('destination');assert.equal((await destination.env.MEDIA.list()).objects.length,0);
  const empty=(await destination.env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.filter(r=>!r.name.startsWith('_cf_')&&!r.name.startsWith('sqlite_'));assert.equal(empty.length,0);
  await destination.dispose();destination=null;await cliRef(['d1','execute','DB','--local','--file',sqlPath,'--config',configs.destination,'--yes']);
  destination=await getPlatformProxyRef({configPath:configs.destination,persist:{path:`${directory}/destination/.wrangler/state/v3`},remoteBindings:false,envFiles:[]});
  for(const item of manifest){const bytes=await readFileRef(`${objectDir}/${item.file}`);assert.equal(await digestRef(bytes),item.sha256);
    await destination.env.MEDIA.put(item.key,bytes,{sha256:item.sha256,httpMetadata:item.httpMetadata,customMetadata:item.customMetadata});}
  for(const name of tables){const restored=(await destination.env.DB.prepare(`SELECT *${name.startsWith('site_document')&&name!=='site_document_chunks'?',CAST(revision AS TEXT) AS revision_wire':''} FROM ${name} ORDER BY rowid`).all()).results;assert.deepEqual(restored,snapshot[name],name);}
  for(const item of manifest){const object=await destination.env.MEDIA.get(item.key);assert.equal(object.size,item.size);assert.equal(await digestRef(await object.arrayBuffer()),item.sha256);assert.deepEqual(object.httpMetadata,item.httpMetadata);assert.deepEqual(object.customMetadata,item.customMetadata);}
  const document=await getDocumentRef(destination.env.DB,'content');assert.equal(document.revision,9007199254740993n);assert.equal(document.draft.assets.cvUrl,assets[1].url);
  const historical=await getDocumentVersionRef(destination.env.DB,'content',1n);assert.equal(historical.data.assets.heroImageUrl,assets[0].url);
  await saveDraftRef(destination.env.DB,'content',await prepareDocumentBodyRef(historical.json),document.revision,actorRef,timeRef,{existingBodyId:historical.bodyId,action:'restore:1'});
  await publishDocumentRef(destination.env.DB,'content',9007199254740994n,false,actorRef,timeRef);
  assert.deepEqual(new Uint8Array(await (await destination.env.MEDIA.get(assets[0].objectKey)).arrayBuffer()),pngRef);
  t.diagnostic(`Recovery: ${tables.length} D1 tables, ${manifest.length} R2 objects, ${pages} list pages; bytes, HTTP metadata, Arabic names, history and Int64 matched.`);
});
