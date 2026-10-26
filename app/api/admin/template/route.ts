import { isAdminRequest } from '../../../../lib/admin/auth';
import { csvCell } from '../../../../lib/admin/csv';
import { isKind } from '../../../../lib/admin/kinds';
import { templateFor } from '../../../../lib/admin/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  if (!isAdminRequest(request)) return new Response('Not allowed', { status: 401 });
  const kind = new URL(request.url).searchParams.get('kind');
  if (!isKind(kind)) return new Response('Unknown type', { status: 400 });
  const { headers, example } = templateFor(kind);
  const csv = `﻿${headers.join(',')}\r\n${example.map(csvCell).join(',')}\r\n`;
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="oppvault-${kind}-template.csv"`,
      'cache-control': 'no-store',
    },
  });
}
