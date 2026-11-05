'use client';

import { OPEN_COOKIES_EVENT } from '../lib/consent';

/** Footer link that reopens the cookie choices at any time. */
export default function CookieSettingsLink() {
  return (
    <button type="button" className="footer__linkbtn" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIES_EVENT))}>
      Cookie settings
    </button>
  );
}
