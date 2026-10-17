// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import worker from './adminRuntimeWorker.js';

let last;
const record=(counts,result)=>{
  if (!result.meta) counts.missingMetadata++;
  counts.reads+=result.meta?.rows_read??0;counts.writes+=result.meta?.rows_written??0;return result;
};
const recordRef = record;
// codeguard:components:end

export default {async fetch(request,env,ctx){
  const url=new URL(request.url);
  if (url.hostname==='media.example.test') {
    const object=await env.MEDIA.get(url.pathname.slice(1));if(!object)return new Response(null,{status:404});
    const headers=new Headers();
    object.writeHttpMetadata(headers);return new Response(object.body,{headers: headers});
  }
  if (url.pathname==='/__test/media-stats') return Response.json(last);
  last={statements:0,batches:0,reads:0,writes:0,missingMetadata:0,put:0,delete:0,list:0};const counts=last;
  const wrap=s=>new Proxy(s,{get(target,key){
    if(key==='bind')return(...args)=>wrapRef(target.bind(...args));
    if(key==='first')return async(column)=>{counts.statements++;const r=recordRef(counts,await target.all());return column ? r.results[0]?.[column]??null : r.results[0]??null;};
    if(['all','run'].includes(key))return async(...args)=>{counts.statements++;return recordRef(counts,await target[key](...args));};
    const value=target[key];
    const valueRef = value;return typeof valueRef==='function'?valueRef.bind(target):valueRef;
  }});
  const wrapRef = wrap;
  const db={prepare:sql=>wrapRef(env.DB.prepare(sql)),async batch(statements){counts.statements+=statements.length;counts.batches++;return(await env.DB.batch(statements)).map(r=>recordRef(counts,r));}};
  const dbRef = db;
  const media=new Proxy(env.MEDIA,{get(target,key){const value=target[key];
  const valueRef2 = value;return typeof valueRef2==='function'?(...args)=>{if(key in counts)counts[key]++;return valueRef2.apply(target,args);}:valueRef2;}});
  const mediaRef = media;
  return worker.fetch(request,{...env,DB:dbRef,MEDIA:mediaRef},ctx);
}};
