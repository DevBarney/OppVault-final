'use client';

export default function SignOutButton() {
  async function out() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }
  return (
    <button type="button" className="adm__ghost" onClick={out}>
      Sign out
    </button>
  );
}
