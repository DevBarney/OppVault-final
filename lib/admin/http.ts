export function json(body: Record<string, unknown>, status = 200, extra: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store', ...extra } });
}
