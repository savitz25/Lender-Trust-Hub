# Georgia HMDA slice
- County market rows: **35**
- Lender–county activity (major counties): **10841**
- LEI state summaries: **1061**
- High-confidence LEI→directory mappings: **57**
- Major counties with names: **35**

## Top mapped LEIs by GA originations

- `rocket-mortgage` — Rocket Mortgage, LLC (21182 GA orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (17047 GA orig.)
- `ameris-bank` — Ameris Bank (5627 GA orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (5272 GA orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (5118 GA orig.)
- `truist-bank` — Truist Bank (4837 GA orig.)
- `pennymac` — PennyMac Loan Services, LLC (4168 GA orig.)
- `movement-mortgage-myrtle-beach` — Movement Mortgage, LLC (4139 GA orig.)
- `new-american-funding` — Broker Solutions, Inc. (4063 GA orig.)
- `guild-mortgage-west-valley` — Guild Mortgage Company LLC (3946 GA orig.)
- `ally-bank` — Ally Bank (3788 GA orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (3633 GA orig.)
- `primelending-columbus` — PrimeLending, a PlainsCapital Company (3631 GA orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (3440 GA orig.)
- `regions-bank` — Regions Bank (2869 GA orig.)
- `crosscountry-mortgage-west-valley` — CrossCountry Mortgage, LLC (2777 GA orig.)
- `synovus-bank` — Synovus Bank (2576 GA orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (2560 GA orig.)
- `newrez` — Newrez LLC (2480 GA orig.)
- `academy-mortgage` — Academy Mortgage Corporation (2402 GA orig.)
- `cardinal-financial` — Cardinal Financial Company, Limited Partnership (2388 GA orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (2140 GA orig.)
- `southstate-bank` — SouthState Bank, National Association (1856 GA orig.)
- `wells-fargo-bank` — Wells Fargo Bank, National Association (1509 GA orig.)
- `mr-cooper` — Nationstar Mortgage LLC (1447 GA orig.)

## Major counties (panel-ready)

- **Fulton** (`13121`) — 22578 originations
- **Gwinnett** (`13135`) — 19503 originations
- **Cobb** (`13067`) — 17350 originations
- **DeKalb** (`13089`) — 14488 originations
- **Cherokee** (`13057`) — 8482 originations
- **Forsyth** (`13117`) — 8073 originations
- **Chatham** (`13051`) — 7306 originations
- **Henry** (`13151`) — 6639 originations
- **Paulding** (`13223`) — 5386 originations
- **Hall** (`13139`) — 4853 originations
- **Houston** (`13153`) — 4752 originations
- **Clayton** (`13063`) — 4687 originations
- **Columbia** (`13073`) — 4588 originations
- **Coweta** (`13077`) — 4177 originations
- **Richmond** (`13245`) — 3632 originations
- **Muscogee** (`13215`) — 3529 originations
- **Douglas** (`13097`) — 3400 originations
- **Bartow** (`13015`) — 3294 originations
- **Jackson** (`13157`) — 3115 originations
- **Fayette** (`13113`) — 3108 originations
- **Carroll** (`13045`) — 3017 originations
- **Barrow** (`13013`) — 2989 originations
- **Bibb** (`13021`) — 2887 originations
- **Newton** (`13217`) — 2832 originations
- **Walton** (`13297`) — 2798 originations
- **Lowndes** (`13185`) — 2788 originations
- **Rockdale** (`13247`) — 2428 originations
- **Effingham** (`13103`) — 2168 originations
- **Glynn** (`13127`) — 2110 originations
- **Floyd** (`13115`) — 1996 originations
- **Clarke** (`13059`) — 1877 originations
- **Catoosa** (`13047`) — 1821 originations
- **Bryan** (`13029`) — 1784 originations
- **Whitfield** (`13313`) — 1740 originations
- **Spalding** (`13255`) — 1596 originations

## Matching rules

- Reuse FL/TX curated LEI maps when the LEI has GA activity
- GA-curated LEIs only when GLEIF/legal name + public NMLS are high-confidence
- No fuzzy LEI inventing
