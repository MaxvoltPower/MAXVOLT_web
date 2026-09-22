// ============================================================
// MAXVOLT — Product seed script
// ------------------------------------------------------------
// Usage:
//   node scripts/seed-products.mjs              # upsert all
//   node scripts/seed-products.mjs --fresh      # wipe + reseed
//   node scripts/seed-products.mjs --dry-run    # print only
//
// Requires .env at project root with:
//   MONGODB_URI=...
//   MONGODB_DB=maxvolt   (optional, defaults to "maxvolt")
// ============================================================

import 'dotenv/config';
import { MongoClient } from 'mongodb';

// ---------- CLI flags ----------
const args = new Set(process.argv.slice(2));
const FRESH = args.has('--fresh');
const DRY_RUN = args.has('--dry-run');

// ---------- Env ----------
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'maxvolt';

if (!uri) {
  console.error('\x1b[31m✗ MONGODB_URI is not set. Add it to .env\x1b[0m');
  process.exit(1);
}

// ---------- Small color helpers ----------
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};
const log = (...a) => console.log(...a);
const ok = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const warn = (m) => console.log(`${c.yellow}!${c.reset} ${m}`);
const err = (m) => console.error(`${c.red}✗${c.reset} ${m}`);
const info = (m) => console.log(`${c.cyan}ℹ${c.reset} ${m}`);

