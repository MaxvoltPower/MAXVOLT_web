// ============================================================
// MAXVOLT — Excel helpers (SheetJS)
// ------------------------------------------------------------
// Used by the admin bulk import/export screen.
//   exportProductsToExcel() — download the full catalogue
//   downloadTemplate()      — download a blank import template
//   parseExcelFile()        — read an uploaded .xlsx/.xls/.csv
// ============================================================

import * as XLSX from 'xlsx';

// The canonical column order for export + template.
// `readOnly` columns are exported but not meant to be edited by hand.
export const COLUMNS = [
  { key: '_id',             label: '_id (MongoDB — do not edit)', width: 26, readOnly: true },
  { key: 'id',              label: 'id (SKU)',                    width: 18 },
  { key: 'brand',           label: 'brand',                       width: 14 },
  { key: 'model',           label: 'model',                       width: 22 },
  { key: 'category',        label: 'category (slug)',             width: 22 },
  { key: 'type',            label: 'type',                        width: 18 },
  { key: 'capacity',        label: 'capacity',                    width: 16 },
  { key: 'voltage',         label: 'voltage',                     width: 12 },
  { key: 'va',              label: 'va',                          width: 12 },
  { key: 'warranty',        label: 'warranty',                    width: 14 },
  { key: 'waveType',        label: 'waveType',                    width: 16 },
  { key: 'runtime',         label: 'runtime',                     width: 14 },
  { key: 'terminal',        label: 'terminal',                    width: 12 },
  { key: 'suitableCars',    label: 'suitableCars',                width: 20 },
  { key: 'suitableLoad',    label: 'suitableLoad',                width: 20 },
  { key: 'suitableFor',     label: 'suitableFor',                 width: 18 },
  { key: 'bestFor',         label: 'bestFor',                     width: 22 },
  { key: 'configurable',    label: 'configurable',                width: 22 },
  { key: 'price',           label: 'price (raw)',                 width: 16 },
  { key: 'discountedPrice', label: 'discountedPrice (number)',    width: 20 },
  { key: 'stock',           label: 'stock',                       width: 10 },
  { key: 'availability',    label: 'availability',                width: 18 },
  { key: 'image',           label: 'image (URL)',                 width: 30 },
  { key: 'images',          label: 'images (pipe-separated)',     width: 40 },
  { key: 'active',          label: 'active (true/false)',         width: 16 },
  { key: 'featured',        label: 'featured (true/false)',       width: 16 },
];

const HEADER_TO_KEY = Object.fromEntries(
  COLUMNS.map((c) => [c.label.toLowerCase(), c.key])
);

/** Convert a product array to an .xlsx Blob and trigger download. */
export function exportProductsToExcel(products, filename = 'maxvolt-products.xlsx') {
  const rows = products.map((p) => {
    const out = {};
    for (const c of COLUMNS) {
      let v = p[c.key];
      if (c.key === 'images' && Array.isArray(v)) v = v.join(' | ');
      if (c.key === 'active' || c.key === 'featured') v = v ? 'TRUE' : 'FALSE';
      out[c.label] = v ?? '';
    }
    return out;
  });

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: COLUMNS.map((c) => c.label),
  });

  // Column widths
  ws['!cols'] = COLUMNS.map((c) => ({ wch: c.width }));

  // Freeze the header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  XLSX.writeFile(wb, filename);
}

/** Build a blank import template with just headers + one example row. */
export function downloadTemplate() {
  const example = {};
  for (const c of COLUMNS) example[c.label] = '';
  example['brand'] = 'Luminous';
  example['model'] = 'RC18000 PRO';
  example['category'] = 'homeInverterBatteries';
  example['capacity'] = '150Ah';
  example['price'] = '12000 - 13500';
  example['stock'] = '10';
  example['active'] = 'TRUE';
  example['featured'] = 'FALSE';
  example['images'] = 'lum-rc18000pro.jpg | https://example.com/2.jpg';

  const ws = XLSX.utils.json_to_sheet([example], {
    header: COLUMNS.map((c) => c.label),
  });
  ws['!cols'] = COLUMNS.map((c) => ({ wch: c.width }));
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'maxvolt-import-template.xlsx');
}

/**
 * Parse an uploaded .xlsx/.xls/.csv File into an array of row objects
 * keyed by our canonical column keys.
 */
export async function parseExcelFile(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('The workbook has no sheets');

  const ws = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

  if (raw.length === 0) throw new Error('The sheet is empty');

  // Map the user's header labels back to our canonical keys.
  // Accepts both the exact label and the bare key.
  const firstRow = raw[0];
  const headerMap = {};
  for (const label of Object.keys(firstRow)) {
    const norm = String(label).trim().toLowerCase();
    if (HEADER_TO_KEY[norm]) {
      headerMap[label] = HEADER_TO_KEY[norm];
      continue;
    }
    // Try matching by bare key
    const match = COLUMNS.find((c) => c.key.toLowerCase() === norm);
    if (match) headerMap[label] = match.key;
  }

  return raw.map((row) => {
    const out = {};
    for (const [label, value] of Object.entries(row)) {
      const key = headerMap[label];
      if (key) out[key] = value;
    }
    return out;
  });
}