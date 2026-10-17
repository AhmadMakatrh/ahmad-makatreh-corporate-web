// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { createApi as createApiRef } from '../../src/index.js';
import { createSupabaseStorageFixture as createSupabaseStorageFixtureRef } from './supabaseStorageFixture.js';

let api,storage,last;
// codeguard:components:end

export default {async fetch(request,env,ctx){
  storage??=createSupabaseStorageFixtureRef({origin:env.SUPABASE_URL,bucket:env.SUPABASE_STORAGE_BUCKET,secret:env.SUPABASE_SECRET_KEY});
  const url=new URL(request.url);
  if(url.origin===env.SUPABASE_URL)return storage.fetcher(request.url,{method:request.method,headers:request.headers,redirect:'manual'});
  if(url.pathname==='/__test/supabase-stats')return Response.json({...last,storage:{...storage.counts}});
  api??=createApiRef({fetcher:(input,options)=>{
    if(String(input)===env.SUPABASE_URL+'/auth/v1/.well-known/jwks.json')return Promise.resolve(Response.json(env.TEST_PUBLIC_JWKS));
    return storage.fetcher(input,options);
  }});
  storage.reset();last={statements:0,reads:0,writes:0,missingMetadata:0};const counts=last;
  const record=result=>{if(!result.meta)counts.missingMetadata++;counts.reads+=result.meta?.rows_read??0;counts.writes+=result.meta?.rows_written??0;return result;};
  const recordRef = record;
  const wrap=s=>new Proxy(s,{get(target,key){
    if(key==='bind')return(...args)=>wrapRef(target.bind(...args));
    if(key==='first')return async(column)=>{counts.statements++;const r=recordRef(await target.all());return column ? r.results[0]?.[column]??null : r.results[0]??null;};
    if(['all','run'].includes(key))return async(...args)=>{counts.statements++;return recordRef(await target[key](...args));};
    const value=target[key];
    const valueRef = value;return typeof valueRef==='function'?valueRef.bind(target):valueRef;
  }});
  const wrapRef = wrap;
  const db={prepare:sql=>wrapRef(env.DB.prepare(sql)),async batch(statements){counts.statements+=statements.length;return(await env.DB.batch(statements)).map(recordRef);}};
  const dbRef = db;
  return api.fetch(request,{...env,DB:dbRef},ctx);
}};
