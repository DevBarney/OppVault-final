// Team accounts. The owner signs in with ADMIN_PASSWORD. Writers have their own email and password, stored as
// a salted scrypt hash in the private admin_users table. A writer can only reach the blog editor.

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { call, dbConfigured, headers } from './db';

export type TeamUser = { id: string; name: string; email: string; role: 'writer'; active: boolean; created_at: string; last_login: string | null; avatar_url: string | null };
type Row = TeamUser & { password_hash: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pw, salt, 32);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyHash(pw: string, stored: string | null | undefined): boolean {
  // Always do the same amount of work, so response time does not reveal whether an email exists.
  const parts = (stored ?? '').split('$');
  const salt = parts[0] === 'scrypt' && parts[1] ? Buffer.from(parts[1], 'hex') : Buffer.alloc(16);
  const expected = parts[0] === 'scrypt' && parts[2] ? Buffer.from(parts[2], 'hex') : Buffer.alloc(32);
  const actual = scryptSync(pw, salt, 32);
  return parts[0] === 'scrypt' && expected.length === actual.length && timingSafeEqual(actual, expected);
}

const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function generatePassword(length = 14): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function validPassword(pw: unknown): pw is string {
  return typeof pw === 'string' && pw.length >= 10 && pw.length <= 100;
}

export function cleanEmail(v: unknown): string | null {
  const e = typeof v === 'string' ? v.trim().toLowerCase() : '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 200 ? e : null;
}

export async function findByEmail(email: string): Promise<Row | null> {
  if (!dbConfigured()) return null;
  const r = await call(`admin_users?select=*&email=eq.${encodeURIComponent(email.toLowerCase())}&limit=1`, { headers: headers() });
  const row = r.ok && Array.isArray(r.body) ? (r.body[0] as Row | undefined) : undefined;
  return row && row.email.toLowerCase() === email.toLowerCase() ? row : null;
}

export async function findById(id: string): Promise<Row | null> {
  if (!dbConfigured() || !UUID.test(id)) return null;
  const r = await call(`admin_users?select=*&id=eq.${id}&limit=1`, { headers: headers() });
  return r.ok && Array.isArray(r.body) ? ((r.body[0] as Row | undefined) ?? null) : null;
}

export async function listUsers(): Promise<TeamUser[]> {
  const r = await call('admin_users?select=id,name,email,role,active,created_at,last_login,avatar_url&order=created_at.desc&limit=200', { headers: headers() });
  return r.ok && Array.isArray(r.body) ? (r.body as TeamUser[]) : [];
}

export async function createUser(name: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const r = await call('admin_users', {
    method: 'POST',
    headers: headers({ prefer: 'return=minimal' }),
    body: JSON.stringify({ name, email, role: 'writer', password_hash: hashPassword(password) }),
  });
  if (r.ok) return { ok: true };
  return { ok: false, error: r.status === 409 ? 'That email already has an account.' : 'The account could not be created.' };
}

export async function updateUser(id: string, patch: Record<string, unknown>): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const r = await call(`admin_users?id=eq.${id}`, { method: 'PATCH', headers: headers({ prefer: 'return=minimal' }), body: JSON.stringify(patch) });
  return r.ok;
}

export async function deleteUser(id: string): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const r = await call(`admin_users?id=eq.${id}`, { method: 'DELETE', headers: headers({ prefer: 'return=minimal' }) });
  return r.ok;
}

/** A writer's cookie only counts while the account still exists and is active. */
export async function activeWriter(id: string): Promise<Row | null> {
  const u = await findById(id);
  return u && u.active ? u : null;
}
