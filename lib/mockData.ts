import { FLORIDA_LENDERS } from '@/lib/mortgage/floridaLenders';
import { GEORGIA_LENDERS } from '@/lib/mortgage/georgiaLenders';
import { SOUTH_CAROLINA_LENDERS } from '@/lib/mortgage/southCarolinaLenders';
import { NORTH_CAROLINA_LENDERS } from '@/lib/mortgage/northCarolinaLenders';
import { TENNESSEE_LENDERS } from '@/lib/mortgage/tennesseeLenders';
import { ARIZONA_LENDERS } from '@/lib/mortgage/arizonaLenders';
import { CALIFORNIA_LENDERS } from '@/lib/mortgage/californiaLenders';
import { COLORADO_LENDERS } from '@/lib/mortgage/coloradoLenders';

export type LoanType = 'Conventional' | 'FHA' | 'VA' | 'USDA' | 'Jumbo' | 'ARM' | 'Refinance';
export type CreditTier = 'Excellent' | 'Good' | 'Fair' | 'Rebuilding';
export type LenderType = 'Lender' | 'Broker' | 'Credit Union' | 'Bank';

export interface Lender {
  id: string;
  slug: string;
  name: string;
  nmlsId: string;
  type: LenderType;
  city: string;
  state: string;
  stateSlug: string;
  county: string;
  countySlug: string;
  zipCodes: string[];
  rating: number;
  reviewCount: number;
  trustScore: number;
  countyExperienceScore: number;
  nationalVolumeRank: number;
  loanTypes: LoanType[];
  specialties: string[];
  creditTiers: CreditTier[];
  nmlsVerified: boolean;
  cfpbComplaints: number;
  bbbRating: 'A+' | 'A' | 'A-' | 'B+' | 'B';
  googleRating: number;
  trustpilotRating: number;
  avgCloseDays: number;
  onTimeCloseRate: number;
  shortDescription: string;
  website?: string;
  phone?: string;
}

export const TRUST_STATS = {
  verifiedLenders: 12450,
  totalReviews: 2_800_000,
  countiesCovered: 3142,
  dataSources: ['NMLS', 'CFPB', 'BBB', 'Google', 'Trustpilot'],
};

