import type { LenderHomeIntel } from '@/lib/home-intel/types';
import { parseLenderAsk } from './parse';
import type { AskExecution, AskInterpretationLine, LenderResearchQuery } from './types';

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

function interpretation(query: LenderResearchQuery): AskInterpretationLine[] {
  const lines: AskInterpretationLine[] = [{ label: 'Mode', value: query.mode.replaceAll('_', ' ') }];
  if (query.geography) {
    lines.push({
      label: 'Geography',
      value: [query.geography.state, query.geography.county].filter(Boolean).join(' · ') || query.geography.grain,
    });
    lines.push({ label: 'Geography meaning', value: 'Mortgage property / census location (HMDA), not lender location' });
  }
  if (query.loanPurpose?.length) lines.push({ label: 'Mortgage purpose', value: query.loanPurpose.join(', ') });
  if (query.loanType?.length) lines.push({ label: 'Loan type', value: query.loanType.join(', ') });
  if (query.actionTaken?.length) lines.push({ label: 'HMDA action family', value: query.actionTaken.join(', ') });
  if (query.requestedMetric) lines.push({ label: 'Metric', value: query.requestedMetric === 'most' ? 'Highest raw count (not “best”)' : query.requestedMetric });
  lines.push({ label: 'Entity grain', value: 'Institution / research snapshot — not MLO or branch' });
  return lines;
}

export function executeLenderAsk(raw: string, intel: LenderHomeIntel): AskExecution {
  const query = parseLenderAsk(raw);
  const interpretationLines = interpretation(query);
  const geographyWarning =
    query.geography?.note ??
    'HMDA geography is property/census location, not headquarters, branch network, or service territory.';

  if (query.mode === 'fail_closed') {
    const href =
      query.failClosedKind === 'county-snapshot' || query.geography?.state === 'FL' ? '/florida' : query.failClosedKind === 'entity-volume' ? '/lender' : undefined;
    return {
      query,
      interpretation: interpretationLines,
      geographyWarning,
      headline: 'This question is fail-closed',
      body: query.failReason ?? 'Unsupported.',
      href,
      hrefLabel: href === '/florida' ? 'Open Florida intelligence' : href === '/lender' ? 'Research a published lender' : undefined,
    };
  }

  if (query.mode === 'definition') {
    return {
      query,
      interpretation: interpretationLines,
      geographyWarning,
      headline: 'What “originated” means in HMDA',
      body: 'On this hub, originations are HMDA action_taken = originated loans in the 2025 county-grain snapshot. That is not a closed loan from your Loan Estimate, not today’s rate, and not a recommendation.',
    };
  }

  if (query.mode === 'evidence') {
    const cfpb = intel.stateOfRecord.find((m) => m.id === 'cfpb-mortgage') ?? intel.stateOfRecord[intel.stateOfRecord.length - 1];
    return {
      query,
      interpretation: interpretationLines,
      geographyWarning,
      headline: 'Indexed CFPB mortgage complaint records',
      body: 'A complaint is a consumer-submitted observation, not a finding of wrongdoing. Attachment to a canonical institution is incomplete. Raw complaint count does not account for lender size or mortgage volume.',
      facts: cfpb
        ? [
            { label: 'Mortgage observations in snapshot', value: cfpb.display },
            ...cfpb.components.map((c) => ({ label: c.label, value: c.value })),
          ]
        : [],
      href: '/lender',
      hrefLabel: 'Open published research profiles',
    };
  }

  const fl = intel.geography.find((g) => g.state === 'FL');
  const usApps = intel.geography.reduce((s, g) => s + g.applications, 0);

  if (query.mode === 'comparison' && fl) {
    return {
      query,
      interpretation: interpretationLines,
      geographyWarning,
      headline: 'Florida vs U.S. reported HMDA 2025 county-grain activity',
      body: 'Same vintage and county grain. This is not which market is better. Volume reflects reporting and housing activity, not lender quality.',
      facts: [
        { label: 'Florida applications (property geography)', value: fmt(fl.applications) },
        { label: 'Florida originations', value: fmt(fl.originations) },
        { label: 'Florida denials', value: fmt(fl.denials) },
        { label: 'U.S. county-grain applications (sum of jurisdictions)', value: fmt(usApps) },
      ],
      href: '/florida',
      hrefLabel: 'Florida mortgage intelligence',
    };
  }

  if (query.mode === 'count' && query.geography?.state === 'FL' && fl) {
    const action = query.actionTaken?.[0] ?? 'application';
    const value = action === 'origination' ? fl.originations : action === 'denial' ? fl.denials : fl.applications;
    return {
      query,
      interpretation: interpretationLines,
      geographyWarning,
      headline: `Reported HMDA 2025 ${action}s for properties in Florida`,
      body: 'County-grain observations aggregated to Florida. Not lenders headquartered in Florida and not a service-territory map.',
      facts: [{ label: `Florida ${action}s`, value: fmt(value) }],
      href: '/florida',
      hrefLabel: 'Florida mortgage intelligence',
    };
  }

  const apps = intel.stateOfRecord.find((m) => m.id === 'hmda-apps');
  const orig = intel.stateOfRecord.find((m) => m.id === 'hmda-orig');
  const action = query.actionTaken?.[0] ?? 'application';
  const metric = action === 'origination' ? orig : apps;
  return {
    query,
    interpretation: interpretationLines,
    geographyWarning,
    headline: 'Current HMDA research universe (county grain, 2025 vintage)',
    body: 'National snapshot of reported activity. Originations divided by applications is not an approval rate.',
    facts: metric
      ? [
          { label: metric.label, value: metric.display },
          { label: 'Grain', value: metric.grain },
          { label: 'Official as-of', value: metric.officialAsOf },
        ]
      : [],
  };
}

export function askExamplePrompts(): string[] {
  return [
    'How many mortgage applications are in the current research universe?',
    'How many applications are for properties in Florida?',
    'Compare Florida and U.S. mortgage activity',
    'What does originated mean in HMDA?',
    'Show indexed CFPB mortgage complaint coverage',
  ];
}
