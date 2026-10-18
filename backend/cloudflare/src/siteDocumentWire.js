// codeguard:components:start
// codeguard:defines: parseDocumentRevision, parseDocumentRequest, revisionJson
const parseDocumentRevisionRef = parseDocumentRevision;
const maxRevision = 9223372036854775807n;
const maxRevisionRef = maxRevision;

export function parseDocumentRevision(text, minimum = 0n) {
  if (typeof text !== 'string' || !/^(0|[1-9]\d*)$/.test(text)) return null;
  const value = BigInt(text);
  return value >= minimum && value <= maxRevisionRef ? value : null;
}

export function parseDocumentRequest(text) {
  const sources = new WeakMap();
  const result = JSON.parse(text, function (key, value, context) {
    if ((key === 'revision' || key === 'expectedRevision') && typeof value === 'number') {
      const fields = sources.get(this) ?? {};
      fields[key] = context.source; sources.set(this, fields);
    }
    return value;
  });
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    for (const field of ['revision', 'expectedRevision']) {
      if (Object.hasOwn(result, field)) result[field] = parseDocumentRevisionRef(sources.get(result)?.[field]);
    }
  }
  return result;
}

export function revisionJson(revision) {
  if (typeof revision !== 'bigint' || revision < 0n || revision > maxRevisionRef) throw new RangeError('Invalid document revision');
  return JSON.rawJSON(String(revision));
}
// codeguard:components:end
