import { buildIcs, type CalendarKind } from '../../../../../lib/calendar';
import { isCategorySlug } from '../../../../../lib/categories';
import { SITE_URL } from '../../../../../lib/config';
import { getOpportunity } from '../../../../../lib/data';
import { daysUntil } from '../../../../../lib/dates';

export const runtime = 'nodejs';

/** Download a calendar file for a listing's date, with reminders. */
export async function GET(_request: Request, ctx: { params: Promise<{ category: string; slug: string }> }): Promise<Response> {
  const { category, slug } = await ctx.params;
  if (!isCategorySlug(category) || !/^[a-z0-9-]{1,120}$/.test(slug)) return new Response('Not found', { status: 404 });
  const item = await getOpportunity(category, slug);
  const days = item ? daysUntil(item.deadline) : null;
  if (!item || !item.deadline || days === null || days < 0) return new Response('This listing has no upcoming date.', { status: 404 });

  const kind: CalendarKind = category === 'events' ? 'event' : category === 'student-offers' ? 'offer' : 'deadline';
  const ics = buildIcs({
    uid: `${category}-${slug}`,
    title: item.title,
    date: item.deadline,
    kind,
    pageUrl: `${SITE_URL}/${category}/${slug}`,
    officialUrl: item.source_url,
    daysLeft: days,
  });
  return new Response(ics, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="oppvault-${slug.slice(0, 60)}.ics"`,
      'cache-control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
