// codeguard:components:start
// codeguard:defines: maxMediaBytes, detectMediaFormat, validateMediaUpload, readMediaBody
import { inquiryId as inquiryIdRef } from './adminInquiries.js';

export const maxMediaBytes = 10485760;
const maxMediaBytesRef = maxMediaBytes;
const ascii = (bytes, offset, text) => [...text].every((v,i) => bytes[offset+i] === v.charCodeAt(0));
const asciiRef = ascii;

export function detectMediaFormat(bytes) {
  if (bytes.length < 12 || bytes.length > maxMediaBytesRef) return null;
  if ([137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)) return {contentType:'image/png',extension:'.png'};
  if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255 && bytes.at(-2)===255 && bytes.at(-1)===217) return {contentType:'image/jpeg',extension:'.jpg'};
  if (asciiRef(bytes,0,'RIFF') && asciiRef(bytes,8,'WEBP')) return {contentType:'image/webp',extension:'.webp'};
  if (asciiRef(bytes,0,'%PDF-')) {
    for (let i=Math.max(0,bytes.length-1024);i<=bytes.length-5;i++) if (asciiRef(bytes,i,'%%EOF')) return {contentType:'application/pdf',extension:'.pdf'};
  }
  return null;
}

export function validateMediaUpload(value, name) {
  const id = inquiryIdRef(value);
  if (!id || id==='00000000-0000-0000-0000-000000000000' || typeof name!=='string' || name.length>200
    || !name.replace(/\p{White_Space}/gu,'') || /\p{Cc}/u.test(name)) return null;
  return { id, originalName: name.replaceAll('\\','/').split('/').at(-1) };
}

export async function readMediaBody(request) {
  if (!request.body) return {status:400};
  const reader=request.body.getReader();
  try {
    const length=request.headers.get('Content-Length');
    if (length && /^\d+$/.test(length) && BigInt(length)>BigInt(maxMediaBytesRef)) { await reader.cancel(); return {status:413}; }
    let bytes=new Uint8Array(65536), used=0;
    while (true) {
      const {done,value}=await reader.read(); if (done) return {bytes:bytes.slice(0,used)};
      if (!(value instanceof Uint8Array)) { await reader.cancel(); return {status:400}; }
      const needed=used+value.length;
      if (needed>maxMediaBytesRef) { await reader.cancel(); return {status:413}; }
      if (needed>bytes.length) {
        const grown=new Uint8Array(Math.min(maxMediaBytesRef,Math.max(needed,bytes.length*2)));
         grown.set(bytes.subarray(0,used)); bytes=grown;
      }
      bytes.set(value,used); used=needed;
    }
  } catch { return {status:400}; }
  finally { reader.releaseLock(); }
}
// codeguard:components:end
