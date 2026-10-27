import { isAdminRequest, sameOrigin } from '../../../../lib/admin/auth';
import { dbConfigured } from '../../../../lib/admin/db';
import { json } from '../../../../lib/admin/http';
import { cleanEmail, createUser, deleteUser, findByEmail, generatePassword, hashPassword, listUsers, updateUser } from '../../../../lib/admin/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  if (!isAdminRequest(request)) return json({ ok: false, error: 'Only the owner can manage the team.' }, 401);
  if (!dbConfigured()) return json({ ok: false, error: 'The database connection is not set up yet (SUPABASE_SERVICE_ROLE_KEY).' }, 503);
  return json({ ok: true, users: await listUsers() });
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Request not allowed.' }, 403);
  if (!isAdminRequest(request)) return json({ ok: false, error: 'Only the owner can manage the team.' }, 401);
  if (!dbConfigured()) return json({ ok: false, error: 'The database connection is not set up yet.' }, 503);
  let b: Record<string, unknown>;
  try {
    b = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'That request could not be read.' }, 400);
  }
  const id = typeof b.id === 'string' ? b.id : '';

  if (b.action === 'create') {
    const name = typeof b.name === 'string' ? b.name.trim().slice(0, 80) : '';
    const email = cleanEmail(b.email);
    if (name.length < 2) return json({ ok: false, error: 'Add the person\'s name.' }, 400);
    if (!email) return json({ ok: false, error: 'Add a valid email address.' }, 400);
    if (await findByEmail(email)) return json({ ok: false, error: 'That email already has an account.' }, 409);
    const password = generatePassword();
    const r = await createUser(name, email, password);
    if (!r.ok) return json({ ok: false, error: r.error ?? 'Could not create the account.' }, 400);
    // The temporary password is shown once, here, and is never stored in readable form.
    return json({ ok: true, email, password });
  }
  if (b.action === 'reset') {
    const password = generatePassword();
    return (await updateUser(id, { password_hash: hashPassword(password) })) ? json({ ok: true, password }) : json({ ok: false, error: 'Nothing was changed.' }, 400);
  }
  if (b.action === 'deactivate' || b.action === 'activate') {
    return (await updateUser(id, { active: b.action === 'activate' })) ? json({ ok: true }) : json({ ok: false, error: 'Nothing was changed.' }, 400);
  }
  if (b.action === 'delete') {
    return (await deleteUser(id)) ? json({ ok: true }) : json({ ok: false, error: 'Nothing was deleted.' }, 400);
  }
  return json({ ok: false, error: 'That request was not valid.' }, 400);
}
