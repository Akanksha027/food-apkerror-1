#!/usr/bin/env node
/**
 * Upload cuisine-specific seed menus to the live API for all restaurants.
 *
 * Usage:
 *   SEED_EMAIL=owner@example.com SEED_PASSWORD=secret node scripts/seed-restaurant-menus.mjs
 *
 * Options (env):
 *   API_URL / EXPO_PUBLIC_API_URL  — default http://api.viharfood.in
 *   SEED_EMAIL, SEED_PASSWORD      — restaurant owner login (required unless --dry-run)
 *   SEED_RESTAURANT_ID             — seed only one restaurant
 *   SEED_FORCE=1                   — re-seed even if menu exists
 *   SEED_DELAY_MS=600              — delay between restaurants (rate limit)
 *
 * Flags:
 *   --dry-run   — print plan only, no POST requests
 */

import {
  buildBulkImportPayloads,
  buildSeedMenuForApi,
} from './lib/seed-menu.mjs';
import { ApiClient, getApiBase, getId, sleep } from './lib/api-client.mjs';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const force = process.env.SEED_FORCE === '1' || args.has('--force');
const delayMs = Number(process.env.SEED_DELAY_MS ?? 600);
const onlyId = process.env.SEED_RESTAURANT_ID?.trim();

async function tryBulkImport(client, restaurantId, menu) {
  const payloads = buildBulkImportPayloads(menu);
  const path = `/api/v1/restaurant-service/restaurants/${restaurantId}/items/bulk-import`;

  for (const body of payloads) {
    try {
      const res = await client.request(path, { method: 'POST', body });
      return { ok: true, mode: 'bulk-import', response: res };
    } catch (err) {
      if (err.status === 404) break;
      // try next payload shape
    }
  }
  return { ok: false };
}

async function uploadCategoryByCategory(client, restaurantId, menu) {
  let createdCategories = 0;
  let createdItems = 0;
  const base = `/api/v1/restaurant-service/restaurants/${restaurantId}`;

  for (const category of menu.categories) {
    const catRes = await client.request(`${base}/categories`, {
      method: 'POST',
      body: {
        name: category.name,
        sortOrder: category.sortOrder,
      },
    });

    const categoryId = getId(catRes.data ?? catRes);
    if (!categoryId) {
      throw new Error(`Category created but no id returned for "${category.name}"`);
    }
    createdCategories += 1;

    for (const item of category.items) {
      await client.request(`${base}/categories/${categoryId}/items`, {
        method: 'POST',
        body: {
          name: item.name,
          description: item.description,
          price: item.price,
          isVeg: item.isVeg,
          isAvailable: item.isAvailable,
          imageUrl: item.imageUrl,
        },
      });
      createdItems += 1;
      await sleep(120);
    }
  }

  return { ok: true, mode: 'categories+items', createdCategories, createdItems };
}

async function seedRestaurant(client, restaurant) {
  const id = getId(restaurant);
  const name = restaurant.name ?? 'Restaurant';
  const cuisines = Array.isArray(restaurant.cuisines) ? restaurant.cuisines : [];

  const existing = await client.getItemCount(id);
  if (!force && existing > 0) {
    return { id, name, skipped: true, reason: `already has ${existing} items` };
  }

  const menu = buildSeedMenuForApi(id, { name, cuisines });

  if (dryRun) {
    const itemCount = menu.flatItems.length;
    const catCount = menu.categories.length;
    return {
      id,
      name,
      dryRun: true,
      profile: menu.profile,
      categories: catCount,
      items: itemCount,
    };
  }

  const bulk = await tryBulkImport(client, id, menu);
  if (bulk.ok) {
    const count = await client.getItemCount(id);
    return {
      id,
      name,
      mode: bulk.mode,
      profile: menu.profile,
      items: count,
    };
  }

  const manual = await uploadCategoryByCategory(client, id, menu);
  const count = await client.getItemCount(id);
  return {
    id,
    name,
    mode: manual.mode,
    profile: menu.profile,
    categories: manual.createdCategories,
    items: count,
  };
}

async function main() {
  const email = process.env.SEED_EMAIL?.trim();
  const password = process.env.SEED_PASSWORD?.trim();

  console.log(`API: ${getApiBase()}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'UPLOAD'}${force ? ' (force)' : ''}`);

  if (!dryRun && (!email || !password)) {
    console.error(
      '\nSet SEED_EMAIL and SEED_PASSWORD (restaurant owner account with menu write access).\n' +
        'Example:\n' +
        '  $env:SEED_EMAIL="you@example.com"; $env:SEED_PASSWORD="pass"; node scripts/seed-restaurant-menus.mjs\n'
    );
    process.exit(1);
  }

  const client = new ApiClient();

  if (!dryRun) {
    console.log(`Logging in as ${email}…`);
    await client.login(email, password);
    console.log('Authenticated.\n');
  } else {
    // public GET only
    client.request = async (path) => {
      const res = await fetch(`${getApiBase()}${path}`, {
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
      return data;
    };
  }

  let restaurants = await client.getAllRestaurants();
  if (onlyId) {
    restaurants = restaurants.filter((r) => getId(r) === onlyId);
    if (!restaurants.length) {
      console.error(`Restaurant not found: ${onlyId}`);
      process.exit(1);
    }
  }

  console.log(`Found ${restaurants.length} restaurant(s).\n`);

  const results = { ok: 0, skipped: 0, failed: 0 };

  for (let i = 0; i < restaurants.length; i += 1) {
    const restaurant = restaurants[i];
    const label = `[${i + 1}/${restaurants.length}] ${restaurant.name}`;

    try {
      const result = await seedRestaurant(client, restaurant);

      if (result.skipped) {
        results.skipped += 1;
        console.log(`${label} — skipped (${result.reason})`);
      } else if (result.dryRun) {
        results.ok += 1;
        console.log(
          `${label} — would upload ${result.items} items in ${result.categories} categories (${result.profile})`
        );
      } else {
        results.ok += 1;
        console.log(
          `${label} — uploaded via ${result.mode}: ${result.items} items (${result.profile})`
        );
      }
    } catch (err) {
      results.failed += 1;
      console.error(`${label} — FAILED: ${err.message}`);
      if (err.status === 429) {
        const wait = Number(err.data?.retryAfterSeconds ?? 60) * 1000;
        console.log(`Rate limited — waiting ${wait / 1000}s…`);
        await sleep(wait);
      }
    }

    if (i < restaurants.length - 1) await sleep(delayMs);
  }

  console.log('\n--- Summary ---');
  console.log(`Uploaded/ planned: ${results.ok}`);
  console.log(`Skipped:           ${results.skipped}`);
  console.log(`Failed:            ${results.failed}`);

  if (results.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
