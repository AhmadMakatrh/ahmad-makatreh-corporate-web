// codeguard:components:start
// codeguard:defines: createSupabaseStorageFixture
export function createSupabaseStorageFixture({origin,bucket,secret}) {
  const objects=new Map();
  const counts={uploads:0,removals:0,list:0,downloads:0,upserts:0,bucketInfo:0,info:0,keyChecks:0};
  const countsRef = counts;
  const publishable='sb_publishable_fixture';
  const publishableRef = publishable;
  const denial=code=>Response.json({statusCode:code==='AccessDenied'?'403':'404',code,error:code,message:'Denied'},{status:400});
  const denialRef = denial;
  const settings={id:bucket,name:bucket,public:false,file_size_limit:10485760,allowed_mime_types:['image/png','image/jpeg','image/webp','application/pdf']};
  return {origin,bucket,secret,objects: objects,counts: countsRef,settings: settings,reset(){for(const key of Object.keys(countsRef))countsRef[key]=0;},
    async fetcher(input,options) {
      const request=new Request(input,options);
      const url=new URL(request.url);
      if(url.origin!==origin || request.redirect!=='manual')throw new Error('Unexpected Storage request.');
      request.signal.throwIfAborted();
      const base='/storage/v1/object';
      const baseRef = base;
      const authenticated=request.headers.get('apikey')===secret;
      if(request.method==='GET'&&url.pathname==='/storage/v1/bucket'){
        countsRef.keyChecks++;if(request.headers.get('apikey')!==publishableRef)return Response.json({message:'Invalid API key'},{status:401});
        if(url.searchParams.get('limit')!=='1'||url.searchParams.get('search')!==bucket)throw new Error('Unbounded key verification.');return Response.json([]);
      }
      if(request.method==='GET' && url.pathname===`/storage/v1/bucket/${bucket}`){
        countsRef.bucketInfo++;return authenticated ? Response.json(settings):new Response(null,{status:403});
      }
      if(request.method==='POST' && url.pathname===`${baseRef}/list/${bucket}`){
        countsRef.list++;if(!authenticated)return new Response(null,{status:403});
        const {prefix,limit,offset,sortBy}=await request.json();
        if(limit!==100 || !Number.isInteger(offset) || sortBy.column!=='name' || sortBy.order!=='asc')throw new Error('Unbounded or unstable list.');
        const entries=new Map();
        const start=prefix?prefix.replace(/\/$/,'')+'/':'';
        for(const [key,object]of objects){
          if(!key.startsWith(start))continue;const relative=key.slice(start.length),name=relative.split('/')[0];
          if(relative.includes('/'))entries.set(name,{name,id:null,metadata:null});
          else entries.set(name,{name,id:object.id,metadata:{size:object.body.length,mimetype:object.contentType}});
        }
        return Response.json([...entries.values()].sort((a,b)=>a.name.localeCompare(b.name)).slice(offset,offset+limit));
      }
      if(request.method==='GET'&&url.pathname.startsWith(`${baseRef}/info/${bucket}/`)){
        countsRef.info++;if(!authenticated)return denialRef('NoSuchKey');
        const key=url.pathname.slice(`${baseRef}/info/${bucket}/`.length).split('/').map(decodeURIComponent).join('/'),object=objects.get(key);
        return object?Response.json({id:object.id,name:key,bucket_id:bucket,size:object.body.length,content_type:object.contentType,cache_control:object.cacheControl,metadata:object.userMetadata,created_at:null,last_modified:null}):denialRef('NoSuchKey');
      }
      if(request.method==='POST' && url.pathname.startsWith(`${baseRef}/${bucket}/`)) {
        countsRef.uploads++;
        if(!authenticated)return request.headers.get('apikey')===publishableRef?denialRef('AccessDenied'):Response.json({message:'Invalid API key'},{status:401});
        if(request.headers.get('x-upsert')!=='false'){countsRef.upserts++;throw new Error('Overwrite is forbidden in this fixture.');}
        const key=url.pathname.slice(`${baseRef}/${bucket}/`.length).split('/').map(decodeURIComponent).join('/');
        if(objects.has(key))return Response.json({statusCode:'409',error:'Duplicate',message:'The resource already exists'},{status:400});
        const body=new Uint8Array(await request.arrayBuffer());
        const metadata=request.headers.get('x-metadata');
        const userMetadata=metadata ? JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(metadata),value=>value.charCodeAt(0)))) : {};
        const id=crypto.randomUUID();objects.set(key,{id,body: body,contentType:request.headers.get('Content-Type'),cacheControl:request.headers.get('Cache-Control'),userMetadata});
        return Response.json({Id:id,Key:`${bucket}/${key}`});
      }
      if(request.method==='DELETE' && url.pathname===`${baseRef}/${bucket}`) {
        countsRef.removals++;if(!authenticated)return new Response(null,{status:403});
        const {prefixes}=await request.json();if(!Array.isArray(prefixes)||prefixes.length!==1)throw new Error('Unexpected cleanup scope.');
        const key=prefixes[0],object=objects.get(key);objects.delete(key);
        return Response.json(object ? [{id:object.id,name:key,bucket_id:bucket,metadata:{size:object.body.length,mimetype:object.contentType},user_metadata:object.userMetadata}] : []);
      }
      if(request.method==='GET' && [ `${baseRef}/authenticated/${bucket}/`,`${baseRef}/public/${bucket}/` ].some(prefix=>url.pathname.startsWith(prefix))) {
        countsRef.downloads++;if(!authenticated || url.pathname.startsWith(`${baseRef}/public/`))return denialRef('NoSuchBucket');
        const key=url.pathname.slice(`${baseRef}/authenticated/${bucket}/`.length).split('/').map(decodeURIComponent).join('/'),object=objects.get(key);
        return object ? new Response(object.body,{headers:{'Content-Type':object.contentType,'Cache-Control':object.cacheControl,'Content-Disposition':url.searchParams.has('download')?'attachment':'inline'}}) : new Response(null,{status:404});
      }
      throw new Error('Unexpected Storage endpoint.');
    },
  };
}
// codeguard:components:end