// ============================================================
// Product catalogue — mirrors frontend/src/data/products.js
// Keep this in sync when you add new fallback products.
// ============================================================
const PRODUCTS = {
  homeInverterBatteries: [
    { id: 'BAT-LUM-001', brand: 'Luminous', model: 'ILSF 12042', capacity: '120Ah', type: 'Flat Plate', voltage: '12V', warranty: '36 Months', price: '9500 - 10500', availability: 'Available', bestFor: 'Basic home backup', image: 'lum-ilsf12042.jpg' },
    { id: 'BAT-LUM-002', brand: 'Luminous', model: 'RC18000 PRO', capacity: '150Ah', type: 'Tall Tubular', voltage: '12V', warranty: '48 Months', price: '12000 - 13500', availability: 'Usually Available', bestFor: 'Medium homes', image: 'lum-rc18000pro.jpg' },
    { id: 'BAT-LUM-003', brand: 'Luminous', model: 'SC18060', capacity: '150Ah', type: 'Tall Tubular', voltage: '12V', warranty: '48 Months', price: '13000 - 14500', availability: 'Usually Available', bestFor: 'Higher load homes', image: 'lum-sc18060.jpg' },
    { id: 'BAT-LUM-004', brand: 'Luminous', model: 'EC18060', capacity: '150Ah', type: 'Tall Tubular', voltage: '12V', warranty: '48 Months', price: '13000 - 14500', availability: 'Usually Available', bestFor: 'Premium homes', image: 'lum-ec18060.jpg' },
    { id: 'BAT-LUM-005', brand: 'Luminous', model: 'RC25000 PRO', capacity: '200Ah', type: 'Tall Tubular', voltage: '12V', warranty: '48 Months', price: '16000 - 18000', availability: 'Check Availability', bestFor: 'High backup requirements', image: 'lum-rc25000pro.jpg' },
    { id: 'BAT-EXI-001', brand: 'Exide', model: 'IMST1500', capacity: '150Ah', type: 'Short Tubular', voltage: '12V', warranty: '48 Months', price: '11000 - 12500', availability: 'Usually Available', bestFor: 'Standard homes', image: 'exi-imst1500.jpg' },
    { id: 'BAT-EXI-002', brand: 'Exide', model: 'IMT1500', capacity: '150Ah', type: 'Tall Tubular', voltage: '12V', warranty: '48 Months', price: '12500 - 14000', availability: 'Usually Available', bestFor: 'Medium to large homes', image: 'exi-imt1500.jpg' },
    { id: 'BAT-EXI-003', brand: 'Exide', model: 'IT500', capacity: '150Ah', type: 'InvaTubular', voltage: '12V', warranty: '48 Months', price: '12000 - 13500', availability: 'Usually Available', bestFor: 'Reliable backup', image: 'exi-it500.jpg' },
    { id: 'BAT-EXI-004', brand: 'Exide', model: 'IMT2000', capacity: '200Ah', type: 'Tall Tubular', voltage: '12V', warranty: '48 Months', price: '16500 - 18000', availability: 'Usually Available', bestFor: 'High capacity backup', image: 'exi-imt2000.jpg' },
    { id: 'BAT-EXI-005', brand: 'Exide', model: 'EL Ultra 150', capacity: '150Ah', type: 'Premium Tubular', voltage: '12V', warranty: '60 Months', price: '14000 - 15500', availability: 'Check Availability', bestFor: 'Premium homes', image: 'exi-elultra150.jpg' },
    { id: 'BAT-AMR-001', brand: 'Amaron', model: 'AR150TN54', capacity: '150Ah', type: 'Tall Tubular', voltage: '12V', warranty: '48 Months', price: '12500 - 14000', availability: 'Usually Available', bestFor: 'Standard homes', image: 'amr-ar150tn54.jpg' },
    { id: 'BAT-AMR-002', brand: 'Amaron', model: 'AR150TT60', capacity: '150Ah', type: 'Tall Tubular', voltage: '12V', warranty: '48 Months', price: '12500 - 14000', availability: 'Usually Available', bestFor: 'Reliable backup', image: 'amr-ar150tt60.jpg' },
    { id: 'BAT-AMR-003', brand: 'Amaron', model: 'AR200TT54', capacity: '200Ah', type: 'Tall Tubular', voltage: '12V', warranty: '48 Months', price: '16500 - 18000', availability: 'Usually Available', bestFor: 'High capacity needs', image: 'amr-ar200tt54.jpg' },
    { id: 'BAT-AMR-004', brand: 'Amaron', model: 'AR200TT60', capacity: '200Ah', type: 'Tall Tubular', voltage: '12V', warranty: '48 Months', price: '16500 - 18000', availability: 'Check Availability', bestFor: 'Premium high capacity', image: 'amr-ar200tt60.jpg' },
    { id: 'BAT-AMR-005', brand: 'Amaron', model: 'AM180TT54', capacity: '180Ah', type: 'Tall Tubular', voltage: '12V', warranty: '48 Months', price: '14000 - 15500', availability: 'Usually Available', bestFor: 'Medium-high backup', image: 'amr-am180tt54.jpg' },
  ],
  homeInverters: [
    { id: 'INV-LUM-001', brand: 'Luminous', model: 'EVO D 700', va: '700VA', voltage: '12V', waveType: 'Pure Sine Wave', suitableLoad: 'Basic home backup', warranty: '24 Months', price: '4500 - 5500', availability: 'Available', image: 'inv-lum-evod700.jpg' },
    { id: 'INV-LUM-002', brand: 'Luminous', model: 'EVO D 800', va: '800VA', voltage: '12V', waveType: 'Pure Sine Wave', suitableLoad: 'Standard home', warranty: '24 Months', price: '5000 - 6000', availability: 'Available', image: 'inv-lum-evod800.jpg' },
    { id: 'INV-LUM-003', brand: 'Luminous', model: 'EVO D 900', va: '900VA', voltage: '12V', waveType: 'Pure Sine Wave', suitableLoad: 'Standard to higher load', warranty: '24 Months', price: '5500 - 6500', availability: 'Available', image: 'inv-lum-evod900.jpg' },
    { id: 'INV-EXI-001', brand: 'Exide', model: 'STAR 12V700', va: '700VA', voltage: '12V', waveType: 'Pure Sine Wave', suitableLoad: 'Basic backup', warranty: '24 Months', price: '4500 - 5500', availability: 'Available', image: 'inv-exi-star700.jpg' },
    { id: 'INV-EXI-002', brand: 'Exide', model: 'STAR12V900', va: '900VA', voltage: '12V', waveType: 'Pure Sine Wave', suitableLoad: 'Standard home', warranty: '24 Months', price: '5500 - 6500', availability: 'Available', image: 'inv-exi-star900.jpg' },
    { id: 'INV-AMR-001', brand: 'Amaron', model: 'HB750A', va: '750VA', voltage: '12V', waveType: 'Pure Sine Wave', suitableLoad: 'Basic home', warranty: '24 Months', price: '4800 - 5800', availability: 'Available', image: 'inv-amr-hb750a.jpg' },
    { id: 'INV-AMR-002', brand: 'Amaron', model: 'HB950A', va: '950VA', voltage: '12V', waveType: 'Pure Sine Wave', suitableLoad: 'Standard home', warranty: '24 Months', price: '5800 - 6800', availability: 'Available', image: 'inv-amr-hb950a.jpg' },
  ],
  carBatteries: [
    { id: 'CAR-EXI-001', brand: 'Exide', model: 'Matrix MT48D26L', capacity: '12V / 35Ah', type: 'Automotive Lead-Acid', terminal: 'Left', voltage: '12V', warranty: '36 Months', price: '3800 - 4500', availability: 'Usually Available', suitableCars: 'Multiple brands', image: 'car-exi-matrix26l.jpg' },
    { id: 'CAR-EXI-002', brand: 'Exide', model: 'Matrix MT40B20R', capacity: '12V / 35Ah', type: 'Automotive Lead-Acid', terminal: 'Right', voltage: '12V', warranty: '36 Months', price: '3800 - 4500', availability: 'Usually Available', suitableCars: 'Toyota, Mahindra, Force', image: 'car-exi-matrix40r.jpg' },
    { id: 'CAR-EXI-003', brand: 'Exide', model: 'Matrix MTRED45L', capacity: '12V / 45Ah', type: 'Automotive Lead-Acid', terminal: 'Left', voltage: '12V', warranty: '36 Months', price: '4200 - 5000', availability: 'Usually Available', suitableCars: 'Premium cars', image: 'car-exi-mtred45l.jpg' },
    { id: 'CAR-AMR-001', brand: 'Amaron', model: 'FLO 40B20L', capacity: '12V / 35Ah', type: 'Automotive Lead-Acid', terminal: 'Left', voltage: '12V', warranty: '36 Months', price: '3600 - 4300', availability: 'Available', suitableCars: 'Maruti, Hyundai, Renault', image: 'car-amr-flo40b20l.jpg' },
    { id: 'CAR-AMR-002', brand: 'Amaron', model: 'FLO 40B20R', capacity: '12V / 35Ah', type: 'Automotive Lead-Acid', terminal: 'Right', voltage: '12V', warranty: '36 Months', price: '3600 - 4300', availability: 'Available', suitableCars: 'Toyota, General Motors', image: 'car-amr-flo40b20r.jpg' },
  ],
  totoErickshawBatteries: [
    { id: 'TOTO-EAS-001', brand: 'Eastman', model: 'EM1622ER', capacity: '12V / 160Ah', type: 'Tubular', voltage: '12V (48V config)', warranty: '36 Months', price: '12000 - 13500', availability: 'Usually Available', bestFor: 'E-Rickshaws', image: 'toto-eas-em1622er.jpg' },
    { id: 'TOTO-EAS-002', brand: 'Eastman', model: 'EM1615ER', capacity: '12V / 145Ah', type: 'Tall Tubular', voltage: '12V (48V config)', warranty: '36 Months', price: '11000 - 12500', availability: 'Usually Available', bestFor: 'Standard e-rickshaws', image: 'toto-eas-em1615er.jpg' },
    { id: 'TOTO-EAS-003', brand: 'Eastman', model: 'EM1351ER', capacity: '12V / 135Ah', type: 'Short Tubular', voltage: '12V (48V config)', warranty: '36 Months', price: '10000 - 11500', availability: 'Available', bestFor: 'Budget e-rickshaws', image: 'toto-eas-em1351er.jpg' },
    { id: 'TOTO-LUM-001', brand: 'Luminous', model: 'Cruze LS1052105', capacity: '12V / 105Ah', type: 'Lithium-Ion Battery', voltage: '51.2V / 105Ah', warranty: '60 Months', price: '180000 - 200000', availability: 'Check Availability', bestFor: 'Premium e-rickshaws, long range', image: 'toto-lum-cruze.jpg' },
    { id: 'TOTO-EXI-001', brand: 'Exide', model: 'ERTEPLUS150N', capacity: '12V / 150Ah', type: 'Tubular', voltage: '12V (48V config)', warranty: '36 Months', price: '12000 - 13500', availability: 'Usually Available', bestFor: 'High-performance e-rickshaws', image: 'toto-exi-erteplus150n.jpg' },
  ],
  ebikeBatteries: [
    { id: 'EBIKE-ATK-001', brand: 'AMPTEK', model: 'AT12-24', capacity: '12V / 24Ah', type: 'SMF / Lead Acid', voltage: '12V (configurable)', warranty: '24 Months', price: '8500 - 9500', availability: 'Usually Available', configurable: '48V (4×), 60V (5×), 72V (6×)', image: 'ebike-atk-at1224.jpg' },
    { id: 'EBIKE-ATK-002', brand: 'AMPTEK', model: 'AT12-23', capacity: '12V / 23Ah', type: 'SMF / Lead Acid', voltage: '12V (configurable)', warranty: '24 Months', price: '8000 - 9000', availability: 'Available', configurable: '48V (4×), 60V (5×), 72V (6×)', image: 'ebike-atk-at1223.jpg' },
    { id: 'EBIKE-UPL-001', brand: 'UPLUS', model: 'UPEB-1228', capacity: '12V / 28Ah', type: 'SMF / Lead Acid', voltage: '12V (configurable)', warranty: '24 Months', price: '9500 - 10500', availability: 'Available', configurable: '48V (4×), 60V (5×), 72V (6×)', image: 'ebike-upl-upeb1228.jpg' },
  ],
  ups: [
    { id: 'UPS-MTK-001', brand: 'Microtek', model: 'Legend 650', va: '650VA / 360W', waveType: 'Line Interactive', runtime: '~10-15 mins', warranty: '24 Months', price: '3200 - 4000', availability: 'Available', suitableFor: 'Desktop PC, Monitor', image: 'ups-mtk-legend650.jpg' },
    { id: 'UPS-MTK-002', brand: 'Microtek', model: 'Legend 1000', va: '1000VA / 600W', waveType: 'Line Interactive', runtime: '~15-20 mins', warranty: '24 Months', price: '4500 - 5500', availability: 'Available', suitableFor: 'Office workstation', image: 'ups-mtk-legend1000.jpg' },
    { id: 'UPS-APC-001', brand: 'APC', model: 'BX600C-IN', va: '600VA / 360W', waveType: 'Line Interactive', runtime: '~10-15 mins', warranty: '24 Months', price: '3500 - 4300', availability: 'Available', suitableFor: 'Desktop protection', image: 'ups-apc-bx600c.jpg' },
    { id: 'UPS-APC-002', brand: 'APC', model: 'BX1100C-IN', va: '1100VA / 660W', waveType: 'Line Interactive', runtime: '~18-25 mins', warranty: '24 Months', price: '5500 - 6500', availability: 'Available', suitableFor: 'Office setup', image: 'ups-apc-bx1100c.jpg' },
  ],
};

