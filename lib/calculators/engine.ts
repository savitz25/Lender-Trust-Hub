/** Shared mortgage calculation engine — memoization-friendly pure functions */

export const STATE_TAX_RATES: Record<string, number> = {
  FL: 0.89, NJ: 2.13, CA: 0.75, TX: 1.6, NY: 1.62, National: 1.1,
};

export const CREDIT_RATE_MAP: Record<string, number> = {
  excellent: 6.25, good: 6.75, fair: 7.5, poor: 8.5,
  Excellent: 6.25, Good: 6.75, Fair: 7.5, Rebuilding: 8.5,
};

export interface AmortRow {
  month: number;
  year: number;
  date: Date;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
  cumulativeInterest: number;
}

export interface AmortResult {
  schedule: AmortRow[];
  basePay: number;
  totalInterest: number;
  totalPrincipal: number;
  payoffDate: Date;
  payoffMonths: number;
  totalCost: number;
}

export function monthlyPayment(principal: number, annualRate: number, years: number): number {
  const p = Math.max(0, principal);
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (p === 0) return 0;
  if (r === 0) return p / n;
  return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function calcPMI(loanAmount: number, homePrice: number, manualPMI?: number | null): number {
  if (manualPMI != null && manualPMI >= 0) return manualPMI;
  const ltv = homePrice > 0 ? (loanAmount / homePrice) * 100 : 100;
  if (ltv <= 80) return 0;
  return (loanAmount * 0.005) / 12;
}

export function buildAmortSchedule(opts: {
  principal: number;
  annualRate: number;
  years: number;
  extraMonthly?: number;
  lumpSum?: number;
  lumpMonth?: number;
  startDate?: Date;
}): AmortResult {
  const {
    principal, annualRate, years,
    extraMonthly = 0, lumpSum = 0, lumpMonth = 1,
    startDate = new Date(),
  } = opts;
  const r = annualRate / 100 / 12;
  const maxMonths = years * 12 + 360;
  const basePay = monthlyPayment(principal, annualRate, years);
  let balance = principal;
  const schedule: AmortRow[] = [];
  let totalInterest = 0;
  let totalPrincipal = 0;

  for (let m = 1; m <= maxMonths && balance > 0.005; m++) {
    const interest = balance * r;
    let extra = extraMonthly;
    if (m === lumpMonth && lumpSum > 0) extra += lumpSum;
    let principalPaid = basePay - interest + extra;
    if (principalPaid > balance) principalPaid = balance;
    balance -= principalPaid;
    totalInterest += interest;
    totalPrincipal += principalPaid;
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + m - 1);
    schedule.push({
      month: m, year: Math.ceil(m / 12), date: d,
      payment: interest + principalPaid, interest, principal: principalPaid,
      balance: Math.max(0, balance), cumulativeInterest: totalInterest,
    });
  }

  return {
    schedule, basePay, totalInterest, totalPrincipal,
    payoffDate: schedule.length ? schedule[schedule.length - 1].date : startDate,
    payoffMonths: schedule.length,
    totalCost: principal + totalInterest,
  };
}

export function yearlySummary(schedule: AmortRow[]) {
  const years: Record<number, { year: number; interest: number; principal: number; endBalance: number }> = {};
  schedule.forEach((row) => {
    if (!years[row.year]) years[row.year] = { year: row.year, interest: 0, principal: 0, endBalance: 0 };
    years[row.year].interest += row.interest;
    years[row.year].principal += row.principal;
    years[row.year].endBalance = row.balance;
  });
  return Object.values(years);
}

export function suggestedRate(creditKey: string): number {
  return CREDIT_RATE_MAP[creditKey] ?? 6.75;
}

export function exportCSV(rows: (string | number)[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}