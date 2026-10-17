// codeguard:components:start
// codeguard:defines: prepareDocumentBody, decodeDocumentBody
const parseBodyRef = parseBody;
const partSize = 524288;
const partSizeRef = partSize;

function parseBody(json) {
  if (json.length > 1500000) throw new Error('Document limit exceeded');
  const data = JSON.parse(json);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid document');
  const stack = [[data, 1]];
  while (stack.length) {
    const [value, depth] = stack.pop();
    if (depth > 24) throw new Error('Document depth exceeded');
    for (const item of Object.values(value)) if (item && typeof item === 'object') stack.push([item, depth + 1]);
  }
  return data;
}

export async function prepareDocumentBody(json) {
  parseBodyRef(json);
  const bytes = new TextEncoder().encode(json), parts = [];
  for (let offset = 0; offset < bytes.length; offset += partSizeRef) parts.push(bytes.slice(offset, offset + partSizeRef));
  if (parts.length > 10) throw new Error('Chunk limit exceeded');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return { json, parts: parts, sha256: Array.from(new Uint8Array(digest), v => v.toString(16).padStart(2, '0')).join('') };
}

export function decodeDocumentBody(rows) {
  if (!rows.length || rows.length > 10) throw new Error('Missing or excessive chunks');
  const parts = rows.map((row, index) => {
    if (row.part_number !== index || row.content == null) throw new Error('Missing chunk');
    const bytes = new Uint8Array(row.content);
    if (!bytes.length || bytes.length > partSizeRef) throw new Error('Chunk limit exceeded');
    return bytes;
  });
  const bytes = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  const json = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  return { json, data: parseBodyRef(json) };
}
// codeguard:components:end
