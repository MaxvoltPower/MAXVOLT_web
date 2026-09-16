// ============================================
// MAXVOLT — One-time product seed script
// Usage:  node scripts/seed-products.mjs
// Requires .env with MONGODB_URI and MONGODB_DB
// ============================================

import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'maxvolt';

if (!uri) {
  console.error('MONGODB_URI is not set. Add it to .env');
  process.exit(1);
}

// Map legacy category keys → DB category field
const CATEGORY_MAP = {
  homeInverterBatteries: 'homeInverterBatteries',
  homeInverters: 'homeInverters',
  carBatteries: 'carBatteries',
  totoErickshawBatteries: 'totoErickshawBatteries',
  ebikeBatteries: 'ebikeBatteries',
  ups: 'ups',
  upsOffice: 'ups',
};

async function main() {
  const jsonPath = join(__dirname, '..', 'data', 'products.json');
  const raw = JSON.parse(readFileSync(jsonPath, 'utf8'));

  const flat = [];
  for (const key in raw) {
    if (!Array.isArray(raw[key])) continue;
    const category = CATEGORY_MAP[key] || key;
    raw[key].forEach(p => flat.push({ ...p, category }));
  }

  console.log(`Loaded ${flat.length} products from data/products.json`);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('products');

    let inserted = 0, updated = 0;

    for (const p of flat) {
      // Use legacy `id` as a natural key for upsert
      const filter = { id: p.id };
      const existing = await col.findOne(filter);
      const now = new Date();

      const doc = {
        ...p,
        active: p.active !== false,
        updatedAt: now,
      };

      if (existing) {
        await col.updateOne(filter, { $set: doc });
        updated++;
      } else {
        doc.createdAt = now;
        await col.insertOne(doc);
        inserted++;
      }
    }

    console.log(`✅ Seed complete: ${inserted} inserted, ${updated} updated`);

    // Create indexes
    await col.createIndex({ category: 1, active: 1 });
    await col.createIndex({ brand: 1 });
    await col.createIndex({ id: 1 }, { unique: true, sparse: true });
    console.log('✅ Indexes created');
  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});