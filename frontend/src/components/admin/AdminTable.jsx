// ============================================================
// MAXVOLT — Admin table with sorting, filtering & pagination
// ============================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { classNames } from '@lib/utils';

/**
 * Reusable admin table with:
 * - Column sorting (click header to toggle asc/desc/none)
 * - Global search
 * - Per-column filters (text, select, range, date)
 * - Pagination
 * - Row selection
 * - Bulk actions
 */
export default function AdminTable({
  columns,
  data,
  loading,
  emptyMessage = 'No items found',
  keyField = '_id',
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  bulkActions = [],
  toolbar,
  initialPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100, 'all'],
  stickyHeader = true,
  className,
}) {
  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({}); // { [colKey]: value }
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [showFilters, setShowFilters] = useState(false);

  // ----------------------------------------------------------
  // Reset page when data/filters change
  // ----------------------------------------------------------
  useEffect(() => {
    setPage(0);
  }, [search, filters, sortKey, sortDir, pageSize]);

  // ----------------------------------------------------------
  // Filter columns that have filterable config
  // ----------------------------------------------------------
  const filterableColumns = useMemo(
    () => columns.filter((c) => c.filterable || c.filter),
    [columns]
  );

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((v) => v !== '' && v !== undefined && v !== null),
    [filters]
  );

  // ----------------------------------------------------------
  // Apply search + filters
  // ----------------------------------------------------------
  const filteredData = useMemo(() => {
    let result = [...data];

    // Global search across searchable columns
    if (search.trim()) {
      const q = search.toLowerCase();
      const searchableCols = columns.filter((c) => c.searchable !== false);
      result = result.filter((row) =>
        searchableCols.some((col) => {
          const val = getNestedValue(row, col.key);
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        })
      );
    }

    // Per-column filters
    for (const col of filterableColumns) {
      const filterVal = filters[col.key];
      if (filterVal === undefined || filterVal === null || filterVal === '') continue;

      const filterConfig = col.filter || {};
      const type = filterConfig.type || 'text';

      result = result.filter((row) => {
        const val = getNestedValue(row, col.key);

        switch (type) {
          case 'select':
            return String(val) === String(filterVal);

          case 'multiselect':
            if (!Array.isArray(filterVal) || filterVal.length === 0) return true;
            return filterVal.includes(String(val));

          case 'text':
            return String(val ?? '').toLowerCase().includes(String(filterVal).toLowerCase());

          case 'number-range': {
            const num = Number(val);
            if (!Number.isFinite(num)) return false;
            const min = filterVal.min !== undefined && filterVal.min !== '' ? Number(filterVal.min) : -Infinity;
            const max = filterVal.max !== undefined && filterVal.max !== '' ? Number(filterVal.max) : Infinity;
            return num >= min && num <= max;
          }

          case 'date-range': {
            const date = new Date(val).getTime();
            if (!Number.isFinite(date)) return false;
            const from = filterVal.from ? new Date(filterVal.from).getTime() : -Infinity;
            const to = filterVal.to ? new Date(filterVal.to).getTime() + 86400000 : Infinity;
            return date >= from && date <= to;
          }

          case 'boolean':
            if (filterVal === 'all') return true;
            return Boolean(val) === (filterVal === 'true');

          default:
            return true;
        }
      });
    }

    return result;
  }, [data, search, filters, columns, filterableColumns]);

  // ----------------------------------------------------------
  // Apply sorting
  // ----------------------------------------------------------
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    const col = columns.find((c) => c.key === sortKey);
    const sorter = col?.sorter;

    const sorted = [...filteredData].sort((a, b) => {
      const aVal = getNestedValue(a, sortKey);
      const bVal = getNestedValue(b, sortKey);

      if (sorter) return sorter(aVal, bVal, a, b);

      // Default sorting logic
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal;
      }

      return String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });

    return sortDir === 'desc' ? sorted.reverse() : sorted;
  }, [filteredData, sortKey, sortDir, columns]);

  // ----------------------------------------------------------
  // Pagination
  // ----------------------------------------------------------
  const effectivePageSize = pageSize === 'all' ? sortedData.length || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(sortedData.length / effectivePageSize));
  const safePage = Math.min(page, totalPages - 1);

  const pagedData = useMemo(() => {
    if (pageSize === 'all') return sortedData;
    const start = safePage * effectivePageSize;
    return sortedData.slice(start, start + effectivePageSize);
  }, [sortedData, safePage, effectivePageSize, pageSize]);

  const rangeStart = sortedData.length === 0 ? 0 : safePage * effectivePageSize + 1;
  const rangeEnd =
    pageSize === 'all'
      ? sortedData.length
      : Math.min((safePage + 1) * effectivePageSize, sortedData.length);

  // ----------------------------------------------------------
  // Selection helpers
  // ----------------------------------------------------------
  const allOnPageSelected =
    selectable &&
    pagedData.length > 0 &&
    pagedData.every((row) => selectedIds.includes(row[keyField]));

  const someOnPageSelected =
    selectable && pagedData.some((row) => selectedIds.includes(row[keyField]));

  const toggleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    const pageIds = pagedData.map((r) => r[keyField]);

    if (allOnPageSelected) {
      onSelectionChange(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      const newIds = new Set([...selectedIds, ...pageIds]);
      onSelectionChange(Array.from(newIds));
    }
  }, [pagedData, selectedIds, onSelectionChange, keyField, allOnPageSelected]);

  const toggleSelectRow = useCallback(
    (id) => {
      if (!onSelectionChange) return;
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter((x) => x !== id));
      } else {
        onSelectionChange([...selectedIds, id]);
      }
    },
    [selectedIds, onSelectionChange]
  );

  // ----------------------------------------------------------
  // Sort toggle
  // ----------------------------------------------------------
  const handleSort = (key) => {
    const col = columns.find((c) => c.key === key);
    if (col?.sortable === false) return;

    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortKey(null);
        setSortDir('asc');
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // ----------------------------------------------------------
  // Clear all filters
  // ----------------------------------------------------------
  const clearFilters = () => {
    setFilters({});
    setSearch('');
    setSortKey(null);
    setSortDir('asc');
  };

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className={classNames('rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="px-3 sm:px-4 py-3 bg-[var(--bg-muted)] border-b border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] text-xs pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] text-xs"
            />
          </div>

          {/* Filter toggle */}
          {filterableColumns.length > 0 && (
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={classNames(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors',
                showFilters || hasActiveFilters
                  ? 'bg-accent/15 border-accent text-accent'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
              )}
            >
              <span>⚙️</span>
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold">
                  {Object.values(filters).filter((v) => v !== '' && v !== undefined).length}
                </span>
              )}
            </button>
          )}

          {/* Clear */}
          {(search || hasActiveFilters || sortKey) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-red-400 hover:text-red-300 hover:underline"
            >
              Clear all
            </button>
          )}

          {/* Custom toolbar */}
          {toolbar && <div className="flex items-center gap-2 ml-auto">{toolbar}</div>}
        </div>

        {/* Filter panel */}
        {showFilters && filterableColumns.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filterableColumns.map((col) => (
              <FilterControl
                key={col.key}
                column={col}
                value={filters[col.key]}
                onChange={(val) => setFilters((prev) => ({ ...prev, [col.key]: val }))}
              />
            ))}
          </div>
        )}

        {/* Bulk actions */}
        {selectable && selectedIds.length > 0 && bulkActions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--text-subtle)]">
              {selectedIds.length} selected
            </span>
            {bulkActions.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={() => action.onClick(selectedIds)}
                className={classNames(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  action.variant === 'danger'
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                    : 'bg-[var(--bg-elev)] border border-[var(--border)] hover:border-accent'
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className={classNames('bg-[var(--bg-muted)]', stickyHeader && 'sticky top-0 z-10')}>
            <tr>
              {selectable && (
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-accent cursor-pointer"
                    aria-label="Select all"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={classNames(
                    'px-3 py-3 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap',
                    col.sortable !== false && 'cursor-pointer select-none hover:text-accent',
                    col.headerClassName
                  )}
                  style={{ width: col.width, textAlign: col.align }}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && (
                      <SortIndicator active={sortKey === col.key} dir={sortDir} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-16 text-center">
                  <div className="inline-flex flex-col items-center gap-2 text-[var(--text-subtle)]">
                    <span className="text-2xl animate-pulse">⏳</span>
                    <span className="text-sm">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : pagedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-16 text-center">
                  <div className="inline-flex flex-col items-center gap-2 text-[var(--text-subtle)]">
                    <span className="text-3xl opacity-60">📭</span>
                    <span className="text-sm">{emptyMessage}</span>
                    {(search || hasActiveFilters) && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-xs text-accent hover:underline mt-1"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              pagedData.map((row, rowIndex) => {
                const id = row[keyField];
                const isSelected = selectedIds.includes(id);
                return (
                  <tr
                    key={id || rowIndex}
                    className={classNames(
                      'border-t border-[var(--border)] transition-colors',
                      isSelected ? 'bg-accent/10' : 'hover:bg-accent/5',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(id)}
                          className="w-4 h-4 accent-accent cursor-pointer"
                          aria-label={`Select row ${rowIndex + 1}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={classNames('px-3 py-3', col.className)}
                        style={{ textAlign: col.align }}
                      >
                        {col.render
                          ? col.render(getNestedValue(row, col.key), row)
                          : formatCellValue(getNestedValue(row, col.key))}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="px-3 sm:px-4 py-3 bg-[var(--bg-muted)] border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-[var(--text-subtle)]">
          <span>
            {sortedData.length === 0 ? (
              'No items'
            ) : pageSize === 'all' ? (
              <>Showing <strong className="text-[var(--text)]">{sortedData.length}</strong> items</>
            ) : (
              <>Showing <strong className="text-[var(--text)]">{rangeStart}–{rangeEnd}</strong> of <strong className="text-[var(--text)]">{sortedData.length}</strong></>
            )}
          </span>

          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const v = e.target.value;
                setPageSize(v === 'all' ? 'all' : Number(v));
              }}
              className="px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-elev)] text-xs cursor-pointer"
            >
              {pageSizeOptions.map((s) => (
                <option key={String(s)} value={s}>
                  {s === 'all' ? 'All' : s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {pageSize !== 'all' && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <PagerButton onClick={() => setPage(0)} disabled={safePage === 0} aria-label="First">
              «
            </PagerButton>
            <PagerButton onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0} aria-label="Previous">
              ‹
            </PagerButton>
            <span className="text-xs text-[var(--text-subtle)] px-2 tabular-nums">
              {safePage + 1} / {totalPages}
            </span>
            <PagerButton onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} aria-label="Next">
              ›
            </PagerButton>
            <PagerButton onClick={() => setPage(totalPages - 1)} disabled={safePage >= totalPages - 1} aria-label="Last">
              »
            </PagerButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function SortIndicator({ active, dir }) {
  if (!active) {
    return <span className="text-[var(--text-subtle)] opacity-40 text-[10px]">↕</span>;
  }
  return (
    <span className="text-accent text-[10px]">
      {dir === 'asc' ? '↑' : '↓'}
    </span>
  );
}

function FilterControl({ column, value, onChange }) {
  const config = column.filter || {};
  const type = config.type || 'text';

  switch (type) {
    case 'select':
      return (
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[var(--text-subtle)] mb-1">
            {config.label || column.label}
          </label>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] text-xs cursor-pointer"
          >
            <option value="">All</option>
            {(config.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    case 'number-range':
      return (
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[var(--text-subtle)] mb-1">
            {config.label || column.label}
          </label>
          <div className="flex gap-1.5">
            <input
              type="number"
              placeholder="Min"
              value={value?.min ?? ''}
              onChange={(e) => onChange({ ...value, min: e.target.value })}
              className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] text-xs"
            />
            <input
              type="number"
              placeholder="Max"
              value={value?.max ?? ''}
              onChange={(e) => onChange({ ...value, max: e.target.value })}
              className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] text-xs"
            />
          </div>
        </div>
      );

    case 'date-range':
      return (
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[var(--text-subtle)] mb-1">
            {config.label || column.label}
          </label>
          <div className="flex gap-1.5">
            <input
              type="date"
              value={value?.from ?? ''}
              onChange={(e) => onChange({ ...value, from: e.target.value })}
              className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] text-xs"
            />
            <input
              type="date"
              value={value?.to ?? ''}
              onChange={(e) => onChange({ ...value, to: e.target.value })}
              className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] text-xs"
            />
          </div>
        </div>
      );

    case 'boolean':
      return (
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[var(--text-subtle)] mb-1">
            {config.label || column.label}
          </label>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] text-xs cursor-pointer"
          >
            <option value="">All</option>
            <option value="true">{config.trueLabel || 'Yes'}</option>
            <option value="false">{config.falseLabel || 'No'}</option>
          </select>
        </div>
      );

    case 'text':
    default:
      return (
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[var(--text-subtle)] mb-1">
            {config.label || column.label}
          </label>
          <input
            type="text"
            placeholder={config.placeholder || `Filter ${column.label.toLowerCase()}...`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] text-xs"
          />
        </div>
      );
  }
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

// ============================================================
// Helpers
// ============================================================

function getNestedValue(obj, path) {
  if (!path || !obj) return undefined;
  if (!path.includes('.')) return obj[path];
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function formatCellValue(val) {
  if (val === null || val === undefined || val === '') return '—';
  if (val instanceof Date) return val.toLocaleDateString('en-IN');
  if (typeof val === 'boolean') return val ? '✓' : '✗';
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') return JSON.stringify(val).slice(0, 50);
  return String(val);
}