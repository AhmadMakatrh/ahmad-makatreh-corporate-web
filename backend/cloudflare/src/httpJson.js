// codeguard:components:start
// codeguard:defines: readJson
export async function readJson(request, maxBytes = 65536, parse = JSON.parse) {
  if (Number(request.headers.get('Content-Length')) > maxBytes) return { oversized: true };
  const reader = request.body?.getReader();
  if (!reader) return { invalid: true };
  const parts = [];
   let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > maxBytes) { await reader.cancel(); return { oversized: true }; }
      parts.push(value);
    }
    const bytes = new Uint8Array(length);
     let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.length; }
    return { value: parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) };
  } catch { return { invalid: true }; }
  finally { reader.releaseLock(); }
}
// codeguard:components:end
