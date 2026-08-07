/**
 * Generate Lender Trust Hub favicon + PWA icon set from the official lockup mark
 * (teal bracket + multi-node hub). Replaces legacy euro/handshake icon.
 *
 * Usage: node scripts/install-lth-favicon.mjs [optionalSourcePng]
 */
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BRAND = join(ROOT, 'public', 'brand');
const PUBLIC = join(ROOT, 'public');
const DEFAULT = join(BRAND, 'lender-trust-hub-logo-header.png');
const SOURCE = process.argv[2] || DEFAULT;

const CANVAS = { r: 248, g: 250, b: 252 };
const WHITE = { r: 255, g: 255, b: 255 };

async function stripDarkBg(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const p = new Uint8ClampedArray(data);
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i];
    const g = p[i + 1];
    const b = p[i + 2];
    const a = p[i + 3];
    if (a < 16 || (r < 40 && g < 40 && b < 45)) {
      p[i] = p[i + 1] = p[i + 2] = p[i + 3] = 0;
    }
  }
  return sharp(Buffer.from(p), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 10 })
    .png()
    .toBuffer();
}

async function extractMark(cleaned) {
  const meta = await sharp(cleaned).metadata();
  const w = meta.width || 1;
  const h = meta.height || 1;
  const cut = Math.min(Math.floor(w * 0.34), Math.floor(h * 1.35));
  const slice = await sharp(cleaned)
    .extract({ left: 0, top: 0, width: Math.min(cut, w), height: h })
    .trim({ threshold: 8 })
    .png()
    .toBuffer();
  const m = await sharp(slice).metadata();
  const side = Math.max(m.width || 1, m.height || 1);
  const pad = Math.round(side * 0.1);
  return sharp(slice)
    .extend({
      top: Math.floor((side - (m.height || 0)) / 2) + pad,
      bottom: Math.ceil((side - (m.height || 0)) / 2) + pad,
      left: Math.floor((side - (m.width || 0)) / 2) + pad,
      right: Math.ceil((side - (m.width || 0)) / 2) + pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function writeOnBg(mark, rel, size, bg) {
  const out = join(ROOT, rel);
  const inner = Math.round(size * 0.82);
  const resized = await sharp(mark)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  if (bg) {
    await sharp({
      create: { width: size, height: size, channels: 3, background: bg },
    })
      .composite([{ input: resized, gravity: 'centre' }])
      .png()
      .toFile(out);
  } else {
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: resized, gravity: 'centre' }])
      .png()
      .toFile(out);
  }
  console.log('wrote', rel);
}

async function writeFooterLogo(srcPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = new Uint8ClampedArray(data);
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 10) continue;
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const isTeal = g > r + 8 && g > 85 && b > 70 && g > b * 0.7;
    const isWarm = r > 150 && g > 80 && g < 200 && b < 120;
    const isPurple = b > r + 15 && b > g + 10 && b > 90 && r < 160;
    const isBlueNode = b > g + 20 && b > r + 30 && b > 140 && g < 200;
    if (isTeal || isWarm || isPurple || isBlueNode) continue;
    if (lum < 160) {
      const t = 1 - lum / 160;
      const v = Math.round(200 + t * 55);
      px[i] = v;
      px[i + 1] = Math.min(255, v + 4);
      px[i + 2] = Math.min(255, v + 10);
    }
  }
  await sharp(Buffer.from(px), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(join(BRAND, 'lender-trust-hub-logo-footer.png'));
  console.log('wrote brand/lender-trust-hub-logo-footer.png');
}

async function main() {
  if (!existsSync(SOURCE)) {
    console.error('Source not found:', SOURCE);
    process.exit(1);
  }

  mkdirSync(BRAND, { recursive: true });
  mkdirSync(PUBLIC, { recursive: true });

  const cleaned = await stripDarkBg(SOURCE);
  const mark = await extractMark(cleaned);
  const markMeta = await sharp(mark).metadata();
  console.log(`Mark: ${markMeta.width}x${markMeta.height}`);

  await writeOnBg(mark, 'public/brand/lender-trust-hub-icon.png', 512, null);
  await writeOnBg(mark, 'public/brand/lender-trust-hub-icon-192.png', 192, null);
  await writeOnBg(mark, 'public/icon-512.png', 512, null);
  await writeOnBg(mark, 'public/icon-192.png', 192, null);
  await writeOnBg(mark, 'public/android-chrome-512x512.png', 512, null);
  await writeOnBg(mark, 'public/android-chrome-192x192.png', 192, null);

  await writeOnBg(mark, 'public/favicon-16x16.png', 16, CANVAS);
  await writeOnBg(mark, 'public/favicon-32x32.png', 32, CANVAS);
  await writeOnBg(mark, 'public/favicon-48x48.png', 48, CANVAS);
  await writeOnBg(mark, 'public/favicon.png', 32, CANVAS);
  await writeOnBg(mark, 'public/brand/lender-trust-hub-favicon-32.png', 32, CANVAS);
  await writeOnBg(mark, 'public/apple-touch-icon.png', 180, WHITE);
  await writeOnBg(mark, 'public/brand/lender-trust-hub-email-mark.png', 128, WHITE);

  const icoBuf = await sharp({
    create: { width: 32, height: 32, channels: 3, background: CANVAS },
  })
    .composite([
      {
        input: await sharp(mark)
          .resize(26, 26, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer(),
        gravity: 'centre',
      },
    ])
    .png()
    .toBuffer();
  writeFileSync(join(PUBLIC, 'favicon.ico'), icoBuf);
  writeFileSync(join(ROOT, 'app', 'favicon.ico'), icoBuf);
  console.log('wrote public/favicon.ico + app/favicon.ico');

  await writeFooterLogo(SOURCE);

  writeFileSync(
    join(PUBLIC, 'site.webmanifest'),
    JSON.stringify(
      {
        name: 'Lender Trust Hub',
        short_name: 'Lender Trust Hub',
        description:
          'Independent lender research — NMLS-oriented verification, rate comparison, and calculators. No paid placements.',
        start_url: '/',
        display: 'standalone',
        background_color: '#F8FAFC',
        theme_color: '#0D9488',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      null,
      2
    ) + '\n'
  );
  console.log('wrote public/site.webmanifest');
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
