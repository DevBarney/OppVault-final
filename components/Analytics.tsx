'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ANALYTICS_AVAILABLE, loadAnalytics, stopAnalytics, trackPageView } from '../lib/analytics';
import { CONSENT_CHANGED_EVENT, hasConsent } from '../lib/consent';

/** Starts Google Analytics only after the visitor has allowed it, and stops it if they take that back. */
export default function Analytics() {
  const pathname = usePathname() ?? '/';
  const [on, setOn] = useState(false);
  const last = useRef('');

  useEffect(() => {
    if (!ANALYTICS_AVAILABLE) return;
    const apply = () => {
      if (hasConsent('analytics')) {
        loadAnalytics();
        setOn(true);
      } else {
        stopAnalytics();
        setOn(false);
        last.current = '';
      }
    };
    apply();
    window.addEventListener(CONSENT_CHANGED_EVENT, apply);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, apply);
  }, []);

  useEffect(() => {
    if (!on || last.current === pathname) return;
    last.current = pathname;
    trackPageView(pathname);
  }, [on, pathname]);

  return null;
}
