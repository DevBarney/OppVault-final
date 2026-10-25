'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { ArrowIcon } from './Icons';

// Main navigation. Each link is a page of the platform.
const LINKS = [
  { href: '/scholarships', label: 'Scholarships' },
  { href: '/fellowships', label: 'Fellowships' },
  { href: '/grants', label: 'Grants' },
  { href: '/courses', label: 'Courses' },
  { href: '/events', label: 'Events' },
  { href: '/student-offers', label: 'Student Offers' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
];

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Site header: the exact OppVault logo, section links, a "Join the list" button, a thin
 * reading-progress line, and a menu for phones. It lives in app/layout.tsx so every page has it.
 */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? '/';
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
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const className = `nav${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header ref={headerRef} className={className}>
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

        <div id="mobile-menu" className="nav__menu">
          <nav aria-label="Mobile">
            <ul>
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    className="nav__mlink"
                    href={link.href}
                    aria-current={isActive(link.href) ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <span>{link.label}</span>
                    <ArrowIcon className="nav__marrow" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <a className="btn btn--primary nav__mcta" href="#subscribe" onClick={goToSignup}>
            <span>Get updates</span>
            <ArrowIcon className="btn__arrow" />
          </a>
        </div>
        </div>
      </header>
    </>
  );
}
