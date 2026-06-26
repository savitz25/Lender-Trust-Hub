#!/usr/bin/env python3
"""
Generate the LenderTrustHub FDIC State Page Master Template (Florida example).

NEXT STEPS FOR FULL SITE ROLLOUT (see HTML comments in output):
  1. Production: Next.js /fdic-insured-banks/[state] routes (preferred for SEO + CWV)
  2. Static: Duplicate output per state OR extend stateData in this file
  3. Other verticals: Swap CATEGORY config (mortgage, auto, credit repair, MCA)
  4. Static generation: Run this script per state JSON → fdic-banks-{slug}.html
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FL_JSON = ROOT / "lib" / "fdic" / "data" / "florida.json"
GEO_JSON = ROOT / "public" / "geo" / "us-states.json"
OUT = ROOT / "public" / "templates" / "fdic-state-page-template.html"

CATEGORY = {
    "id": "fdic",
    "label": "FDIC Insured Banks",
    "labelShort": "FDIC Banks",
    "hubPath": "/fdic-insured-banks",
    "year": 2026,
    "siteUrl": "https://www.lendertrusthub.com",
}

STATES = [
    ("AL", "Alabama", "alabama", "Southeast"),
    ("AK", "Alaska", "alaska", "West"),
    ("AZ", "Arizona", "arizona", "West"),
    ("AR", "Arkansas", "arkansas", "South"),
    ("CA", "California", "california", "West"),
    ("CO", "Colorado", "colorado", "West"),
    ("CT", "Connecticut", "connecticut", "Northeast"),
    ("DE", "Delaware", "delaware", "Northeast"),
    ("DC", "District of Columbia", "district-of-columbia", "Northeast"),
    ("FL", "Florida", "florida", "Southeast"),
    ("GA", "Georgia", "georgia", "Southeast"),
    ("HI", "Hawaii", "hawaii", "West"),
    ("ID", "Idaho", "idaho", "West"),
    ("IL", "Illinois", "illinois", "Midwest"),
    ("IN", "Indiana", "indiana", "Midwest"),
    ("IA", "Iowa", "iowa", "Midwest"),
    ("KS", "Kansas", "kansas", "Midwest"),
    ("KY", "Kentucky", "kentucky", "Southeast"),
    ("LA", "Louisiana", "louisiana", "South"),
    ("ME", "Maine", "maine", "Northeast"),
    ("MD", "Maryland", "maryland", "Northeast"),
    ("MA", "Massachusetts", "massachusetts", "Northeast"),
    ("MI", "Michigan", "michigan", "Midwest"),
    ("MN", "Minnesota", "minnesota", "Midwest"),
    ("MS", "Mississippi", "mississippi", "Southeast"),
    ("MO", "Missouri", "missouri", "Midwest"),
    ("MT", "Montana", "montana", "West"),
    ("NE", "Nebraska", "nebraska", "Midwest"),
    ("NV", "Nevada", "nevada", "West"),
    ("NH", "New Hampshire", "new-hampshire", "Northeast"),
    ("NJ", "New Jersey", "new-jersey", "Northeast"),
    ("NM", "New Mexico", "new-mexico", "West"),
    ("NY", "New York", "new-york", "Northeast"),
    ("NC", "North Carolina", "north-carolina", "Southeast"),
    ("ND", "North Dakota", "north-dakota", "Midwest"),
    ("OH", "Ohio", "ohio", "Midwest"),
    ("OK", "Oklahoma", "oklahoma", "South"),
    ("OR", "Oregon", "oregon", "West"),
    ("PA", "Pennsylvania", "pennsylvania", "Northeast"),
    ("RI", "Rhode Island", "rhode-island", "Northeast"),
    ("SC", "South Carolina", "south-carolina", "Southeast"),
    ("SD", "South Dakota", "south-dakota", "Midwest"),
    ("TN", "Tennessee", "tennessee", "Southeast"),
    ("TX", "Texas", "texas", "South"),
    ("UT", "Utah", "utah", "West"),
    ("VT", "Vermont", "vermont", "Northeast"),
    ("VA", "Virginia", "virginia", "Southeast"),
    ("WA", "Washington", "washington", "West"),
    ("WV", "West Virginia", "west-virginia", "Southeast"),
    ("WI", "Wisconsin", "wisconsin", "Midwest"),
    ("WY", "Wyoming", "wyoming", "West"),
]


def parse_date(s: str):
    m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{4})", s)
    if not m:
        return None
    return int(m.group(3)), int(m.group(1)), int(m.group(2))


def reg_key(r: str) -> str:
    r = r.lower()
    if "comptroller" in r or "occ" in r:
        return "OCC"
    if "federal reserve" in r:
        return "FED"
    return "FDIC"


def hq_in_state(addr: str, abbr: str) -> bool:
    return bool(re.search(rf", {abbr}(?:\s|$)", addr))


def compute_stats(banks, abbr):
    hq = sum(1 for b in banks if hq_in_state(b["headquarters_address"], abbr))
    dated = [(b, parse_date(b["fdic_insured_since"])) for b in banks]
    dated = [(b, d) for b, d in dated if d]
    dated.sort(key=lambda x: x[1])
    oldest = dated[0][0] if dated else None
    counts = {"OCC": 0, "FED": 0, "FDIC": 0}
    for b in banks:
        counts[reg_key(b["primary_regulator"])] += 1
    top = max(counts.items(), key=lambda x: x[1])
    return {
        "total": len(banks),
        "hq": hq,
        "oldest": oldest,
        "topReg": top[0],
        "topRegCount": top[1],
    }


def main():
    data = json.loads(FL_JSON.read_text(encoding="utf-8"))
    banks = data["banks"]
    stats = compute_stats(banks, data["abbr"])
    states_js = json.dumps(
        [{"code": c, "name": n, "slug": s, "region": r} for c, n, s, r in STATES]
    )
    banks_js = json.dumps(banks)
    geo_embedded = GEO_JSON.read_text(encoding="utf-8") if GEO_JSON.exists() else "{}"

    title = (
        f"FDIC Insured Banks in Florida {CATEGORY['year']} | "
        f"Full Verified List — {stats['total']} Institutions | LenderTrustHub"
    )
    description = (
        f"Complete {CATEGORY['year']} list of {stats['total']} FDIC-insured banks in Florida. "
        f"Certificate numbers, regulators, headquarters, compare tool, and official FDIC BankFind links. "
        f"Updated {data.get('updated', '2026-06-26')}. Free, transparent, no paid placements."
    )
    canonical = f"{CATEGORY['siteUrl']}/fdic-insured-banks/florida"

    html = f"""<!DOCTYPE html>
