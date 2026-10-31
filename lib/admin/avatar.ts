// Profile pictures for writers. The browser shrinks the picture to 256 x 256 before it is sent; the server
// re-checks the file type by its first bytes (never by the name) and the size, then stores it in the public
// "avatars" bucket of Supabase Storage.
import { dbConfigured, headers } from './db';

export const MAX_AVATAR_BYTES = 200_000;

export function sniffImage(bytes: Uint8Array): { ext: 'jpg' | 'png' | 'webp'; mime: string } | null {
  if (bytes.length > 12 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (bytes.length > 12 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { ext: 'png', mime: 'image/png' };
  if (
    bytes.length > 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

export async function uploadAvatar(owner: string, bytes: Uint8Array, ext: string, mime: string): Promise<string> {
  return putAvatar(`${owner}-${Date.now()}.${ext}`, bytes, mime);
}

/** A review photo gets an unguessable name, so it can be matched and removed later. */
export async function uploadReviewPhoto(bytes: Uint8Array, ext: string, mime: string): Promise<string> {
  return putAvatar(`review-${crypto.randomUUID()}.${ext}`, bytes, mime);
}

async function putAvatar(path: string, bytes: Uint8Array, mime: string): Promise<string> {
  if (!dbConfigured()) throw new Error('The database connection is not set up yet.');
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const res = await fetch(`${base}/storage/v1/object/avatars/${path}`, {
    method: 'POST',
    headers: { ...headers(), 'content-type': mime, 'cache-control': 'max-age=31536000' },
    body: bytes as unknown as BodyInit,
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    let msg = '';
    try {
      msg = String(((await res.json()) as { message?: string }).message ?? '');
    } catch {
      /* no body */
    }
    throw new Error(`The picture could not be stored (${res.status}${msg ? `: ${msg.slice(0, 120)}` : ''}).`);
  }
  return `${base}/storage/v1/object/public/avatars/${path}`;
}

/** Removes a picture that was uploaded for a review (best effort; a leftover file is harmless). */
export async function removeStoredAvatar(url: string | null): Promise<void> {
  if (!url || !dbConfigured()) return;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const marker = `${base}/storage/v1/object/public/avatars/`;
  if (!url.startsWith(marker)) return;
  const path = url.slice(marker.length);
  if (!/^review-[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path)) return; // only ever remove review pictures
  try {
    await fetch(`${base}/storage/v1/object/avatars/${path}`, { method: 'DELETE', headers: headers(), signal: AbortSignal.timeout(10000) });
  } catch {
    /* ignore */
  }
}
