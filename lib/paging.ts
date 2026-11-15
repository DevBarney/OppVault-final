/** How many listings a page shows. Visitors can pick a bigger page so they press "Next" less. */
export const PAGE_SIZES = [24, 48, 96] as const;
export const DEFAULT_PAGE_SIZE = 24;

export function pageSize(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '', 10);
  return (PAGE_SIZES as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
}

/** The value to keep in the address: nothing for the default size, so ordinary links stay short. */
export function pageSizeParam(size: number): string | undefined {
  return size === DEFAULT_PAGE_SIZE ? undefined : String(size);
}
