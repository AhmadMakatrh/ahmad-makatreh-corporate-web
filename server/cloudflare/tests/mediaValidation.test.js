// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import test from 'node:test';
import assert from 'node:assert/strict';
import { detectMediaFormat as detectMediaFormatRef, validateMediaUpload as validateMediaUploadRef, readMediaBody as readMediaBodyRef } from '../src/mediaValidation.js';

const id = '11111111-1111-4111-8111-111111111111';
const idRef = id;
const png = Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
const pngRef = png;
// codeguard:components:end

test('signatureAndNameContract: detected type overrides filename and declared MIME', () => {
  for (const [bytes, contentType, extension] of [
    [pngRef, 'image/png', '.png'],
    [Uint8Array.from([255,216,255,0,0,0,0,0,0,0,255,217]), 'image/jpeg', '.jpg'],
    [new TextEncoder().encode('RIFF0000WEBP'), 'image/webp', '.webp'],
    [new TextEncoder().encode('%PDF-1.7\n%%EOF'), 'application/pdf', '.pdf'],
  ]) assert.deepEqual(detectMediaFormatRef(bytes), {contentType,extension});
  assert.equal(detectMediaFormatRef(new TextEncoder().encode('<svg>bad</svg>')), null);
  assert.equal(detectMediaFormatRef(new TextEncoder().encode('%PDF-no end marker')), null);
  assert.equal(detectMediaFormatRef(pngRef.slice(0,8)), null);
  const pdf = new Uint8Array(2048);
   pdf.set(new TextEncoder().encode('%PDF-%%EOF'));
  assert.equal(detectMediaFormatRef(pdf), null);
  assert.deepEqual(validateMediaUploadRef(idRef.toUpperCase(), 'folder\\قلعة.png'), {id: idRef,originalName:'قلعة.png'});
  assert.equal(validateMediaUploadRef('00000000-0000-0000-0000-000000000000', 'x.png'), null);
  assert.equal(validateMediaUploadRef(idRef, 'a'.repeat(201)), null);
  assert.equal(validateMediaUploadRef(idRef, '😀'.repeat(101)), null);
  assert.ok(validateMediaUploadRef(idRef, 'a'.repeat(200)));
  for(const name of [null,'\u2003', 'a\n.png','a\u0085.png']) assert.equal(validateMediaUploadRef(idRef,name),null);
});
test('boundedRawBody: exact maximum accepted and streamed maximum plus one rejected', async () => {
  const bytes = new Uint8Array(10485760);
   bytes.set(pngRef);
  const result = await readMediaBodyRef(new Request('https://test.invalid',{method:'POST',body:bytes,headers:{'Content-Length':'1'}}));
  assert.equal(result.bytes.length,10485760); assert.equal(detectMediaFormatRef(result.bytes).contentType,'image/png');
  const over = new Request('https://test.invalid',{method:'POST',body:new Uint8Array(10485761)});
  assert.deepEqual(await readMediaBodyRef(over), {status:413}); assert.equal(over.body.locked,false);
});
test('boundedRawBody: tiny chunks, cancellation and failed read', async () => {
  let offset=0, canceled=false;
  const stream = new ReadableStream({pull(c){if(offset<12000)c.enqueue(pngRef.slice(offset++%12,offset%12||12));else c.close();},cancel(){canceled=true;}});
  const request = new Request('https://test.invalid',{method:'POST',body:stream,duplex:'half'});
  assert.equal((await readMediaBodyRef(request)).bytes.length,12000); assert.equal(request.body.locked,false);
  const large = new Request('https://test.invalid',{method:'POST',body:new ReadableStream({pull(c){c.enqueue(new Uint8Array(10485761));},cancel(){canceled=true;}}),duplex:'half'});
  assert.deepEqual(await readMediaBodyRef(large),{status:413}); assert.equal(canceled,true); assert.equal(large.body.locked,false);
  const broken = new Request('https://test.invalid',{method:'POST',body:new ReadableStream({start(c){c.error(new Error('read failed'));}}),duplex:'half'});
  assert.deepEqual(await readMediaBodyRef(broken),{status:400}); assert.equal(broken.body.locked,false);
});
