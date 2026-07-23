#!/usr/bin/env node
/**
 * Seed 3+ home offers (banners + deals) into the live customer-service API.
 *
 * Usage:
 *   SEED_EMAIL=you@example.com SEED_PASSWORD=secret node scripts/seed-offers.mjs
 *
 * Options:
 *   API_URL / EXPO_PUBLIC_API_URL  — default http://api.viharfood.in
 *   --dry-run                     — print payloads only
 *   --force                       — try create even if deals already exist
 */

import { ApiClient, getApiBase } from './lib/api-client.mjs';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const force = args.has('--force') || process.env.SEED_FORCE === '1';

const OFFERS = [
  {
    kind: 'deal',
    title: 'Flat 50% OFF',
    description: 'On your first orders · limited time',
    code: 'WELCOME50',
    imageUrl:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
  },
  {
    kind: 'deal',
    title: 'Free delivery',
    description: 'No delivery fee on orders above ₹199',
    code: 'FREEDEL',
    imageUrl:
      'https://images.unsplash.com/photo-1526367790999-0150787882da?auto=format&fit=crop&w=1200&q=80',
  },
  {
    kind: 'deal',
    title: 'Weekend specials',
    description: 'Extra savings on biryani, pizza & more',
    code: 'WEEKEND20',
    imageUrl:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
  },
  {
    kind: 'banner',
    title: 'Express in 20 mins',
    description: 'Lightning-fast delivery from top kitchens',
    deepLink: '/deals',
    imageUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
  },
];

const DEAL_PATHS = [
  '/api/v1/customer-service/deals',
  '/api/v1/customer-service/customers/deals',
  '/api/v1/customer-service/offers',
  '/api/v1/customer-service/admin/deals',
];

const BANNER_PATHS = [
  '/api/v1/customer-service/banners',
  '/api/v1/customer-service/customers/banners',
  '/api/v1/customer-service/admin/banners',
];

function dealBodies(offer) {
  return [
    {
      title: offer.title,
      description: offer.description,
      code: offer.code,
      imageUrl: offer.imageUrl,
    },
    {
      title: offer.title,
      description: offer.description,
      promoCode: offer.code,
      imageUrl: offer.imageUrl,
      discountPercent: 50,
    },
    {
      name: offer.title,
      description: offer.description,
      code: offer.code,
      image: offer.imageUrl,
    },
  ];
}

function bannerBodies(offer) {
  return [
    {
      title: offer.title,
      imageUrl: offer.imageUrl,
      deepLink: offer.deepLink || '/deals',
      subtitle: offer.description,
    },
    {
      title: offer.title,
      image: offer.imageUrl,
      link: offer.deepLink || '/deals',
      description: offer.description,
    },
  ];
}

function listFromResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.deals)) return data.deals;
  if (Array.isArray(data?.banners)) return data.banners;
  if (Array.isArray(data?.offers)) return data.offers;
  if (Array.isArray(data?.data?.deals)) return data.data.deals;
  if (Array.isArray(data?.data?.banners)) return data.data.banners;
  return [];
}

async function tryCreate(client, paths, bodies) {
  let lastError = null;
  for (const path of paths) {
    for (const body of bodies) {
      try {
        const res = await client.request(path, { method: 'POST', body });
        return { ok: true, path, body, response: res };
      } catch (err) {
        lastError = err;
        // 404 = wrong path; try next. 400/422 = wrong body shape; try next body.
        if (err.status && ![400, 404, 405, 422].includes(err.status)) {
          // auth/permission issues — keep trying other paths once
        }
      }
    }
  }
  return { ok: false, error: lastError };
}

async function main() {
  const email = process.env.SEED_EMAIL?.trim();
  const password = process.env.SEED_PASSWORD?.trim();
  const base = getApiBase();

  console.log(`API: ${base}`);
  console.log(`Offers to seed: ${OFFERS.length}`);

  if (dryRun) {
    console.log(JSON.stringify(OFFERS, null, 2));
    console.log('Dry run only — no requests sent.');
    return;
  }

  if (!email || !password) {
    console.error(
      'Missing SEED_EMAIL / SEED_PASSWORD.\nExample:\n  SEED_EMAIL=you@example.com SEED_PASSWORD=secret node scripts/seed-offers.mjs'
    );
    process.exit(1);
  }

  const client = new ApiClient(base);
  await client.login(email, password);
  console.log(`Logged in as ${email}`);

  let existingDeals = [];
  let existingBanners = [];
  try {
    const dealsRes = await client.request('/api/v1/customer-service/customers/deals');
    existingDeals = listFromResponse(dealsRes);
  } catch {
    // ignore
  }
  try {
    const homeRes = await client.request('/api/v1/customer-service/customers/home');
    existingBanners = listFromResponse(homeRes?.data?.banners ?? homeRes?.banners ?? homeRes);
  } catch {
    // ignore
  }

  console.log(`Existing deals: ${existingDeals.length}, home banners: ${existingBanners.length}`);

  if (!force && existingDeals.length + existingBanners.length >= 3) {
    console.log('Already have 3+ offers. Pass --force to create more.');
    return;
  }

  let created = 0;
  let failed = 0;

  for (const offer of OFFERS) {
    const paths = offer.kind === 'banner' ? BANNER_PATHS : DEAL_PATHS;
    const bodies = offer.kind === 'banner' ? bannerBodies(offer) : dealBodies(offer);
    const result = await tryCreate(client, paths, bodies);
    if (result.ok) {
      created += 1;
      console.log(`✓ Created ${offer.kind}: ${offer.title} via ${result.path}`);
    } else {
      failed += 1;
      const msg = result.error?.message || 'unknown error';
      const status = result.error?.status || '?';
      console.log(`✗ Failed ${offer.kind}: ${offer.title} (${status} ${msg})`);
    }
  }

  console.log(`\nDone. Created ${created}, failed ${failed}.`);
  if (created === 0) {
    console.log(
      '\nNo create endpoint accepted the payload. Ask backend to enable POST for deals/banners,\nor seed offers in the admin panel / database, then reopen the customer app.'
    );
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
