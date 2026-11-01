'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import { CATEGORIES } from '../lib/categories';
import './command-palette.css';

type Entry = { label: string; hint: string; href: string; words: string };

const PAGES: Entry[] = [
  ...CATEGORIES.map((c) => ({ label: c.label, hint: 'Browse', href: `/${c.slug}`, words: `${c.label} ${c.singular} ${c.slug}`.toLowerCase() })),
  { label: 'Blog', hint: 'Guides and advice', href: '/blog', words: 'blog guides articles advice' },
  { label: 'My saved', hint: 'Your saved opportunities', href: '/account/saved', words: 'saved favourites bookmarks heart account' },
  { label: 'Suggest an opportunity', hint: 'Share one with us', href: '/submit', words: 'suggest submit add share' },
  { label: 'Reviews', hint: 'What people say', href: '/reviews', words: 'reviews testimonials feedback' },
  { label: 'About OppVault', hint: 'Who we are', href: '/about', words: 'about team story' },
];

const wordsOf = (s: string) => s.toLowerCase().split(/\s+/).filter(Boolean);

/**
 * Press / or Ctrl/Cmd + K anywhere to jump to a page or search. "grants nigeria" opens Grants filtered to "nigeria";
 * anything else searches every category. Arrow keys move, Enter goes, Escape closes.
 */
export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  const results = useMemo(() => {
    const words = wordsOf(query);
    const out: Entry[] = [];
    if (words.length > 0) {
      // "grants nigeria": the first word names a category, the rest is the search.
      const cat = CATEGORIES.find((c) => [c.slug, c.singular, c.label.toLowerCase()].includes(words[0]) || c.slug.startsWith(words[0]) && words[0].length >= 4 && words.length > 1);
      const rest = (cat ? words.slice(1) : words).join(' ').slice(0, 60);
      if (cat && rest) out.push({ label: `Search ${cat.label} for “${rest}”`, hint: 'Enter', href: `/${cat.slug}?q=${encodeURIComponent(rest)}`, words: '' });
      out.push({ label: `Search everything for “${words.join(' ').slice(0, 60)}”`, hint: 'All categories', href: `/search?q=${encodeURIComponent(words.join(' ').slice(0, 60))}`, words: '' });
    }
    const pages = words.length ? PAGES.filter((p) => words.every((w) => p.words.includes(w) || p.label.toLowerCase().includes(w))) : PAGES;
    return [...out, ...pages].slice(0, 9);
  }, [query]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      const combo = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (combo || (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey)) {
        e.preventDefault();
        returnTo.current = document.activeElement as HTMLElement | null;
        setOpen(true);
        setQuery('');
        setIndex(0);
      }
    };
    const onOpen = () => {
      returnTo.current = document.activeElement as HTMLElement | null;
      setOpen(true);
      setQuery('');
      setIndex(0);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('oppvault:open-search', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('oppvault:open-search', onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    returnTo.current?.focus?.();
  }

  function go(entry: Entry | undefined) {
    if (!entry) return;
    setOpen(false);
    router.push(entry.href);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[index]);
    }
  }

  if (!open) return null;
  return (
    <div className="cmdk" role="presentation" onMouseDown={(e: MouseEvent<HTMLDivElement>) => e.target === e.currentTarget && close()}>
      <div className="cmdk__box" role="dialog" aria-modal="true" aria-label="Quick search" onKeyDown={onKeyDown}>
        <input
          ref={inputRef}
          className="cmdk__input"
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          placeholder="Jump to a page, or try “grants nigeria”"
          role="combobox"
          aria-expanded="true"
          aria-controls="cmdk-list"
          aria-activedescendant={`cmdk-${index}`}
          maxLength={80}
          autoComplete="off"
          spellCheck={false}
        />
        <ul className="cmdk__list" id="cmdk-list" role="listbox">
          {results.map((r, i) => (
            <li key={r.href + r.label} id={`cmdk-${i}`} role="option" aria-selected={i === index} className={`cmdk__item${i === index ? ' is-active' : ''}`} onMouseMove={() => setIndex(i)} onClick={() => go(r)}>
              <span>{r.label}</span>
              <span className="cmdk__hint">{r.hint}</span>
            </li>
          ))}
        </ul>
        <p className="cmdk__foot">↑ ↓ to move · Enter to go · Esc to close</p>
      </div>
    </div>
  );
}
