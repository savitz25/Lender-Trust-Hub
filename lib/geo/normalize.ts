/** Normalize county names for comparison. */

export function normalizeCountyName(raw: string | null | undefined): string {
  return (raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+county$/i, '')
    .replace(/\s+parish$/i, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugifyCountyName(raw: string): string {
  return normalizeCountyName(raw).replace(/\s+/g, '-');
}

export function titleCaseSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export function countiesEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeCountyName(a);
  const nb = normalizeCountyName(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}
