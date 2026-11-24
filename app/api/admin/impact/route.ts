import { sessionFromRequest } from '../../../../lib/admin/auth';
import { json } from '../../../../lib/admin/http';
import { csvCell, getExtra, getImpact, getSubscribers, rangeDays } from '../../../../lib/admin/impact';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The impact numbers as a spreadsheet file (owner only), for reports and funding applications. */
export async function GET(request: Request): Promise<Response> {
  const session = sessionFromRequest(request);
  if (!session || session.role !== 'owner') return json({ ok: false, error: 'Please sign in again.' }, 401);
  const days = rangeDays(new URL(request.url).searchParams.get('days') ?? undefined);
  const [d, subs, extra] = await Promise.all([getImpact(days), getSubscribers(), getExtra(days)]);
  if (!d) return json({ ok: false, error: 'The numbers could not be loaded.' }, 503);

  const rows: (string | number)[][] = [
    ['OppVault impact report'],
    ['Period', `Last ${d.days} days`, 'Generated', d.generated_at.slice(0, 10)],
    [],
    ['Measure', 'All time', `Last ${d.days} days`, 'Previous period'],
    ['Accounts created', d.accounts.total, d.accounts.period, d.accounts.previous],
    ['Listings saved', d.saves.total, d.saves.period, d.saves.previous],
    ['Applications tracked (I applied)', d.applied.total, d.applied.period, d.applied.previous],
    ['Official site clicks', d.clicks.total, d.clicks.period, d.clicks.previous],
    ['WhatsApp group link opens', d.joins.total, d.joins.period, ''],
    ...(extra ? [['People sent to an official page (person-days, no account needed)', extra.people.total, extra.people.period, extra.people.previous]] : []),
    ['People who saved a listing', d.saves.people, '', ''],
    ['People who tracked an application', d.applied.people, '', ''],
    ['Published listings', d.listings.published, '', ''],
    ['Email subscribers (active)', subs ? subs.active : 'not available', '', ''],
    [],
    ['Official site clicks by category', `Last ${d.days} days`],
    ...d.clicks_by_category.map((c) => [c.category, c.n]),
    [],
    ['Applications tracked by category', `Last ${d.days} days`],
    ...d.applied_by_category.map((c) => [c.category, c.n]),
    [],
    ['Most clicked listings', 'Category', 'Clicks'],
    ...d.top_clicked.map((t) => [t.title, t.category, t.n]),
    [],
    ['Most applied-to listings', 'Category', 'Applications'],
    ...d.top_applied.map((t) => [t.title, t.category, t.n]),
    [],
    ...(extra ? [['Month', 'Apply clicks', 'People', 'WhatsApp opens', 'Accounts', 'Saves', 'Applications'], ...extra.monthly.map((m) => [m.month, m.clicks, m.people, m.joins, m.accounts, m.saves, m.applied]), []] : []),
    ['Week starting', 'Accounts', 'Saves', 'Applications', 'Official site clicks', 'WhatsApp opens'],
    ...d.weekly.map((w) => [w.week, w.accounts, w.saves, w.applied, w.clicks, w.joins]),
  ];
  const body = rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
  return new Response(`﻿${body}`, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="oppvault-impact-${new Date().toISOString().slice(0, 10)}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
