import type { LenderHomeIntel } from '@/lib/home-intel/types';
import { parseLenderAsk } from './parse';
import { ASK_GEO_NOTE, type AskExecution, type AskInterpretationLine, type LenderResearchQuery } from './types';

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

export function interpretationLines(query: LenderResearchQuery): AskInterpretationLine[] {
  const lines: AskInterpretationLine[] = [{ label: 'Research type', value: query.mode.replaceAll('_', ' ') }];
  if (query.coverageState) lines.push({ label: 'Coverage', value: query.coverageState });
  if (query.identifier) lines.push({ label: 'Identifier', value: `${query.identifier.type === 'LEI' ? 'LEI' : 'NMLS institution ID'} ${query.identifier.value}` });
  if (query.identityQuery && !query.identifier) lines.push({ label: 'Institution', value: query.identityQuery });
  if (query.geography) {
    lines.push({
      label: 'Geography',
      value: [query.geography.state, query.geography.county, query.geography.compareCounty].filter(Boolean).join(' · ') || query.geography.grain,
    });
    lines.push({ label: 'Geography meaning', value: 'Mortgage property / census location (HMDA), not lender location' });
  }
  if (query.loanPurpose?.length) lines.push({ label: 'Mortgage purpose', value: query.loanPurpose.join(', ') });
  if (query.loanType?.length) lines.push({ label: 'Loan type', value: query.loanType.join(', ') });
  if (query.actionTaken?.length) lines.push({ label: 'HMDA action family', value: query.actionTaken.join(', ') });
  if (query.requestedMetric) {
    lines.push({
      label: 'Metric',
      value: query.requestedMetric === 'most' ? 'Highest raw count (not “best”)' : query.requestedMetric,
    });
  }
  if (query.evidenceFamilies?.includes('cfpb')) lines.push({ label: 'Evidence family', value: 'CFPB mortgage complaints (confirmed bridges only)' });
  lines.push({
    label: 'Entity grain',
    value: query.mode === 'entity' ? 'HMDA LEI, bridged to a public profile only when identity confirms' : 'Institution / research snapshot — not MLO or branch',
  });
  return lines;
}

export function executeLenderAsk(raw: string, intel: LenderHomeIntel): AskExecution {
  const query = parseLenderAsk(raw);
  const interpretation = interpretationLines(query);
  const geographyWarning = query.geography?.note ?? ASK_GEO_NOTE;

  if (query.mode === 'fail_closed') {
    const href =
      query.failClosedKind === 'county-snapshot' || query.geography?.state === 'FL' ? '/florida' : query.failClosedKind === 'entity-volume' ? '/lender' : undefined;
    return {
      query,
      interpretation,
      geographyWarning,
      headline: 'This question is fail-closed',
      body: query.failReason ?? 'Unsupported.',
      href,
      hrefLabel: href === '/florida' ? 'Open Florida intelligence' : href === '/lender' ? 'Research a published lender' : undefined,
      failClosed: true,
    };
  }

  if (query.mode === 'definition') {
    const definitions: Record<string, { title: string; body: string }> = {
      nmls: { title: 'What an NMLS institution ID means', body: 'An NMLS institution ID identifies a licensed or registered company in the Nationwide Multistate Licensing System. Institution, branch, and person/MLO IDs are separate identity grains; the number is not a recommendation.' },
      lei: { title: 'What an LEI means', body: 'A Legal Entity Identifier identifies a legal entity in financial reporting. LenderTrustHub uses confirmed LEI bridges for HMDA reporting identity; an LEI is not an NMLS ID or an additional institution.' },
      hmda: { title: 'What HMDA means here', body: 'HMDA records reported mortgage applications and outcomes tied to property/census geography. The observations do not establish lender headquarters, service territory, future approval odds, price, or quality.' },
      institution_types: { title: 'Bank, mortgage company, and broker', body: 'Depository, nonbank mortgage company, and mortgage broker are different institutional roles. A public institution profile does not represent an MLO person or branch, and role is not a quality signal.' },
      application: { title: 'What an application means in HMDA', body: 'An application is an HMDA-reported application observation. It is distinct from an origination and a denial.' },
      denial: { title: 'What a denial means in HMDA', body: 'A denial is an HMDA action category. It is not a finding of wrongdoing and does not by itself establish a comparable lender approval rate.' },
      origination: { title: 'What “originated” means in HMDA', body: 'Originations are HMDA originated-loan observations in the 2025 reporting vintage. They are not today’s rate, a recommendation, or a prediction for a future applicant.' },
      cfpb: { title: 'What a CFPB complaint observation means', body: 'A complaint is a consumer-submitted observation. It is not a finding of wrongdoing, and institution attribution requires a confirmed company bridge.' },
    };
    const selected = definitions[query.definitionId ?? 'origination'] ?? definitions.origination!;
    return {
      query,
      interpretation,
      geographyWarning,
      headline: selected.title,
      body: selected.body,
    };
  }

  if (query.mode === 'entity' || query.mode === 'aggregate' || (query.mode === 'count' && query.geography?.grain === 'county') || (query.mode === 'comparison' && query.geography?.grain === 'county')) {
    const encoded = encodeURIComponent(raw.trim());
    return {
      query,
      interpretation,
      geographyWarning,
      headline: 'This question runs against HMDA observations',
      body: 'Institution-level and county-grain answers are executed on /ask from committed HMDA files. The homepage snapshot does not invent a top-lender list.',
      href: `/ask?q=${encoded}`,
      hrefLabel: 'Open the Ask result',
    };
  }

  if (query.mode === 'evidence') {
    const cfpb = intel.stateOfRecord.find((m) => m.id === 'cfpb-mortgage') ?? intel.stateOfRecord[intel.stateOfRecord.length - 1];
    return {
      query,
      interpretation,
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
      interpretation,
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
      interpretation,
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
    interpretation,
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
    'Which lenders originated the most mortgages in Florida?',
    'Which lenders received the most applications for properties in Broward County?',
    'Compare Broward and Palm Beach mortgage activity',
    'How many applications are for properties in Florida?',
    'Which lenders originated the most FHA mortgages in Florida?',
    'Which lenders have the lowest rates today?',
  ];
}
