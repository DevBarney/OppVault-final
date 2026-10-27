'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import Prose from '../Prose';

type Item = { id: string; title: string; author?: string; status: 'draft' | 'review' | 'published'; published_at?: string; updated_at?: string };
type Full = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  author: string;
  tags: string[];
  image_url: string | null;
  status: 'draft' | 'review' | 'published';
  published_at: string;
  review_note: string;
};

const LABEL: Record<string, string> = { draft: 'draft', review: 'waiting for review', published: 'live' };
const today = () => new Date().toISOString().slice(0, 10);

export default function BlogEditor({ role }: { role: 'owner' | 'writer' }) {
  const owner = role === 'owner';
  const [items, setItems] = useState<Item[] | null>(null);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(false);
  const [id, setId] = useState('');
  const [status, setStatus] = useState<'draft' | 'review' | 'published'>('draft');
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState('');
  const [date, setDate] = useState(today());
  const [author, setAuthor] = useState('');
  const [slug, setSlug] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const locked = !owner && status === 'published';

  async function load(f = filter) {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch(`/api/admin/posts${f ? `?status=${f}` : ''}`);
      const d = (await res.json()) as { ok: boolean; error?: string; items?: Item[] };
      if (d.ok) setItems(d.items ?? []);
      else setErr(d.error ?? 'Could not load posts.');
    } catch {
      setErr('Could not reach the server.');
    }
    setBusy(false);
  }

  function blank() {
    setId('');
    setStatus('draft');
    setTitle('');
    setExcerpt('');
    setBody('');
    setTags('');
    setImage('');
    setDate(today());
    setAuthor('');
    setSlug('');
    setNote('');
    setMsg('');
    setErr('');
    setEditing(true);
  }

  async function open(itemId: string) {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const res = await fetch(`/api/admin/posts?id=${encodeURIComponent(itemId)}`);
      const d = (await res.json()) as { ok: boolean; error?: string; post?: Full };
      if (d.ok && d.post) {
        const p = d.post;
        setId(p.id);
        setStatus(p.status);
        setTitle(p.title);
        setExcerpt(p.excerpt);
        setBody(p.body);
        setTags(p.tags.join(', '));
        setImage(p.image_url ?? '');
        setDate(p.published_at);
        setAuthor(p.author);
        setSlug(p.slug);
        setNote(p.review_note);
        setEditing(true);
      } else setErr(d.error ?? 'Could not open that post.');
    } catch {
      setErr('Could not reach the server.');
    }
    setBusy(false);
  }

  async function send(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, id, title, excerpt, body, tags, image_url: image, published_at: date, author, slug, ...extra }),
      });
      const d = (await res.json()) as { ok: boolean; error?: string; id?: string; status?: 'draft' | 'review' | 'published' };
      if (d.ok) {
        if (action === 'delete') {
          setEditing(false);
          setMsg('Deleted.');
        } else {
          if (d.id) setId(d.id);
          if (d.status) setStatus(d.status);
          setMsg(
            action === 'publish' ? 'Published. It is now live on the blog.' : action === 'submit' ? 'Sent for review. The owner will check it.' : action === 'save' ? 'Saved.' : 'Done.',
          );
          if (action === 'unpublish' || action === 'reject') setEditing(false);
        }
        await load();
      } else setErr(d.error ?? 'Something went wrong.');
    } catch {
      setErr('Could not reach the server.');
    }
    setBusy(false);
  }

  function insert(prefix: string) {
    setBody((b) => `${b}${b && !b.endsWith('\n') ? '\n' : ''}${prefix}`);
  }

  if (!editing) {
    return (
      <div className="adm__form">
        <div className="adm__actions">
          <button type="button" className="adm__ghost adm__ghost--on" onClick={blank}>Write a new post</button>
          <button type="button" className="adm__ghost" disabled={busy} onClick={() => load()}>{items ? 'Refresh' : 'Load posts'}</button>
          {owner ? (
            <select className="adm__input" aria-label="Filter by status" value={filter} onChange={(e: ChangeEvent<HTMLSelectElement>) => { setFilter(e.target.value); void load(e.target.value); }}>
              <option value="">All posts</option>
              <option value="review">Waiting for review</option>
              <option value="draft">Drafts</option>
              <option value="published">Live</option>
            </select>
          ) : null}
        </div>
        {err ? <p className="adm__notice adm__notice--error" role="alert">{err}</p> : null}
        {msg ? <p className="adm__notice adm__notice--ok">{msg}</p> : null}
        {items && items.length === 0 ? <p className="adm__muted">No posts yet.</p> : null}
        <ul className="adm__rows">
          {items?.map((it) => (
            <li key={it.id}>
              <div className="adm__rowtitle" style={{ padding: '10px 12px' }}>
                {it.title}
                <span className={`adm__chip ${it.status === 'published' ? '' : 'adm__chip--draft'}`}>{LABEL[it.status]}</span>
                {owner && it.author ? <span className="adm__muted"> by {it.author}</span> : null}
              </div>
              <div className="adm__rowtools">
                <button type="button" className="adm__ghost" disabled={busy} onClick={() => open(it.id)}>{!owner && it.status === 'published' ? 'View' : 'Open'}</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="adm__form">
      <div className="adm__actions">
        <button type="button" className="adm__ghost" onClick={() => { setEditing(false); void load(); }}>Back to posts</button>
        <span className={`adm__chip ${status === 'published' ? '' : 'adm__chip--draft'}`}>{LABEL[status]}</span>
      </div>
      {err ? <p className="adm__notice adm__notice--error" role="alert">{err}</p> : null}
      {msg ? <p className="adm__notice adm__notice--ok" aria-live="polite">{msg}</p> : null}
      {note ? <p className="adm__notice adm__notice--warn">Note from the owner: {note}</p> : null}
      {locked ? <p className="adm__notice">This post is live, so only the owner can change it.</p> : null}

      <label className="adm__label" htmlFor="bp-title">Title</label>
      <input id="bp-title" className="adm__input" value={title} maxLength={200} disabled={locked} onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} />

      <label className="adm__label" htmlFor="bp-excerpt">Short summary (shown on the blog list; leave empty to use the start of the post)</label>
      <textarea id="bp-excerpt" className="adm__input" rows={3} maxLength={400} value={excerpt} disabled={locked} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setExcerpt(e.target.value)} />

      <div className="adm__actions">
        <button type="button" className="adm__ghost" disabled={locked} onClick={() => insert('## ')}>Heading</button>
        <button type="button" className="adm__ghost" disabled={locked} onClick={() => insert('- ')}>Bullet</button>
      </div>
      <label className="adm__label" htmlFor="bp-body">Post</label>
      <textarea id="bp-body" className="adm__input adm__textarea" rows={16} value={body} disabled={locked} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)} />
      <p className="adm__muted">Leave a blank line between paragraphs. Start a line with <code>## </code> for a heading and <code>- </code> for a bullet.</p>

      <label className="adm__label" htmlFor="bp-tags">Tags (separated by commas)</label>
      <input id="bp-tags" className="adm__input" value={tags} disabled={locked} onChange={(e: ChangeEvent<HTMLInputElement>) => setTags(e.target.value)} />
      <label className="adm__label" htmlFor="bp-image">Cover image link (optional, https://)</label>
      <input id="bp-image" className="adm__input" value={image} disabled={locked} onChange={(e: ChangeEvent<HTMLInputElement>) => setImage(e.target.value)} />
      <label className="adm__label" htmlFor="bp-date">Date (YYYY-MM-DD)</label>
      <input id="bp-date" className="adm__input" value={date} disabled={locked} onChange={(e: ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} />
      {owner ? (
        <>
          <label className="adm__label" htmlFor="bp-author">Author name shown on the post</label>
          <input id="bp-author" className="adm__input" value={author} placeholder="OppVault team" onChange={(e: ChangeEvent<HTMLInputElement>) => setAuthor(e.target.value)} />
          {id ? (
            <>
              <label className="adm__label" htmlFor="bp-slug">Web address ending</label>
              <input id="bp-slug" className="adm__input" value={slug} onChange={(e: ChangeEvent<HTMLInputElement>) => setSlug(e.target.value)} />
            </>
          ) : null}
        </>
      ) : null}

      {!locked ? (
        <div className="adm__actions">
          <button type="button" className="adm__ghost" disabled={busy} onClick={() => send('save')}>Save draft</button>
          {owner ? (
            <button type="button" className="adm__ghost adm__ghost--on" disabled={busy} onClick={() => send('publish')}>{status === 'published' ? 'Save and keep live' : 'Publish now'}</button>
          ) : (
            <button type="button" className="adm__ghost adm__ghost--on" disabled={busy} onClick={() => send('submit')}>Send for review</button>
          )}
          {id && (owner || status !== 'published') ? (
            <button type="button" className="adm__ghost adm__ghost--danger" disabled={busy} onClick={() => { if (window.confirm('Delete this post for good?')) void send('delete'); }}>Delete</button>
          ) : null}
        </div>
      ) : null}

      {owner && id && status === 'review' ? (
        <div className="adm__actions">
          <input className="adm__input" placeholder="Note back to the writer (optional)" value={note} onChange={(e: ChangeEvent<HTMLInputElement>) => setNote(e.target.value)} />
          <button type="button" className="adm__ghost" disabled={busy} onClick={() => send('reject', { note })}>Send back to writer</button>
        </div>
      ) : null}
      {owner && id && status === 'published' ? (
        <div className="adm__actions">
          <button type="button" className="adm__ghost" disabled={busy} onClick={() => send('unpublish')}>Take offline (back to draft)</button>
        </div>
      ) : null}

      <h3 className="adm__subtitle">Preview</h3>
      <div className="adm__prose">
        <h2>{title || 'Your title'}</h2>
        {excerpt ? <p><em>{excerpt}</em></p> : null}
        <Prose text={body || 'Your post appears here as you type.'} />
      </div>
    </div>
  );
}
