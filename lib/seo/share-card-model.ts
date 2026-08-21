export type LenderShareCardModel = {
  kind: 'fallback' | 'entity';
  eyebrow: string;
  title: string;
  subtitle?: string;
  fact?: string;
};

export function truncateShareText(value: string, maxChars: number): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

export function lenderEntityShareModel(input: {
  name: string;
  city?: string;
  state?: string;
  nmlsId?: string;
  type?: string;
}): LenderShareCardModel {
  const location = [input.city, input.state].filter(Boolean).join(', ');
  const nmls = (input.nmlsId || '').replace(/\D/g, '');
  const type = input.type?.trim();
  const bits = [
    nmls ? `NMLS ${nmls}` : null,
    type ? `${type} research` : 'Licensing · products · public research',
  ].filter(Boolean);
  return {
    kind: 'entity',
    eyebrow: 'LENDER RESEARCH',
    title: truncateShareText(input.name || '', 48) || 'Lender profile',
    subtitle: location ? truncateShareText(location, 52) : undefined,
    fact: truncateShareText(bits.join(' · '), 72),
  };
}
