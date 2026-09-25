// ============================================================
// MAXVOLT — Backfill structured numeric fields
// ------------------------------------------------------------
// Adds vaNumeric and capacityAh to every product already in the
// database, so the calculator can use them immediately without
// a full reseed.
//
// Usage:
//   node scripts/backfill-numerics.mjs
//   node scripts/backfill-numerics.mjs --dry-run
// ============================================================

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'maxvolt';

if (!uri) {
  console.error('✗ MONGODB_URI is not set. Add it to .env');
  process.exit(1);
}

function parseVaFromRaw(raw) {
  if (raw === null || raw === undefined) return 0;
  const s = String(raw).trim();
  if (!s) return 0;
  const kMatch = s.match(/(\d+(?:\.\d+)?)\s*k\s*va/i);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);
  const vaMatch = s.match(/(\d+(?:\.\d+)?)\s*va/i);
  if (vaMatch) return Math.round(parseFloat(vaMatch[1]));
  const m = s.match(/\d+(?:\.\d+)?/);
  return m ? Math.round(parseFloat(m[0])) : 0;
}

function parseAhFromRaw(raw) {
  if (raw === null || raw === undefined) return 0;
  const s = String(raw).trim();
  if (!s) return 0;
  const ahMatch = s.match(/(\d+(?:\.\d+)?)\s*ah/i);
  if (ahMatch) return Math.round(parseFloat(ahMatch[1]));
  const nums = s.match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) return 0;
  return Math.round(Math.max(...nums.map(Number)));
}

async function main() {
  console.log('');
  console.log('MAXVOLT — backfill numeric fields');
  console.log(`Database: ${dbName}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'WRITE'}`);
  console.log('');

  const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 });

  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('products');

    const all = await col.find({}).toArray();
    console.log(`Found ${all.length} product(s)`);

    const ops = [];
    let withVa = 0;
    let withAh = 0;

    for (const p of all) {
      const vaNumeric = parseVaFromRaw(p.va);
      const capacityAh = parseAhFromRaw(p.capacity);

      if (vaNumeric > 0) withVa += 1;
      if (capacityAh > 0) withAh += 1;

      const update = {};
      if (vaNumeric > 0 && p.vaNumeric !== vaNumeric) update.vaNumeric = vaNumeric;
      if (capacityAh > 0 && p.capacityAh !== capacityAh) update.capacityAh = capacityAh;

      if (Object.keys(update).length === 0) continue;

      update.updatedAt = new Date();
      ops.push({
        updateOne: { filter: { _id: p._id }, update: { $set: update } },
      });
    }

    console.log(`  · With VA number: ${withVa}`);
    console.log(`  · With Ah number: ${withAh}`);
    console.log(`  · Needs update:   ${ops.length}`);

    if (DRY_RUN) {
      console.log('');
      console.log('Dry run complete — no changes written.');
      return;
    }

    if (ops.length > 0) {
      const result = await col.bulkWrite(ops, { ordered: false });
      console.log('');
      console.log(`✓ Backfill complete: ${result.modifiedCount} product(s) updated`);
    } else {
      console.log('');
      console.log('✓ Nothing to update.');
    }
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(`✗ Backfill failed: ${e.message}`);
  if (e.stack) console.error(e.stack);
  process.exit(1);
});