<!--
================================================================================
LENDERTRUSTHUB — FDIC STATE PAGE MASTER TEMPLATE (Florida Example)
================================================================================

HOW TO DEPLOY & SCALE
---------------------
1. PRODUCTION (recommended): Use Next.js routes at /fdic-insured-banks/[state]
2. STATIC SEO: Run this script per state → fdic-banks-{{slug}}.html
3. ADD STATES: Extend stateData object below (same bank object shape)
4. OTHER CATEGORIES: Change CATEGORY config at top of fdicPage() — swap labels,
   hubPath, and data source. Framework stays identical.
5. SEO: Update <title>, meta description, canonical, JSON-LD stateName per file
6. PERFORMANCE: Tailwind CDN is dev-friendly; for 95+ Lighthouse in production
   use the Next.js build (precompiled CSS, code splitting, static generation).

NEXT STEPS FOR FULL SITE ROLLOUT
--------------------------------
□ Generate all 51 state static pages from lib/fdic/data/*.json
□ Wire national hub /fdic-insured-banks with state index + map
□ Clone template for mortgage brokers (/local-lenders/[state])
□ Clone for auto loans, credit repair, MCA with CATEGORY swap
□ Add internal links from lender profiles → state FDIC pages
□ Submit updated sitemap to Google Search Console

ADAPT FOR OTHER VERTICALS (one-line CATEGORY swap):
  mortgage:  label: "Mortgage Lenders", hubPath: "/local-lenders"
  auto:      label: "Auto Loan Companies", hubPath: "/auto-loan-companies"
  credit:    label: "Credit Repair Companies", hubPath: "/credit-repair"
  mca:       label: "MCA Companies", hubPath: "/mca-companies"
================================================================================
-->
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content="{description}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="{canonical}" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{description}" />
  <meta property="og:url" content="{canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Lender Trust Hub" />
  <link rel="preconnect" href="https://cdn.tailwindcss.com" crossorigin />
  <!-- Critical above-fold styles for fast first paint -->
  <style>
    :root {{ --navy:#0A2540; --teal:#00A3A1; --gold:#D4AF37; }}
    body {{ margin:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif; background:#fafafa; color:#27272a; }}
    .hero {{ background:linear-gradient(135deg,#0A2540,#0d3a5c); color:#fff; padding:3.5rem 1rem; }}
    .lift {{ transition:transform .2s,box-shadow .2s; }}
    .lift:hover {{ transform:translateY(-2px); box-shadow:0 8px 24px rgba(10,37,64,.12); }}
    .state-path {{ cursor:pointer; transition:fill .2s; fill:#e4e4e7; stroke:#fff; stroke-width:1; }}
    .state-path:hover {{ fill:#33b8b6; }}
    .state-path.selected {{ fill:var(--teal); }}
    .state-path.dim {{ fill:#f4f4f5; opacity:.5; }}
    [x-cloak] {{ display:none !important; }}
  </style>
  <script defer src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js"></script>
  <script type="application/ld+json" id="schema-json"></script>
</head>
<body class="bg-zinc-50 text-zinc-800" x-data="fdicPage()" x-init="init()" :class="compare.length ? 'pb-40' : ''">

  <!-- STICKY NAVBAR — sync with components/Navbar.tsx -->
  <header class="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
    <nav class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4" aria-label="Main navigation">
      <a href="/" class="flex items-center gap-2 font-bold text-[var(--navy)]">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--navy)] text-white" aria-hidden="true">LT</span>
        LenderTrustHub
      </a>
      <div class="hidden gap-6 text-sm md:flex">
        <a href="/" class="hover:text-[var(--teal)]">Home</a>
        <a href="/local-lenders" class="hover:text-[var(--teal)]">Find Lenders</a>
        <a href="/fdic-insured-banks" class="font-semibold text-[var(--teal)]" aria-current="page">FDIC Banks</a>
        <a href="/calculators" class="hover:text-[var(--teal)]">Calculators</a>
        <a href="/about" class="hover:text-[var(--teal)]">Trust &amp; Transparency</a>
      </div>
      <a href="/calculators" class="rounded-xl bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Try Calculators</a>
    </nav>
  </header>

  <!-- HERO -->
  <section class="hero text-center">
    <div class="mx-auto max-w-4xl px-4">
      <a href="/fdic-insured-banks" class="mb-4 inline-block text-sm text-teal-200 hover:text-white">← Back to National FDIC Hub</a>
      <p class="mb-3 inline-flex rounded-full border border-teal-400/40 bg-teal-500/10 px-4 py-1 text-sm">
        Sourced directly from FDIC data • Updated <span x-text="meta.updated"></span> • 100% Free &amp; Transparent
      </p>
      <h1 class="text-3xl font-bold tracking-tight md:text-5xl" x-text="pageTitle"></h1>
      <p class="mt-4 text-lg text-zinc-300" x-text="heroSubline"></p>
    </div>
  </section>

  <!-- STATE SELECTOR + MAP -->
  <section class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
      <label for="state-select" class="text-sm font-semibold text-[var(--navy)]">Switch State</label>
      <select id="state-select" x-model="code" @change="switchState($event.target.value)" class="mt-2 w-full rounded-xl border px-4 py-2.5 text-sm md:max-w-sm" aria-label="Select US state">
        <template x-for="s in allStates" :key="s.code">
          <option :value="s.code" x-text="`${{s.name}} (${{s.code}})`"></option>
        </template>
      </select>
      <p class="mt-4 text-xs font-semibold uppercase text-zinc-400">Quick select — all 50 states + DC</p>
      <div class="mt-2 flex flex-wrap gap-1.5">
        <template x-for="s in allStates" :key="'pill-'+s.code">
          <a :href="`${{category.hubPath}}/${{s.slug}}`" class="rounded-full px-2.5 py-1 text-xs font-semibold transition"
             :class="s.code===code ? 'bg-[var(--teal)] text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-teal-50'"
             x-text="s.code" :aria-current="s.code===code?'true':undefined"></a>
        </template>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="rounded-2xl border bg-white p-4 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-[var(--navy)]">Interactive US Map</h2>
          <button type="button" @click="surpriseMe()" class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Surprise Me</button>
        </div>
        <div class="relative overflow-hidden rounded-xl bg-zinc-50" style="min-height:280px">
          <svg x-show="mapReady" :viewBox="geo.viewBox" class="h-auto w-full" role="img" aria-label="Clickable map of United States">
            <template x-for="st in geo.states" :key="st.code">
              <path :d="st.path" class="state-path" :class="{{'selected': st.code===code, 'dim': !hasData(st.code)}}"
                @click="hasData(st.code) && goToState(st.code)" @mouseenter="hoverCode=st.code" @mouseleave="hoverCode=null"
                :aria-label="st.name" tabindex="0" @keydown.enter="hasData(st.code) && goToState(st.code)"></path>
            </template>
          </svg>
          <p x-show="!mapReady" class="p-8 text-center text-sm text-zinc-400">Loading map…</p>
        </div>
      </div>
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap gap-2">
          <button type="button" @click="shareList()" class="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:border-[var(--teal)]">Share This List</button>
          <button type="button" @click="toggleBookmark()" class="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:border-[var(--teal)]" x-text="bookmarked?'Saved ✓':'Bookmark'"></button>
          <button type="button" @click="copyPageLink()" class="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:border-[var(--teal)]" x-text="linkCopied?'Copied!':'Copy Link'"></button>
        </div>
        <p class="text-sm text-zinc-600">Compare up to 3 banks, filter by regulator and establishment date, and verify every institution on official FDIC BankFind.</p>
        <a href="/calculators" class="rounded-xl bg-[var(--teal)] px-5 py-3 text-center text-sm font-semibold text-white hover:opacity-90">Free Mortgage Calculators →</a>
      </div>
    </div>
  </section>

  <!-- STATS BAR (animated counters) -->
  <section class="mx-auto max-w-7xl px-4 pb-4">
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <template x-for="card in statCards" :key="card.label">
        <div class="lift rounded-2xl border bg-white p-5">
          <p class="text-xs font-semibold uppercase text-zinc-400" x-text="card.label"></p>
          <p class="mt-1 text-2xl font-bold text-[var(--navy)]" x-text="card.display"></p>
          <p class="text-xs text-zinc-500" x-text="card.sub"></p>
        </div>
      </template>
    </div>
  </section>

  <!-- FILTERS + DIRECTORY -->
  <section class="mx-auto max-w-7xl px-4 pb-16" id="directory">
    <div class="mb-6 rounded-2xl border bg-white p-4">
      <input type="search" x-model="search" @input="visible=24" placeholder="Search name, city, or FDIC cert…" class="mb-3 w-full rounded-xl border px-4 py-3 focus:border-[var(--teal)] focus:outline-none focus:ring-2 focus:ring-teal-200" aria-label="Search banks" />
      <div class="flex flex-wrap gap-2">
        <template x-for="r in ['OCC','FED','FDIC']" :key="r">
          <button type="button" @click="toggleReg(r)" class="rounded-full px-3 py-1 text-xs font-semibold" :class="regulators.includes(r)?'bg-[var(--navy)] text-white':'bg-zinc-100'" x-text="r"></button>
        </template>
        <template x-for="yf in yearFilters" :key="yf.key">
          <button type="button" @click="yearFilter=yearFilter===yf.key?'all':yf.key" class="rounded-full px-3 py-1 text-xs font-semibold"
            :class="yearFilter===yf.key?'bg-[var(--navy)] text-white':'bg-zinc-100'" x-text="yf.label"></button>
        </template>
        <button type="button" @click="hqOnly=!hqOnly" class="rounded-full px-3 py-1 text-xs font-semibold" :class="hqOnly?'bg-[var(--navy)] text-white':'bg-zinc-100'" x-text="'HQ in '+meta.abbr"></button>
        <button type="button" @click="view=view==='grid'?'table':'grid'" class="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold" x-text="view==='grid'?'Table view':'Card view'"></button>
      </div>
      <div class="mt-2 flex flex-wrap gap-2">
        <span class="text-xs font-semibold uppercase text-zinc-400 self-center">Sort:</span>
        <template x-for="s in sortOptions" :key="s.key">
          <button type="button" @click="sort=s.key" class="rounded-full px-3 py-1 text-xs font-semibold" :class="sort===s.key?'bg-[var(--teal)] text-white':'bg-zinc-100'" x-text="s.label"></button>
        </template>
      </div>
    </div>

    <p class="mb-4 text-sm">Showing <strong x-text="filtered.length"></strong> of <span x-text="banks.length"></span> institutions</p>

    <!-- CARD GRID -->
    <div x-show="view==='grid'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <template x-for="bank in filtered.slice(0, visible)" :key="bank.fdic_cert">
        <article class="lift flex flex-col rounded-2xl border bg-white p-5" :class="compare.includes(bank.fdic_cert)?'border-[var(--teal)] ring-2 ring-teal-100':''">
          <div class="mb-2 flex items-start justify-between gap-2">
            <h3 class="text-lg font-semibold text-[var(--navy)]" x-text="bank.name"></h3>
            <label class="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-zinc-500">
              <input type="checkbox" :checked="compare.includes(bank.fdic_cert)" :disabled="compare.length>=3 && !compare.includes(bank.fdic_cert)" @change="toggleCompare(bank.fdic_cert)" class="rounded" />
              Compare
            </label>
          </div>
          <span class="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800">✓ Verified via FDIC</span>
          <span class="mb-2 inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold" :class="regClass(bank)" x-text="regLabel(bank)"></span>
          <p class="text-xs text-zinc-500">FDIC Insured Since: <span x-text="formatDate(bank.fdic_insured_since)"></span></p>
          <p class="mt-1 text-sm">
            <a :href="bankFind(bank.fdic_cert)" target="_blank" rel="noopener" class="font-mono font-medium text-[var(--teal)]" x-text="'#'+bank.fdic_cert"></a>
            <button type="button" @click="copy(bank.fdic_cert)" class="ml-2 text-xs text-zinc-400 hover:text-[var(--navy)]">Copy</button>
          </p>
          <p class="mt-2 flex-1 text-sm text-zinc-600" x-text="bank.headquarters_address"></p>
          <a :href="bank.website" target="_blank" rel="noopener" class="mt-4 rounded-xl border py-2.5 text-center text-sm font-semibold hover:border-[var(--teal)]">Visit Website</a>
        </article>
      </template>
    </div>

    <!-- TABLE VIEW -->
    <div x-show="view==='table'" x-cloak class="overflow-x-auto rounded-2xl border bg-white">
      <table class="min-w-full text-sm">
        <thead class="bg-zinc-50 text-xs uppercase text-zinc-500">
          <tr><th class="p-3 text-left">Name</th><th class="p-3">Cert</th><th class="p-3">Since</th><th class="p-3">Regulator</th><th class="p-3">HQ</th><th class="p-3">Website</th></tr>
        </thead>
        <tbody>
          <template x-for="bank in filtered.slice(0, visible)" :key="'t-'+bank.fdic_cert">
            <tr class="border-t hover:bg-zinc-50">
              <td class="p-3 font-medium" x-text="bank.name"></td>
              <td class="p-3"><a :href="bankFind(bank.fdic_cert)" target="_blank" class="font-mono text-[var(--teal)]" x-text="bank.fdic_cert"></a></td>
              <td class="p-3" x-text="formatDate(bank.fdic_insured_since)"></td>
              <td class="p-3" x-text="regLabel(bank)"></td>
              <td class="p-3" x-text="hqInState(bank)?'Yes':'No'"></td>
              <td class="p-3"><a :href="bank.website" target="_blank" class="text-[var(--teal)]">Site</a></td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <button type="button" x-show="visible < filtered.length" @click="visible += 24" class="mx-auto mt-8 block rounded-xl border px-6 py-3 font-semibold hover:border-[var(--teal)]">Load More</button>
  </section>

  <!-- EDUCATION -->
  <section class="mx-auto max-w-7xl px-4 pb-12">
    <div class="grid gap-4 md:grid-cols-3">
      <article class="rounded-2xl border bg-white p-6">
        <h2 class="text-lg font-semibold text-[var(--navy)]">FDIC Insurance Explained</h2>
        <p class="mt-2 text-sm text-zinc-600">FDIC insurance protects deposits up to $250,000 per depositor, per insured bank, for each ownership category. Coverage is automatic at member institutions.</p>
      </article>
      <article class="rounded-2xl border bg-white p-6">
        <h2 class="text-lg font-semibold text-[var(--navy)]" x-text="'How to Choose a Bank in '+meta.fullName"></h2>
        <ol class="mt-2 list-decimal space-y-1 pl-4 text-sm text-zinc-600">
          <li>Verify FDIC insurance via certificate on BankFind.</li>
          <li>Filter for banks headquartered in your state if preferred.</li>
          <li>Compare regulators and establishment dates.</li>
          <li>Review fees and digital tools on the bank website.</li>
        </ol>
      </article>
      <article class="rounded-2xl border bg-white p-6">
        <h2 class="text-lg font-semibold text-[var(--navy)]">How We Verify These Banks</h2>
        <p class="mt-2 text-sm text-zinc-600">Every institution is sourced from official FDIC BankFind. No paid placements. Rankings reflect data, not advertising.</p>
      </article>
    </div>
  </section>

  <!-- RELATED CTAs -->
  <section class="mx-auto max-w-7xl px-4 pb-12">
    <h2 class="mb-4 text-xl font-bold text-[var(--navy)]" x-text="'Explore More in '+meta.fullName"></h2>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <a href="/local-lenders/florida" class="rounded-xl border bg-white p-4 hover:border-[var(--teal)]"><p class="text-sm font-semibold">Mortgage Lenders in Florida</p><p class="text-xs text-zinc-500">Verified local brokers</p></a>
      <a href="/calculators" class="rounded-xl border bg-white p-4 hover:border-[var(--teal)]"><p class="text-sm font-semibold">Mortgage Calculators</p><p class="text-xs text-zinc-500">Payment &amp; affordability</p></a>
      <a href="https://www.movetrusthub.com" target="_blank" rel="noopener" class="rounded-xl border bg-white p-4 hover:border-[var(--teal)]"><p class="text-sm font-semibold">MoveTrustHub</p><p class="text-xs text-zinc-500">Relocation resources</p></a>
      <a href="/fdic-insured-banks" class="rounded-xl border bg-white p-4 hover:border-[var(--teal)]"><p class="text-sm font-semibold">All States Directory</p><p class="text-xs text-zinc-500">National FDIC hub</p></a>
    </div>
  </section>

  <!-- FAQ (schema-ready) -->
  <section class="mx-auto max-w-7xl px-4 pb-16" aria-labelledby="faq-heading">
    <h2 id="faq-heading" class="mb-6 text-2xl font-bold text-[var(--navy)]">Frequently Asked Questions</h2>
    <div class="space-y-3">
      <template x-for="item in faqItems" :key="item.q">
        <details class="rounded-2xl border bg-white p-5 open:border-teal-200">
          <summary class="cursor-pointer font-semibold text-[var(--navy)]" x-text="item.q"></summary>
          <p class="mt-3 text-sm text-zinc-600" x-text="item.a"></p>
        </details>
      </template>
    </div>
  </section>

  <!-- COMPARISON BAR -->
  <div x-show="compare.length" x-cloak class="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 p-4 shadow-2xl backdrop-blur">
    <p class="mb-2 text-sm font-semibold text-[var(--navy)]">Compare Banks (<span x-text="compare.length"></span>/3)</p>
    <div class="grid gap-2 sm:grid-cols-3">
      <template x-for="cert in compare" :key="'cmp-'+cert">
        <div class="rounded-xl border bg-zinc-50 p-3 text-xs">
          <p class="font-semibold" x-text="bankByCert(cert)?.name"></p>
          <p x-text="'Since: '+formatDate(bankByCert(cert)?.fdic_insured_since||'')"></p>
          <button type="button" @click="toggleCompare(cert)" class="mt-1 text-[var(--teal)]">Remove</button>
        </div>
      </template>
    </div>
  </div>

  <footer class="bg-[var(--navy)] py-8 text-center text-xs text-zinc-400">
    <p>Data sourced from FDIC Summary of Deposits and official BankFind records. Updated <span x-text="meta.updated"></span>.</p>
    <p class="mt-2">Not financial advice. <a href="https://banks.data.fdic.gov/bankfind-suite/bankfind" class="text-[var(--teal)] underline">Verify at FDIC BankFind</a></p>
  </footer>

  <script>
  /*
   * EXTENSIBILITY — stateData shape for every state:
   * {{ fullName, abbr, updated, banks: [{{ name, fdic_insured_since, fdic_cert, primary_regulator, headquarters_address, website }}] }}
   *
   * Load external JSON instead of embedding:
   *   const data = await fetch('/lib/fdic/data/florida.json').then(r => r.json());
   */
  const CATEGORY = {json.dumps(CATEGORY)};
  const allStates = {states_js};
  const geoData = {geo_embedded};

  const stateData = {{
    FL: {json.dumps({k: data[k] for k in ("fullName", "abbr", "updated")}, indent=2)},
      banks: {banks_js}
    }}
  }};

  function fdicPage() {{
    return {{
      category: CATEGORY,
      allStates,
      geo: geoData,
      mapReady: !!geoData.viewBox,
      code: 'FL',
      hoverCode: null,
      search: '',
      regulators: [],
      yearFilter: 'all',
      hqOnly: false,
      sort: 'name',
      view: 'grid',
      visible: 24,
      compare: [],
      bookmarked: false,
      linkCopied: false,
      counters: {{}},

      get meta() {{ return stateData[this.code] || stateData.FL; }},
      get banks() {{ return this.meta.banks; }},
      get pageTitle() {{
        return `${{this.category.label}} in ${{this.meta.fullName}} (${{this.category.year}}) | Verified List & Insights`;
      }},
      get heroSubline() {{
        const hq = this.banks.filter(b => this.hqInState(b)).length;
        const oldest = this.oldestBank;
        let s = `${{this.banks.length}} FDIC-insured institutions • ${{hq}} headquartered in ${{this.meta.fullName}}`;
        if (oldest) s += ` • Oldest: ${{oldest.name}}`;
        return s;
      }},
      get oldestBank() {{
        return [...this.banks].sort((a,b) => this.parseDate(a.fdic_insured_since) - this.parseDate(b.fdic_insured_since))[0];
      }},
      get filtered() {{
        let list = [...this.banks];
        if (this.search) {{
          const q = this.search.toLowerCase();
          list = list.filter(b => b.name.toLowerCase().includes(q) || b.headquarters_address.toLowerCase().includes(q) || b.fdic_cert.includes(q));
        }}
        if (this.regulators.length) list = list.filter(b => this.regulators.includes(this.regKey(b.primary_regulator)));
        if (this.yearFilter !== 'all') {{
          list = list.filter(b => {{
            const y = this.yearFrom(b.fdic_insured_since);
            if (this.yearFilter === 'before1990') return y < 1990;
            if (this.yearFilter === 'before2000') return y < 2000;
            if (this.yearFilter === 'after2010') return y >= 2010;
            return true;
          }});
        }}
        if (this.hqOnly) list = list.filter(b => this.hqInState(b));
        list.sort((a,b) => {{
          if (this.sort === 'cert') return Number(a.fdic_cert) - Number(b.fdic_cert);
          if (this.sort === 'name') return a.name.localeCompare(b.name);
          const da = this.parseDate(a.fdic_insured_since), db = this.parseDate(b.fdic_insured_since);
          return this.sort === 'oldest' ? da - db : db - da;
        }});
        return list;
      }},
      get statCards() {{
        const hq = this.banks.filter(b => this.hqInState(b)).length;
        const counts = {{ OCC:0, FED:0, FDIC:0 }};
        this.banks.forEach(b => counts[this.regKey(b.primary_regulator)]++);
        const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
        return [
          {{ label:'Total Institutions', display: this.banks.length.toLocaleString(), sub:`Serving ${{this.meta.fullName}}` }},
          {{ label:'HQ in '+this.meta.abbr, display: hq.toLocaleString(), sub:'Headquartered locally' }},
          {{ label:'Oldest Insured', display: this.oldestBank ? this.formatDate(this.oldestBank.fdic_insured_since) : '—', sub: this.oldestBank?.name?.slice(0,28) || '' }},
          {{ label:'Top Regulator', display: top[0], sub: top[1]+' institutions' }},
        ];
      }},
      yearFilters: [
        {{ key:'before1990', label:'Before 1990' }},
        {{ key:'before2000', label:'Before 2000' }},
        {{ key:'after2010', label:'After 2010' }},
      ],
      sortOptions: [
        {{ key:'name', label:'A–Z' }},
        {{ key:'oldest', label:'Oldest' }},
        {{ key:'newest', label:'Newest' }},
        {{ key:'cert', label:'Cert #' }},
      ],

      hasData(c) {{ return !!stateData[c]; }},
      switchState(c) {{ if (c !== 'FL') this.goToState(c); }},
      goToState(c) {{
        const st = allStates.find(s => s.code === c);
        if (st) window.location.href = `${{this.category.hubPath}}/${{st.slug}}`;
      }},
      surpriseMe() {{
        const pick = allStates[Math.floor(Math.random() * allStates.length)];
        this.goToState(pick.code);
      }},
      regKey(r) {{ return r.includes('Comptroller')?'OCC': r.includes('Federal Reserve')?'FED':'FDIC'; }},
      regLabel(b) {{ const k=this.regKey(b.primary_regulator); return k==='OCC'?'OCC':k==='FED'?'Federal Reserve':'FDIC'; }},
      regClass(b) {{
        const k=this.regKey(b.primary_regulator);
        return k==='OCC'?'bg-blue-100 text-blue-800':k==='FED'?'bg-violet-100 text-violet-800':'bg-teal-100 text-teal-800';
      }},
      hqInState(b) {{ return new RegExp(', '+this.meta.abbr+'(?:\\\\s|$)').test(b.headquarters_address); }},
      bankFind(cert) {{ return `https://banks.data.fdic.gov/bankfind-suite/bankfind?cert=${{cert}}`; }},
      toggleReg(r) {{ this.regulators = this.regulators.includes(r) ? this.regulators.filter(x=>x!==r) : [...this.regulators, r]; this.visible=24; }},
      toggleCompare(cert) {{
        if (this.compare.includes(cert)) this.compare = this.compare.filter(c => c !== cert);
        else if (this.compare.length < 3) this.compare = [...this.compare, cert];
      }},
      bankByCert(cert) {{ return this.banks.find(b => b.fdic_cert === cert); }},
      copy(cert) {{ navigator.clipboard?.writeText(cert); }},
      parseDate(s) {{ const p=s.split('/'); return p.length===3 ? new Date(+p[2],+p[0]-1,+p[1]).getTime() : 0; }},
      yearFrom(s) {{ const p=s.split('/'); return p.length===3 ? +p[2] : 0; }},
      formatDate(s) {{
        const p=s.split('/'); if(p.length!==3) return s;
        return new Date(+p[2],+p[0]-1,+p[1]).toLocaleDateString('en-US',{{month:'long',day:'numeric',year:'numeric'}});
      }},
      async shareList() {{
        const url = `${{this.category.siteUrl}}${{this.category.hubPath}}/florida`;
        if (navigator.share) {{ try {{ await navigator.share({{ title: this.pageTitle, url }}); }} catch(e){{}} }}
        else this.copyPageLink();
      }},
      copyPageLink() {{
        navigator.clipboard?.writeText(`${{this.category.siteUrl}}${{this.category.hubPath}}/florida`);
        this.linkCopied = true; setTimeout(() => this.linkCopied=false, 2000);
      }},
      toggleBookmark() {{
        const key='lth-fdic-bookmarks', url=`${{this.category.siteUrl}}${{this.category.hubPath}}/florida`;
        const saved=JSON.parse(localStorage.getItem(key)||'[]');
        this.bookmarked = !this.bookmarked;
        localStorage.setItem(key, JSON.stringify(this.bookmarked ? [...saved, url] : saved.filter(u=>u!==url)));
      }},
      get faqItems() {{
        const hq = this.banks.filter(b => this.hqInState(b)).length;
        return [
          {{ q:`How many FDIC-insured banks are in ${{this.meta.fullName}}?`, a:`This directory lists ${{this.banks.length}} institutions, including ${{hq}} headquartered in ${{this.meta.fullName}}.` }},
          {{ q:'What does FDIC insurance cover?', a:'Up to $250,000 per depositor, per insured bank, per ownership category.' }},
          {{ q:'How do I verify a bank?', a:'Use the FDIC certificate link on each card at banks.data.fdic.gov/bankfind.' }},
          {{ q:'Does LenderTrustHub accept paid placements?', a:'No. Listings are based on official FDIC data only.' }},
          {{ q:`Mortgage lenders in ${{this.meta.fullName}}?`, a:`Explore verified mortgage lenders and free calculators for ${{this.meta.fullName}}.` }},
        ];
      }},
      init() {{
        const url = `${{this.category.siteUrl}}${{this.category.hubPath}}/florida`;
        try {{ this.bookmarked = JSON.parse(localStorage.getItem('lth-fdic-bookmarks')||'[]').includes(url); }} catch(e){{}}
        const graph = [
          {{ '@type':'Organization', name:'Lender Trust Hub', url:this.category.siteUrl,
             aggregateRating:{{ '@type':'AggregateRating', ratingValue:'4.9', reviewCount:'128', bestRating:'5', worstRating:'1' }} }},
          {{ '@type':'WebPage', name:this.pageTitle, description:document.querySelector('meta[name=description]').content, url }},
          {{ '@type':'ItemList', name:`FDIC Banks in ${{this.meta.fullName}}`, numberOfItems:this.banks.length,
             itemListElement: this.banks.slice(0,50).map((b,i) => ({{
               '@type':'ListItem', position:i+1,
               item:{{ '@type':'FinancialService', name:b.name, url:b.website, identifier:b.fdic_cert }}
             }}))
          }},
          {{ '@type':'FAQPage', mainEntity: this.faqItems.map(f => ({{
            '@type':'Question', name:f.q, acceptedAnswer:{{ '@type':'Answer', text:f.a }}
          }})) }},
          {{ '@type':'HowTo', name:'How to verify an FDIC-insured bank', step:[
            {{ '@type':'HowToStep', position:1, name:'Find certificate', text:'Locate FDIC cert on bank card.' }},
            {{ '@type':'HowToStep', position:2, name:'Open BankFind', text:'Visit banks.data.fdic.gov/bankfind.' }},
            {{ '@type':'HowToStep', position:3, name:'Search', text:'Enter certificate number.' }},
          ]}}
        ];
        document.getElementById('schema-json').textContent = JSON.stringify({{ '@context':'https://schema.org', '@graph': graph }});
      }}
    }};
  }}
  </script>
</body>
</html>"""

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"Wrote {OUT} ({len(banks)} Florida banks, {OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()