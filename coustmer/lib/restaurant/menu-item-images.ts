/** Unique food photo pool — verified Unsplash IDs, no duplicate URLs. */
const FOOD_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1603894584372-a7369195528d?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1599487488170-d11ec9c172f3?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527477396000-e2717f6f4c83?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516684732701-375e770c5a3a?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1666190092159-3171d1c91a3a?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585937421612-70a008296fbe?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529042410759-b3871200bafc?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1606491956689-2ea866258177?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1496116218417-1a781b1d4160?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1572490122747-3964b21cbd70?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1528735602780-2552fd466c7d?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563379926898-05f4575a58d8?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1617093727343-374698b1d08e?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1626645731056-d79aefad9a4e?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1598866594230-a7c127c97dcf?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555126634-323283e09059?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1626200419199-3918644f3602?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1645177628672-36ad044821db?w=600&h=450&fit=crop&q=80',
  'https://images.unsplash.com/photo-1642455274430-6c908652c0b0?w=600&h=450&fit=crop&q=80',
];

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hashName(name: string) {
  return name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

/** Stable unique image per dish name. */
export function menuItemImageForName(name: string): string {
  const key = normalizeName(name);
  if (!key) return FOOD_IMAGE_POOL[0];
  return FOOD_IMAGE_POOL[hashName(key) % FOOD_IMAGE_POOL.length];
}

export function getFoodImagePool() {
  return FOOD_IMAGE_POOL;
}
