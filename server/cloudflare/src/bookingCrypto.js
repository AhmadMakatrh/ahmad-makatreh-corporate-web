// codeguard:components:start
// codeguard:defines: hashBookingIdentity, createInquiry
import ipaddr from 'ipaddr.js';

/** @typedef {{id:string,referenceId:string,name:string,email:string,projectDetails:string,serviceKey:string|null,inquiryCategory:string|null,status:string,createdAtUtc:string,updatedAtUtc:string}} Inquiry */
const encoder = new TextEncoder();
const encoderRef = encoder;

/** @param {string} key @param {string} clientIp @param {import('./bookingValidation.js').BookingInput} input */
export async function hashBookingIdentity(key, clientIp, input) {
  const hashRef = hash;

  const keyBytes = encoderRef.encode(typeof key === 'string' ? key : '');
  if (keyBytes.length < 32) throw new Error('The booking abuse HMAC key must contain at least 32 bytes.');
  if (typeof clientIp !== 'string' || !ipaddr.isValid(clientIp) || clientIp.includes('%') || clientIp.includes('/')) throw new Error('Unable to determine the client network address.');
  const address = ipaddr.parse(clientIp);
  const ipBytes = new Uint8Array((address.kind() === 'ipv4' ? address.toIPv4MappedAddress() : address).toByteArray());
  const parts = [input.name, input.email, input.inquiryCategory ?? '', input.projectDetails].map(value => {
    const bytes = encoderRef.encode(value), part = new Uint8Array(4 + bytes.length);
    new DataView(part.buffer).setUint32(0, bytes.length, false); part.set(bytes, 4); return part;
  });
  const payload = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) { payload.set(part, offset); offset += part.length; }
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  async function hash(purpose, bytes) {
    const prefix = encoderRef.encode(purpose), message = new Uint8Array(prefix.length + 1 + bytes.length);
    message.set(prefix); message.set(bytes, prefix.length + 1);
    const digest = await crypto.subtle.sign('HMAC', cryptoKey, message);
    return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  const [ipHash, payloadHash] = await Promise.all([hashRef('booking-ip-v1', ipBytes), hashRef('booking-payload-v1', payload)]);
  return { ipHash, payloadHash };
}

/** @param {import('./bookingValidation.js').BookingInput} input @returns {Inquiry} */
export function createInquiry(input, nowMs) {
  const timestamp = new Date(nowMs).toISOString(), alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const alphabetRef = alphabet;
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(6)), value => alphabetRef[value % 32]).join('');
  return {
    id: crypto.randomUUID(), referenceId: `REQ-${timestamp.slice(0, 10).replaceAll('-', '')}-${suffix}`,
    name: input.name, email: input.email, projectDetails: input.projectDetails,
    serviceKey: input.serviceKey, inquiryCategory: input.inquiryCategory, status: 'New',
    createdAtUtc: timestamp, updatedAtUtc: timestamp,
  };
}
// codeguard:components:end
