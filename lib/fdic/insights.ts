import type { FDICBank } from './types';
import type { StateMeta } from './types';
import type {
  DirectoryInsightCard,
  RegulatorBreakdownRow,
  UserScenario,
} from '@/lib/directory/types';
import {
  computeExtendedStateStats,
  getRegulatorKey,
  getRegulatorLabel,
  isHeadquarteredInState,
  parseInsuredDate,
} from './utils';

/** State-specific E-E-A-T content generated from real FDIC data */
export function generateStateInsights(banks: FDICBank[], stateMeta: StateMeta) {
  const stats = computeExtendedStateStats(banks, stateMeta.code);
  const hqBanks = banks.filter((b) =>
    isHeadquarteredInState(b.headquarters_address, stateMeta.code)
  );

  const sortedByAge = [...banks].sort((a, b) => {
    const da = parseInsuredDate(a.fdic_insured_since)?.getTime() ?? Infinity;
    const db = parseInsuredDate(b.fdic_insured_since)?.getTime() ?? Infinity;
    return da - db;
  });

  const occBanks = banks.filter((b) => getRegulatorKey(b.primary_regulator) === 'OCC');
  const recentBanks = banks.filter((b) => {
    const y = parseInsuredDate(b.fdic_insured_since)?.getFullYear();
    return y && y >= 2010;
  });

  const bestFor: DirectoryInsightCard[] = [
    {
      title: `Best for ${stateMeta.fullName} residents`,
      description: `Banks headquartered in ${stateMeta.fullName} often understand local markets, branch networks, and community lending needs.`,
      bankNames: hqBanks.slice(0, 4).map((b) => b.name),
      filterHint: 'Use the "HQ in ' + stateMeta.code + '" filter',
      icon: 'home',
    },
    {
      title: 'Best for long-term stability',
      description:
        'Institutions with decades of continuous FDIC insurance demonstrate resilience through multiple economic cycles.',
      bankNames: sortedByAge.slice(0, 4).map((b) => b.name),
      filterHint: 'Sort by "Oldest First"',
      icon: 'shield',
    },
    {
      title: 'National bank charters (OCC)',
      description:
        'OCC-regulated national banks often offer coast-to-coast digital banking and standardized product lines.',
      bankNames: occBanks.slice(0, 4).map((b) => b.name),
      filterHint: 'Filter by OCC regulator',
      icon: 'building',
    },
    {
      title: 'Newer market entrants',
      description:
        'Recently FDIC-insured institutions may offer competitive digital features and modern mobile experiences.',
      bankNames: recentBanks.slice(0, 4).map((b) => b.name),
      filterHint: 'Filter "After 2010"',
      icon: 'trending',
    },
  ];

  const scenarios: UserScenario[] = [
    {
      persona: `${stateMeta.fullName} homebuyer`,
      headline: `Recommended for ${stateMeta.fullName} homeowners`,
      recommendation: `Start with ${stats.headquartered} banks headquartered in ${stateMeta.fullName} for local branch access, then compare mortgage rates using our free calculators before choosing where to bank.`,
      ctaLabel: 'Mortgage Calculators',
      ctaHref: '/calculators',
    },
    {
      persona: 'First-time depositor',
      headline: 'Protecting your deposits',
      recommendation:
        'Every bank in this directory is FDIC-insured. Verify any institution using the certificate link on each card — never rely on logos alone.',
      ctaLabel: 'How FDIC insurance works',
      ctaHref: '#fdic-faq-heading',
    },
    {
      persona: 'Small business owner',
      headline: 'Business banking in ' + stateMeta.fullName,
      recommendation: `Compare OCC national banks for treasury services against ${stats.headquartered} locally headquartered institutions that may offer relationship-based business lending.`,
      ctaLabel: 'Compare banks',
      ctaHref: '#directory',
    },
  ];

  const regulatorBreakdown: RegulatorBreakdownRow[] = (
    Object.entries(stats.regulatorCounts) as [keyof typeof stats.regulatorCounts, number][]
  )
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({
      regulator: getRegulatorLabel(key),
      count,
      percentage: Math.round((count / stats.total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  return { bestFor, scenarios, regulatorBreakdown, stats };
}