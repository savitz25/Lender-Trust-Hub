# Brand alignment — Lender Trust Hub → Ask Trust Hub family

**Production:** Lender-Trust-Hub (`www.lendertrusthub.com`) only.

## Goal

Chapter of the same company as Insurance / Move — not a separate blue fintech brand.

## Tokens (`app/globals.css`)

| Token | Hex | Role |
|-------|-----|------|
| `--lth-brand-green` | `#059669` | Primary CTAs, trust accent (matches Insurance `--trust`) |
| `--lth-brand-green-dark` | `#047857` | Hover / active |
| `--lth-brand-navy` | `#0A2540` | Headings, chrome |
| `--lth-brand-mark-blue` | `#3B82F6` | **Logo mark only** (triangle segment in PNG) |
| `--lth-surface-mint` | `#f0fdf9` | Hero wash |
| `--lth-accent-teal` | `#0d9488` | Soft secondary accent |
| `--lth-link` | `#0f766e` | Inline links |

**Hard rule:** No electric blue fills on primary buttons, search submit, or key CTAs.

## Logo

| Before | After |
|--------|--------|
| Circular handshake icon + HTML “Lender Trust Hub” wordmark | Full lockup PNG: triangle mark + “Lender” + green “Trust Hub” |
| Source | `Consumer Trust Hub/logos for all verticals/LenderTrustHub-logo-transparent.png` → `public/brand/LenderTrustHub-logo-transparent.png` |

Header: `components/BrandLogo.tsx` uses horizontal lockup (Insurance pattern).  
Footer: same asset, inverted for navy footer.

## Buttons (`components/ui/button.tsx`)

| Variant | Treatment |
|---------|-----------|
| `default` / `trust` | Solid brand green `#059669` |
| `outline` | Zinc border, emerald hover |
| `ghost` | Emerald hover |
| `navy` | Rare navy solid (not dual-primary with green) |

## Before / after (system)

| Area | Before | After |
|------|--------|--------|
| Primary CTA | Bright blue `#3B82F6` | Brand green `#059669` |
| Hero wash | Cool gray-blue teal mix | Soft mint wash (`.lth-hero-wash`) |
| Links / chips | Electric blue hover | Emerald green family |
| My Lending | Outline | Outline + emerald icon (same weight as Insurance My Insurance) |
| Network bar active | Neutral white pill | Emerald-tinted active pill |

## What did not change

- Routes, copy, My Lending Phase A data model  
- Independence / NMLS messaging  
- Goal chips + ZIP search layout  

## Human check

Open Insurance and Lender in two tabs: logo family (triangle) + primary button green should read as one network, different chapter.
