# Lender Trust Hub

**LenderTrustHub.com** — Independent directory of mortgage lenders and brokers. Sister platform to [MoveTrustHub.com](https://movetrusthub.com), rethemed for mortgage lending.

> **Tagline:** Trusted Local Lenders • Verified County Insights • National Expertise

## Brand Vision

Independent, data-obsessed, consumer-empowering hub delivering verified local expertise backed by national scale.

- **Zero paid placements** — rankings cannot be bought
- **Multi-source verification** — NMLS, CFPB, BBB, Google, Trustpilot
- **County-level insights** — local experience scores + national aggregates

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Primary (Navy) | `#0A2540` | Headers, nav, trust elements |
| Accent (Blue) | `#3B82F6` | CTAs, links, charts |
| Trust (Teal) | `#14B8A6` | Success states, badges |

## Features

- **Hyper-local search** by ZIP or county
- **Lender directory** with profile pages (`/lenders/[slug]`)
- **County pages** (`/local-lenders/[state]/[county]`)
- **Side-by-side comparison** tool
- **6 interactive calculators** with Recharts + Framer Motion
- **Trust & Transparency** about page

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Framer Motion, Recharts, Radix Slider
- React Hook Form + Zod (ready for forms)
- Mock JSON data (Supabase-ready swap)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
lender-trust-hub/
├── app/
│   ├── page.tsx                          # Homepage
│   ├── calculators/page.tsx                # Calculator hub
│   ├── about/page.tsx                    # Trust & transparency
│   ├── local-lenders/                    # Directory + county pages
│   ├── lenders/[slug]/page.tsx           # Lender profiles
│   └── compare/page.tsx                  # Side-by-side compare
├── components/
│   ├── MortgagePaymentCalc.tsx           # + 5 more calculators
│   ├── LenderCard.tsx, Navbar.tsx, etc.
├── lib/
│   ├── mockData.ts                       # 22 sample lenders
│   └── lenders.ts                        # Filter/search helpers
```

## Deploy to Vercel

1. Push to GitHub (see below)
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Framework preset: **Next.js** (auto-detected)
4. Deploy — preview URL generated instantly
5. Add custom domain `lendertrusthub.com` in Project → Settings → Domains

### Optional: Supabase

```bash
# Add to .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

Swap `lib/mockData.ts` queries for Supabase client calls when ready.

## GitHub Setup

```bash
# Create repo on GitHub named: lender-trust-hub

cd lender-trust-hub
git remote add origin https://github.com/YOURUSERNAME/lender-trust-hub.git
git add .
git commit -m "Initial LenderTrustHub full-stack MVP"
git push -u origin main
```

## Calculators

| Tool | Route Tab | Features |
|------|-----------|----------|
| Mortgage Payment Maestro | `payment` | Sliders, amortization chart, pie breakdown |
| Dream Home Affordability | `affordability` | Income/debt/down, animated house visual |
| Refinance ROI Simulator | `refinance` | Breakeven chart, savings animation |
| DTI Analyzer | `dti` | Color-coded risk meter + tips |
| Loan Type Comparator | `compare` | Fixed vs ARM vs FHA cards |
| Closing Costs Estimator | `closing` | Breakdown + shareable result |

Each calculator includes **Match Me to Lenders** CTA filtering the directory.

## License

Private — All rights reserved.