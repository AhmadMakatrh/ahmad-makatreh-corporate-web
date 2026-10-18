// codeguard:components:start
// codeguard:defines: normalizeUtc, utcNow, nextUpdatedAt, cursorFor, parseCursor
const normalizeUtcRef = normalizeUtc;
const toTicksRef = toTicks;
const fromTicksRef = fromTicks;
const epochTicks = 621355968000000000n;
const epochTicksRef = epochTicks;
const maxTicks = 3155378975999999999n;
const maxTicksRef = maxTicks;
const ticksPerMs = 10000n;
const ticksPerMsRef = ticksPerMs;
export function normalizeUtc(value) {
  if (typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,7}))?Z$/.exec(value);
  if (!m || Number(m[1]) < 1) return null;
  const base = value.slice(0, 19), ms = Date.parse(`${base}Z`);
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 19) !== base) return null;
  return `${base}.${(m[7] ?? '').padEnd(7, '0')}Z`;
}
function toTicks(value) {
  const normalized = normalizeUtcRef(value);
  if (!normalized) throw new Error('Invalid UTC timestamp.');
  return BigInt(Date.parse(`${normalized.slice(0, 19)}Z`)) * ticksPerMsRef + epochTicksRef + BigInt(normalized.slice(20, 27));
}
function fromTicks(ticks) {
  if (ticks < 0n || ticks > maxTicksRef) return null;
  const base = new Date(Number(ticks / ticksPerMsRef - epochTicksRef / ticksPerMsRef)).toISOString().slice(0, 19);
  return `${base}.${String(ticks % 10000000n).padStart(7, '0')}Z`;
}
export function utcNow(nowMs) {
  const value = fromTicksRef(BigInt(Math.trunc(nowMs)) * ticksPerMsRef + epochTicksRef);
  if (!value) throw new Error('UTC timestamp outside DateTime range.');
  return value;
}
export function nextUpdatedAt(expected, nowMs) {
  const previous = toTicksRef(expected), current = BigInt(Math.trunc(nowMs)) * ticksPerMsRef + epochTicksRef;
  return fromTicksRef(current > previous ? current : previous + ticksPerMsRef);
}
export function cursorFor(createdAtUtc, id) {
  return `${toTicksRef(createdAtUtc)}.${id.replaceAll('-', '').toLowerCase()}`;
}
export function parseCursor(value) {
  if (typeof value !== 'string') return null;
  const match = /^(\d{1,19})\.([0-9a-f]{32})$/i.exec(value);
  if (!match) return null;
  const beforeUtc = fromTicksRef(BigInt(match[1])), id = match[2].toLowerCase();
  return beforeUtc ? { beforeUtc, beforeId: `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}` } : null;
}
// codeguard:components:end
