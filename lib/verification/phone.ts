/**
 * Lender Trust Hub Phase 0 — contact phone integrity.
 * Prefer missing data over placeholder / invented numbers.
 */

/**
 * True when a phone must not be displayed (empty, 555 exchange, fiction ranges, etc.).
 * Broader than NANP fiction alone: catalog `555-xxxx` values are treated as placeholders.
 */
export function isLenderPlaceholderPhone(value: string | null | undefined): boolean {
  if (!value?.trim()) return true;
  const digits = value.replace(/\D/g, '');
  let d = digits;
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  if (d.length !== 10) return true;

  // Any 555 exchange is treated as non-displayable for directory integrity
  if (d.slice(3, 6) === '555') return true;
  // Classic fiction range and form fillers
  if (/^5550[0-1]\d{2}$/.test(d)) return true;
  if (/^555555\d{4}$/.test(d)) return true;
  if (/^(\d)\1{9}$/.test(d)) return true;
  if (d === '1234567890' || d === '0123456789' || d === '0000000000') return true;
  // Invalid NPA/NXX: area code and exchange cannot start with 0 or 1
  if (d[0] === '0' || d[0] === '1') return true;
  if (d[3] === '0' || d[3] === '1') return true;

  return false;
}

/** Return a displayable phone string, or undefined when invalid/placeholder. */
export function cleanDisplayPhone(value: string | null | undefined): string | undefined {
  if (isLenderPlaceholderPhone(value)) return undefined;
  return value!.trim();
}
