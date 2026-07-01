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
  const isKnox = state === 'tennessee' && county === 'knox';
  const isBlount = state === 'tennessee' && county === 'blount';
  const isSevier = state === 'tennessee' && county === 'sevier';
  const isMaricopa = state === 'arizona' && county === 'maricopa';
  const isPinal = state === 'arizona' && county === 'pinal';
  const isSantaClara = state === 'california' && county === 'santa-clara';
  const isRiverside = state === 'california' && county === 'riverside';
  const isFresno = state === 'california' && county === 'fresno';
  const isKern = state === 'california' && county === 'kern';
  const isAdams = state === 'colorado' && county === 'adams';
  const isBoulder = state === 'colorado' && county === 'boulder';
  const isDouglas = state === 'colorado' && county === 'douglas';
  const isElPaso = state === 'colorado' && county === 'el-paso';
  const isJefferson = state === 'colorado' && county === 'jefferson';
  const isRoutt = state === 'colorado' && county === 'routt';
  const isCollin = state === 'texas' && county === 'collin';
  const isDenton = state === 'texas' && county === 'denton';
  const isGrayson = state === 'texas' && county === 'grayson';
  const isHarris = state === 'texas' && county === 'harris';
  const isFortBend = state === 'texas' && county === 'fort-bend';
  const isMontgomery = state === 'texas' && county === 'montgomery';
  const isBastrop = state === 'texas' && county === 'bastrop';
  const isCameron = state === 'texas' && county === 'cameron';
  const isBexar = state === 'texas' && county === 'bexar';
  const isSnohomish = state === 'washington' && county === 'snohomish';
  const isPierce = state === 'washington' && county === 'pierce';
  const isClark = state === 'washington' && county === 'clark';
  const isDistrictOfColumbia = state === 'district-of-columbia' && county === 'district-of-columbia';
  const isWorcester = state === 'massachusetts' && county === 'worcester';
  const isMiddlesex = state === 'massachusetts' && county === 'middlesex';
  const isSuffolk = state === 'massachusetts' && county === 'suffolk';
  const isEssex = state === 'massachusetts' && county === 'essex';
  const isErie = state === 'new-york' && county === 'erie';
  const isAlbany = state === 'new-york' && county === 'albany';
  const isWestchester = state === 'new-york' && county === 'westchester';
  const isPutnam = state === 'new-york' && county === 'putnam';
  const isKings = state === 'new-york' && county === 'kings';
  const isQueens = state === 'new-york' && county === 'queens';
  const isNewYorkCounty = state === 'new-york' && county === 'new-york-county';
  const isPhiladelphia = state === 'pennsylvania' && county === 'philadelphia';
  const isPaMontgomery = state === 'pennsylvania' && county === 'montgomery';
  const isChester = state === 'pennsylvania' && county === 'chester';
  const isBucks = state === 'pennsylvania' && county === 'bucks';
  const isAllegheny = state === 'pennsylvania' && county === 'allegheny';
  const isBeaver = state === 'pennsylvania' && county === 'beaver';
  const isDauphin = state === 'pennsylvania' && county === 'dauphin';
  const isLehigh = state === 'pennsylvania' && county === 'lehigh';
  const isYork = state === 'pennsylvania' && county === 'york';
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
                                                    : isKnox
                                                      ? `Best Mortgage Lenders in Knox County, TN — Knoxville & Farragut (2026)`
                                                      : isBlount
                                                        ? `Best Mortgage Lenders in Blount County, TN — Maryville & East TN (2026)`
                                                        : isSevier
                                                          ? `Best Mortgage Lenders in Sevier County, TN — Gatlinburg & Smokies (2026)`
                                                          : isMaricopa
                                                            ? `Best Mortgage Lenders in Maricopa County, AZ — Phoenix Metro Hubs (2026)`
                                                            : isPinal
                                                              ? `Best Mortgage Lenders in Pinal County, AZ — San Tan Valley & Southeast Border (2026)`
                                                              : isSantaClara
                                                                ? `Best Mortgage Lenders in Santa Clara County, CA — Silicon Valley Spine (2026)`
                                                                : isRiverside
                                                                  ? `Best Mortgage Lenders in Riverside County, CA — Inland Empire Affordability Magnets (2026)`
                                                                  : isFresno
                                                                    ? `Best Mortgage Lenders in Fresno County, CA — Central Valley Alternatives (2026)`
                                                                    : isKern
                                                                      ? `Best Mortgage Lenders in Kern County, CA — Central Valley Alternatives (2026)`
                                                                      : isAdams
                                                                        ? `Best Mortgage Lenders in Adams County, CO — Denver Metro Outer Rings (2026)`
                                                                        : isBoulder
                                                                          ? `Best Mortgage Lenders in Boulder County, CO — Denver Metro North Suburbs (2026)`
                                                                          : isDouglas
                                                                            ? `Best Mortgage Lenders in Douglas County, CO — Denver Metro Outer Rings (2026)`
                                                                            : isElPaso
                                                                              ? `Best Mortgage Lenders in El Paso County, CO — Colorado Springs Stability & Volume (2026)`
                                                                              : isJefferson
                                                                                ? `Best Mortgage Lenders in Jefferson County, CO — Foothills & Mountain Towns (2026)`
                                                                                : isRoutt
                                                                                  ? `Best Mortgage Lenders in Routt County, CO — Steamboat Springs Mountain Towns (2026)`
                                                                                  : isCollin
                                                                                    ? `Best Mortgage Lenders in Collin County, TX — DFW Silicon Prairie (2026)`
                                                                                    : isDenton
                                                                                      ? `Best Mortgage Lenders in Denton County, TX — DFW Silicon Prairie (2026)`
                                                                                      : isGrayson
                                                                                        ? `Best Mortgage Lenders in Grayson County, TX — Sherman-Denison Silicon Prairie (2026)`
                                                                                        : isHarris
                                                                                          ? `Best Mortgage Lenders in Harris County, TX — Greater Houston Metro (2026)`
                                                                                          : isFortBend
                                                                                            ? `Best Mortgage Lenders in Fort Bend County, TX — Greater Houston Metro (2026)`
                                                                                              : isMontgomery
                                                                                                ? `Best Mortgage Lenders in Montgomery County, TX — Greater Houston Metro (2026)`
                                                                                                : isBastrop
                                                                                                  ? `Best Mortgage Lenders in Bastrop County, TX — SpaceX Corridor (2026)`
                                                                                                  : isCameron
                                                                                                    ? `Best Mortgage Lenders in Cameron County, TX — Starbase & Southmost (2026)`
                                                                                                    : isBexar
                                                                                                      ? `Best Mortgage Lenders in Bexar County, TX — San Antonio Value Play (2026)`
                                                                                                      : isSnohomish
                                                                                                        ? `Best Mortgage Lenders in Snohomish County, WA — Transit Corridor (2026)`
                                                                                                        : isPierce
                                                                                                          ? `Best Mortgage Lenders in Pierce County, WA — South Sound (2026)`
                                                                                                          : isClark
                                                                                                            ? `Best Mortgage Lenders in Clark County, WA — Portland Border (2026)`
                                                                                                            : isDistrictOfColumbia
                                                                                                              ? `Best Mortgage Lenders in Washington, DC — Metro Hubs (2026)`
                                                                                                              : isWorcester
                                                                                                                ? `Best Mortgage Lenders in Worcester County, MA — Undisputed Growth Leader (2026)`
                                                                                                                : isMiddlesex
                                                                                                                  ? `Best Mortgage Lenders in Middlesex County, MA — Cambridge, Somerville & MetroWest Hubs (2026)`
                                                                                                                  : isSuffolk
                                                                                                                    ? `Best Mortgage Lenders in Suffolk County, MA — Boston Neighborhoods & Gateway Cities (2026)`
                                                                                                                    : isEssex
                                                                                                                      ? `Best Mortgage Lenders in Essex County, MA — Gateway Cities & North Shore (2026)`
                                                                                                                      : isErie
                                                                                                                        ? `Best Mortgage Lenders in Erie County, NY — Buffalo Upstate Powerhouse (2026)`
                                                                                                                        : isAlbany
                                                                                                                          ? `Best Mortgage Lenders in Albany County, NY — Capital District Powerhouse (2026)`
                                                                                                                          : isWestchester
                                                                                                                            ? `Best Mortgage Lenders in Westchester County, NY — NYC Suburbs Tri-State Surge (2026)`
                                                                                                                            : isPutnam
                                                                                                                              ? `Best Mortgage Lenders in Putnam County, NY — NYC Suburbs Affordability Alternative (2026)`
                                                                                                                              : isKings
                                                                                                                                ? `Best Mortgage Lenders in Kings County, NY — Brooklyn NYC Boroughs (2026)`
                                                                                                                                : isQueens
                                                                                                                                  ? `Best Mortgage Lenders in Queens County, NY — NYC Boroughs Growth Corridors (2026)`
                                                                                                                                  : isNewYorkCounty
                                                                                                                                    ? `Best Mortgage Lenders in New York County, NY — Manhattan NYC Boroughs (2026)`
                                                                                                                                    : isPhiladelphia
                                                                                                                                      ? `Best Mortgage Lenders in Philadelphia County, PA — Metro Crown Jewel (2026)`
                                                                                                                                      : isPaMontgomery
                                                                                                                                        ? `Best Mortgage Lenders in Montgomery County, PA — Philadelphia Collar Counties (2026)`
                                                                                                                                        : isChester
                                                                                                                                          ? `Best Mortgage Lenders in Chester County, PA — Philadelphia Collar Counties (2026)`
                                                                                                                                          : isBucks
                                                                                                                                            ? `Best Mortgage Lenders in Bucks County, PA — Philadelphia Collar Counties (2026)`
                                                                                                                                            : isAllegheny
                                                                                                                                              ? `Best Mortgage Lenders in Allegheny County, PA — Greater Pittsburgh (2026)`
                                                                                                                                              : isBeaver
                                                                                                                                                ? `Best Mortgage Lenders in Beaver County, PA — Baden Hot Suburb (2026)`
                                                                                                                                                : isDauphin
                                                                                                                                                  ? `Best Mortgage Lenders in Dauphin County, PA — Harrisburg Affordability Haven (2026)`
                                                                                                                                                  : isLehigh
                                                                                                                                                    ? `Best Mortgage Lenders in Lehigh County, PA — Lehigh Valley Corridor (2026)`
                                                                                                                                                    : isYork
                                                                                                                                                      ? `Best Mortgage Lenders in York County, PA — Wrightsville Hot Market (2026)`
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
                                                    : isKnox
                                                      ? `Compare 12 NMLS-verified Knoxville mortgage lenders. Mortgage Investors Group, Farragut appreciation, Guild and NAF branches, and tight-inventory expertise.`
                                                      : isBlount
                                                        ? `Compare 12 NMLS-verified Blount County mortgage lenders. Maryville retirees, CrossCountry professionals, VA programs, and mountain lifestyle financing.`
                                                        : isSevier
                                                          ? `Compare 12 NMLS-verified Sevier County mortgage lenders. Gatlinburg vacation rentals, PierPoint fast closings, and tourism-driven investor financing.`
                                                          : isMaricopa
                                                            ? `Compare 24 NMLS-verified Maricopa mortgage lenders. West Valley boomtowns, Queen Creek new construction, Sun American, Lennar, and Southeast Valley family growth.`
                                                            : isPinal
                                                              ? `Compare 12 NMLS-verified Pinal County mortgage lenders. San Tan Valley spillover, Veterans United move-up programs, OneAZ member rates, and Queen Creek border supplements.`
                                                              : isSantaClara
                                                                ? `Compare 12 NMLS-verified Santa Clara mortgage lenders. Jumbo and RSU financing, Guild and NAF branches, PierPoint fast closings, and ultra-competitive San Jose/Cupertino offer dynamics.`
                                                                : isRiverside
                                                                  ? `Compare 12 NMLS-verified Riverside mortgage lenders. Logistics relocations, Lennar new construction, Altura member rates, and $625K–$710K affordability magnet financing.`
                                                                  : isFresno
                                                                    ? `Compare 12 NMLS-verified Fresno mortgage lenders. Clovis elite-school suburbs, Lennar new construction, EECU member rates, and $400K–$430K remote worker financing.`
                                                                    : isKern
                                                                      ? `Compare 12 NMLS-verified Kern mortgage lenders. Bakersfield affordability, positive cash-flow investors, Veterans United programs, and coastal migration support.`
                                                                      : isAdams
                                                                        ? `Compare 12 NMLS-verified Adams mortgage lenders. Erie master-planned new construction, American Financing broker, Lennar builder loans, and north suburban growth.`
                                                                        : isBoulder
                                                                          ? `Compare 12 NMLS-verified Boulder mortgage lenders. Lafayette and Louisville top schools, Elevations member rates, CrossCountry tech-corridor relocations.`
                                                                          : isDouglas
                                                                            ? `Compare 12 NMLS-verified Douglas mortgage lenders. Parker and Centennial family suburbs, NAF new-build volume, and bidding-war-free outer-ring financing.`
                                                                            : isElPaso
                                                                              ? `Compare 12 NMLS-verified El Paso mortgage lenders. Veterans United military programs, Ent Credit Union, Falcon new construction, and Denver affordability safety valve.`
                                                                              : isJefferson
                                                                                ? `Compare 12 NMLS-verified Jefferson mortgage lenders. Evergreen luxury acreage, Golden foothills, Bellco member rates, Lennar mountain modern builds, and Denver commuter pipeline.`
                                                                                : isRoutt
                                                                                  ? `Compare 12 NMLS-verified Routt mortgage lenders. Steamboat Springs resort financing, Alpine Bank second homes, CrossCountry cash buyers, and turnkey mountain modern demand.`
                                                                                  : isCollin
                                                                                    ? `Compare 12 NMLS-verified Collin mortgage lenders. Frisco and McKinney corporate relocations, Supreme Lending broker, Lennar new construction, and Silicon Prairie suburban boom.`
                                                                                    : isDenton
                                                                                      ? `Compare 12 NMLS-verified Denton mortgage lenders. Prosper master-planned growth, Texans Credit Union member rates, and north DFW infrastructure expansion.`
                                                                                      : isGrayson
                                                                                        ? `Compare 12 NMLS-verified Grayson mortgage lenders. Sherman-Denison Texas Instruments workforce housing, CrossCountry manufacturing corridor, and equity-gain financing.`
                                                                                        : isHarris
                                                                                          ? `Compare 12 NMLS-verified Harris mortgage lenders. Katy master-planned communities, MFS broker, Lennar new construction, and resilient Houston suburban financing.`
                                                                                          : isFortBend
                                                                                            ? `Compare 12 NMLS-verified Fort Bend mortgage lenders. Sugar Land medical sector, CrossCountry school districts, First Service member rates, and family stability.`
                                                                                              : isMontgomery
                                                                                                ? `Compare 12 NMLS-verified Montgomery mortgage lenders. The Woodlands top schools, Conroe energy sector, Veterans United programs, and positive YoY growth.`
                                                                                                : isBastrop
                                                                                                  ? `Compare 12 NMLS-verified Bastrop mortgage lenders. SpaceX and Starlink relocations, CrossCountry tech workers, Lennar workforce housing, and rural-to-boom transformation.`
                                                                                                  : isCameron
                                                                                                    ? `Compare 12 NMLS-verified Cameron mortgage lenders. Brownsville Starbase demand, NAF industrial influx, Anchor engineering housing, and Southmost boomtown velocity.`
                                                                                                    : isBexar
                                                                                                      ? `Compare 12 NMLS-verified Bexar mortgage lenders. PrimeLending cash-flow investors, Veterans United military programs, Security Service member rates, and leveled San Antonio value plays.`
                                                                                                      : isSnohomish
                                                                                                        ? `Compare 12 NMLS-verified Snohomish mortgage lenders. Summit Mortgage light rail commuters, BECU aerospace member rates, Lennar transit-oriented builds, and below-Seattle single-family options.`
                                                                                                        : isPierce
                                                                                                          ? `Compare 12 NMLS-verified Pierce mortgage lenders. Heritage Home commuter-rail financing, Veterans United JBLM programs, Sound Credit Union member rates, and $564K median affordability.`
                                                                                                          : isClark
                                                                                                            ? `Compare 12 NMLS-verified Clark mortgage lenders. Columbia River tax-advantage relocations, iQ Credit Union cross-border rates, Lennar waterfront revitalization, and Portland spillover volume.`
                                                                                                            : isDistrictOfColumbia
                                                                                                              ? `Compare 36 NMLS-verified DC mortgage lenders. Upper Northwest value plays, Mid-City historic rowhomes, Brookland first-time buyer entry, Navy Yard waterfront condos, and DCU member rates.`
                                                                                                              : isWorcester
                                                                                                                ? `Compare 12 NMLS-verified Worcester mortgage lenders. Zoom Town growth leader, life sciences relocations, Polar Park revitalization, DCU member rates, and commuter rail affordability.`
                                                                                                                : isMiddlesex
                                                                                                                  ? `Compare 36+ NMLS-verified Middlesex mortgage lenders. Cambridge/Somerville transit hotspots, MetroWest hybrid-work suburbs, Lowell/Malden gateway cities, Green Line demand, and top-tier school districts.`
                                                                                                                  : isSuffolk
                                                                                                                    ? `Compare 24+ NMLS-verified Suffolk mortgage lenders. East Boston waterfront, Dorchester/Jamaica Plain rental yields, Revere Blue Line gateway financing, and high-competition neighborhood demand.`
                                                                                                                    : isEssex
                                                                                                                      ? `Compare 12 NMLS-verified Essex mortgage lenders. Lynn gateway city demand, North Shore commuter transit, Boston spillover affordability, and sharp competitiveness.`
                                                                                                                      : isErie
                                                                                                                        ? `Compare 12 NMLS-verified Erie mortgage lenders. Buffalo top-hot market, 65% above-asking sales, climate refuge appeal, healthcare/education hub, and $227K–$277K affordability.`
                                                                                                                        : isAlbany
                                                                                                                          ? `Compare 12 NMLS-verified Albany mortgage lenders. Capital District supply-demand imbalance, low DOM, government-sector steady activity, and Upstate powerhouse demand.`
                                                                                                                          : isWestchester
                                                                                                                            ? `Compare 16 NMLS-verified Westchester mortgage lenders. White Plains and New Rochelle over-asking sales, 102%+ sale-to-list, Tri-State surge, and Manhattan/Brooklyn relocation.`
                                                                                                                            : isPutnam
                                                                                                                              ? `Compare 16 NMLS-verified Putnam mortgage lenders. 11%+ YoY price gains, NYC suburb affordability alternative, limited inventory, and Tri-State commuter demand.`
                                                                                                                              : isKings
                                                                                                                                ? `Compare 12 NMLS-verified Kings (Brooklyn) mortgage lenders. Southern Brooklyn multi-family rental plays, waterfront rowhomes, lean inventory, and borough bidding wars.`
                                                                                                                                : isQueens
                                                                                                                                  ? `Compare 12 NMLS-verified Queens mortgage lenders. Astoria, LIC, and Flushing growth, modern condos, multi-family investors, and aggressive appreciation.`
                                                                                                                                  : isNewYorkCounty
                                                                                                                                    ? `Compare 12 NMLS-verified Manhattan mortgage lenders. Luxury co-op resurgence, condo financing, urban professionals, and lean-inventory competition.`
                                                                                                                                    : isPhiladelphia
                                                                                                                                      ? `Compare 12+ NMLS-verified Philadelphia mortgage lenders. #6 hottest US market, 41%+ above-asking sales, move-in-ready demand, and collar county spillover.`
                                                                                                                                      : isPaMontgomery
                                                                                                                                        ? `Compare 12 NMLS-verified Montgomery mortgage lenders. Collar county bidding wars, NYC/DC relocators, move-in-ready suburban demand, and Philadelphia Metro competition.`
                                                                                                                                        : isChester
                                                                                                                                          ? `Compare 12 NMLS-verified Chester mortgage lenders. Turn-key suburban homes, intense bidding wars, Philadelphia Metro affordability, and collar county hotspots.`
                                                                                                                                          : isBucks
                                                                                                                                            ? `Compare 12 NMLS-verified Bucks mortgage lenders. NYC/DC affordability safety valve, suburban bidding wars, and Philadelphia Metro collar county demand.`
                                                                                                                                            : isAllegheny
                                                                                                                                              ? `Compare 12 NMLS-verified Allegheny mortgage lenders. Pittsburgh stability, remote worker influx, 8–14 day pending, and Greater Pittsburgh surge.`
                                                                                                                                              : isBeaver
                                                                                                                                                ? `Compare 12 NMLS-verified Beaver mortgage lenders. Baden #3 hottest suburb nationally, tight inventory, rapid pending, and Western PA affordability.`
                                                                                                                                                : isDauphin
                                                                                                                                                  ? `Compare 12 NMLS-verified Dauphin mortgage lenders. Harrisburg 16% YoY appreciation, 31-day sales, government hub demand, and Central PA affordability.`
                                                                                                                                                  : isLehigh
                                                                                                                                                    ? `Compare 12 NMLS-verified Lehigh mortgage lenders. Allentown/Bethlehem 22–31 day pending, NYC/Philly commuter appeal, and lean inventory equilibrium.`
                                                                                                                                                    : isYork
                                                                                                                                                      ? `Compare 12 NMLS-verified York mortgage lenders. Wrightsville #12 national hot market, suburban/rural charm, Baltimore/Harrisburg commuting, and square footage value.`
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