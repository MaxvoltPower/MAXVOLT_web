// ============================================================
// MAXVOLT — Admin bulk product import / export
// ------------------------------------------------------------
// Four-step workflow:
//   1. Export the full catalogue to Excel
//   2. Upload an edited .xlsx / .xls / .csv
//   3. Preview exactly what will happen, choose a mode, confirm
//   4. Review the results
//
// The preview table supports paging through every valid row so
// the admin can inspect the whole import before committing.
//
// Row numbering:
//   · The "Row" column in the preview shows a simple 1-based
//     index (1, 2, 3, ... N) so 60 products read as 1..60.
//   · Excel-absolute row numbers (header = 1, first product = 2)
//     are still used in error / skip / invalid messages so the
//     admin can find the offending line in their spreadsheet.
// ============================================================

import { useState, useMemo, useRef, useEffect } from 'react';
import { api } from '@lib/api';
import { useProducts } from '@context/ProductsContext';
import { useToast } from '@components/ui/Toast';
import {
  exportProductsToExcel,
  downloadTemplate,
  parseExcelFile,
  COLUMNS,
} from '@lib/excel';
import Button from '@components/ui/Button';

const MODES = [
  {
    id: 'update',
    label: 'Update existing only',
    desc: "Only rows whose _id or id matches an existing product are written. New rows are skipped.",
  },
  {
    id: 'upsert',
    label: 'Update + create new',
    desc: "Existing products are updated; rows that don't match are inserted as new products.",
  },
  {
    id: 'replace',
    label: 'Create new only',
    desc: 'Only brand-new rows are inserted. Existing matches are skipped.',
  },
];

const PAGE_SIZES = [25, 50, 100, 250, 'all'];

