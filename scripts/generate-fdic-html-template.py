#!/usr/bin/env python3
"""Generate standalone FDIC state page HTML template with Florida data embedded."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FL_JSON = ROOT / "lib" / "fdic" / "data" / "florida.json"
OUT = ROOT / "public" / "templates" / "fdic-state-page-template.html"

# HOW TO DEPLOY & SCALE (included as HTML comments in output):
# 1. Copy this file per state OR load stateData[stateCode] from external JSON
# 2. For Next.js production: use /fdic-insured-banks/[state] routes (already live)
# 3. To adapt for mortgage/auto/credit repair: swap stateData keys and badge labels
# 4. Customize <title>, meta description, and JSON-LD stateName/year per state

def main():
    data = json.loads(FL_JSON.read_text(encoding="utf-8"))
    banks_js = json.dumps(data["banks"], indent=2)

    html = f"""<!DOCTYPE html>
<!--
  HOW TO DEPLOY & SCALE — LenderTrustHub FDIC State Page Template
  ==============================================================
  1. PRODUCTION: Next.js routes at /fdic-insured-banks/[state] (preferred for SEO)
  2. STATIC: Duplicate this file as fdic-banks-florida.html, etc.
  3. ADD STATES: Extend stateData object below with same bank shape per state
  4. OTHER CATEGORIES: Replace "FDIC Insured Banks" labels; keep filter/map UX
  5. SEO: Update title, meta description, canonical, JSON-LD stateName per file
