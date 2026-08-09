/**
 * Probe CFPB CCDB for exact company= filter hits (mortgage product).
 * Usage: npx tsx scripts/_discover-cfpb-names.ts
 */
import { fetchCfpbCompanyMortgageStats } from '../lib/cfpb/client';

const CANDIDATES = [
  // Homebridge variants
  'Homebridge Financial Services, Inc.',
  'HOMEBRIDGE FINANCIAL SERVICES, INC.',
  'HomeBridge Financial Services, Inc.',
  'Home Bridge Financial Services, Inc.',
  // Space Coast
  'SPACE COAST CREDIT UNION',
  'Space Coast Credit Union',
  // Guild
  'Guild Mortgage Company',
  'GUILD MORTGAGE COMPANY',
  'Guild Mortgage Company LLC',
  'GUILD MORTGAGE COMPANY, LLC',
  // CrossCountry
  'CrossCountry Mortgage, LLC',
  'CROSSCOUNTRY MORTGAGE, LLC',
  'CrossCountry Mortgage Inc.',
  'CROSSCOUNTRY MORTGAGE, INC.',
  // Movement
  'Movement Mortgage, LLC',
  'MOVEMENT MORTGAGE, LLC',
  'Movement Mortgage LLC',
  // PRMG
  'Paramount Residential Mortgage Group, Inc.',
  'PARAMOUNT RESIDENTIAL MORTGAGE GROUP, INC.',
  'PRMG',
  // Navy Federal
  'Navy Federal Credit Union',
  'NAVY FEDERAL CREDIT UNION',
  // PenFed
  'Pentagon Federal Credit Union',
  'PENTAGON FEDERAL CREDIT UNION',
  // PrimeLending
  'PrimeLending, a PlainsCapital Company',
  'PRIMELENDING, A PLAINSCAPITAL COMPANY',
  'PrimeLending',
  // DHI
  'DHI Mortgage Company Limited',
  'DHI MORTGAGE COMPANY, LTD.',
  'D.R. Horton',
  // Fairway
  'Fairway Independent Mortgage Corporation',
  'FAIRWAY INDEPENDENT MORTGAGE CORPORATION',
  // CMG
  'CMG Mortgage, Inc.',
  'CMG MORTGAGE, INC.',
  // PRMI
  'Primary Residential Mortgage, Inc.',
  'PRIMARY RESIDENTIAL MORTGAGE, INC.',
  // Capital City
  'Capital City Home Loans, LLC',
  'CAPITAL CITY HOME LOANS, LLC',
  // VyStar / Fairwinds if any
  'VYSTAR CREDIT UNION',
  'FAIRWINDS CREDIT UNION',
  'ACHIEVA CREDIT UNION',
  // MidFlorida
  'MIDFLORIDA CREDIT UNION',
  // Bank of America (if we add later)
  'BANK OF AMERICA, NATIONAL ASSOCIATION',
  'Bank of America, National Association',
];

async function main() {
  for (const company of CANDIDATES) {
    try {
      const stats = await fetchCfpbCompanyMortgageStats(company);
      const mark = stats.total > 0 ? 'HIT' : '—';
      console.log(`${mark.padEnd(4)} total=${String(stats.total).padStart(6)}  ${company}`);
    } catch (e) {
      console.log(`ERR  ${company}`, e);
    }
    await new Promise((r) => setTimeout(r, 350));
  }
}

main();