// ---------- Category map: source key → canonical category slug ----------
const CATEGORY_MAP = {
  homeInverterBatteries: 'homeInverterBatteries',
  homeInverters: 'homeInverters',
  carBatteries: 'carBatteries',
  totoErickshawBatteries: 'totoErickshawBatteries',
  ebikeBatteries: 'ebikeBatteries',
  ups: 'ups',
};

// ============================================================
// Price parsing — matches frontend/src/lib/utils.js parsePrice()
// ============================================================
function parsePrice(value) {
  if (value === null || value === undefined || value === '') {
    return { min: 0, max: 0, isRange: false, invalid: true, raw: value };
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { min: value, max: value, isRange: false, invalid: false, raw: value };
  }
  const str = String(value).trim();
  if (!str) return { min: 0, max: 0, isRange: false, invalid: true, raw: value };

  const nums = str.replace(/[₹,\s]/g, '').match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) {
    return { min: 0, max: 0, isRange: false, invalid: true, raw: value };
  }
  const parsed = nums.map(Number).filter(Number.isFinite);
  const min = Math.min(...parsed);
  const max = Math.max(...parsed);
  return { min, max, isRange: max !== min, invalid: false, raw: value };
}

function formatINR(n) {
  if (!Number.isFinite(n)) return 'Price on request';
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function formatPriceDisplay(value) {
  const { min, max, isRange, invalid } = parsePrice(value);
  if (invalid) return 'Price on request';
  if (isRange) return `${formatINR(min)} – ${formatINR(max)}`;
  return formatINR(min);
}

// ============================================================
// Normalize each product for storage
// ============================================================
function normalizeProduct(raw, category) {
  const price = parsePrice(raw.price);
  const discountedRaw = raw.discountedPrice;
  const discounted = discountedRaw ? parsePrice(discountedRaw) : null;

  const availableForDiscount =
    discounted && !discounted.invalid && discounted.min > 0;
  const discountedPrice = availableForDiscount ? discounted.min : null;

  // If a discounted price exists, use it as the primary numeric price for
  // sorting/cart math. Otherwise use the lower bound of the range.
  const numericPrice = availableForDiscount ? discounted.min : price.min;

  const displayPrice = availableForDiscount
    ? `${formatINR(discounted.min)}${
        !price.invalid && price.min > discounted.min
          ? ` (was ${formatPriceDisplay(raw.price)})`
          : ''
      }`
    : formatPriceDisplay(raw.price);

  return {
    // identity
    id: raw.id,
    category,

    // descriptive
    brand: raw.brand || '',
    model: raw.model || '',
    type: raw.type || null,
    capacity: raw.capacity || null,
    voltage: raw.voltage || null,
    va: raw.va || null,
    warranty: raw.warranty || null,
    waveType: raw.waveType || null,
    runtime: raw.runtime || null,
    terminal: raw.terminal || null,
    suitableCars: raw.suitableCars || null,
    suitableLoad: raw.suitableLoad || null,
    suitableFor: raw.suitableFor || null,
    bestFor: raw.bestFor || null,
    configurable: raw.configurable || null,

    // pricing — raw + normalized
    price: raw.price ?? null,               // keep raw for admin editing
    priceMin: price.invalid ? null : price.min,
    priceMax: price.invalid ? null : price.max,
    isPriceRange: price.isRange,
    priceDisplay: displayPrice,
    numericPrice,                           // single number for sorting / cart
    discountedPrice,                        // number or null

    // media
    image: raw.image || null,
    imageAlt: `${raw.brand || ''} ${raw.model || ''}`.trim() || 'Product',

    // inventory
    stock: typeof raw.stock === 'number' ? raw.stock : 0,
    availability: raw.availability || 'Available',

    // flags
    active: raw.active !== false,
    featured: raw.featured === true,
  };
}

// ============================================================
// Validate required fields before insert
// ============================================================
function validateProduct(p) {
  const errors = [];
  if (!p.id) errors.push('missing id');
  if (!p.brand) errors.push('missing brand');
  if (!p.model) errors.push('missing model');
  if (!p.category) errors.push('missing category');
  return errors;
}

// ============================================================
// Main
// ============================================================
async function main() {
  log('');
  log(`${c.bold}${c.cyan}MAXVOLT — product seed${c.reset}`);
  log(`${c.dim}Database: ${dbName}${c.reset}`);
  log(`${c.dim}Mode: ${FRESH ? 'FRESH (wipe + reseed)' : 'UPSERT'}${DRY_RUN ? ' · DRY RUN' : ''}${c.reset}`);
  log('');

  // Flatten
  const flat = [];
  for (const key in PRODUCTS) {
    if (!Array.isArray(PRODUCTS[key])) continue;
    const category = CATEGORY_MAP[key] || key;
    for (const raw of PRODUCTS[key]) {
      flat.push(normalizeProduct(raw, category));
    }
  }

  // Validate
  const invalid = flat.filter((p) => validateProduct(p).length > 0);
  if (invalid.length) {
    err(`Found ${invalid.length} invalid product(s):`);
    for (const p of invalid) {
      err(`  · ${p.id || '(no id)'} — ${validateProduct(p).join(', ')}`);
    }
    process.exit(1);
  }

  // Duplicate id check
  const seen = new Set();
  const dupes = [];
  for (const p of flat) {
    if (seen.has(p.id)) dupes.push(p.id);
    seen.add(p.id);
  }
  if (dupes.length) {
    err(`Duplicate product id(s): ${[...new Set(dupes)].join(', ')}`);
    process.exit(1);
  }

  info(`Loaded ${flat.length} products from inline data`);

  if (DRY_RUN) {
    log('');
    log(`${c.bold}Sample normalized product:${c.reset}`);
    log(JSON.stringify(flat[0], null, 2));
    log('');
    ok('Dry run complete — no changes written.');
    return;
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 8000,
  });

  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('products');

    if (FRESH) {
      warn('--fresh flag: deleting all existing products...');
      const del = await col.deleteMany({});
      ok(`Deleted ${del.deletedCount} existing product(s)`);
    }

    // Ensure indexes exist (idempotent)
    await col.createIndex({ id: 1 }, { unique: true, sparse: true });
    await col.createIndex({ category: 1, active: 1 });
    await col.createIndex({ brand: 1 });
    await col.createIndex({ numericPrice: 1 });
    await col.createIndex({ featured: 1, active: 1 });
    info('Indexes ensured');

    // Bulk upsert
    const now = new Date();
    const ops = flat.map((p) => ({
      updateOne: {
        filter: { id: p.id },
        update: {
          $set: { ...p, updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    }));

    let inserted = 0;
    let updated = 0;

    if (ops.length) {
      // Pre-count existing so we can report insert vs update accurately
      const existingIds = await col
        .find({ id: { $in: flat.map((p) => p.id) } }, { projection: { id: 1 } })
        .toArray();
      const existingSet = new Set(existingIds.map((d) => d.id));

      const result = await col.bulkWrite(ops, { ordered: false });
      updated = result.modifiedCount || 0;
      inserted = result.upsertedCount || 0;

      // Safety: recompute from existing set if driver counts look off
      if (inserted + updated !== flat.length) {
        inserted = flat.filter((p) => !existingSet.has(p.id)).length;
        updated = flat.length - inserted;
      }
    }

    // Report
    log('');
    ok(`Seed complete: ${inserted} inserted, ${updated} updated`);
    log('');

    // Quick stats
    const total = await col.countDocuments();
    const byCategory = await col
      .aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }])
      .toArray();

    log(`${c.bold}Collection stats:${c.reset}`);
    log(`  Total products: ${total}`);
    for (const row of byCategory.sort((a, b) => a._id.localeCompare(b._id))) {
      log(`  · ${row._id}: ${row.count}`);
    }
    log('');
    ok('Done.');
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  err(`Seed failed: ${e.message}`);
  if (e.stack) console.error(e.stack);
  process.exit(1);
});