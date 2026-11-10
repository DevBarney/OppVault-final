'use client';

import { useEffect, useState } from 'react';

/** "Add to calendar" (only when there is an upcoming date), "Share on WhatsApp" and "Copy link". */
export default function ShareActions({ category, slug, title, url: officialUrl, hasDate, dateLabel }: { category: string; slug: string; title: string; url: string; hasDate: boolean; dateLabel: string }) {
  const [copied, setCopied] = useState(false);
  // Share the address the page is open on, so a link copied from a preview opens that same preview.
  // On the live site this is the official address, so nothing changes there.
  const [url, setUrl] = useState(officialUrl);
  useEffect(() => {
    try {
      setUrl(`${window.location.origin}/${category}/${slug}`);
    } catch {
      setUrl(officialUrl);
    }
  }, [category, slug, officialUrl]);
  const text = `${title} (${dateLabel}). Details on OppVault: ${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', url);
    }
  }

  return (
    <div className="share">
      {hasDate ? (
        <a className="share__btn" href={`/api/calendar/${category}/${slug}`} download>
          Add to calendar
        </a>
      ) : null}
      <a className="share__btn" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
        Share on WhatsApp
      </a>
      <button type="button" className="share__btn" onClick={copy}>
        {copied ? 'Link copied' : 'Copy link'}
      </button>
      <span className="visually-hidden" role="status">{copied ? 'Link copied' : ''}</span>
    </div>
  );
}
