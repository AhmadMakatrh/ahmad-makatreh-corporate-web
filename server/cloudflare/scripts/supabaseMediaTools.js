// codeguard:components:start
// codeguard:defines: backupSupabaseMedia, restoreSupabaseMedia, probeSupabaseMedia
import { mkdir as mkdirRef,writeFile as writeFileRef,readFile as readFileRef,lstat as lstatRef,appendFile as appendFileRef } from 'node:fs/promises';
import { resolve as resolveRef,join as joinRef } from 'node:path';
import { pathToFileURL as pathToFileURLRef } from 'node:url';
import { createHash as createHashRef,randomUUID as randomUUIDRef } from 'node:crypto';
import { isDeepStrictEqual as isDeepStrictEqualRef } from 'node:util';
import { getMediaStorage as getMediaStorageRef } from '../src/mediaStorage.js';
import { readJson as readJsonRef } from '../src/httpJson.js';
const contextRef = context;
const metadataRef = metadata;
const portableRef = portable;
const newDirectoryRef = newDirectory;
const safeReadRef = safeRead;
const listAllRef = listAll;
const backupSupabaseMediaRef = backupSupabaseMedia;
const loadBackupRef = loadBackup;
const restoreSupabaseMediaRef = restoreSupabaseMedia;
const probeSupabaseMediaRef = probeSupabaseMedia;
const cliRef = cli;


