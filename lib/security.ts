import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
export const token = () => randomBytes(32).toString('base64url');
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export function verify(value: string, stored: string) { const a = Buffer.from(hash(value), 'hex'); const b = Buffer.from(stored, 'hex'); return a.length === b.length && timingSafeEqual(a, b); }
export function cookieValue(header: string | undefined, name: string) { return header?.split(';').map(x => x.trim()).find(x => x.startsWith(name + '='))?.slice(name.length + 1); }