export const ZIP_TO_COUNTY: Record<string, { state: string; stateSlug: string; county: string; countySlug: string }> = {
  '33301': { state: 'Florida', stateSlug: 'florida', county: 'Broward', countySlug: 'broward' },
  '33330': { state: 'Florida', stateSlug: 'florida', county: 'Broward', countySlug: 'broward' },
  '33331': { state: 'Florida', stateSlug: 'florida', county: 'Broward', countySlug: 'broward' },
  '33101': { state: 'Florida', stateSlug: 'florida', county: 'Miami-Dade', countySlug: 'miami-dade' },
  '33130': { state: 'Florida', stateSlug: 'florida', county: 'Miami-Dade', countySlug: 'miami-dade' },
  '33431': { state: 'Florida', stateSlug: 'florida', county: 'Palm Beach', countySlug: 'palm-beach' },
  '32801': { state: 'Florida', stateSlug: 'florida', county: 'Orange', countySlug: 'orange' },
  '32819': { state: 'Florida', stateSlug: 'florida', county: 'Orange', countySlug: 'orange' },
  '32811': { state: 'Florida', stateSlug: 'florida', county: 'Orange', countySlug: 'orange' },
  '34786': { state: 'Florida', stateSlug: 'florida', county: 'Orange', countySlug: 'orange' },
  '32827': { state: 'Florida', stateSlug: 'florida', county: 'Orange', countySlug: 'orange' },
  '33602': { state: 'Florida', stateSlug: 'florida', county: 'Hillsborough', countySlug: 'hillsborough' },
  '33609': { state: 'Florida', stateSlug: 'florida', county: 'Hillsborough', countySlug: 'hillsborough' },
  '33544': { state: 'Florida', stateSlug: 'florida', county: 'Hillsborough', countySlug: 'hillsborough' },
  '33619': { state: 'Florida', stateSlug: 'florida', county: 'Hillsborough', countySlug: 'hillsborough' },
  '32202': { state: 'Florida', stateSlug: 'florida', county: 'Duval', countySlug: 'duval' },
  '32256': { state: 'Florida', stateSlug: 'florida', county: 'Duval', countySlug: 'duval' },
  '32073': { state: 'Florida', stateSlug: 'florida', county: 'Duval', countySlug: 'duval' },
  '32223': { state: 'Florida', stateSlug: 'florida', county: 'Duval', countySlug: 'duval' },
  '32401': { state: 'Florida', stateSlug: 'florida', county: 'Bay', countySlug: 'bay' },
  '32407': { state: 'Florida', stateSlug: 'florida', county: 'Bay', countySlug: 'bay' },
  '32547': { state: 'Florida', stateSlug: 'florida', county: 'Okaloosa', countySlug: 'okaloosa' },
  '32504': { state: 'Florida', stateSlug: 'florida', county: 'Escambia', countySlug: 'escambia' },
  '90210': { state: 'California', stateSlug: 'california', county: 'Los Angeles', countySlug: 'los-angeles' },
  '10001': { state: 'New York', stateSlug: 'new-york', county: 'New York', countySlug: 'new-york' },
  '77001': { state: 'Texas', stateSlug: 'texas', county: 'Harris', countySlug: 'harris' },
  '60601': { state: 'Illinois', stateSlug: 'illinois', county: 'Cook', countySlug: 'cook' },
  '30301': { state: 'Georgia', stateSlug: 'georgia', county: 'Fulton', countySlug: 'fulton' },
  '30041': { state: 'Georgia', stateSlug: 'georgia', county: 'Forsyth', countySlug: 'forsyth' },
  '30004': { state: 'Georgia', stateSlug: 'georgia', county: 'Forsyth', countySlug: 'forsyth' },
  '30097': { state: 'Georgia', stateSlug: 'georgia', county: 'Forsyth', countySlug: 'forsyth' },
  '30024': { state: 'Georgia', stateSlug: 'georgia', county: 'Forsyth', countySlug: 'forsyth' },
  '30253': { state: 'Georgia', stateSlug: 'georgia', county: 'Henry', countySlug: 'henry' },
  '31406': { state: 'Georgia', stateSlug: 'georgia', county: 'Chatham', countySlug: 'chatham' },
  '31405': { state: 'Georgia', stateSlug: 'georgia', county: 'Chatham', countySlug: 'chatham' },
  '30907': { state: 'Georgia', stateSlug: 'georgia', county: 'Richmond', countySlug: 'richmond' },
  '30809': { state: 'Georgia', stateSlug: 'georgia', county: 'Richmond', countySlug: 'richmond' },
  '31909': { state: 'Georgia', stateSlug: 'georgia', county: 'Muscogee', countySlug: 'muscogee' },
  '31904': { state: 'Georgia', stateSlug: 'georgia', county: 'Muscogee', countySlug: 'muscogee' },
  '29577': { state: 'South Carolina', stateSlug: 'south-carolina', county: 'Horry', countySlug: 'horry' },
  '29615': { state: 'South Carolina', stateSlug: 'south-carolina', county: 'Greenville', countySlug: 'greenville' },
  '29464': { state: 'South Carolina', stateSlug: 'south-carolina', county: 'Charleston', countySlug: 'charleston' },
  '29483': { state: 'South Carolina', stateSlug: 'south-carolina', county: 'Berkeley', countySlug: 'berkeley' },
  '27601': { state: 'North Carolina', stateSlug: 'north-carolina', county: 'Wake', countySlug: 'wake' },
  '27401': { state: 'North Carolina', stateSlug: 'north-carolina', county: 'Guilford', countySlug: 'guilford' },
  '27101': { state: 'North Carolina', stateSlug: 'north-carolina', county: 'Forsyth', countySlug: 'forsyth' },
  '37201': { state: 'Tennessee', stateSlug: 'tennessee', county: 'Davidson', countySlug: 'davidson' },
  '37203': { state: 'Tennessee', stateSlug: 'tennessee', county: 'Davidson', countySlug: 'davidson' },
  '37027': { state: 'Tennessee', stateSlug: 'tennessee', county: 'Williamson', countySlug: 'williamson' },
  '37064': { state: 'Tennessee', stateSlug: 'tennessee', county: 'Williamson', countySlug: 'williamson' },
  '37129': { state: 'Tennessee', stateSlug: 'tennessee', county: 'Rutherford', countySlug: 'rutherford' },
  '37902': { state: 'Tennessee', stateSlug: 'tennessee', county: 'Knox', countySlug: 'knox' },
  '37934': { state: 'Tennessee', stateSlug: 'tennessee', county: 'Knox', countySlug: 'knox' },
  '37804': { state: 'Tennessee', stateSlug: 'tennessee', county: 'Blount', countySlug: 'blount' },
  '37862': { state: 'Tennessee', stateSlug: 'tennessee', county: 'Sevier', countySlug: 'sevier' },
  '37738': { state: 'Tennessee', stateSlug: 'tennessee', county: 'Sevier', countySlug: 'sevier' },
  '85001': { state: 'Arizona', stateSlug: 'arizona', county: 'Maricopa', countySlug: 'maricopa' },
  '85326': { state: 'Arizona', stateSlug: 'arizona', county: 'Maricopa', countySlug: 'maricopa' },
  '85396': { state: 'Arizona', stateSlug: 'arizona', county: 'Maricopa', countySlug: 'maricopa' },
  '85338': { state: 'Arizona', stateSlug: 'arizona', county: 'Maricopa', countySlug: 'maricopa' },
  '85395': { state: 'Arizona', stateSlug: 'arizona', county: 'Maricopa', countySlug: 'maricopa' },
  '85142': { state: 'Arizona', stateSlug: 'arizona', county: 'Maricopa', countySlug: 'maricopa' },
  '85143': { state: 'Arizona', stateSlug: 'arizona', county: 'Maricopa', countySlug: 'maricopa' },
  '85140': { state: 'Arizona', stateSlug: 'arizona', county: 'Pinal', countySlug: 'pinal' },
  '95110': { state: 'California', stateSlug: 'california', county: 'Santa Clara', countySlug: 'santa-clara' },
  '95113': { state: 'California', stateSlug: 'california', county: 'Santa Clara', countySlug: 'santa-clara' },
  '95014': { state: 'California', stateSlug: 'california', county: 'Santa Clara', countySlug: 'santa-clara' },
  '95050': { state: 'California', stateSlug: 'california', county: 'Santa Clara', countySlug: 'santa-clara' },
  '92501': { state: 'California', stateSlug: 'california', county: 'Riverside', countySlug: 'riverside' },
  '92503': { state: 'California', stateSlug: 'california', county: 'Riverside', countySlug: 'riverside' },
  '92551': { state: 'California', stateSlug: 'california', county: 'Riverside', countySlug: 'riverside' },
  '92553': { state: 'California', stateSlug: 'california', county: 'Riverside', countySlug: 'riverside' },
  '93611': { state: 'California', stateSlug: 'california', county: 'Fresno', countySlug: 'fresno' },
  '93612': { state: 'California', stateSlug: 'california', county: 'Fresno', countySlug: 'fresno' },
  '93710': { state: 'California', stateSlug: 'california', county: 'Fresno', countySlug: 'fresno' },
  '93301': { state: 'California', stateSlug: 'california', county: 'Kern', countySlug: 'kern' },
  '93309': { state: 'California', stateSlug: 'california', county: 'Kern', countySlug: 'kern' },
  '98101': { state: 'Washington', stateSlug: 'washington', county: 'King', countySlug: 'king' },
  '80201': { state: 'Colorado', stateSlug: 'colorado', county: 'Denver', countySlug: 'denver' },
  '80516': { state: 'Colorado', stateSlug: 'colorado', county: 'Adams', countySlug: 'adams' },
  '80026': { state: 'Colorado', stateSlug: 'colorado', county: 'Boulder', countySlug: 'boulder' },
  '80027': { state: 'Colorado', stateSlug: 'colorado', county: 'Boulder', countySlug: 'boulder' },
  '80134': { state: 'Colorado', stateSlug: 'colorado', county: 'Douglas', countySlug: 'douglas' },
  '80112': { state: 'Colorado', stateSlug: 'colorado', county: 'Douglas', countySlug: 'douglas' },
};

