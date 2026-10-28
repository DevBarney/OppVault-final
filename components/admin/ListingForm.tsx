'use client';

import { useState, type ChangeEvent } from 'react';
import { CATEGORIES } from '../../lib/categories';
import './listing-form.css';

export type ListingValues = {
  category: string;
  title: string;
  link: string;
  provider: string;
  summary: string;
  description: string;
  location: string;
  level: string;
  funding: string;
  deadline: string;
  eligibility: string;
  benefits: string;
  how_to_apply: string;
  image_url: string;
  coupon_code: string;
  featured: boolean;
  published: boolean;
};

export const EMPTY_LISTING: ListingValues = {
  category: 'scholarships',
  title: '',
  link: '',
  provider: '',
  summary: '',
  description: '',
  location: '',
  level: '',
  funding: '',
  deadline: '',
  eligibility: '',
  benefits: '',
  how_to_apply: '',
  image_url: '',
  coupon_code: '',
  featured: false,
  published: true,
};

type Props = {
  /** Starting values. Used when editing a visitor suggestion before approving it. */
  initial?: Partial<ListingValues>;
  /** When set, saving also marks that suggestion as approved. */
  submissionId?: string;
  canSave?: boolean;
  onSaved?: () => void;
  onCancel?: () => void;
};

type Field = 'title' | 'link' | 'provider' | 'summary' | 'description' | 'location' | 'level' | 'funding' | 'deadline' | 'eligibility' | 'benefits' | 'how_to_apply' | 'image_url' | 'coupon_code';

