// Used by server-rendered admin pages: redirects to the login page when not signed in.
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME, readSession, type Session, verifyToken } from './auth';

export async function requireAdmin(): Promise<void> {
  const store = await cookies();
  if (!verifyToken(store.get(COOKIE_NAME)?.value)) redirect('/admin/login');
}

export async function isSignedIn(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

export async function currentSession(): Promise<Session | null> {
  const store = await cookies();
  return readSession(store.get(COOKIE_NAME)?.value);
}

/** Pages for the owner and for writers: redirects to sign-in when there is no session at all. */
export async function requireSession(): Promise<Session> {
  const s = await currentSession();
  if (!s) redirect('/admin/login');
  return s;
}