const maxBytes=10485760;
const maxBytesRef = maxBytes;
const types=['image/png','image/jpeg','image/webp','application/pdf'];
const typesRef = types;
const sha256=bytes=>createHashRef('sha256').update(bytes).digest('hex');
const sha256Ref = sha256;
const fail=message=>{throw new Error(message);};
const failRef = fail;
function context(env,fetcher){
  const requestRef = request;

  if(env.MEDIA_PROVIDER!=='supabase'||!getMediaStorageRef(env,{fetcher}))failRef('Supabase operator configuration is invalid.');
  const origin=new URL(env.SUPABASE_URL).origin,bucket=env.SUPABASE_STORAGE_BUCKET,projectRef=new URL(origin).hostname.split('.')[0];
  let httpRequests=0;
  async function request(url,options,consume){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),45000);httpRequests++;
    try{
      const result=await fetcher(url,{...options,signal:controller.signal,redirect:'manual'});
      if(result.redirected||result.status>=300&&result.status<400){await result.body?.cancel();failRef('Storage redirect refused.');}
      return await consume(result);
    }catch{failRef('Storage operation unconfirmed. Keep evidence; do not repeat an unknown write.');}
    finally{clearTimeout(timer);}
  }
  const headers={apikey:env.SUPABASE_SECRET_KEY};
  const json=(path,options={})=>requestRef(origin+'/storage/v1/'+path,{...options,headers:{...headers,...options.headers}},async result=>{
    if(!result.ok){await result.body?.cancel();failRef('Storage HTTP request failed.');}
    const parsed=await readJsonRef(result,1048576);if(parsed.invalid||parsed.oversized)failRef('Storage JSON response invalid.');return parsed.value;
  });
  const jsonRef = json;
  const storage=getMediaStorageRef(env,{fetcher:(url,options)=>{httpRequests++;return fetcher(url,options);}});
  const storageRef = storage;
  const path=key=>new URL(storageRef.urlFor(key,'image/png')).pathname.replace('/object/public/','/object/authenticated/');
  const pathRef = path;
  return {origin,bucket,projectRef,storage: storageRef,json: jsonRef,request: requestRef,path: pathRef,headers: headers,count:()=>httpRequests,
    async info(key){
      const value=await jsonRef(pathRef(key).slice('/storage/v1/'.length).replace('object/authenticated/','object/info/'));
      if(value?.name!==key||value.bucket_id!==bucket||typeof value.id!=='string'||!value.id)failRef('Object details do not match the requested key.');
      validateSizeRef(value.size);return value;
    },
    async bucketSettings(publicRead=false){
      const value=await jsonRef('bucket/'+bucket);
      if(value?.id!==bucket||value.public!==publicRead||Number(value.file_size_limit)!==maxBytesRef
        ||!Array.isArray(value.allowed_mime_types)||value.allowed_mime_types.length!==typesRef.length||typesRef.some(v=>!value.allowed_mime_types.includes(v)))failRef('Bucket limits do not match the approved configuration.');
    },
    async download(key){
      return requestRef(origin+pathRef(key),{headers: headers},async result=>{
        if(!result.ok){await result.body?.cancel();failRef('File download failed.');}
        const reader=result.body?.getReader();if(!reader)failRef('Empty file response.');const parts=[];
        let size=0;
        try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytesRef){await reader.cancel();failRef('File exceeds approved size.');}parts.push(value);}}
        finally{reader.releaseLock();}
        if(size<1)failRef('Empty file refused.');
        return {bytes:Buffer.concat(parts,size),contentType:result.headers.get('Content-Type'),cacheControl:result.headers.get('Cache-Control')};
      });
    },
  };
}
const validateSize=size=>{if(!Number.isInteger(size)||size<1||size>maxBytesRef)failRef('File size is invalid.');};
const validateSizeRef = validateSize;
function metadata(value,secret){
  if(!value||typeof value!=='object'||Array.isArray(value))failRef('Custom metadata is invalid.');
  const text=JSON.stringify(value);if(Buffer.byteLength(text)>8192||text.includes(secret))failRef('Custom metadata is unsafe or too large.');return value;
}
function portable(item,secret){
  validateSizeRef(item.size);
  if(!typesRef.includes(item.contentType)||typeof item.cacheControl!=='string'||!item.cacheControl||item.cacheControl.length>512||/[^\x20-\x7e]/.test(item.cacheControl)
    ||!/^[0-9a-f]{64}$/.test(item.sha256))failRef('Portable file metadata is invalid.');
  metadataRef(item.metadata,secret);
}
async function newDirectory(directory){
  directory=resolveRef(directory);await mkdirRef(directory,{mode:0o700});return directory;
}
async function safeRead(directory,file,max){
  if(!/^(manifest\.json|[0-9a-f]{64}\.bin)$/.test(file))failRef('Unsafe backup file path.');
  const target=joinRef(directory,file),stat=await lstatRef(target);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>max)failRef('Unsafe or oversized backup file.');return readFileRef(target);
}
const listPage=(c,prefix,offset)=>c.json('object/list/'+c.bucket,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefix,limit:100,offset,sortBy:{column:'name',order:'asc'}})});
const listPageRef = listPage;
async function listAll(c){
  const folders=[''];
  const foldersRef = folders;
  const seenFolders=new Set(['']);
  const seenKeys=new Set();
  const files=[];
  for(let index=0;index<foldersRef.length;index++){
    const prefix=foldersRef[index],pages=new Set();
    for(let offset=0;;offset+=100){
      const page=await listPageRef(c,prefix,offset);
      if(!Array.isArray(page)||page.length>100)failRef('Invalid Storage listing.');
      const signature=JSON.stringify(page.map(v=>v?.name));if(pages.has(signature))failRef('Storage listing repeated a page.');pages.add(signature);
      for(const item of page){
        if(typeof item?.name!=='string'||item.name.includes('/'))failRef('Invalid Storage entry.');
        const key=prefix?prefix+'/'+item.name:item.name;c.path(key);
        if(item.id===null&&item.metadata===null){if(seenFolders.has(key)||key.split('/').length>64)failRef('Storage folder loop or depth limit.');seenFolders.add(key);foldersRef.push(key);}
        else{
          if(typeof item.id!=='string'||!item.id||!item.metadata||seenKeys.has(key))failRef('Invalid or duplicate Storage object.');
          seenKeys.add(key);validateSizeRef(item.metadata.size);files.push({key,summary:item});
        }
      }
      if(page.length<100)break;
    }
  }
  return files;
}
export async function backupSupabaseMedia({env,directory,fetcher=fetch,allowPublicRead=false}){
  const c=contextRef(env,fetcher);directory=await newDirectoryRef(directory);
  await writeFileRef(joinRef(directory,'operation.json'),JSON.stringify({operation:'backup',projectRef:c.projectRef,bucket:c.bucket}),{flag:'wx',mode:0o600});
  if(typeof allowPublicRead!=='boolean')failRef('Invalid bucket visibility option.');
  await c.bucketSettings(allowPublicRead);const files=[];
  let bytes=0;
  for(const {key,summary}of await listAllRef(c)){
    const info=await c.info(key),actual=await c.download(key),digest=sha256Ref(actual.bytes),custom=metadataRef(info.metadata??{},env.SUPABASE_SECRET_KEY);
    if(info.id!==summary.id||actual.bytes.length!==summary.metadata.size||info.size!==actual.bytes.length||info.content_type!==actual.contentType||custom.sha256!==undefined&&custom.sha256!==digest)failRef('Source metadata or hash mismatch.');
    const item={key,file:sha256Ref(key)+'.bin',size:actual.bytes.length,sha256:digest,contentType:info.content_type,cacheControl:info.cache_control,metadata:{...custom,sha256:digest},provider:{id:info.id,createdAt:info.created_at??null,updatedAt:info.last_modified??null}};
    portableRef(item,env.SUPABASE_SECRET_KEY);await writeFileRef(joinRef(directory,item.file),actual.bytes,{flag:'wx',mode:0o600});files.push(item);bytes+=item.size;
  }
  await writeFileRef(joinRef(directory,'manifest.json'),JSON.stringify({format:'ahmad-site-supabase-media',version:1,source:{projectRef:c.projectRef,bucket:c.bucket},files: files},null,2),{flag:'wx',mode:0o600});
  return {files:files.length,bytes,httpRequests:c.count()};
}
async function loadBackup(c,env,directory){
  let manifest;try{manifest=JSON.parse(await safeReadRef(directory,'manifest.json',16777216));}catch{failRef('Backup manifest cannot be read.');}
  if(manifest?.format!=='ahmad-site-supabase-media'||manifest.version!==1||!Array.isArray(manifest.files)
    ||!/^[a-z0-9-]+$/.test(manifest.source?.projectRef??'')||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(manifest.source?.bucket??'')
    ||manifest.source.projectRef===c.projectRef&&manifest.source.bucket===c.bucket)failRef('Restore requires a valid backup and a different destination.');
  const keys=new Set();
  for(const item of manifest.files){
    if(typeof item?.key!=='string')failRef('Invalid backup key.');c.path(item.key);
    if(keys.has(item.key)||item.file!==sha256Ref(item.key)+'.bin')failRef('Duplicate key or unsafe backup path.');keys.add(item.key);portableRef(item,env.SUPABASE_SECRET_KEY);
    const data=await safeReadRef(directory,item.file,maxBytesRef);if(data.length!==item.size||sha256Ref(data)!==item.sha256||item.metadata.sha256!==item.sha256)failRef('Backup file verification failed.');
  }
  return manifest;
}
export async function restoreSupabaseMedia({env,directory,fetcher=fetch}){
  const c=contextRef(env,fetcher);directory=resolveRef(directory);const manifest=await loadBackupRef(c,env,directory);
  await c.bucketSettings();const page=await listPageRef(c,'',0);if(!Array.isArray(page)||page.length)failRef('Restore destination is not empty.');
  const evidence=joinRef(directory,'restore-'+sha256Ref(c.origin+'/'+c.bucket)+'.jsonl');
  await writeFileRef(evidence,JSON.stringify({projectRef:c.projectRef,bucket:c.bucket,operation:'restore'})+'\n',{flag:'wx',mode:0o600});let bytes=0;
  for(const item of manifest.files){
    const data=await safeReadRef(directory,item.file,maxBytesRef);if(data.length!==item.size||sha256Ref(data)!==item.sha256)failRef('Backup changed during restore.');
    await appendFileRef(evidence,JSON.stringify({key:item.key,state:'started'})+'\n');
    await c.storage.put(item.key,data,{sha256:item.sha256,contentType:item.contentType,cacheControl:item.cacheControl,metadata:item.metadata,signal:AbortSignal.timeout(45000)});
    const actual=await c.download(item.key);if(sha256Ref(actual.bytes)!==item.sha256||actual.bytes.length!==item.size||actual.contentType!==item.contentType||actual.cacheControl!==item.cacheControl)failRef('Destination file verification failed.');
    const info=await c.info(item.key);if(info.size!==item.size||info.content_type!==item.contentType||info.cache_control!==item.cacheControl||!isDeepStrictEqualRef(info.metadata??{},item.metadata))failRef('Destination custom metadata mismatch.');
    await appendFileRef(evidence,JSON.stringify({key:item.key,state:'verified'})+'\n');bytes+=item.size;
  }
  const copies=await listAllRef(c);if(copies.length!==manifest.files.length)failRef('Destination object count mismatch.');
  const restored=new Set(copies.map(v=>v.key));
  for(const item of manifest.files)if(!restored.has(item.key))failRef('Destination key missing.');
  return {files:manifest.files.length,bytes,httpRequests:c.count()};
}
export async function probeSupabaseMedia({env,directory,fetcher=fetch}){
  const c=contextRef(env,fetcher);
  const cRef = c;
  const publishable=env.SUPABASE_PUBLISHABLE_KEY;
  if(typeof publishable!=='string'||!publishable.startsWith('sb_publishable_')||/[\p{Cc}\p{White_Space}]/u.test(publishable))failRef('Publishable key is required for complete policy checks.');
  directory=await newDirectoryRef(directory);const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]),large=new Uint8Array(maxBytesRef);
  large.set(png);
  const samples=[[png,'image/png','.png'],[Uint8Array.from([255,216,255,0,0,0,0,0,0,0,255,217]),'image/jpeg','.jpg'],[new TextEncoder().encode('RIFF0000WEBP'),'image/webp','.webp'],[new TextEncoder().encode('%PDF-1.7\n%%EOF'),'application/pdf','.pdf'],[large,'image/png','.png']];
  const files=samples.map(([data,contentType,ext])=>({key:'probe-'+randomUUIDRef()+ext,size:data.length,sha256:sha256Ref(data),contentType}));
  await writeFileRef(joinRef(directory,'operation.json'),JSON.stringify({operation:'probe',projectRef:cRef.projectRef,bucket:cRef.bucket,files}),{flag:'wx',mode:0o600});
  await cRef.bucketSettings();let bytes=0;
  await cRef.request(cRef.origin+'/storage/v1/bucket?limit=1&offset=0&search='+encodeURIComponent(cRef.bucket),{headers:{apikey:publishable}},async result=>{
    const parsed=await readJsonRef(result,16384);
    if(result.status!==200||parsed.invalid||parsed.oversized||!Array.isArray(parsed.value)||parsed.value.length>1||parsed.value.some(v=>v?.id!==cRef.bucket))failRef('Publishable key is not verified for this project.');
  });
  const denied=async(url,options,write=false)=>cRef.request(url,options,async result=>{
    const parsed=await readJsonRef(result,16384),value=parsed.value,status=Number(value?.statusCode);
    const policyCode=status===403&&value?.code==='AccessDenied'||!write&&status===404&&['NoSuchBucket','NoSuchKey'].includes(value?.code);
    if(![400,403,404].includes(result.status)||parsed.invalid||parsed.oversized||!policyCode)failRef('Anonymous policy denial not confirmed.');
  });
  const deniedRef = denied;
  for(let i=0;i<files.length;i++){
    const item=files[i],data=samples[i][0];validateSizeRef(item.size);
    await cRef.storage.put(item.key,data,{sha256:item.sha256,contentType:item.contentType,signal:AbortSignal.timeout(45000)});
    const actual=await cRef.download(item.key);if(actual.bytes.length!==item.size||sha256Ref(actual.bytes)!==item.sha256||actual.contentType!==item.contentType)failRef('Probe download mismatch.');bytes+=item.size;
    if(i===0){
      await deniedRef(cRef.storage.urlFor(item.key,item.contentType),{});
      await deniedRef(cRef.origin+cRef.path(item.key),{headers:{apikey:publishable}});
      const key='denied-'+randomUUIDRef()+'.png';await writeFileRef(joinRef(directory,'policy-write.json'),JSON.stringify({key,state:'attempting'}),{flag:'wx',mode:0o600});
      await deniedRef(cRef.origin+'/storage/v1/object/'+cRef.bucket+'/'+key,{method:'POST',headers:{apikey:publishable,'Content-Type':'image/png','x-upsert':'false'},body:png},true);
    }
  }
  let rejected=false;try{validateSizeRef(maxBytesRef+1);}catch{rejected=true;}if(!rejected)failRef('Local maximum size validation failed.');
  const result={files:files.length,bytes,httpRequests:cRef.count()};
  await writeFileRef(joinRef(directory,'result.json'),JSON.stringify(result),{flag:'wx',mode:0o600});return result;
}
async function cli(){
  const [command,...args]=process.argv.slice(2),operations={probe:probeSupabaseMediaRef,backup:backupSupabaseMediaRef,restore:restoreSupabaseMediaRef};
  const allowPublicRead=command==='backup'&&args.length===7&&args[6]==='--public-read';
  if(!Object.hasOwn(operations,command)||args.length!==6&&!allowPublicRead)failRef('Use probe|backup|restore --project-ref REF --bucket BUCKET --directory PRIVATE_PATH [--public-read for backup only].');
  const flags=new Map();
  for(let i=0;i<6;i+=2){if(!['--project-ref','--bucket','--directory'].includes(args[i])||flags.has(args[i])||!args[i+1])failRef('Invalid operator arguments.');flags.set(args[i],args[i+1]);}
  const c=contextRef(process.env,fetch);if(flags.get('--project-ref')!==c.projectRef||flags.get('--bucket')!==c.bucket)failRef('Explicit project/bucket confirmation does not match the environment.');
  console.info(JSON.stringify(await operations[command]({env:process.env,directory:flags.get('--directory'),allowPublicRead})));
}
// codeguard:components:end

if(process.argv[1]&&import.meta.url===pathToFileURLRef(resolveRef(process.argv[1])).href)cliRef().catch(()=>{console.error('Operator action failed or unconfirmed. Inspect retained evidence before another attempt.');process.exitCode=1;});
