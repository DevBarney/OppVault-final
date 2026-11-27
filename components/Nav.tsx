'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { CATEGORIES, type CategorySlug } from '../lib/categories';
import AccountLink, { AccountExtras, AppliedLink } from './account/AccountLink';
import AccountMenu from './account/AccountMenu';
import { joinPath } from '../lib/join';
import { ArrowIcon, CategoryIcon, SearchIcon } from './Icons';
import './nav-search.css';

// Desktop navigation: the seven kinds of opportunity live in the "Opportunities" menu, the rest are plain links.
const LINKS = [
  { href: '/blog', label: 'Blog' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/about', label: 'About' },
];

// The phone menu: the seven kinds of opportunity, each with a plain line and (when known) how many are open now.
const KINDS: { slug: CategorySlug; label: string; line: string }[] = [
  { slug: 'scholarships', label: 'Scholarships', line: 'Funding for study' },
  { slug: 'fellowships', label: 'Fellowships', line: 'Programmes and placements' },
  { slug: 'internships', label: 'Internships', line: 'Work experience and placements' },
  { slug: 'grants', label: 'Grants', line: 'Money for projects and ideas' },
  { slug: 'courses', label: 'Courses', line: 'Learn something new' },
  { slug: 'events', label: 'Events', line: 'Dates for your diary' },
  { slug: 'student-offers', label: 'Student Offers', line: 'Discounts and free tools' },
];
const MORE = [...LINKS, { href: '/support', label: 'Help & contact' }];

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Site header: the exact OppVault logo, section links, a "Join the list" button, a thin
 * reading-progress line, and a menu for phones. It lives in app/layout.tsx so every page has it.
 */
export default function Nav({ counts }: { counts?: Partial<Record<CategorySlug, number>> }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? '/';
  // On the home page the hero already has a search box, so the nav icon waits until that box has scrolled away.
  // It starts hidden on the home page, so the icon never flashes up beside the hero's own search box before scripts run.
  const [heroSearchSeen, setHeroSearchSeen] = useState(pathname === '/');
  // Desktop "Opportunities" menu
  const [menu, setMenu] = useState(false);
  const [menuLeft, setMenuLeft] = useState(0);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Scrolling: shrink the bar, fill the progress line, and mark the section you are reading.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 8);

      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Phone menu: close on Escape, on a tap outside the header, and when the screen gets wide.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 1180) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  // While the phone menu is open the page behind it stays still, so a swipe scrolls the menu and not the page.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add('nav-lock');
    return () => root.classList.remove('nav-lock');
  }, [open]);

  // "Join the list": glide to the sign-up form and put the cursor in it.
  // Every page has the sign-up band above the footer, so this works everywhere.
  function goToSignup(event: MouseEvent<HTMLAnchorElement>) {
    setOpen(false);
    const target = document.getElementById('subscribe');
    if (!target) return;
    event.preventDefault();
    const calm = reducedMotion();
    target.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' });
    const input = target.querySelector<HTMLInputElement>('input[type="email"]');
    window.setTimeout(() => input?.focus({ preventScroll: true }), calm ? 0 : 600);
  }

  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [pathname]);

  // Desktop menu: line it up under its button, close on Escape, on a click elsewhere, when focus leaves, and when the screen narrows.
  useEffect(() => {
    if (!menu) return;
    const place = () => {
      const btn = menuBtnRef.current;
      const wrap = btn?.closest('.nav__wrap');
      if (!btn || !wrap) return;
      const b = btn.getBoundingClientRect();
      const w = wrap.getBoundingClientRect();
      const width = Math.min(560, w.width - 24);
      setMenuLeft(Math.max(12, Math.min(b.left - w.left - 8, w.width - width - 12)));
    };
    place();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenu(false);
        menuBtnRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      const t = event.target as Node;
      if (!menuRef.current?.contains(t) && !menuBtnRef.current?.contains(t)) setMenu(false);
    };
    const onFocus = (event: FocusEvent) => {
      const t = event.target as Node;
      if (!menuRef.current?.contains(t) && !menuBtnRef.current?.contains(t)) setMenu(false);
    };
    const onResize = () => (window.innerWidth < 1180 ? setMenu(false) : place());
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('focusin', onFocus);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('focusin', onFocus);
      window.removeEventListener('resize', onResize);
    };
  }, [menu]);

  useEffect(() => {
    if (pathname !== '/') {
      setHeroSearchSeen(false);
      return;
    }
    const target = document.querySelector('.hsearch');
    if (!target || !('IntersectionObserver' in window)) {
      setHeroSearchSeen(false);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setHeroSearchSeen(entry.isIntersecting), { rootMargin: '-80px 0px 0px 0px' });
    io.observe(target);
    return () => io.disconnect();
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const onKind = KINDS.some((k) => isActive(`/${k.slug}`));

  const className = `nav${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header ref={headerRef} className={className}>
        <div className="nav__scrim" aria-hidden="true" onClick={() => setOpen(false)} />
        <div className="container nav__wrap">
          <div className="nav__inner">
          <Link className="nav__brand" href="/" aria-label="OppVault home">
            <Image
              className="nav__logo"
              src="/logo-horizontal.png"
              alt="OppVault"
              width={1459}
              height={427}
              sizes="160px"
              priority
            />
          </Link>

          <nav className="nav__links" aria-label="Primary">
            <ul>
              <li>
                <button
                  ref={menuBtnRef}
                  type="button"
                  className="nav__link nav__dd"
                  aria-expanded={menu}
                  aria-controls="opp-menu"
                  aria-current={onKind ? 'page' : undefined}
                  onClick={() => setMenu((v) => !v)}
                  onKeyDown={(e: { key: string; preventDefault: () => void }) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setMenu(true);
                      window.setTimeout(() => menuRef.current?.querySelector<HTMLElement>('a')?.focus(), 0);
                    }
                  }}
                >
                  <span>Opportunities</span>
                  <svg className="nav__dd-chev" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </li>
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link className="nav__link" href={link.href} aria-current={isActive(link.href) ? 'page' : undefined}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="nav__actions">
            <button type="button" className="nav__search" data-away={heroSearchSeen ? 'true' : undefined} aria-hidden={heroSearchSeen ? true : undefined} tabIndex={heroSearchSeen ? -1 : undefined} aria-label="Search OppVault" title="Search (press /)" onClick={() => window.dispatchEvent(new Event('oppvault:open-search'))}>
              <SearchIcon className="nav__search-icon" />
              <span className="nav__search-text" aria-hidden="true">Search</span>
              <kbd className="nav__kbd" aria-hidden="true">/</kbd>
            </button>
            <AccountLink />
            <AccountMenu />
            <a className="btn btn--primary btn--sm nav__cta" href="#subscribe" onClick={goToSignup}>
              <span>Get updates</span>
              <ArrowIcon className="btn__arrow" />
            </a>
            <button
              ref={toggleRef}
              type="button"
              className="nav__toggle"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((value) => !value)}
            >
              <span className="nav__bars" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
          <span className="nav__progress" aria-hidden="true">
            <span ref={barRef} />
          </span>
          </div>

        <div id="opp-menu" ref={menuRef} className="ddm" hidden={!menu} style={{ left: menuLeft }} role="group" aria-label="Kinds of opportunity">
          <ul className="ddm__list">
            {KINDS.map((k) => {
              const n = counts?.[k.slug];
              const icon = CATEGORIES.find((c) => c.slug === k.slug)?.icon;
              return (
                <li key={k.slug}>
                  <Link className="ddm__row" href={`/${k.slug}`} aria-current={isActive(`/${k.slug}`) ? 'page' : undefined} onClick={() => setMenu(false)}>
                    <span className="ddm__icon" aria-hidden="true">{icon ? <CategoryIcon name={icon} className="ddm__svg" /> : null}</span>
                    <span className="ddm__text">
                      <span className="ddm__name">{k.label}</span>
                      <span className="ddm__line">{k.line}</span>
                    </span>
                    {typeof n === 'number' && n > 0 ? <span className="ddm__count">{n} {k.slug === 'events' ? 'upcoming' : 'open'}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="ddm__search"
            onClick={() => {
              setMenu(false);
              window.dispatchEvent(new Event('oppvault:open-search'));
            }}
          >
            <SearchIcon className="ddm__search-icon" />
            <span>Search every opportunity</span>
          </button>
        </div>

        <div id="mobile-menu" className="nav__menu">
          <div className="vm">
            <button
              type="button"
              className="vm__search"
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new Event('oppvault:open-search'));
              }}
            >
              <SearchIcon className="vm__search-icon" />
              <span>Search every opportunity</span>
            </button>

            <nav aria-label="Kinds of opportunity">
              <ul className="vm__tiles">
                {KINDS.map((k) => {
                  const n = counts?.[k.slug];
                  const icon = CATEGORIES.find((c) => c.slug === k.slug)?.icon;
                  return (
                    <li key={k.slug} className="vm__tilewrap">
                      <Link className="vm__tile" href={`/${k.slug}`} aria-current={isActive(`/${k.slug}`) ? 'page' : undefined} onClick={() => setOpen(false)}>
                        <span className="vm__ticon" aria-hidden="true">{icon ? <CategoryIcon name={icon} className="vm__tsvg" /> : null}</span>
                        <span className="vm__tname">{k.label}</span>
                        {typeof n === 'number' && n > 0 ? <span className="vm__tcount">{n} {k.slug === 'events' ? 'upcoming' : 'open'}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="vm__you">
              <p className="vm__head">Your space</p>
              <div className="vm__chips">
                <AccountLink variant="text" onNavigate={() => setOpen(false)} />
                <AppliedLink variant="text" onNavigate={() => setOpen(false)} />
                <AccountExtras onNavigate={() => setOpen(false)} />
              </div>
            </div>

            <nav className="vm__more" aria-label="More">
              {MORE.map((m) => (
                <Link key={m.href} className="vm__minor" href={m.href} aria-current={isActive(m.href) ? 'page' : undefined} onClick={() => setOpen(false)}>
                  {m.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="vm__dock">
            <a className="btn btn--primary nav__mcta" href="#subscribe" onClick={goToSignup}>
              <span>Get updates</span>
              <ArrowIcon className="btn__arrow" />
            </a>
            <a className="vm__join" href={joinPath('menu')} onClick={() => setOpen(false)}>
              <svg className="vm__join-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 19L4 20Z" />
                <path d="M9 9.2c.2 2.6 2.2 4.6 5 5.5l1.3-1.3-1.9-1-.8.7c-.8-.4-1.5-1.1-1.9-1.9l.7-.8-1-1.9L9 9.2Z" />
              </svg>
              <span>Join the group</span>
            </a>
          </div>
        </div>
        </div>
      </header>
    </>
  );
}