export default function BulkImportExport() {
  const { showToast } = useToast();
  const { reload } = useProducts();
  const fileInputRef = useRef(null);

  const [parsedRows, setParsedRows] = useState(null); // array | null
  const [fileName, setFileName] = useState('');
  const [mode, setMode] = useState('upsert');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState(null);

  // Preview table controls
  const [previewPage, setPreviewPage] = useState(0);
  const [previewPageSize, setPreviewPageSize] = useState(25);
  const [previewSearch, setPreviewSearch] = useState('');
  const [previewActionFilter, setPreviewActionFilter] = useState('all'); // all | create | update | skip | invalid

  // ----------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------
  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await api.bulkExportProducts();
      const items = data?.items || [];
      if (items.length === 0) {
        showToast('No products to export', 'warning');
        return;
      }
      exportProductsToExcel(
        items,
        `maxvolt-products-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      showToast(`Exported ${items.length} product(s)`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  // ----------------------------------------------------------
  // UPLOAD + PARSE
  // ----------------------------------------------------------
  const handleFile = async (file) => {
    if (!file) return;
    setResult(null);
    setFileName(file.name);
    try {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        showToast('No rows found in the sheet', 'warning');
        setParsedRows(null);
        return;
      }
      setParsedRows(rows);
      setPreviewPage(0);
      setPreviewSearch('');
      setPreviewActionFilter('all');
      showToast(`Parsed ${rows.length} row(s)`, 'success');
    } catch (err) {
      showToast('Could not read the file: ' + err.message, 'error');
      setParsedRows(null);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setParsedRows(null);
    setFileName('');
    setResult(null);
    setPreviewPage(0);
    setPreviewSearch('');
    setPreviewActionFilter('all');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ----------------------------------------------------------
  // VALIDATION PREVIEW
  // ----------------------------------------------------------
  const preview = useMemo(() => {
    if (!parsedRows) return null;

    const valid = [];
    const invalid = [];

    parsedRows.forEach((row, i) => {
      // `i` is the 0-based array index.
      // displayIndex = 1-based counter shown in the preview table (1..N)
      // sheetRow     = Excel-absolute row (header = 1, first data = 2)
      const displayIndex = i + 1;
      const sheetRow = i + 2;

      const issues = [];
      if (!row.model || String(row.model).trim() === '') issues.push('missing model');
      if (!row.brand || String(row.brand).trim() === '') issues.push('missing brand');
      if (!row.category || String(row.category).trim() === '') issues.push('missing category');

      const hasId =
        (row.id && String(row.id).trim()) ||
        (row._id && String(row._id).trim());

      if (issues.length > 0) {
        invalid.push({ displayIndex, sheetRow, data: row, issues });
      } else {
        valid.push({ displayIndex, sheetRow, data: row, hasId: Boolean(hasId) });
      }
    });

    return {
      total: parsedRows.length,
      valid,
      invalid,
      toCreate: valid.filter((v) => !v.hasId).length,
      toUpdate: valid.filter((v) => v.hasId).length,
    };
  }, [parsedRows]);

  // ----------------------------------------------------------
  // BUILD ONE UNIFIED PREVIEW LIST (valid + invalid, tagged)
  // ----------------------------------------------------------
  const previewRows = useMemo(() => {
    if (!preview) return [];
    const out = [];

    for (const v of preview.valid) {
      const willSkip =
        (mode === 'update' && !v.hasId) ||
        (mode === 'replace' && v.hasId);
      out.push({
        key: `v-${v.sheetRow}`,
        displayIndex: v.displayIndex,
        sheetRow: v.sheetRow,
        data: v.data,
        action: willSkip ? 'skip' : v.hasId ? 'update' : 'create',
        issues: null,
      });
    }
    for (const iv of preview.invalid) {
      out.push({
        key: `i-${iv.sheetRow}`,
        displayIndex: iv.displayIndex,
        sheetRow: iv.sheetRow,
        data: iv.data,
        action: 'invalid',
        issues: iv.issues,
      });
    }
    // Sort by original spreadsheet order
    out.sort((a, b) => a.sheetRow - b.sheetRow);
    return out;
  }, [preview, mode]);

  // ----------------------------------------------------------
  // FILTER PREVIEW ROWS
  // ----------------------------------------------------------
  const filteredPreviewRows = useMemo(() => {
    let rows = previewRows;

    if (previewActionFilter !== 'all') {
      rows = rows.filter((r) => r.action === previewActionFilter);
    }

    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase();
      rows = rows.filter((r) => {
        const d = r.data || {};
        const hay = `${d.id || ''} ${d._id || ''} ${d.brand || ''} ${
          d.model || ''
        } ${d.category || ''}`.toLowerCase();
        return hay.includes(q);
      });
    }

    return rows;
  }, [previewRows, previewActionFilter, previewSearch]);

  // ----------------------------------------------------------
  // PAGINATION
  // ----------------------------------------------------------
  const effectivePageSize =
    previewPageSize === 'all' ? filteredPreviewRows.length || 1 : previewPageSize;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPreviewRows.length / effectivePageSize)
  );

  // Keep the current page in range when filters/page size change
  useEffect(() => {
    if (previewPage > totalPages - 1) {
      setPreviewPage(Math.max(0, totalPages - 1));
    }
  }, [previewPage, totalPages]);

  const pagedRows = useMemo(() => {
    if (previewPageSize === 'all') return filteredPreviewRows;
    const start = previewPage * effectivePageSize;
    return filteredPreviewRows.slice(start, start + effectivePageSize);
  }, [filteredPreviewRows, previewPage, previewPageSize, effectivePageSize]);

  const rangeStart =
    filteredPreviewRows.length === 0 ? 0 : previewPage * effectivePageSize + 1;
  const rangeEnd =
    previewPageSize === 'all'
      ? filteredPreviewRows.length
      : Math.min(
          (previewPage + 1) * effectivePageSize,
          filteredPreviewRows.length
        );

  // Action counts for the filter chips
  const actionCounts = useMemo(() => {
    const counts = { all: previewRows.length, create: 0, update: 0, skip: 0, invalid: 0 };
    for (const r of previewRows) counts[r.action] += 1;
    return counts;
  }, [previewRows]);

  // ----------------------------------------------------------
  // IMPORT
  // ----------------------------------------------------------
  const handleImport = async () => {
    if (!preview || preview.valid.length === 0) {
      showToast('No valid rows to import', 'warning');
      return;
    }
    if (
      !confirm(
        `Import ${preview.valid.length} product(s) in "${mode}" mode?\n\n` +
          `This will update/create products in the live database.`
      )
    ) {
      return;
    }

    setImporting(true);
    setResult(null);
    try {
      const rows = preview.valid.map((v) => v.data);
      const res = await api.bulkImportProducts({ rows, mode });
      setResult(res);
      showToast(
        `Import done — ${res.summary.created} created, ${res.summary.updated} updated`,
        'success'
      );
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl mb-1">Bulk Import / Export</h1>
        <p className="text-sm text-[var(--text-subtle)]">
          Export your full catalogue to Excel, edit it offline, then import it
          back. Every change is previewed before it hits the database.
        </p>
      </div>

      {/* ---------- STEP 1: EXPORT ---------- */}
      <section className="surface mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold mb-1 text-[var(--text)]">
              1. Export current catalogue
            </h2>
            <p className="text-sm text-[var(--text-muted)] max-w-2xl">
              Downloads an <code>.xlsx</code> with every product and all its
              fields — including the MongoDB <code>_id</code> column, which is
              what lets the importer know which rows to update.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button onClick={handleExport} variant="primary" loading={exporting}>
              ⬇ Export to Excel
            </Button>
            <Button onClick={downloadTemplate} variant="outline">
              Download blank template
            </Button>
          </div>
        </div>
      </section>

      {/* ---------- STEP 2: UPLOAD ---------- */}
      <section className="surface mb-6">
        <h2 className="text-base font-bold mb-1 text-[var(--text)]">
          2. Upload your edited sheet
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-4 max-w-2xl">
          Accepts <code>.xlsx</code>, <code>.xls</code>, and <code>.csv</code>.
          Leave the <code>_id</code> column untouched to update existing
          products; leave it blank to create a new one.
        </p>

        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="rounded-2xl border-2 border-dashed border-[var(--border-strong)] p-8 text-center hover:border-accent transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-4xl mb-3 opacity-70">📄</div>
          {fileName ? (
            <>
              <p className="text-sm font-semibold text-[var(--text)] mb-1">
                {fileName}
              </p>
              <p className="text-xs text-[var(--text-subtle)]">
                {parsedRows ? `${parsedRows.length} row(s) parsed` : 'Reading...'}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-[var(--text)] mb-1">
                Drag &amp; drop your file here, or click to browse
              </p>
              <p className="text-xs text-[var(--text-subtle)]">
                .xlsx · .xls · .csv — max 5,000 rows
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        {parsedRows && (
          <button
            onClick={reset}
            className="mt-3 text-xs text-red-400 hover:text-red-300 hover:underline"
          >
            Clear and choose a different file
          </button>
        )}
      </section>

      {/* ---------- STEP 3: PREVIEW + MODE ---------- */}
      {preview && (
        <section className="surface mb-6">
          <h2 className="text-base font-bold mb-3 text-[var(--text)]">
            3. Review &amp; choose import mode
          </h2>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <Stat label="Total rows" value={preview.total} />
            <Stat label="Will update" value={preview.toUpdate} tone="brand" />
            <Stat label="Will create" value={preview.toCreate} tone="emerald" />
            <Stat label="Invalid" value={preview.invalid.length} tone="red" />
          </div>

          {/* Mode picker */}
          <div className="mb-5">
            <div className="text-xs uppercase tracking-widest font-bold text-[var(--text-subtle)] mb-2">
              Import mode
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MODES.map((m) => (
                <label
                  key={m.id}
                  className={`p-4 rounded-xl border-[1.5px] cursor-pointer transition-all ${
                    mode === m.id
                      ? 'border-accent bg-accent/10'
                      : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="mode"
                      value={m.id}
                      checked={mode === m.id}
                      onChange={() => setMode(m.id)}
                      className="mt-0.5 accent-accent"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[var(--text)] mb-1">
                        {m.label}
                      </div>
                      <div className="text-xs text-[var(--text-subtle)] leading-relaxed">
                        {m.desc}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Invalid rows summary (kept separate from the big table so it
              stays visible even when the admin filters the table) */}
          {preview.invalid.length > 0 && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="text-sm font-bold text-red-400 mb-2">
                ⚠ {preview.invalid.length} row(s) will be skipped
              </div>
              <ul className="text-xs text-red-300 space-y-1 max-h-32 overflow-y-auto">
                {preview.invalid.slice(0, 20).map((r) => (
                  <li key={r.sheetRow}>
                    Row {r.sheetRow} (Excel): {r.issues.join(', ')}
                  </li>
                ))}
                {preview.invalid.length > 20 && (
                  <li className="italic">
                    …and {preview.invalid.length - 20} more (filter the table
                    below by “Invalid” to see all)
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* ---------- Full preview table with paging + filters ---------- */}
          {previewRows.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] overflow-hidden mb-5">
              {/* Toolbar */}
              <div className="px-3 sm:px-4 py-3 bg-[var(--bg-muted)] border-b border-[var(--border)] flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] text-xs pointer-events-none">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Search id / brand / model / category..."
                    value={previewSearch}
                    onChange={(e) => {
                      setPreviewSearch(e.target.value);
                      setPreviewPage(0);
                    }}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] text-xs"
                  />
                </div>

                {/* Page size */}
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-subtle)]">
                  <span className="hidden sm:inline">Rows:</span>
                  <select
                    value={previewPageSize}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPreviewPageSize(v === 'all' ? 'all' : Number(v));
                      setPreviewPage(0);
                    }}
                    className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] text-xs cursor-pointer"
                  >
                    {PAGE_SIZES.map((s) => (
                      <option key={String(s)} value={s}>
                        {s === 'all' ? 'Show all' : s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action filter chips */}
              <div className="px-3 sm:px-4 py-2.5 bg-[var(--bg-muted)] border-b border-[var(--border)] flex flex-wrap gap-2">
                <Chip
                  label={`All (${actionCounts.all})`}
                  active={previewActionFilter === 'all'}
                  onClick={() => {
                    setPreviewActionFilter('all');
                    setPreviewPage(0);
                  }}
                />
                <Chip
                  label={`Will create (${actionCounts.create})`}
                  tone="emerald"
                  active={previewActionFilter === 'create'}
                  onClick={() => {
                    setPreviewActionFilter('create');
                    setPreviewPage(0);
                  }}
                />
                <Chip
                  label={`Will update (${actionCounts.update})`}
                  tone="brand"
                  active={previewActionFilter === 'update'}
                  onClick={() => {
                    setPreviewActionFilter('update');
                    setPreviewPage(0);
                  }}
                />
                <Chip
                  label={`Will skip (${actionCounts.skip})`}
                  tone="slate"
                  active={previewActionFilter === 'skip'}
                  onClick={() => {
                    setPreviewActionFilter('skip');
                    setPreviewPage(0);
                  }}
                />
                <Chip
                  label={`Invalid (${actionCounts.invalid})`}
                  tone="red"
                  active={previewActionFilter === 'invalid'}
                  onClick={() => {
                    setPreviewActionFilter('invalid');
                    setPreviewPage(0);
                  }}
                />
              </div>

              {/* Table body */}
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[var(--bg-muted)] sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2 text-left">Row</th>
                      <th className="px-2 py-2 text-left">Action</th>
                      <th className="px-2 py-2 text-left">id / _id</th>
                      <th className="px-2 py-2 text-left">Brand</th>
                      <th className="px-2 py-2 text-left">Model</th>
                      <th className="px-2 py-2 text-left">Category</th>
                      <th className="px-2 py-2 text-right">Price</th>
                      <th className="px-2 py-2 text-right">Stock</th>
                      <th className="px-2 py-2 text-center">Active</th>
                      <th className="px-2 py-2 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-4 py-10 text-center text-[var(--text-subtle)]"
                        >
                          No rows match the current filter.
                        </td>
                      </tr>
                    ) : (
                      pagedRows.map((r) => (
                        <tr
                          key={r.key}
                          className={`border-t border-[var(--border)] ${
                            r.action === 'invalid' ? 'bg-red-500/5' : ''
                          }`}
                        >
                          <td className="px-2 py-2 text-[var(--text-subtle)] tabular-nums">
                            {r.displayIndex}
                          </td>
                          <td className="px-2 py-2">
                            <ActionBadge action={r.action} />
                          </td>
                          <td className="px-2 py-2 font-mono text-[10px] text-[var(--text-subtle)] truncate max-w-[160px]">
                            {r.data.id || r.data._id || '—'}
                          </td>
                          <td className="px-2 py-2">{r.data.brand || '—'}</td>
                          <td className="px-2 py-2">{r.data.model || '—'}</td>
                          <td className="px-2 py-2">{r.data.category || '—'}</td>
                          <td className="px-2 py-2 text-right">
                            {r.data.discountedPrice || r.data.price || '—'}
                          </td>
                          <td className="px-2 py-2 text-right">
                            {r.data.stock || r.data.stock === 0
                              ? r.data.stock
                              : '—'}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {String(r.data.active || '').toLowerCase() ===
                            'false'
                              ? '❌'
                              : '✅'}
                          </td>
                          <td className="px-2 py-2 text-[10px] text-red-300">
                            {r.issues ? r.issues.join(', ') : ''}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div className="px-3 sm:px-4 py-3 bg-[var(--bg-muted)] border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[var(--text-subtle)]">
                  {filteredPreviewRows.length === 0 ? (
                    'No rows to show'
                  ) : previewPageSize === 'all' ? (
                    <>
                      Showing <strong className="text-[var(--text)]">all</strong>{' '}
                      {filteredPreviewRows.length} row
                      {filteredPreviewRows.length === 1 ? '' : 's'}
                    </>
                  ) : (
                    <>
                      Showing{' '}
                      <strong className="text-[var(--text)]">
                        {rangeStart}–{rangeEnd}
                      </strong>{' '}
                      of {filteredPreviewRows.length} row
                      {filteredPreviewRows.length === 1 ? '' : 's'}
                    </>
                  )}
                </div>

                {previewPageSize !== 'all' && totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <PagerButton
                      onClick={() => setPreviewPage(0)}
                      disabled={previewPage === 0}
                      aria-label="First page"
                    >
                      «
                    </PagerButton>
                    <PagerButton
                      onClick={() => setPreviewPage((p) => Math.max(0, p - 1))}
                      disabled={previewPage === 0}
                      aria-label="Previous page"
                    >
                      ‹
                    </PagerButton>
                    <span className="text-xs text-[var(--text-subtle)] px-2 tabular-nums">
                      Page {previewPage + 1} of {totalPages}
                    </span>
                    <PagerButton
                      onClick={() =>
                        setPreviewPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      disabled={previewPage >= totalPages - 1}
                      aria-label="Next page"
                    >
                      ›
                    </PagerButton>
                    <PagerButton
                      onClick={() => setPreviewPage(totalPages - 1)}
                      disabled={previewPage >= totalPages - 1}
                      aria-label="Last page"
                    >
                      »
                    </PagerButton>
                  </div>
                )}

                {previewPageSize !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewPageSize('all');
                      setPreviewPage(0);
                    }}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    Show all {filteredPreviewRows.length} rows
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Import button */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleImport}
              variant="primary"
              loading={importing}
              disabled={preview.valid.length === 0}
            >
              ⬆ Import {preview.valid.length} product(s)
            </Button>
            <Button onClick={reset} variant="outline" disabled={importing}>
              Cancel
            </Button>
          </div>
        </section>
      )}

      {/* ---------- STEP 4: RESULT ---------- */}
      {result && (
        <section className="surface">
          <h2 className="text-base font-bold mb-3 text-[var(--text)]">
            Import complete
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <Stat label="Created" value={result.summary.created} tone="emerald" />
            <Stat label="Updated" value={result.summary.updated} tone="brand" />
            <Stat label="Skipped" value={result.summary.skipped} tone="amber" />
            <Stat label="Errors" value={result.summary.errors} tone="red" />
          </div>

          {result.results.errors.length > 0 && (
            <details className="mb-3">
              <summary className="cursor-pointer text-sm font-bold text-red-400">
                {result.results.errors.length} error(s)
              </summary>
              <ul className="mt-2 text-xs text-red-300 space-y-1 max-h-40 overflow-y-auto">
                {result.results.errors.map((e, i) => (
                  <li key={i}>
                    Excel row {e.row} ({e.id}): {e.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {result.results.skipped.length > 0 && (
            <details className="mb-3">
              <summary className="cursor-pointer text-sm font-bold text-amber-400">
                {result.results.skipped.length} skipped row(s)
              </summary>
              <ul className="mt-2 text-xs text-amber-300 space-y-1 max-h-40 overflow-y-auto">
                {result.results.skipped.map((s, i) => (
                  <li key={i}>
                    Excel row {s.row} ({s.id}): {s.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <Button onClick={reset} variant="outline">
            Import another file
          </Button>
        </section>
      )}

      {/* ---------- Field reference ---------- */}
      <section className="surface mt-6">
        <details>
          <summary className="cursor-pointer text-sm font-bold text-[var(--text)]">
            📖 Field reference
          </summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[var(--bg-muted)]">
                <tr>
                  <th className="px-3 py-2 text-left">Column</th>
                  <th className="px-3 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {COLUMNS.map((c) => (
                  <tr key={c.key} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2 font-mono text-[var(--text)]">
                      {c.label}
                    </td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">
                      {c.readOnly
                        ? 'MongoDB ObjectId — leave untouched to update in place. Blank = create new.'
                        : c.key === 'images'
                        ? 'Separate multiple URLs with a pipe ( | ). The first becomes the main image.'
                        : c.key === 'active' || c.key === 'featured'
                        ? 'TRUE / FALSE (also accepts 1/0, yes/no)'
                        : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </>
  );
}

// ============================================================
// Small presentational helpers
// ============================================================

function Stat({ label, value, tone = 'default' }) {
  const tones = {
    default: 'text-[var(--text)]',
    brand: 'text-brand-light',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  };
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-[var(--text-subtle)] mb-1">
        {label}
      </div>
      <div className={`text-2xl font-extrabold tabular-nums ${tones[tone]}`}>
        {value}
      </div>
    </div>
  );
}

function Chip({ label, active, onClick, tone = 'accent' }) {
  const activeCls = {
    accent: 'bg-accent/20 border-accent text-accent',
    emerald: 'bg-emerald-500/20 border-emerald-500 text-emerald-400',
    brand: 'bg-brand/20 border-brand text-brand-light',
    slate: 'bg-slate-500/20 border-slate-500 text-slate-400',
    red: 'bg-red-500/20 border-red-500 text-red-400',
  }[tone];

  const inactiveCls =
    'bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-wide transition-all ${
        active ? activeCls : inactiveCls
      }`}
    >
      {label}
    </button>
  );
}

function ActionBadge({ action }) {
  const map = {
    create: { label: 'CREATE', cls: 'bg-emerald-500/20 text-emerald-400' },
    update: { label: 'UPDATE', cls: 'bg-brand/20 text-brand-light' },
    skip: { label: 'SKIP', cls: 'bg-slate-500/20 text-slate-400' },
    invalid: { label: 'INVALID', cls: 'bg-red-500/20 text-red-400' },
  };
  const cfg = map[action] || map.skip;
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function PagerButton({ children, onClick, disabled, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 grid place-items-center rounded-md border border-[var(--border)] text-[var(--text)] text-xs hover:bg-[var(--bg-elev)] hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed"
      {...rest}
    >
      {children}
    </button>
  );
}