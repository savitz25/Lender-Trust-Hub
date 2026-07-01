import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { LenderCard } from '@/components/LenderCard';
import { SearchBar } from '@/components/SearchBar';
import { getLendersByCounty } from '@/lib/lenders';

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; county: string }>;
}): Promise<Metadata> {
  const { state, county } = await params;
  const stateName = titleCase(state);
  const countyName = titleCase(county);
  const isOrange = state === 'florida' && county === 'orange';
  const isHillsborough = state === 'florida' && county === 'hillsborough';
  const isDuval = state === 'florida' && county === 'duval';
  const isBay = state === 'florida' && county === 'bay';
  const isForsyth = state === 'georgia' && county === 'forsyth';
  const isHenry = state === 'georgia' && county === 'henry';
  const isChatham = state === 'georgia' && county === 'chatham';
  const isRichmond = state === 'georgia' && county === 'richmond';
  const isMuscogee = state === 'georgia' && county === 'muscogee';
  const isColumbia = state === 'georgia' && county === 'columbia';
  const isHorry = state === 'south-carolina' && county === 'horry';
  const isGreenville = state === 'south-carolina' && county === 'greenville';
  const isSpartanburg = state === 'south-carolina' && county === 'spartanburg';
  const isCharleston = state === 'south-carolina' && county === 'charleston';
  const isBerkeley = state === 'south-carolina' && county === 'berkeley';
  const isDorchester = state === 'south-carolina' && county === 'dorchester';
  const isMecklenburg = state === 'north-carolina' && county === 'mecklenburg';
  const isWake = state === 'north-carolina' && county === 'wake';
  const isNcDurham = state === 'north-carolina' && county === 'durham';
  const isGuilford = state === 'north-carolina' && county === 'guilford';
  const isNcForsyth = state === 'north-carolina' && county === 'forsyth';
  const isDavidson = state === 'tennessee' && county === 'davidson';
  const isWilliamson = state === 'tennessee' && county === 'williamson';
  const isRutherford = state === 'tennessee' && county === 'rutherford';
  return {
    title: isOrange
      ? `Best Mortgage Lenders in Orange County, FL — Orlando Metro (2026)`
      : isHillsborough
        ? `Best Mortgage Lenders in Hillsborough County, FL — Tampa Bay (2026)`
        : isDuval
          ? `Best Mortgage Lenders in Duval County, FL — Jacksonville (2026)`
          : isBay
            ? `Best Mortgage Lenders in Bay County, FL — Panama City & PCB (2026)`
            : isForsyth
              ? `Best Mortgage Lenders in Forsyth County, GA — North Atlanta Suburbs (2026)`
              : isHenry
                ? `Best Mortgage Lenders in Henry County, GA — Metro Atlanta Outer Ring (2026)`
                : isChatham
                  ? `Best Mortgage Lenders in Chatham County, GA — Coastal Savannah (2026)`
                  : isRichmond
                    ? `Best Mortgage Lenders in Richmond County, GA — Augusta & CSRA (2026)`
                    : isMuscogee
                      ? `Best Mortgage Lenders in Muscogee County, GA — Columbus & Fort Moore (2026)`
                      : isColumbia
                        ? `Best Mortgage Lenders in Columbia County, GA — Evans & Grovetown (2026)`
                        : isHorry
                          ? `Best Mortgage Lenders in Horry County, SC — Grand Strand & Myrtle Beach (2026)`
                          : isGreenville
                            ? `Best Mortgage Lenders in Greenville County, SC — Upstate SC (2026)`
                            : isSpartanburg
                              ? `Best Mortgage Lenders in Spartanburg County, SC — Upstate USDA (2026)`
                              : isCharleston
                                ? `Best Mortgage Lenders in Charleston County, SC — Lowcountry (2026)`
                                : isBerkeley
                                  ? `Best Mortgage Lenders in Berkeley County, SC — Summerville & Lowcountry (2026)`
                                  : isDorchester
                                    ? `Best Mortgage Lenders in Dorchester County, SC — Charleston Metro (2026)`
                                    : isMecklenburg
                                      ? `Best Mortgage Lenders in Mecklenburg County, NC — Charlotte Metro (2026)`
                                      : isWake
                                        ? `Best Mortgage Lenders in Wake County, NC — Research Triangle (2026)`
                                        : isNcDurham
                                          ? `Best Mortgage Lenders in Durham County, NC — Research Triangle (2026)`
                                          : isGuilford
                                            ? `Best Mortgage Lenders in Guilford County, NC — Piedmont Triad (2026)`
                                            : isNcForsyth
                                              ? `Best Mortgage Lenders in Forsyth County, NC — Winston-Salem (2026)`
                                              : isDavidson
                                                ? `Best Mortgage Lenders in Davidson County, TN — Greater Nashville (2026)`
                                                : isWilliamson
                                                  ? `Best Mortgage Lenders in Williamson County, TN — Franklin & Brentwood (2026)`
                                                  : isRutherford
                                                    ? `Best Mortgage Lenders in Rutherford County, TN — Murfreesboro (2026)`
                                                    : `Mortgage Lenders in ${countyName} County, ${stateName}`,
    description: isOrange
      ? `Compare 9 NMLS-verified Orlando mortgage lenders. Acrisure HQ, VA specialists, first-time buyer brokers, and DPA programs in Orange County.`
      : isHillsborough
        ? `Compare 10 NMLS-verified Tampa Bay mortgage lenders. MacDill VA specialists, Wesley Chapel brokers, fast closings, and national lenders with local Tampa branches.`
        : isDuval
          ? `Compare 10 NMLS-verified Jacksonville mortgage lenders. NAS Jax VA specialists, award-winning local brokers, Navy Federal, and national lenders with Northeast FL branches.`
          : isBay
            ? `Compare 10 NMLS-verified Panhandle mortgage lenders. Blissful Mortgage PCB, Eglin VA specialists, military credit unions, and Emerald Coast beach financing in Bay County.`
            : isForsyth
              ? `Compare 11 NMLS-verified North Atlanta mortgage lenders. Johns Creek brokers, Alpharetta Avalon experts, Cumming new construction, and Forsyth school-district financing.`
              : isHenry
                ? `Compare 3 NMLS-verified Metro Atlanta outer-ring mortgage lenders. McDonough first-time buyer teams, Georgia DPA programs, USDA financing, and independent wholesale brokers.`
                : isChatham
                  ? `Compare 2 NMLS-verified Coastal Savannah mortgage lenders. Port relocations, VA/military, flood zone expertise, and Pooler new-construction financing in Chatham County.`
                  : isRichmond
                    ? `Compare 3 NMLS-verified Augusta mortgage lenders. Fort Eisenhower military and cyber relocations, zero-down VA, and CSRA new-construction financing in Richmond County.`
                    : isMuscogee
                      ? `Compare 2 NMLS-verified Columbus mortgage lenders. Fort Moore VA specialists, first-time buyer programs, and single-close renovation loans in Muscogee County.`
                      : isColumbia
                        ? `Compare 3 NMLS-verified CSRA mortgage lenders serving Evans and Grovetown. Augusta-area VA, new construction, and Fort Eisenhower relocation expertise in Columbia County.`
                        : isHorry
                          ? `Compare 5 NMLS-verified Grand Strand mortgage lenders. Myrtle Beach retiree relocations, condo financing, manufactured homes, FHA/VA, and 7-day upfront underwriting in Horry County.`
                          : isGreenville
                            ? `Compare 4 NMLS-verified Upstate SC mortgage lenders. Greenville renovation loans, BMW/Michelin relocations, Fairway VA programs, and Movement upfront underwriting.`
                            : isSpartanburg
                              ? `Compare 5 NMLS-verified Spartanburg mortgage lenders. USDA zero-down programs, Greenville corridor supplements, and industrial subdivision financing in Upstate SC.`
                              : isCharleston
                                ? `Compare 5 NMLS-verified Lowcountry mortgage lenders. Charleston luxury condos, Boeing/Volvo relocations, jumbo financing, and rapid coastal resale closings.`
                                : isBerkeley
                                  ? `Compare 5 NMLS-verified Lowcountry mortgage lenders serving Summerville and Berkeley County. Charleston metro corporate relocations and coastal flood underwriting.`
                                  : isDorchester
                                    ? `Compare 5 NMLS-verified Charleston metro mortgage lenders serving Dorchester County. Integrated realty financing and competitive suburban resale programs.`
                                    : isMecklenburg
                                      ? `Compare 5 NMLS-verified Charlotte metro mortgage lenders. Corporate relocations, Huntersville suburbs, Guild and NAF branches, and fast-closing brokers in Mecklenburg County.`
                                      : isWake
                                        ? `Compare 5 NMLS-verified Research Triangle mortgage lenders. Martini Mortgage Group, tech relocations, Cary/Apex professionals, and competitive Wake County financing.`
                                        : isNcDurham
                                          ? `Compare 5 NMLS-verified Durham County mortgage lenders. RTP tech and healthcare relocations with Triangle-market purchase and refinance expertise.`
                                          : isGuilford
                                            ? `Compare 4 NMLS-verified Piedmont Triad mortgage lenders. Affordable Greensboro entry, Helms Mortgage broker, and equity-building $283K–$315K markets.`
                                            : isNcForsyth
                                              ? `Compare 5 NMLS-verified Forsyth County mortgage lenders. Winston-Salem Silverton branch plus Guilford Triad supplements for first-time buyers.`
                                              : isDavidson
                                                ? `Compare 12 NMLS-verified Greater Nashville mortgage lenders. Churchill Mortgage, corporate relocations, Guild and NAF branches, and VA specialists in Davidson County.`
                                                : isWilliamson
                                                  ? `Compare 12 NMLS-verified Williamson County mortgage lenders. Franklin/Brentwood luxury, CrossCountry professionals, credit union rates, and new-construction financing.`
                                                  : isRutherford
                                                    ? `Compare 12 NMLS-verified Rutherford County mortgage lenders. Murfreesboro fast closings, suburban volume, VA programs, and affordability-belt spillover.`
                                                    : `Compare verified mortgage lenders and brokers in ${countyName} County, ${stateName}. NMLS verified with county experience scores.`,
  };
}

