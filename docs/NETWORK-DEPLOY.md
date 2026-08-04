# Network deploy discipline

**Hard rule:** Production hosts are **not** the same Git repo. Changes to **this** repo are what ship to `www.lendertrusthub.com`. Move monorepo work does **not** update this apex domain.

## Production source of truth

| Domain | Production Git repo | Production URL | Vercel must track |
|--------|---------------------|----------------|-------------------|
| `www.asktrusthub.com` | **Conumers-Trust-Hub** | https://www.asktrusthub.com | Ask project → Ask `main` |
| `www.movetrusthub.com` | **Move-trust-Hub** | https://www.movetrusthub.com | Move project → Move `main` |
| `www.insurancetrusthub.com` | **Insurance-trust-hub** | https://www.insurancetrusthub.com | Insurance project → Insurance `main` |
| `www.lendertrusthub.com` | **Lender-Trust-Hub** (this repo) | https://www.lendertrusthub.com | Lender project → this `main` |

## When you change X, push to Y

| Change type | Push to |
|-------------|---------|
| Ask router, Trust Center, Standard, life journeys | **Conumers-Trust-Hub** only |
| Move journey modules, Move chrome, Move methodology | **Move-trust-Hub** |
| Insurance homepage / methodology / journey / seal / meta | **Insurance-trust-hub** |
| Lender homepage / methodology / journey / seal / meta / scores copy | **Lender-Trust-Hub** (this repo) |
| Shared *idea* (Trust Mark, belonging line, journey label) | **All repos that render it on production** |

- **Forbidden assumption:** “It’s in Move monorepo under `app/lender` so this domain is updated.” **False.** Push here for Lender production.

## Network standard version

Constant: `lib/network/standard-version.ts` → `ASK_NETWORK_STANDARD_VERSION`

- **Bump when:** network bar/seal contract, journey module label API, Trust Mark, belonging line, methodology cross-links
- **Do not bump for:** unrelated vertical content
- Live host exposes `data-network-standard` on `<body>`

### Trust Mark contract

Primary: `Ask Trust Hub Standard` → `https://www.asktrusthub.com/methodology`  
Long: `Researched to the Ask Trust Hub Standard`  
Network bar **Standards** → Ask methodology. Component: `components/network/trust-mark.tsx`.

## Post-deploy smoke

Prefer the canonical script from **Move-trust-Hub**:

```bash
# clone/path: Move-trust-Hub
npm run smoke:network
```

Quick curls:

```bash
curl -sI https://www.asktrusthub.com/methodology
curl -sI https://www.movetrusthub.com/about/how-we-score-movers
curl -sI https://www.insurancetrusthub.com/methodology
curl -sI https://www.lendertrusthub.com/methodology
curl -sI https://www.asktrusthub.com/moving-to
```

Lender `/methodology` must be **200**. Homepage should reference the network (Ask Trust Hub / methodology), not raw coverage flex like `3,142`.

See also: [NETWORK-PR-CHECKLIST.md](./NETWORK-PR-CHECKLIST.md)

## Human: verify Vercel Git connections

1. Vercel → **Insurance** project → Settings → Git → repo = `Insurance-trust-hub`, branch `main`
2. Vercel → **Lender** project → repo = `Lender-Trust-Hub`, branch `main`
3. Vercel → **Move** project → repo = `Move-trust-Hub`, branch `main`
4. Vercel → **Ask** project → repo = `Conumers-Trust-Hub`, branch `main`
5. Production alias for this project includes `www.lendertrusthub.com`