const NATIONAL_LENDERS: Lender[] = [
  {
    id: '4', slug: 'pacific-trust-mortgage', name: 'Pacific Trust Mortgage', nmlsId: '1984721', type: 'Lender',
    city: 'Los Angeles', state: 'California', stateSlug: 'california', county: 'Los Angeles', countySlug: 'los-angeles',
    zipCodes: ['90210', '90024', '90012'], rating: 4.6, reviewCount: 3421, trustScore: 88, countyExperienceScore: 92,
    nationalVolumeRank: 15, loanTypes: ['Conventional', 'Jumbo', 'ARM', 'Refinance'], specialties: ['High-Cost Areas', 'Rate Locks'],
    creditTiers: ['Excellent', 'Good'], nmlsVerified: true, cfpbComplaints: 12, bbbRating: 'A',
    googleRating: 4.5, trustpilotRating: 4.4, avgCloseDays: 35, onTimeCloseRate: 91,
    shortDescription: 'LA County jumbo specialist navigating California conforming limits and complex appraisals.',
    phone: '(310) 555-0301',
  },
  {
    id: '5', slug: 'metro-home-finance', name: 'Metro Home Finance', nmlsId: '2239104', type: 'Bank',
    city: 'New York', state: 'New York', stateSlug: 'new-york', county: 'New York', countySlug: 'new-york',
    zipCodes: ['10001', '10011', '10022'], rating: 4.5, reviewCount: 1876, trustScore: 86, countyExperienceScore: 90,
    nationalVolumeRank: 22, loanTypes: ['Conventional', 'Jumbo', 'Refinance'], specialties: ['Co-ops', 'Condos'],
    creditTiers: ['Excellent', 'Good'], nmlsVerified: true, cfpbComplaints: 18, bbbRating: 'A-',
    googleRating: 4.4, trustpilotRating: 4.3, avgCloseDays: 38, onTimeCloseRate: 89,
    shortDescription: 'Manhattan co-op and condo financing with deep NYC board approval experience.',
    phone: '(212) 555-0401',
  },
  {
    id: '6', slug: 'lone-star-lending', name: 'Lone Star Lending', nmlsId: '1673842', type: 'Lender',
    city: 'Houston', state: 'Texas', stateSlug: 'texas', county: 'Harris', countySlug: 'harris',
    zipCodes: ['77001', '77002', '77019'], rating: 4.8, reviewCount: 2654, trustScore: 92, countyExperienceScore: 95,
    nationalVolumeRank: 28, loanTypes: ['Conventional', 'FHA', 'VA', 'USDA'], specialties: ['VA Loans', 'Rural Properties'],
    creditTiers: ['Excellent', 'Good', 'Fair'], nmlsVerified: true, cfpbComplaints: 5, bbbRating: 'A+',
    googleRating: 4.7, trustpilotRating: 4.8, avgCloseDays: 27, onTimeCloseRate: 96,
    shortDescription: 'Harris County VA and USDA expert serving Houston metro military families.',
    phone: '(713) 555-0501',
  },
  {
    id: '7', slug: 'windy-city-mortgage', name: 'Windy City Mortgage Co.', nmlsId: '1892047', type: 'Broker',
    city: 'Chicago', state: 'Illinois', stateSlug: 'illinois', county: 'Cook', countySlug: 'cook',
    zipCodes: ['60601', '60614', '60657'], rating: 4.7, reviewCount: 1543, trustScore: 90, countyExperienceScore: 93,
    nationalVolumeRank: 55, loanTypes: ['Conventional', 'FHA', 'Refinance'], specialties: ['First-Time Buyers', 'Down Payment Assistance'],
    creditTiers: ['Excellent', 'Good', 'Fair', 'Rebuilding'], nmlsVerified: true, cfpbComplaints: 7, bbbRating: 'A',
    googleRating: 4.6, trustpilotRating: 4.5, avgCloseDays: 31, onTimeCloseRate: 93,
    shortDescription: 'Cook County broker connecting buyers with Illinois down-payment assistance programs.',
    phone: '(312) 555-0601',
  },
  {
    id: '8', slug: 'peach-state-home-loans', name: 'Peach State Home Loans', nmlsId: '2019384', type: 'Lender',
    city: 'Atlanta', state: 'Georgia', stateSlug: 'georgia', county: 'Fulton', countySlug: 'fulton',
    zipCodes: ['30301', '30309', '30318'], rating: 4.9, reviewCount: 987, trustScore: 94, countyExperienceScore: 91,
    nationalVolumeRank: 67, loanTypes: ['Conventional', 'FHA', 'VA'], specialties: ['New Construction', 'Rate Buydowns'],
    creditTiers: ['Excellent', 'Good', 'Fair'], nmlsVerified: true, cfpbComplaints: 3, bbbRating: 'A+',
    googleRating: 4.8, trustpilotRating: 4.7, avgCloseDays: 29, onTimeCloseRate: 95,
    shortDescription: 'Fulton County new-build specialist with builder partnerships across metro Atlanta.',
    phone: '(404) 555-0701',
  },
  {
    id: '10', slug: 'cascade-home-lending', name: 'Cascade Home Lending', nmlsId: '1928471', type: 'Credit Union',
    city: 'Seattle', state: 'Washington', stateSlug: 'washington', county: 'King', countySlug: 'king',
    zipCodes: ['98101', '98109', '98122'], rating: 4.8, reviewCount: 756, trustScore: 95, countyExperienceScore: 96,
    nationalVolumeRank: 89, loanTypes: ['Conventional', 'Jumbo', 'Refinance'], specialties: ['Member Benefits', 'Low Fees'],
    creditTiers: ['Excellent', 'Good'], nmlsVerified: true, cfpbComplaints: 1, bbbRating: 'A+',
    googleRating: 4.9, trustpilotRating: 4.8, avgCloseDays: 26, onTimeCloseRate: 98,
    shortDescription: 'King County credit union offering member-exclusive rates and minimal closing costs.',
    phone: '(206) 555-0901',
  },
  {
    id: '11', slug: 'rocky-mountain-mortgage', name: 'Rocky Mountain Mortgage', nmlsId: '2083746', type: 'Lender',
    city: 'Denver', state: 'Colorado', stateSlug: 'colorado', county: 'Denver', countySlug: 'denver',
    zipCodes: ['80201', '80202', '80206'], rating: 4.7, reviewCount: 1123, trustScore: 91, countyExperienceScore: 90,
    nationalVolumeRank: 61, loanTypes: ['Conventional', 'FHA', 'VA', 'Jumbo'], specialties: ['Mountain Properties', 'Second Homes'],
    creditTiers: ['Excellent', 'Good', 'Fair'], nmlsVerified: true, cfpbComplaints: 4, bbbRating: 'A',
    googleRating: 4.6, trustpilotRating: 4.5, avgCloseDays: 30, onTimeCloseRate: 94,
    shortDescription: 'Denver County expert in mountain and vacation home financing across Colorado.',
    phone: '(303) 555-1001',
  },
  {
    id: '14', slug: 'golden-gate-home-loans', name: 'Golden Gate Home Loans', nmlsId: '1765432', type: 'Lender',
    city: 'San Francisco', state: 'California', stateSlug: 'california', county: 'San Francisco', countySlug: 'san-francisco',
    zipCodes: ['94102', '94107', '94110'], rating: 4.4, reviewCount: 892, trustScore: 84, countyExperienceScore: 91,
    nationalVolumeRank: 73, loanTypes: ['Jumbo', 'Conventional', 'ARM'], specialties: ['Tech Employee RSU', 'High DTI'],
    creditTiers: ['Excellent', 'Good'], nmlsVerified: true, cfpbComplaints: 11, bbbRating: 'A-',
    googleRating: 4.3, trustpilotRating: 4.2, avgCloseDays: 40, onTimeCloseRate: 87,
    shortDescription: 'SF Bay Area jumbo lender experienced with RSU income and stock-option buyers.',
    phone: '(415) 555-1301',
  },
  {
    id: '15', slug: 'heartland-home-finance', name: 'Heartland Home Finance', nmlsId: '1948273', type: 'Lender',
    city: 'Dallas', state: 'Texas', stateSlug: 'texas', county: 'Dallas', countySlug: 'dallas',
    zipCodes: ['75201', '75204', '75219'], rating: 4.7, reviewCount: 2034, trustScore: 89, countyExperienceScore: 88,
    nationalVolumeRank: 35, loanTypes: ['Conventional', 'FHA', 'VA', 'Refinance'], specialties: ['Fast Closings', 'Digital Process'],
    creditTiers: ['Excellent', 'Good', 'Fair'], nmlsVerified: true, cfpbComplaints: 7, bbbRating: 'A',
    googleRating: 4.6, trustpilotRating: 4.5, avgCloseDays: 24, onTimeCloseRate: 95,
    shortDescription: 'Dallas County digital-first lender with 21-day average close times.',
    phone: '(214) 555-1401',
  },
  {
    id: '16', slug: 'liberty-lending-solutions', name: 'Liberty Lending Solutions', nmlsId: '1873645', type: 'Broker',
    city: 'Philadelphia', state: 'Pennsylvania', stateSlug: 'pennsylvania', county: 'Philadelphia', countySlug: 'philadelphia',
    zipCodes: ['19102', '19103', '19106'], rating: 4.6, reviewCount: 1087, trustScore: 88, countyExperienceScore: 86,
    nationalVolumeRank: 81, loanTypes: ['Conventional', 'FHA', 'USDA'], specialties: ['Urban Rehab', 'Historic Homes'],
    creditTiers: ['Excellent', 'Good', 'Fair'], nmlsVerified: true, cfpbComplaints: 6, bbbRating: 'A',
    googleRating: 4.5, trustpilotRating: 4.4, avgCloseDays: 34, onTimeCloseRate: 90,
    shortDescription: 'Philadelphia broker specializing in FHA 203k and historic property renovations.',
    phone: '(215) 555-1501',
  },
  {
    id: '17', slug: 'capital-trust-mortgage', name: 'Capital Trust Mortgage', nmlsId: '2093847', type: 'Lender',
    city: 'Washington', state: 'District of Columbia', stateSlug: 'district-of-columbia', county: 'District of Columbia', countySlug: 'district-of-columbia',
    zipCodes: ['20001', '20002', '20009'], rating: 4.5, reviewCount: 743, trustScore: 87, countyExperienceScore: 92,
    nationalVolumeRank: 95, loanTypes: ['Conventional', 'Jumbo', 'VA'], specialties: ['Government Employees', 'Condo'],
    creditTiers: ['Excellent', 'Good'], nmlsVerified: true, cfpbComplaints: 5, bbbRating: 'A',
    googleRating: 4.4, trustpilotRating: 4.3, avgCloseDays: 32, onTimeCloseRate: 92,
    shortDescription: 'DC metro lender serving federal employees and Capitol Hill condo buyers.',
    phone: '(202) 555-1601',
  },
  {
    id: '18', slug: 'blue-ridge-home-lending', name: 'Blue Ridge Home Lending', nmlsId: '1729384', type: 'Lender',
    city: 'Charlotte', state: 'North Carolina', stateSlug: 'north-carolina', county: 'Mecklenburg', countySlug: 'mecklenburg',
    zipCodes: ['28202', '28203', '28204'], rating: 4.8, reviewCount: 1567, trustScore: 91, countyExperienceScore: 89,
    nationalVolumeRank: 52, loanTypes: ['Conventional', 'FHA', 'VA', 'USDA'], specialties: ['Relocation', 'First-Time Buyers'],
    creditTiers: ['Excellent', 'Good', 'Fair'], nmlsVerified: true, cfpbComplaints: 4, bbbRating: 'A+',
    googleRating: 4.7, trustpilotRating: 4.6, avgCloseDays: 28, onTimeCloseRate: 94,
    shortDescription: 'Mecklenburg County relocation specialist for corporate transferees.',
    phone: '(704) 555-1701',
  },
  {
    id: '19', slug: 'great-lakes-mortgage', name: 'Great Lakes Mortgage Group', nmlsId: '1964728', type: 'Lender',
    city: 'Detroit', state: 'Michigan', stateSlug: 'michigan', county: 'Wayne', countySlug: 'wayne',
    zipCodes: ['48201', '48202', '48226'], rating: 4.4, reviewCount: 923, trustScore: 83, countyExperienceScore: 85,
    nationalVolumeRank: 88, loanTypes: ['Conventional', 'FHA', 'Refinance'], specialties: ['Affordable Housing', 'Michigan MSHDA'],
    creditTiers: ['Good', 'Fair', 'Rebuilding'], nmlsVerified: true, cfpbComplaints: 10, bbbRating: 'B+',
    googleRating: 4.3, trustpilotRating: 4.2, avgCloseDays: 37, onTimeCloseRate: 86,
    shortDescription: 'Wayne County affordable housing lender with MSHDA down-payment programs.',
    phone: '(313) 555-1801',
  },
  {
    id: '20', slug: 'pioneer-valley-lending', name: 'Pioneer Valley Lending', nmlsId: '2038471', type: 'Broker',
    city: 'Springfield', state: 'Massachusetts', stateSlug: 'massachusetts', county: 'Hampden', countySlug: 'hampden',
    zipCodes: ['01103', '01104', '01105'], rating: 4.7, reviewCount: 512, trustScore: 90, countyExperienceScore: 94,
    nationalVolumeRank: 118, loanTypes: ['Conventional', 'FHA', 'VA'], specialties: ['MassHousing', 'Rural Western MA'],
    creditTiers: ['Excellent', 'Good', 'Fair'], nmlsVerified: true, cfpbComplaints: 2, bbbRating: 'A+',
    googleRating: 4.8, trustpilotRating: 4.7, avgCloseDays: 30, onTimeCloseRate: 93,
    shortDescription: 'Western Massachusetts broker with MassHousing program expertise.',
    phone: '(413) 555-1901',
  },
];

export const lenders: Lender[] = [...NATIONAL_LENDERS, ...FLORIDA_LENDERS, ...GEORGIA_LENDERS, ...SOUTH_CAROLINA_LENDERS, ...NORTH_CAROLINA_LENDERS, ...TENNESSEE_LENDERS, ...ARIZONA_LENDERS, ...CALIFORNIA_LENDERS, ...COLORADO_LENDERS];