-->
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FDIC Insured Banks in Florida 2026 | Full Verified List | LenderTrustHub</title>
  <meta name="description" content="Complete 2026 list of FDIC-insured banks in Florida. Certificate numbers, regulators, headquarters, and official FDIC BankFind links. Free, transparent, no paid placements." />
  <link rel="canonical" href="https://www.lendertrusthub.com/fdic-insured-banks/florida" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <style>
    :root {{ --navy: #0A2540; --teal: #00A3A1; --gold: #D4AF37; }}
    .lift:hover {{ transform: translateY(-2px); box-shadow: 0 8px 24px rgba(10,37,64,.12); }}
    .state-path {{ cursor: pointer; transition: fill .2s; }}
    .state-path:hover {{ fill: #33b8b6; }}
    .state-path.selected {{ fill: var(--teal); }}
  </style>
  <script type="application/ld+json" id="schema-json"></script>
</head>
<body class="bg-zinc-50 text-zinc-800" x-data="fdicPage()" x-init="init()">
  <!-- Sticky Navbar -->
  <header class="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
    <nav class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4" aria-label="Main">
      <a href="/" class="flex items-center gap-2 font-bold text-[var(--navy)]">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--navy)] text-white">LT</span>
        LenderTrustHub
      </a>
      <div class="hidden gap-6 text-sm md:flex">
        <a href="/">Home</a>
        <a href="/local-lenders">Find Lenders</a>
        <a href="/fdic-insured-banks" class="font-semibold text-[var(--teal)]">FDIC Banks</a>
        <a href="/calculators">Calculators</a>
      </div>
      <a href="/calculators" class="rounded-xl bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white">Calculators</a>
    </nav>
  </header>

  <!-- Hero -->
  <section class="bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-16 text-white">
    <div class="mx-auto max-w-4xl px-4 text-center">
      <a href="/fdic-insured-banks" class="mb-4 inline-block text-sm text-teal-200">← Back to National FDIC Hub</a>
      <p class="mb-3 inline-flex rounded-full border border-teal-400/40 bg-teal-500/10 px-4 py-1 text-sm">Sourced from FDIC • Updated <span x-text="meta.updated"></span></p>
      <h1 class="text-3xl font-bold md:text-5xl" x-text="`FDIC Insured Banks in ${{meta.fullName}} (2026) | Verified List & Insights`"></h1>
      <p class="mt-4 text-lg text-zinc-300" x-text="heroSubline"></p>
    </div>
  </section>

  <!-- Stats -->
  <section class="mx-auto max-w-7xl px-4 py-8">
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <template x-for="card in statCards" :key="card.label">
        <div class="lift rounded-2xl border bg-white p-5 transition">
          <p class="text-xs font-semibold uppercase text-zinc-400" x-text="card.label"></p>
          <p class="mt-1 text-2xl font-bold text-[var(--navy)]" x-text="card.value"></p>
          <p class="text-xs text-zinc-500" x-text="card.sub"></p>
        </div>
      </template>
    </div>
  </section>

  <!-- Filters + Directory -->
  <section class="mx-auto max-w-7xl px-4 pb-16">
    <div class="mb-6 rounded-2xl border bg-white p-4">
      <input type="search" x-model="search" placeholder="Search name, city, or cert..." class="mb-3 w-full rounded-xl border px-4 py-3" aria-label="Search banks" />
      <div class="flex flex-wrap gap-2">
        <template x-for="r in ['OCC','FED','FDIC']" :key="r">
          <button type="button" @click="toggleReg(r)" class="rounded-full px-3 py-1 text-xs font-semibold" :class="regulators.includes(r)?'bg-[var(--navy)] text-white':'bg-zinc-100'" x-text="r"></button>
        </template>
        <button type="button" @click="hqOnly=!hqOnly" class="rounded-full px-3 py-1 text-xs font-semibold" :class="hqOnly?'bg-[var(--navy)] text-white':'bg-zinc-100'">HQ in FL</button>
        <button type="button" @click="view=view==='grid'?'table':'grid'" class="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold" x-text="view==='grid'?'Table view':'Card view'"></button>
      </div>
    </div>

    <p class="mb-4 text-sm">Showing <strong x-text="filtered.length"></strong> of <span x-text="banks.length"></span> institutions</p>

    <div x-show="view==='grid'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <template x-for="bank in filtered.slice(0, visible)" :key="bank.fdic_cert">
        <article class="lift flex flex-col rounded-2xl border bg-white p-5 transition">
          <h3 class="text-lg font-semibold text-[var(--navy)]" x-text="bank.name"></h3>
          <p class="mt-2 text-xs text-zinc-500">FDIC Insured Since: <span x-text="bank.fdic_insured_since"></span></p>
          <p class="mt-1 text-sm">
            <a :href="bankFind(bank.fdic_cert)" target="_blank" rel="noopener" class="font-mono text-[var(--teal)]" x-text="'#'+bank.fdic_cert"></a>
            <button type="button" @click="copy(bank.fdic_cert)" class="ml-2 text-xs text-zinc-400">Copy</button>
          </p>
          <p class="mt-2 flex-1 text-sm text-zinc-600" x-text="bank.headquarters_address"></p>
          <a :href="bank.website" target="_blank" rel="noopener" class="mt-4 rounded-xl border py-2 text-center text-sm font-semibold">Visit Website</a>
        </article>
      </template>
    </div>

    <div x-show="view==='table'" class="overflow-x-auto rounded-2xl border bg-white">
      <table class="min-w-full text-sm">
        <thead class="bg-zinc-50 text-xs uppercase text-zinc-500"><tr><th class="p-3 text-left">Name</th><th class="p-3">Cert</th><th class="p-3">Since</th><th class="p-3">Address</th></tr></thead>
        <tbody>
          <template x-for="bank in filtered.slice(0, visible)" :key="bank.fdic_cert">
            <tr class="border-t"><td class="p-3" x-text="bank.name"></td><td class="p-3"><a :href="bankFind(bank.fdic_cert)" target="_blank" x-text="bank.fdic_cert" class="text-[var(--teal)]"></a></td><td class="p-3" x-text="bank.fdic_insured_since"></td><td class="p-3" x-text="bank.headquarters_address"></td></tr>
          </template>
        </tbody>
      </table>
    </div>

    <button type="button" x-show="visible < filtered.length" @click="visible += 24" class="mx-auto mt-8 block rounded-xl border px-6 py-3 font-semibold">Load More</button>
  </section>

  <footer class="bg-[var(--navy)] py-6 text-center text-xs text-zinc-400">
    Data sourced from FDIC BankFind. Not financial advice. <a href="https://banks.data.fdic.gov/bankfind-suite/bankfind" class="text-[var(--teal)] underline">Verify at FDIC</a>
  </footer>

  <script>
  /*
   * EXTENSIBILITY: Add states to stateData with identical bank object shape.
   * Load from external JSON: fetch('/lib/fdic/data/florida.json').then(r=>r.json())
   */
  const stateData = {{
    FL: {json.dumps({"fullName": data["fullName"], "abbr": data["abbr"], "updated": data["updated"], "banks": data["banks"]}, indent=4)}
  }};

  function fdicPage() {{
    return {{
      code: 'FL',
      meta: stateData.FL,
      banks: stateData.FL.banks,
      search: '',
      regulators: [],
      hqOnly: false,
      sort: 'name',
      view: 'grid',
      visible: 24,
      get filtered() {{
        let list = [...this.banks];
        if (this.search) {{
          const q = this.search.toLowerCase();
          list = list.filter(b => b.name.toLowerCase().includes(q) || b.headquarters_address.toLowerCase().includes(q) || b.fdic_cert.includes(q));
        }}
        if (this.regulators.length) list = list.filter(b => this.regKey(b.primary_regulator) === this.regulators.find(r => this.regKey(b.primary_regulator)===r));
        if (this.hqOnly) list = list.filter(b => /, FL(?:\\s|$)/.test(b.headquarters_address));
        list.sort((a,b) => a.name.localeCompare(b.name));
        return list;
      }},
      get heroSubline() {{
        const hq = this.banks.filter(b => /, FL(?:\\s|$)/.test(b.headquarters_address)).length;
        return `${{this.banks.length}} FDIC-insured institutions • ${{hq}} headquartered in Florida`;
      }},
      get statCards() {{
        const hq = this.banks.filter(b => /, FL(?:\\s|$)/.test(b.headquarters_address)).length;
        return [
          {{ label: 'Total Institutions', value: this.banks.length, sub: 'Serving Florida' }},
          {{ label: 'HQ in Florida', value: hq, sub: 'Headquartered locally' }},
          {{ label: 'Data Updated', value: this.meta.updated, sub: 'FDIC source' }},
          {{ label: 'Directory', value: 'Free', sub: 'No paid placements' }},
        ];
      }},
      regKey(r) {{ return r.includes('Comptroller')?'OCC': r.includes('Federal Reserve')?'FED':'FDIC'; }},
      bankFind(cert) {{ return `https://banks.data.fdic.gov/bankfind-suite/bankfind?cert=${{cert}}`; }},
      toggleReg(r) {{ this.regulators = this.regulators.includes(r) ? this.regulators.filter(x=>x!==r) : [...this.regulators, r]; }},
      copy(cert) {{ navigator.clipboard?.writeText(cert); }},
      init() {{
        const schema = {{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'FDIC Insured Banks in Florida',
          numberOfItems: this.banks.length
        }};
        document.getElementById('schema-json').textContent = JSON.stringify(schema);
      }}
    }};
  }}
  </script>
</body>
</html>"""

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"Wrote {OUT} ({len(data['banks'])} Florida banks embedded)")


if __name__ == "__main__":
    main()