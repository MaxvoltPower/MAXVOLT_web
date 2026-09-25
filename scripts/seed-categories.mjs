// ============================================================
// MAXVOLT — Category seed script
// ------------------------------------------------------------
// Usage:
//   node scripts/seed-categories.mjs
//   node scripts/seed-categories.mjs --fresh   (wipe + reseed)
//
// Reads MONGODB_URI and MONGODB_DB from .env
// ============================================================

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const args = new Set(process.argv.slice(2));
const FRESH = args.has('--fresh');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'maxvolt';

if (!uri) {
  console.error('✗ MONGODB_URI is not set. Add it to .env');
  process.exit(1);
}

const CATEGORIES = [
  {
    slug: 'homeInverterBatteries',
    name: 'Home Inverter & Battery',
    icon: '🏠',
    description: 'Reliable backup power for homes and small businesses.',
    image: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=600&h=400&fit=crop',
    order: 1,
  },
  {
    slug: 'carBatteries',
    name: 'Car Batteries',
    icon: '🚗',
    description: 'Reliable starting power for cars and commercial vehicles.',
    image: 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=600&h=400&fit=crop',
    order: 2,
  },
  {
    slug: 'totoErickshawBatteries',
    name: 'TOTO / E-Rickshaw',
    icon: '🛺',
    description: 'Heavy-duty battery solutions for electric rickshaws.',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&h=400&fit=crop',
    order: 3,
  },
  {
    slug: 'ebikeBatteries',
    name: 'E-Bike Batteries',
    icon: '🚲',
    description: 'Battery solutions for electric two-wheelers.',
    image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600&h=400&fit=crop',
    order: 4,
  },
  {
    slug: 'ups',
    name: 'UPS Systems',
    icon: '💻',
    description: 'Backup power and protection for PCs, offices and businesses.',
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&h=400&fit=crop',
    order: 5,
  },
  {
    slug: 'solar',
    name: 'Solar & Power Solutions',
    icon: '☀️',
    description: 'Solutions for renewable and backup power options.',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop',
    order: 6,
  },
];

async function main() {
  console.log('');
  console.log('MAXVOLT — category seed');
  console.log(`Database: ${dbName}`);
  console.log(`Mode: ${FRESH ? 'FRESH (wipe + reseed)' : 'UPSERT'}`);
  console.log('');

  const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 });

  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('categories');

    await col.createIndex({ slug: 1 }, { unique: true });
    await col.createIndex({ order: 1, active: 1 });

    if (FRESH) {
      const del = await col.deleteMany({});
      console.log(`! Deleted ${del.deletedCount} existing categor(ies)`);
    }

    const now = new Date();
    const ops = CATEGORIES.map((c) => ({
      updateOne: {
        filter: { slug: c.slug },
        update: {
          $set: { ...c, active: true, updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    }));

    const result = await col.bulkWrite(ops, { ordered: false });
    const inserted = result.upsertedCount || 0;
    const updated = result.modifiedCount || 0;

    console.log('');
    console.log(`✓ Seed complete: ${inserted} inserted, ${updated} updated`);
    const total = await col.countDocuments();
    console.log(`  Total categories: ${total}`);
    console.log('');
    console.log('✓ Done.');
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(`✗ Seed failed: ${e.message}`);
  if (e.stack) console.error(e.stack);
  process.exit(1);
});