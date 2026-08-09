import { fetchCfpbCompanyMortgageStats } from '../lib/cfpb/client';

const names = [
  'Guild Holdings Company',
  'GUILD HOLDINGS COMPANY',
  'CrossCountry Mortgage LLC',
  'CROSSCOUNTRY MORTGAGE LLC',
  'PARAMOUNT RESIDENTIAL MORTGAGE GROUP',
  'DHI Mortgage Company',
  'DHI MORTGAGE COMPANY',
  'CMG Financial Services, Inc.',
  'CMG FINANCIAL SERVICES, INC.',
  'PRIMARY RESIDENTIAL MORTGAGE',
  'Movement Mortgage LLC',
  'NAVY FEDERAL CREDIT UNION',
  'PENTAGON FEDERAL CREDIT UNION',
  'PRIMELENDING, A PLAINSCAPITAL COMPANY',
  'Fairway Independent Mortgage Corporation',
  'VYSTAR CREDIT UNION',
  'BANK OF AMERICA, NATIONAL ASSOCIATION',
];

async function main() {
  for (const c of names) {
    const s = await fetchCfpbCompanyMortgageStats(c);
    console.log(String(s.total).padStart(6), c);
    await new Promise((r) => setTimeout(r, 300));
  }
}

main();
