#!/usr/bin/env node
/**
 * Backfill unique image URLs on API menu items missing image.
 * PUT /restaurants/:id/items/:itemId
 *
 * SEED_EMAIL + SEED_PASSWORD required unless --dry-run
 */

import { ApiClient, getApiBase, getId, sleep } from './lib/api-client.mjs';
import { menuItemImageForName } from './lib/menu-item-images.mjs';

const dryRun = process.argv.includes('--dry-run');
const delayMs = Number(process.env.SEED_DELAY_MS ?? 400);

async function updateItemImage(client, restaurantId, item) {
  const itemId = getId(item);
  const imageUrl = menuItemImageForName(item.name ?? 'Dish');
  const path = `/api/v1/restaurant-service/restaurants/${restaurantId}/items/${itemId}`;
  const bodies = [{ image: imageUrl }, { imageUrl }];

  for (const body of bodies) {
    try {
      await client.request(path, { method: 'PUT', body });
      return true;
    } catch {
      // try next shape
    }
  }
  return false;
}

async function main() {
  const email = process.env.SEED_EMAIL?.trim();
  const password = process.env.SEED_PASSWORD?.trim();
  console.log(`API: ${getApiBase()} | ${dryRun ? 'DRY RUN' : 'UPDATE'}`);

  if (!dryRun && (!email || !password)) {
    console.error('Set SEED_EMAIL and SEED_PASSWORD');
    process.exit(1);
  }

  const client = new ApiClient();
  if (!dryRun) await client.login(email, password);
  else {
    client.request = async (path) => {
      const res = await fetch(`${getApiBase()}${path}`, {
        headers: { Accept: 'application/json' },
      });
      return res.json();
    };
  }

  let updated = 0;
  let skipped = 0;
  const restaurants = await client.getAllRestaurants();

  for (const restaurant of restaurants) {
    const rid = getId(restaurant);
    const res = await client.request(
      `/api/v1/restaurant-service/restaurants/${rid}/items?limit=100`
    );
    const items = Array.isArray(res.data) ? res.data : [];

    for (const item of items) {
      if (item.image || item.imageUrl) {
        skipped += 1;
        continue;
      }
      if (dryRun) {
        console.log(`Would update: ${restaurant.name} → ${item.name}`);
        updated += 1;
        continue;
      }
      if (await updateItemImage(client, rid, item)) {
        console.log(`✓ ${restaurant.name} → ${item.name}`);
        updated += 1;
      }
      await sleep(delayMs);
    }
  }

  console.log(`\nUpdated: ${updated} | Already had image: ${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
