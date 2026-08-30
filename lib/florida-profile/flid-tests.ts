import { INDEXING_COHORT, RENDER_COHORT } from '@/lib/national-profile/publication';
import { DISCOVERY_SEARCHABLE_COUNT } from '@/lib/national-profile/discovery';
import { FLORIDA_LEND_005_SNAPSHOT } from '@/lib/florida-intelligence/snapshot';
import { FLORIDA_PHASE1_COUNT, FLORIDA_PHASE1_GATE } from './phase1';
import { FLORIDA_PHASE2_COUNT, FLORIDA_PHASE2_GATE } from './phase2';
import type { EntityKind, IdentifierType, RelationshipType } from '@/lib/identity/types';

export type Flid = { id: string; pass: boolean; detail: string };

const KINDS: EntityKind[] = ['institution', 'branch', 'person_mlo'];
const IDENTS: IdentifierType[] = [
  'NMLS_INSTITUTION',
  'NMLS_BRANCH',
  'NMLS_PERSON',
  'LEI',
  'FDIC_CERT',
  'NCUA_CHARTER',
  'RSSD',
  'FHA_ID',
  'HUD_ID',
  'SBA_ID',
  'STATE_LICENSE',
  'OTHER_AUTHORITATIVE',
];
const RELS: RelationshipType[] = [
  'SUBSIDIARY_OF',
  'PARENT_OF',
  'BRAND_OF',
  'SUCCESSOR_TO',
  'PREDECESSOR_OF',
  'ASSOCIATED_WITH',
  'BELONGS_TO',
];

export function runFlidTests(): Flid[] {
  const out: Flid[] = [];
  const check = (id: string, pass: boolean, detail: string) => out.push({ id, pass, detail });
  check('FLID2', KINDS.includes('person_mlo') && KINDS.includes('branch') && KINDS.includes('institution'), 'three kinds');
  check('FLID5', IDENTS.includes('NMLS_PERSON'), 'person ident is existing NMLS_PERSON');
  check('FLID6', IDENTS.includes('NMLS_BRANCH'), 'branch ident');
  check('FLID17', RELS.includes('ASSOCIATED_WITH'), 'associated_with reserved');
  check('FLID18', RELS.includes('BELONGS_TO'), 'belongs_to reserved');
  check('FLID39', FLORIDA_PHASE1_COUNT + FLORIDA_PHASE2_COUNT === 130, '130 public');
  check('FLID43', RENDER_COHORT.length === 181 && INDEXING_COHORT.length === 180, '181/180');
  check('FLID44', DISCOVERY_SEARCHABLE_COUNT === 181 && FLORIDA_PHASE1_GATE.search === false && FLORIDA_PHASE2_GATE.search === false, 'search 181');
  check(
    'FLID45',
    FLORIDA_LEND_005_SNAPSHOT.fingerprint === '616a961b7524fd5fd48ba7dcedcc553aabe9b658a586557908622912f5f08edc',
    'si fingerprint',
  );
  return out;
}
