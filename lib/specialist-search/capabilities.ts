import type { SpecialistSearchCapability } from './contract';

export const LENDER_SEARCH_CAPABILITIES: SpecialistSearchCapability[] = [
  { key: 'identity', label: 'Institution identity', supportState: 'KNOWN', coverage: 'Published institution cohort', sourceSystems: ['NMLS institution records', 'GLEIF', 'publication manifests'], limitations: ['Institution is not branch or MLO.'] },
  { key: 'hmda', label: 'HMDA market activity', supportState: 'KNOWN', coverage: 'Committed 2025 state/county observations', sourceSystems: ['CFPB HMDA'], limitations: ['Property geography is not lender location or service territory.'] },
  { key: 'cfpb', label: 'CFPB complaint observations', supportState: 'PARTIAL', coverage: 'Curated confirmed company bridges', sourceSystems: ['CFPB Consumer Complaint Database'], limitations: ['Complaint is not wrongdoing; unattached observations are excluded.'] },
  { key: 'florida-ofr', label: 'Florida OFR evidence', supportState: 'PARTIAL', coverage: 'Published, confirmed institution links only', sourceSystems: ['Florida OFR'], limitations: ['Credential is not institution identity; unresolved links remain held.'] },
  { key: 'new-jersey-rmla', label: 'New Jersey RMLA roster', supportState: 'REQUEST_ONLY', coverage: 'Official request/search workflow', sourceSystems: ['New Jersey DOBI'], limitations: ['No complete acquired bulk universe; missing is not zero.'] },
  { key: 'california-crmla', label: 'California CRMLA roster', supportState: 'NOT_ACQUIRED', coverage: 'No complete current bulk roster', sourceSystems: ['California DFPI'], limitations: ['CalHFA directory rows are not a lender population.'] },
  { key: 'arizona-roster', label: 'Arizona company roster', supportState: 'PARTIAL', coverage: 'Open Search/source-specific evidence', sourceSystems: ['Arizona DIFI'], limitations: ['Open-search evidence is not a complete acquired company universe.'] },
  { key: 'mlo', label: 'MLO/person directory', supportState: 'UNSUPPORTED', coverage: 'Institution publication only', sourceSystems: [], limitations: ['Person and branch identifiers are not silently treated as institutions.'] },
  { key: 'service-territory', label: 'Service territory', supportState: 'UNSUPPORTED', coverage: 'HMDA property geography only', sourceSystems: ['CFPB HMDA'], limitations: ['Activity tied to properties does not prove availability or service territory.'] },
];
