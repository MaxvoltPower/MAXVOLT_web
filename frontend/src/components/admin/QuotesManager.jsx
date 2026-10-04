// ============================================================
// MAXVOLT — Admin quotes manager (enhanced)
// ============================================================

import { useEffect, useState, useMemo } from 'react';
import { api } from '@lib/api';
import { formatDate } from '@lib/utils';
import { useToast } from '@components/ui/Toast';
import Badge from '@components/ui/Badge';
import AdminTable from './AdminTable';
import { QUOTE_STATUS_OPTIONS } from '@hooks/useAdminFilters';

export default function QuotesManager() {
  const { showToast } = useToast();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getQuotes();
      setQuotes(data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdate = async (id, status) => {
    try {
      await api.updateQuote(id, { status });
      showToast('Quote updated', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this quote request?')) return;
    try {
      await api.deleteQuote(id);
      showToast('Quote deleted', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleBulkStatus = async (ids, status) => {
    if (!confirm(`Update ${ids.length} quote(s) to "${status}"?`)) return;
    try {
      await Promise.all(ids.map((id) => api.updateQuote(id, { status })));
      showToast(`${ids.length} quote(s) updated`, 'success');
      setSelectedIds([]);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleBulkDelete = async (ids) => {
    if (!confirm(`Delete ${ids.length} quote(s)?`)) return;
    try {
      await Promise.all(ids.map((id) => api.deleteQuote(id)));
      showToast(`${ids.length} quote(s) deleted`, 'success');
      setSelectedIds([]);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'createdAt',
        label: 'Date',
        sortable: true,
        filterable: true,
        filter: { type: 'date-range', label: 'Request Date' },
        render: (val) => (
          <span className="text-xs text-[var(--text-subtle)] whitespace-nowrap">
            {formatDate(val)}
          </span>
        ),
      },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        filterable: true,
        filter: { type: 'text', placeholder: 'Filter name...' },
        render: (val) => <span className="font-medium">{val || '—'}</span>,
      },
      {
        key: 'phone',
        label: 'Phone',
        sortable: true,
        searchable: true,
        render: (val) => (
          <a
            href={`tel:${val}`}
            className="text-accent hover:underline text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {val || '—'}
          </a>
        ),
      },
      {
        key: 'email',
        label: 'Email',
        sortable: true,
        filterable: true,
        filter: { type: 'text', placeholder: 'Filter email...' },
        render: (val) => (
          <span className="text-xs text-[var(--text-subtle)]">{val || '—'}</span>
        ),
      },
      {
        key: 'requirement',
        label: 'Requirement',
        sortable: true,
        filterable: true,
        filter: {
          type: 'select',
          options: [
            { value: 'Home Inverter + Battery', label: 'Home Inverter + Battery' },
            { value: 'Car Battery', label: 'Car Battery' },
            { value: 'TOTO / E-Rickshaw Battery', label: 'TOTO / E-Rickshaw' },
            { value: 'E-Bike Battery', label: 'E-Bike Battery' },
            { value: 'UPS System', label: 'UPS System' },
            { value: 'Solar Solution', label: 'Solar Solution' },
            { value: 'Other Power Solution', label: 'Other' },
          ],
        },
        render: (val) => (
          <span className="text-xs max-w-[180px] block truncate">{val || '—'}</span>
        ),
      },
      {
        key: 'location',
        label: 'Location',
        sortable: true,
        filterable: true,
        filter: { type: 'text', placeholder: 'Filter location...' },
        render: (val) => (
          <span className="text-xs">{val || '—'}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        filterable: true,
        filter: { type: 'select', options: QUOTE_STATUS_OPTIONS },
        render: (val, quote) => (
          <select
            value={val}
            onChange={(e) => {
              e.stopPropagation();
              handleUpdate(quote._id, e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
            className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] text-xs cursor-pointer"
          >
            {QUOTE_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        sortable: false,
        searchable: false,
        render: (_, quote) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(quote._id);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-semibold hover:bg-red-500/25"
          >
            Delete
          </button>
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl mb-1">Quote Requests</h1>
          <p className="text-sm text-[var(--text-subtle)]">
            {quotes.length} total quote requests
          </p>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={quotes}
        loading={loading}
        keyField="_id"
        emptyMessage="No quote requests yet"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={[
          {
            label: '✓ Contacted',
            onClick: (ids) => handleBulkStatus(ids, 'contacted'),
          },
          {
            label: '💰 Quoted',
            onClick: (ids) => handleBulkStatus(ids, 'quoted'),
          },
          {
            label: '🏆 Won',
            onClick: (ids) => handleBulkStatus(ids, 'won'),
          },
          {
            label: '🗑️ Delete',
            variant: 'danger',
            onClick: handleBulkDelete,
          },
        ]}
      />
    </>
  );
}