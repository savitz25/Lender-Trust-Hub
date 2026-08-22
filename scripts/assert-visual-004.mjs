/**
 * VISUAL-004 Lender network shell — source contract.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const failures = [];
const assert = (cond, msg) => {
  if (!cond) failures.push(msg);
};

const tokens = read('lib/design/trusthub-visual-standard.ts');
const markGeom = read('lib/design/trusthub-mark-geometry.ts');
const mark = read('components/lender-network-mark.tsx');
const css = read('app/globals.css');
const nav = read('components/Navbar.tsx');
const logo = read('components/BrandLogo.tsx');
const switcher = read('components/switch-hub-menu.tsx');
const registry = read('lib/network/registry.ts');
const layout = read('app/layout.tsx');

assert(tokens.includes('2026.08.21-visual-v1'), 'chassis version');
assert(tokens.includes("lender: '#0D9488'"), 'Lender accent #0D9488');
assert(!tokens.includes('#4F46E5') || tokens.includes("ask: '#4F46E5'"), 'Ask indigo only as registry accent');
assert(markGeom.includes('immutable network geometry'), 'canonical mark rule');
assert(mark.includes('strokeWidth="2.4"'), 'canonical stroke 2.4');
assert(mark.includes('r="2.5"'), 'canonical outer dots');
assert(mark.includes('r="2.1"'), 'canonical center dot');
assert(mark.includes('#0D9488'), 'Lender bracket accent');
assert(css.includes('--th-header-desktop: 69px'), '69px desktop header');
assert(css.includes('--th-header-tablet: 65px'), '65px tablet');
assert(css.includes('--th-header-mobile: 57px'), '57px mobile');
assert(css.includes('--th-logo-desktop: 36px'), '36px logo slot');
assert(css.includes('--th-control: 44px'), '44px controls');
assert(css.includes('--th-radius-control: 12px'), '12px control radius');
assert(css.includes('--th-shell-max: 1200px'), '1200 shell');
assert(!css.includes('backdrop-filter'), 'no backdrop-filter on shell');
assert(!layout.includes('AskNetworkBar'), 'AskNetworkBar removed from layout');
assert(nav.includes('th-header'), 'reference header class');
assert(nav.includes('variant="embedded"'), 'Switch Hub in drawer');
assert(!nav.includes('AskNetworkBar'), 'no network bar in navbar');
assert(nav.includes('<SwitchHubMenu />'), 'desktop Switch Hub');
assert(nav.includes('variant="embedded"'), 'drawer Switch Hub is embedded, not a second trigger');
assert(!nav.includes('compact'), 'no compact Switch Hub in product header');
assert(logo.includes('LenderNetworkMark'), 'tight SVG mark');
assert(logo.includes('th-logo-wordmark'), 'HTML wordmark not PNG tagline');
assert(switcher.includes('switcherEntries()'), 'registry order');
assert(switcher.includes('hub.switcherLabel'), 'canonical blurbs');
assert(switcher.includes('ASK TRUST HUB NETWORK'), 'network panel title');
assert(switcher.includes('Current'), 'Current label');
assert(switcher.includes('aria-current'), 'aria-current');
assert(switcher.includes('CURRENT_NETWORK_HUB_ID'), 'current hub from registry');
assert(registry.includes("CURRENT_NETWORK_HUB_ID: NetworkHubId = 'lender'"), 'current hub is lender');
assert(layout.includes('data-th-chassis'), 'chassis stamp');
assert(layout.includes('Inter'), 'Inter chrome font');

const order = ["'ask'", "'move'", "'lender'", "'insurance'", "'contractor'", "'senior'", "'investor'"];
let last = -1;
for (const id of order) {
  const i = registry.indexOf(`id: ${id}`);
  assert(i > last, `registry order ${id}`);
  last = i;
}

if (failures.length) {
  console.error('VISUAL-004 assertions failed:');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}
console.log('VISUAL-004 Lender network-shell assertions passed.');
