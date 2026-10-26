// Turns the plain text written on the admin page into a branded, email-safe HTML message.
// Supported: blank-line paragraphs, "## Heading", "- bullets", [text](https://link), **bold**,
// and a button on its own line: [button: Label | https://link]. Everything is escaped first.

import { SITE_URL, TAGLINE } from '../config';

const NAVY = '#04106b';
const ROYAL = '#0332b3';
const INK = '#1e2350';
const MUTED = '#4f577f';

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function safeUrl(u: string): string | null {
  try {
    const x = new URL(u.trim());
    return x.protocol === 'https:' ? x.toString() : null;
  } catch {
    return null;
  }
}

function inline(raw: string): string {
  let s = esc(raw);
  s = s.replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, (_m, text: string, url: string) => {
    const ok = safeUrl(url.replace(/&amp;/g, '&'));
    return ok ? `<a href="${esc(ok)}" style="color:${ROYAL};text-decoration:underline;">${text}</a>` : text;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return s;
}

const P = `font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:${INK};margin-top:0;margin-bottom:16px;`;

export function renderEmail(body: string, previewText: string): { html: string; text: string } {
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let para: string[] = [];
  let bullets: string[] = [];

  const flushPara = () => {
    if (para.length) out.push(`<p style="${P}">${para.map(inline).join('<br>')}</p>`);
    para = [];
  };
  const flushBullets = () => {
    if (bullets.length) {
      out.push(
        `<ul style="${P}padding-left:20px;">${bullets.map((b) => `<li style="margin-bottom:6px;">${inline(b)}</li>`).join('')}</ul>`,
      );
    }
    bullets = [];
  };

  for (const line of lines) {
    const t = line.trim();
    const button = t.match(/^\[button:\s*(.+?)\s*\|\s*(https:\/\/\S+?)\s*\]$/i);
    if (t === '') {
      flushPara();
      flushBullets();
    } else if (button && safeUrl(button[2])) {
      flushPara();
      flushBullets();
      out.push(
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;"><tr><td bgcolor="${ROYAL}" style="border-radius:999px;background-color:${ROYAL};"><a href="${esc(safeUrl(button[2]) as string)}" style="display:inline-block;padding-top:12px;padding-bottom:12px;padding-left:24px;padding-right:24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">${esc(button[1])}</a></td></tr></table>`,
      );
    } else if (t.startsWith('## ')) {
      flushPara();
      flushBullets();
      out.push(`<h2 style="font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:28px;color:${NAVY};margin-top:8px;margin-bottom:10px;">${inline(t.slice(3))}</h2>`);
    } else if (t.startsWith('- ')) {
      flushPara();
      bullets.push(t.slice(2));
    } else {
      flushBullets();
      para.push(t);
    }
  }
  flushPara();
  flushBullets();

  const preview = previewText ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#ffffff;">${esc(previewText)}</div>` : '';
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>OppVault</title></head>
<body style="margin:0;padding:0;background-color:#f5f9ff;">${preview}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f9ff" style="background-color:#f5f9ff;"><tr><td align="center" style="padding-top:24px;padding-bottom:24px;padding-left:12px;padding-right:12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:14px;">
<tr><td bgcolor="${NAVY}" style="background-color:${NAVY};border-top-left-radius:14px;border-top-right-radius:14px;padding-top:24px;padding-bottom:24px;padding-left:28px;padding-right:28px;">
<a href="${esc(SITE_URL)}" style="font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:30px;font-weight:bold;color:#ffffff;text-decoration:none;">OppVault</a>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#9fdcfb;">${esc(TAGLINE)}</div></td></tr>
<tr><td style="padding-top:28px;padding-bottom:12px;padding-left:28px;padding-right:28px;">${out.join('\n')}</td></tr>
<tr><td style="padding-top:8px;padding-bottom:28px;padding-left:28px;padding-right:28px;border-top:1px solid #dce6f7;">
<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:${MUTED};margin-top:16px;margin-bottom:0;">You are receiving this because you signed up at <a href="${esc(SITE_URL)}" style="color:${MUTED};">oppvault.app</a>. Always check the official source before you apply. Questions? Reply to this email or write to hello@oppvault.app.<br><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a></p>
</td></tr></table></td></tr></table></body></html>`;

  const text = [
    body
      .replace(/\[button:\s*(.+?)\s*\|\s*(https:\/\/\S+?)\s*\]/gi, '$1: $2')
      .replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '$1 ($2)')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/^## /gm, '')
      .trim(),
    '',
    '--',
    'You are receiving this because you signed up at oppvault.app. Questions? Write to hello@oppvault.app.',
    'Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}',
  ].join('\n');

  return { html, text };
}