export default async function CountyLendersPage({
  params,
  searchParams,
}: {
  params: Promise<{ state: string; county: string }>;
  searchParams: Promise<{ zip?: string }>;
}) {
  const { state, county } = await params;
  const { zip } = await searchParams;
  const stateName = titleCase(state);
  const countyName = titleCase(county);
  const lenders = getLendersByCounty(state, county);
  const countyLabel = `${countyName} County, ${stateName}`;

  return (
    <div className="container mx-auto px-4 py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link href="/" className="hover:text-[#3B82F6]">Home</Link></li>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <li><Link href="/local-lenders" className="hover:text-[#3B82F6]">Local Lenders</Link></li>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <li><span className="text-[#0A2540]">{countyLabel}</span></li>
        </ol>
      </nav>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[#0A2540] md:text-4xl">
          Mortgage Lenders in {countyLabel}
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600">
          {lenders.length} verified lender{lenders.length !== 1 ? 's' : ''} ranked by
          county experience score and trust score. {zip ? `Showing results for ZIP ${zip}.` : ''}
        </p>
        <SearchBar className="mt-6 max-w-xl" />
      </div>

      <div className="mx-auto max-w-3xl space-y-4">
        {lenders.length > 0 ? (
          lenders.map((lender, i) => (
            <LenderCard
              key={lender.id}
              lender={lender}
              rank={i + 1}
              countyLabel={countyLabel}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <p className="text-zinc-600">
              We&apos;re expanding coverage in {countyLabel}. Check back soon or{' '}
              <Link href="/local-lenders" className="text-[#3B82F6] underline">
                browse all counties
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}