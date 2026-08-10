import { fetchCfpbCompanyMortgageStats } from '../lib/cfpb/client';

const names = [
  'Union Home Mortgage Corp',
  'Union Home Mortgage Corp.',
  'UNION HOME MORTGAGE CORP',
  'Mortgage Research Center, LLC',
  'Supreme Lending',
  'FBC MORTGAGE, LLC',
  'Acrisure Mortgage Partners, LLC',
  'Lennar Financial Services, LLC',
  'CITY NATIONAL BANK',
  'City National Bank',
  'HUNTINGTON NATIONAL BANK, THE',
  'THE HUNTINGTON NATIONAL BANK',
  'SEACOAST BANKING CORPORATION OF FLORIDA',
  'Synovus Bank',
  'FIFTH THIRD FINANCIAL CORPORATION',
  'KEYCORP',
  'CAPITAL ONE FINANCIAL CORPORATION',
  'CITIBANK, N.A.',
  'DISCOVER BANK',
  'BANK OF AMERICA, NATIONAL ASSOCIATION',
  'Guild Holdings Company',
  'CrossCountry Mortgage LLC',
  'Movement Mortgage LLC',
  'Fairway Independent Mortgage Corporation',
  'BROKER SOLUTIONS, INC.',
  'Eagle Home Mortgage, LLC',
];

async function main() {
  for (const c of names) {
    const s = await fetchCfpbCompanyMortgageStats(c);
    console.log(String(s.total).padStart(6), c);
    await new Promise((r) => setTimeout(r, 280));
  }
}

main();
