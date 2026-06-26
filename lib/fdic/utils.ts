import type { FDICBank, RegulatorKey } from './types';

export function getRegulatorKey(regulator: string): RegulatorKey {
  const r = regulator.toLowerCase();
  if (r.includes('comptroller') || r.includes('occ')) return 'OCC';
  if (r.includes('federal reserve')) return 'FED';
  return 'FDIC';
}

export function getRegulatorLabel(key: RegulatorKey): string {
  switch (key) {
    case 'OCC':
      return 'OCC';
    case 'FED':
      return 'Federal Reserve';
    case 'FDIC':
      return 'FDIC';
  }
}

export function getRegulatorColors(key: RegulatorKey): { bg: string; text: string } {
  switch (key) {
    case 'OCC':
      return { bg: 'bg-blue-100', text: 'text-blue-800' };
    case 'FED':
      return { bg: 'bg-violet-100', text: 'text-violet-800' };
    case 'FDIC':
      return { bg: 'bg-teal-100', text: 'text-teal-800' };
  }
}

export function fdicBankFindUrl(cert: string): string {
  return `https://banks.data.fdic.gov/bankfind-suite/bankfind?cert=${cert}`;
}

export function parseInsuredDate(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [m, d, y] = parts.map(Number);
  if (!m || !d || !y) return null;
  return new Date(y, m - 1, d);
}

export function formatInsuredDate(dateStr: string): string {
  const d = parseInsuredDate(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function isHeadquarteredInState(address: string, stateAbbr: string): boolean {
  return new RegExp(`, ${stateAbbr}(?:\\s|$)`).test(address);
}

export function computeStateStats(banks: FDICBank[], stateAbbr: string) {
  const headquartered = banks.filter((b) =>
    isHeadquarteredInState(b.headquarters_address, stateAbbr)
  );
  const dated = banks
    .map((b) => ({ bank: b, date: parseInsuredDate(b.fdic_insured_since) }))
    .filter((x): x is { bank: FDICBank; date: Date } => x.date !== null);
  dated.sort((a, b) => a.date.getTime() - b.date.getTime());
  const oldest = dated[0]?.bank;

  return {
    total: banks.length,
    headquartered: headquartered.length,
    oldest,
  };
}

export function banksToCSV(banks: FDICBank[]): string {
  const headers = [
    'name',
    'fdic_insured_since',
    'fdic_cert',
    'primary_regulator',
    'headquarters_address',
    'website',
  ];
  const rows = banks.map((b) =>
    headers
      .map((h) => {
        const val = b[h as keyof FDICBank] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function downloadCSV(banks: FDICBank[], filename: string) {
  const blob = new Blob([banksToCSV(banks)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}