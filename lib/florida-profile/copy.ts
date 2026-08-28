/** Locked Phase 1 public copy. Do not paraphrase into scores or clean-record claims. */

export const FLORIDA_PHASE1_COPY = {
  independent:
    'LenderTrustHub is an independent public-source research product. It is not a regulator, licensing authority, endorsement, or recommendation.',
  servicerYes: 'OFR MLD credential reports SERVICER=Yes.',
  addressNotTerritory:
    'This OFR primary address is license/business/HQ evidence. It is not service territory, branch footprint, lending geography, or county coverage.',
  noEvent:
    'No attributable Florida OFR final-agency-action observation was found for this confirmed company identity in the connected July-2015-forward FLAIO sources.',
  notCleanRecord: 'Absence of an attached observation is not a clean-record finding.',
  consentNotAdmission:
    'A consented or stipulated order is not an admission of every allegation in the underlying matter.',
  notAutomaticallyAdverse: 'A final agency action is not automatically an adverse disciplinary finding.',
  ofrNotFederal: 'Florida OFR evidence and federal regulatory evidence are separate sovereigns and are not summed.',
  hmdaNotQuality: 'HMDA is reporting activity, not a lender quality score.',
  cfpbNotFindings: 'CFPB records shown here are consumer complaint observations, not regulator findings or violations.',
  currentApproved: 'Florida license evidence is a current Approved snapshot, not a historical license-status time series.',
  flaioStart: 'Connected FLAIO coverage begins July 2015. Pre-July-2015 REAL orders are not bulk represented.',
  unattached607: '607 company FLAIO orders are not safely attached to current confirmed identities.',
  noMloBranch: 'No MLO/person or branch identity layer is published from this profile.',
  credentialsNotCompanies: 'License credentials are not the same as companies. Multiple credentials may belong to one identity.',
  viewOrder: 'View official OFR order',
  regulatoryHeading: 'Regulatory & Enforcement History',
} as const;

export const EVENT_TYPE_LABEL: Record<string, string> = {
  FINAL_ORDER: 'Final order',
  LICENSE_DENIAL: 'License denial',
  WITHDRAWAL: 'Withdrawal',
  OTHER: 'Other final disposition',
  EMERGENCY_ORDER: 'Emergency order',
  LICENSE_SUSPENSION: 'License suspension',
  LICENSE_REVOCATION: 'License revocation',
  CONSENT_ORDER: 'Consent order',
  CEASE_AND_DESIST: 'Cease and desist',
  FINE: 'Fine',
  PENALTY: 'Penalty',
  SETTLEMENT: 'Settlement',
  ADMINISTRATIVE_COMPLAINT: 'Administrative complaint',
};

export const FINDING_LABEL: Record<string, string> = {
  AGENCY_FINDING: 'Agency finding',
  CONSENTED_ORDER: 'Consented order',
  NOT_DISCIPLINE: 'Not characterized as discipline',
  UNSPECIFIED: 'Unspecified',
  ALLEGATION: 'Allegation',
};
