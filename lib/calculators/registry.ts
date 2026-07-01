import type { LucideIcon } from 'lucide-react';
import {
  Home, PiggyBank, RefreshCw, Calendar, Scale, Building2,
  Landmark, TrendingUp, Calculator,
} from 'lucide-react';

export type CalcId =
  | 'payment'
  | 'affordability'
  | 'refinance'
  | 'amortization'
  | 'compare'
  | 'rent-vs-buy'
  | 'heloc'
  | 'down-payment'
  | 'rental'
  | 'dti'
  | 'closing';

export interface CalcMeta {
  id: CalcId;
  title: string;
  benefit: string;
  icon: LucideIcon;
  featured?: boolean;
  seoTitle: string;
  seoDescription: string;
}

export const CALCULATORS: CalcMeta[] = [
  {
    id: 'payment',
    title: 'Mortgage Payment (PITI)',
    benefit: 'Full PITI with taxes, PMI, charts, amortization & extra payments.',
    icon: Home,
    featured: true,
    seoTitle: 'Mortgage Payment Calculator with PMI & Charts',
    seoDescription: 'Calculate monthly PITI, total interest, payoff date, and export amortization schedules.',
  },
  {
    id: 'affordability',
    title: 'Home Affordability',
    benefit: 'Max home price from income, debts, and DTI guidelines.',
    icon: PiggyBank,
    seoTitle: 'Home Affordability Calculator',
    seoDescription: 'Find how much house you can afford using front-end and back-end DTI ratios.',
  },
  {
    id: 'refinance',
    title: 'Refinance Savings',
    benefit: 'Breakeven months and lifetime interest comparison.',
    icon: RefreshCw,
    seoTitle: 'Refinance Breakeven Calculator',
    seoDescription: 'Compare current vs new loan payments and find your refinance breakeven point.',
  },
  {
    id: 'amortization',
    title: 'Payoff Planner',
    benefit: 'Extra payments, lump sums, and interest saved.',
    icon: Calendar,
    seoTitle: 'Amortization & Payoff Planner',
    seoDescription: 'Model extra mortgage payments and see payoff acceleration with charts and CSV export.',
  },
  {
    id: 'compare',
    title: 'Loan Comparison',
    benefit: 'Compare 2–3 scenarios side by side.',
    icon: Scale,
    seoTitle: 'Mortgage Loan Comparison Tool',
    seoDescription: 'Side-by-side comparison of rates, terms, down payments, and total cost.',
  },
  {
    id: 'rent-vs-buy',
    title: 'Rent vs. Buy',
    benefit: 'Net worth projection and break-even year.',
    icon: Building2,
    seoTitle: 'Rent vs Buy Calculator',
    seoDescription: 'Compare renting vs buying over 5–30 years with appreciation and investment returns.',
  },
  {
    id: 'heloc',
    title: 'HELOC / Equity',
    benefit: 'Borrowing power and payment scenarios.',
    icon: Landmark,
    seoTitle: 'HELOC & Home Equity Calculator',
    seoDescription: 'Estimate HELOC borrowing power, interest-only vs amortizing payments.',
  },
  {
    id: 'down-payment',
    title: 'Down Payment Planner',
    benefit: 'Savings timeline with growth projections.',
    icon: PiggyBank,
    seoTitle: 'Down Payment Savings Planner',
    seoDescription: 'Project when you will reach your down payment goal with monthly contributions.',
  },
  {
    id: 'rental',
    title: 'Rental Cash Flow',
    benefit: 'Cap rate, cash-on-cash, and 5-year projection.',
    icon: TrendingUp,
    seoTitle: 'Rental Property Cash Flow Analyzer',
    seoDescription: 'Evaluate investment property cap rate, cash-on-cash return, and cash flow.',
  },
  {
    id: 'dti',
    title: 'DTI Analyzer',
    benefit: 'Front/back-end ratios with lender-ready guidance.',
    icon: Calculator,
    seoTitle: 'Debt-to-Income Ratio Analyzer',
    seoDescription: 'Calculate front-end and back-end DTI to assess mortgage readiness.',
  },
  {
    id: 'closing',
    title: 'Closing Costs',
    benefit: 'Estimate fees before you shop lenders.',
    icon: Calculator,
    seoTitle: 'Closing Costs Estimator',
    seoDescription: 'Estimate mortgage closing costs by state and loan amount.',
  },
];

export const CALC_DISCLAIMER =
  'These tools provide estimates for educational purposes only. Actual rates, fees, terms, and approvals vary by lender, credit profile, property, and market conditions. Always consult a licensed mortgage professional.';