export default function ListingForm({ initial, submissionId, canSave = true, onSaved, onCancel }: Props) {
  const start: ListingValues = { ...EMPTY_LISTING, ...initial };
  const [v, setV] = useState<ListingValues>(start);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [done, setDone] = useState<{ published: boolean; path: string; replaced: boolean } | null>(null);

  const cat = CATEGORIES.find((c) => c.slug === v.category) ?? CATEGORIES[0];
  const id = (n: string) => `lf-${submissionId ?? 'new'}-${n}`;
  const linkOk = /^https:\/\/\S+$/i.test(v.link.trim());

  const text = (f: Field) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setV({ ...v, [f]: e.target.value });
    setWarn('');
  };

  async function save(confirm: boolean) {
    setBusy(true);
    setError('');
    if (!confirm) setWarn('');
    try {
      const res = await fetch('/api/admin/listing', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...v, submission_id: submissionId, confirm }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; needsConfirm?: boolean; published?: boolean; category?: string; slug?: string; replaced?: boolean };
      if (data.ok) {
        setDone({ published: Boolean(data.published), path: `/${data.category}/${data.slug}`, replaced: Boolean(data.replaced) });
        onSaved?.();
      } else if (data.needsConfirm) {
        setWarn(data.error ?? 'Please confirm.');
      } else {
        setError(data.error ?? 'Nothing was saved.');
      }
    } catch {
      setError('Could not reach the server.');
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="lf">
        <p className="adm__notice adm__notice--ok" aria-live="polite">
          {done.replaced ? 'Replaced and saved. ' : 'Saved. '}
          {done.published ? 'It is live now (pages refresh within a few minutes).' : 'It is saved as a hidden draft. Show it from "Manage what is live".'}
        </p>
        <div className="adm__actions">
          {done.published ? (
            <a className="adm__link" href={done.path} target="_blank" rel="noopener noreferrer">
              View the listing
            </a>
          ) : null}
          {submissionId ? null : (
            <button
              type="button"
              className="adm__ghost adm__ghost--on"
              onClick={() => {
                setV({ ...EMPTY_LISTING, category: v.category });
                setDone(null);
              }}
            >
              Add another
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="lf">
      <div className="lf__grid">
        <div className="lf__field">
          <label className="adm__label" htmlFor={id('cat')}>
            Type <span className="lf__req">(required)</span>
          </label>
          <select id={id('cat')} className="adm__input" value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="lf__field">
          <label className="adm__label" htmlFor={id('prov')}>Provider</label>
          <input id={id('prov')} className="adm__input" value={v.provider} onChange={text('provider')} maxLength={160} />
          <p className="lf__hint">Who runs it. Empty: the website name from the link is used.</p>
        </div>

        <div className="lf__field lf__full">
          <label className="adm__label" htmlFor={id('title')}>
            Title <span className="lf__req">(required)</span>
          </label>
          <input id={id('title')} className="adm__input" value={v.title} onChange={text('title')} maxLength={200} />
        </div>

        <div className="lf__field lf__full">
          <label className="adm__label" htmlFor={id('link')}>
            Official link <span className="lf__req">(required)</span>
          </label>
          <div className="adm__actions">
            <input id={id('link')} className="adm__input" type="url" inputMode="url" placeholder="https://" value={v.link} onChange={text('link')} maxLength={600} />
            {linkOk ? (
              <a className="adm__link" href={v.link.trim()} target="_blank" rel="noopener noreferrer nofollow">
                Open link
              </a>
            ) : null}
          </div>
          <p className="lf__hint">Must start with https://. Saved exactly as you type it. Open it and check it is the official page before you save.</p>
        </div>

        <div className="lf__field lf__full">
          <label className="adm__label" htmlFor={id('sum')}>Summary</label>
          <textarea id={id('sum')} className="adm__input adm__textarea" value={v.summary} onChange={text('summary')} maxLength={400} />
          <p className="lf__hint">One or two sentences shown on the card. Empty: a plain pointer to the official page is used. Nothing is made up.</p>
        </div>

        <div className="lf__field">
          <label className="adm__label" htmlFor={id('date')}>{cat.dateLabel}</label>
          <input id={id('date')} className="adm__input" type="date" value={v.deadline} onChange={text('deadline')} />
          <p className="lf__hint">Leave empty for rolling or no fixed date.</p>
        </div>
        <div className="lf__field">
          <label className="adm__label" htmlFor={id('fund')}>{cat.fundingLabel}</label>
          <input id={id('fund')} className="adm__input" list={id('fundlist')} value={v.funding} onChange={text('funding')} maxLength={120} />
          <datalist id={id('fundlist')}>
            {cat.fundingOptions.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
          <p className="lf__hint">Pick one of the suggestions so the filter finds it, or type your own.</p>
        </div>

        <div className="lf__field">
          <label className="adm__label" htmlFor={id('loc')}>Location</label>
          <input id={id('loc')} className="adm__input" value={v.location} onChange={text('location')} maxLength={120} />
          <p className="lf__hint">Country or city, or Online. Empty: Global.</p>
        </div>
        <div className="lf__field">
          <label className="adm__label" htmlFor={id('lvl')}>Level</label>
          <input id={id('lvl')} className="adm__input" value={v.level} onChange={text('level')} maxLength={80} />
          <p className="lf__hint">For example Undergraduate or Postgraduate. Empty: All levels.</p>
        </div>

        <div className="lf__field lf__full">
          <label className="adm__label" htmlFor={id('desc')}>Description</label>
          <textarea id={id('desc')} className="adm__input adm__textarea" value={v.description} onChange={text('description')} maxLength={6000} />
          <p className="lf__hint">Optional longer text. Leave a blank line between paragraphs.</p>
        </div>

        <div className="lf__field">
          <label className="adm__label" htmlFor={id('elig')}>Eligibility</label>
          <textarea id={id('elig')} className="adm__input adm__textarea" value={v.eligibility} onChange={text('eligibility')} />
          <p className="lf__hint">One item per line.</p>
        </div>
        <div className="lf__field">
          <label className="adm__label" htmlFor={id('ben')}>Benefits</label>
          <textarea id={id('ben')} className="adm__input adm__textarea" value={v.benefits} onChange={text('benefits')} />
          <p className="lf__hint">One item per line.</p>
        </div>

        <div className="lf__field lf__full">
          <label className="adm__label" htmlFor={id('how')}>How to apply</label>
          <textarea id={id('how')} className="adm__input adm__textarea" value={v.how_to_apply} onChange={text('how_to_apply')} maxLength={3000} />
        </div>

        <div className="lf__field">
          <label className="adm__label" htmlFor={id('img')}>Image link</label>
          <input id={id('img')} className="adm__input" type="url" inputMode="url" placeholder="https://" value={v.image_url} onChange={text('image_url')} maxLength={600} />
          <p className="lf__hint">Optional. A direct https link to a picture.</p>
        </div>
        <div className="lf__field">
          <label className="adm__label" htmlFor={id('code')}>Coupon code</label>
          <input id={id('code')} className="adm__input" value={v.coupon_code} onChange={text('coupon_code')} maxLength={60} />
          <p className="lf__hint">Optional. Shown on the listing page.</p>
        </div>
      </div>

      <div className="lf__checks">
        <label className="lf__check">
          <input type="checkbox" checked={v.published} onChange={(e) => setV({ ...v, published: e.target.checked })} />
          Publish now (untick to save as a hidden draft)
        </label>
        <label className="lf__check">
          <input type="checkbox" checked={v.featured} onChange={(e) => setV({ ...v, featured: e.target.checked })} />
          Featured
        </label>
      </div>

      {error ? (
        <p className="adm__notice adm__notice--error" role="alert">
          {error}
        </p>
      ) : null}
      {warn ? (
        <p className="lf__warn" role="alert">
          {warn}
        </p>
      ) : null}

      <div className="adm__actions lf__inline">
        {warn ? (
          <button type="button" className="adm__ghost adm__ghost--on" disabled={busy || !canSave} onClick={() => save(true)}>
            Save anyway
          </button>
        ) : (
          <button type="button" className="adm__ghost adm__ghost--on" disabled={busy || !canSave} onClick={() => save(false)}>
            {busy ? 'Saving...' : submissionId ? 'Save and approve' : 'Save listing'}
          </button>
        )}
        {onCancel ? (
          <button type="button" className="adm__ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        {canSave ? null : <span className="adm__muted">The database is not connected for writing yet.</span>}
      </div>
      <p className="adm__muted">Only add real listings you have checked against the official source. Invented ones should never be saved.</p>
    </div>
  );
}
