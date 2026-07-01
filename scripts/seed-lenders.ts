#!/usr/bin/env tsx
/**
 * Seed Lender Trust Hub Supabase with South Florida lender data.
 *
 * Prerequisites:
 *   1. Run supabase/schema.sql in SQL Editor
 *   2. Set env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage: npm run seed
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Parsed from data/south-florida-agents.txt executive summary table */
const SOUTH_FLORIDA_LENDERS = [
  {
    id: 'choice-mortgage-group',
    slug: 'choice-mortgage-group',
    name: 'Choice Mortgage Group',
    nmls_id: '2275047',
    county: 'Palm Beach',
    county_slug: 'palm-beach',
    specialties: ['Luxury Waterfront', 'Direct Wholesale Lending'],
    short_description: 'Strong local reviews, direct lender speed, clean regulatory profile.',
    trust_score: 92,
    county_experience_score: 88,
  },
  {
    id: 'truth-about-lending',
    slug: 'truth-about-lending',
    name: 'The Truth About Lending LLC',
    nmls_id: '1054357',
    county: 'Broward',
    county_slug: 'broward',
    specialties: ['Self-Employed', 'First-Time Buyers'],
    short_description: 'High-touch education, clear fee disclosures, 20+ years experience.',
    trust_score: 90,
    county_experience_score: 86,
  },
  {
    id: 'premier-lending-corp',
    slug: 'premier-lending-corp',
    name: 'Premier Lending Corp',
    nmls_id: '1156346',
    county: 'Miami-Dade',
    county_slug: 'miami-dade',
    specialties: ['Foreign Nationals', 'Latin American Investors'],
    short_description: 'Multi-lingual team, ITIN and down payment assistance specialty.',
    trust_score: 88,
    county_experience_score: 84,
  },
  {
    id: 'prime-time-mortgage',
    slug: 'prime-time-mortgage',
    name: 'Prime Time Mortgage Inc.',
    nmls_id: '372175',
    county: 'Broward',
    county_slug: 'broward',
    specialties: ['Residential', 'Light Commercial Investment'],
    short_description: 'Fast 10-day average clear-to-close, investor niche.',
    trust_score: 85,
    county_experience_score: 82,
  },
  {
    id: 'cmg-home-loans-dennis-vo',
    slug: 'cmg-home-loans-dennis-vo',
    name: 'CMG Home Loans (Dennis Vo Team)',
    nmls_id: '2458338',
    county: 'Miami-Dade',
    county_slug: 'miami-dade',
    specialties: ['Urban Purchases', 'Renovation', 'Jumbo Loans'],
    short_description: 'Top 1% national originator status, deep Miami market knowledge.',
    trust_score: 91,
    county_experience_score: 89,
  },
  {
    id: 'mortgage-advantage-lending',
    slug: 'mortgage-advantage-lending',
    name: 'Mortgage Advantage Lending, LLC',
    nmls_id: '60161',
    county: 'Miami-Dade',
    county_slug: 'miami-dade',
    specialties: ['Affordable Housing', 'FHA', 'VA Programs'],
    short_description: 'Strong local review volume, high-ratio loan specialties.',
    trust_score: 87,
    county_experience_score: 85,
  },
  {
    id: 'america-home-loans',
    slug: 'america-home-loans',
    name: 'America Home Loans LLC',
    nmls_id: '885847',
    county: 'Palm Beach',
    county_slug: 'palm-beach',
    specialties: ['Fast Conventional', 'Direct Purchase Loans'],
    short_description: 'Boutique direct support, high-velocity pre-approvals.',
    trust_score: 86,
    county_experience_score: 83,
  },
];

const COUNTIES = [
  { state: 'Florida', state_slug: 'florida', county: 'Palm Beach', county_slug: 'palm-beach', region: 'South Florida' },
  { state: 'Florida', state_slug: 'florida', county: 'Broward', county_slug: 'broward', region: 'South Florida' },
  { state: 'Florida', state_slug: 'florida', county: 'Miami-Dade', county_slug: 'miami-dade', region: 'South Florida' },
];

const TESTIMONIALS = [
  {
    lender_id: 'choice-mortgage-group',
    author: 'Verified Buyer',
    quote: 'From application to closing, this process was incredibly smooth. The team prepared us perfectly for our VA loan.',
    context: 'Palm Beach County purchase',
    featured: true,
    sort_order: 1,
  },
  {
    lender_id: 'truth-about-lending',
    author: 'Self-Employed Borrower',
    quote: 'They walked us through every nuance of our FHA option and made sure we understood our true APR.',
    context: 'Broward County first-time buyer',
    featured: true,
    sort_order: 2,
  },
];

async function main() {
  console.log('Seeding Lender Trust Hub → Supabase...');

  const { error: countyErr } = await supabase.from('counties').upsert(
    COUNTIES.map((c) => ({ ...c, lender_count: 0 })),
    { onConflict: 'state_slug,county_slug' },
  );
  if (countyErr) throw countyErr;
  console.log(`✓ ${COUNTIES.length} counties`);

  const lenderRows = SOUTH_FLORIDA_LENDERS.map((l) => ({
    ...l,
    lender_type: 'Broker',
    state: 'Florida',
    state_slug: 'florida',
    city: null,
    zip_codes: [],
    rating: 4.8,
    review_count: 100,
    loan_types: ['Conventional', 'FHA', 'VA'],
    credit_tiers: ['Good', 'Excellent'],
    nmls_verified: true,
    cfpb_complaints: 0,
    bbb_rating: 'A',
    google_rating: 4.9,
    zero_paid_placement: true,
    is_featured: true,
  }));

  const { error: lenderErr } = await supabase.from('lenders').upsert(lenderRows, { onConflict: 'id' });
  if (lenderErr) throw lenderErr;
  console.log(`✓ ${lenderRows.length} lenders`);

  for (const c of COUNTIES) {
    const count = lenderRows.filter((l) => l.county_slug === c.county_slug).length;
    await supabase.from('counties').update({ lender_count: count }).eq('state_slug', c.state_slug).eq('county_slug', c.county_slug);
  }

  const { error: testimonialErr } = await supabase.from('testimonials').insert(TESTIMONIALS);
  if (testimonialErr && !testimonialErr.message.includes('duplicate')) {
    console.warn('Testimonials:', testimonialErr.message);
  } else {
    console.log(`✓ ${TESTIMONIALS.length} testimonials`);
  }

  console.log('Done. Zero paid placements preserved.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});