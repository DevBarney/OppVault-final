// Used by server-rendered admin pages: redirects to the login page when not signed in.
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME, verifyToken } from './auth';

export async function requireAdmin(): Promise<void> {
  const store = await cookies();
  if (!verifyToken(store.get(COOKIE_NAME)?.value)) redirect('/admin/login');
}

export async function isSignedIn(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}
