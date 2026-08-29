export type AskMode =
  | 'entity'
  | 'count'
  | 'aggregate'
  | 'comparison'
  | 'evidence'
  | 'definition'
  | 'fail_closed';

export type LenderResearchQuery = {
  mode: AskMode;
  geography?: {
    grain: 'national' | 'state' | 'county' | 'property' | 'headquarters' | 'branch';
    state?: string;
    county?: string;
    note: string;
  };
  lenderType?: string[];
  loanPurpose?: string[];
  loanType?: string[];
  actionTaken?: string[];
  evidenceFamilies?: string[];
  requestedMetric?: 'count' | 'rate' | 'most' | 'median' | 'share' | null;
  sort?: { field: string; direction: 'asc' | 'desc' };
  failReason?: string;
  failClosedKind?: string;
};

export type AskInterpretationLine = { label: string; value: string };

export type AskExecution = {
  query: LenderResearchQuery;
  interpretation: AskInterpretationLine[];
  geographyWarning: string;
  headline: string;
  body: string;
  href?: string;
  hrefLabel?: string;
  facts?: Array<{ label: string; value: string }>;
};
