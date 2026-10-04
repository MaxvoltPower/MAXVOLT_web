// ============================================================
// MAXVOLT — Admin orders manager (enhanced)
// ============================================================

import { useEffect, useState, useMemo } from 'react';
import { api } from '@lib/api';
import { formatPrice, formatDate } from '@lib/utils';
import { useToast } from '@components/ui/Toast';
import Badge from '@components/ui/Badge';
import AdminTable from './AdminTable';
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '@hooks/useAdminFilters';

export default function OrdersManager() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders();
      setOrders(data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateOrder(id, { status });
      showToast('Order updated', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleBulkStatus = async (ids, status) => {
    if (!confirm(`Update ${ids.length} order(s) to "${status}"?`)) return;
    try {
      await Promise.all(ids.map((id) => api.updateOrder(id, { status })));
      showToast(`${ids.length} order(s) updated`, 'success');
      setSelectedIds([]);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: '_id',
        label: 'Order ID',
        sortable: true,
        render: (val) => (
          <span className="font-mono text-xs">
            #{String(val).slice(-8).toUpperCase()}
          </span>
        ),
      },
      {
        key: 'email',
        label: 'Customer',
        sortable: true,
        filterable: true,
        filter: { type: 'text', placeholder: 'Filter email...' },
        render: (val, order) => (
          <div>
            <div className="text-sm font-medium">{order.shipping?.name || '—'}</div>
            <div className="text-xs text-[var(--text-subtle)]">{val || '—'}</div>
          </div>
        ),
      },
      {
        key: 'phone',
        label: 'Phone',
        sortable: false,
        searchable: true,
        render: (_, order) => (
          <span className="text-xs">{order.shipping?.phone || '—'}</span>
        ),
      },
      {
        key: 'items',
        label: 'Items',
        sortable: false,
        searchable: true,
        render: (val) => (
          <div className="text-xs max-w-[200px]">
            {val?.slice(0, 2).map((i, idx) => (
              <div key={idx} className="truncate">
                {i.model} × {i.qty}
              </div>
            ))}
            {val?.length > 2 && (
              <span className="text-[var(--text-subtle)]">
                +{val.length - 2} more
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'total',
        label: 'Total',
        sortable: true,
        filterable: true,
        filter: { type: 'number-range', label: 'Total Range (₹)' },
        render: (val) => (
          <span className="font-semibold whitespace-nowrap">
            {formatPrice(val)}
          </span>
        ),
      },
      {
        key: 'paymentStatus',
        label: 'Payment',
        sortable: true,
        filterable: true,
        filter: { type: 'select', options: PAYMENT_STATUS_OPTIONS },
        render: (val) => (
          <Badge variant={val === 'paid' ? 'paid' : val === 'failed' ? 'failed' : 'new'}>
            {val || 'pending'}
          </Badge>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        filterable: true,
        filter: { type: 'select', options: ORDER_STATUS_OPTIONS },
        render: (val, order) => (
          <select
            value={val}
            onChange={(e) => {
              e.stopPropagation();
              handleUpdateStatus(order._id, e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
            className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] text-xs cursor-pointer"
          >
            {ORDER_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        ),
      },
      {
        key: 'paymentMethod',
        label: 'Method',
        sortable: true,
        filterable: true,
        filter: {
          type: 'select',
          options: [
            { value: 'cod', label: 'Cash on Delivery' },
            { value: 'razorpay', label: 'Online (Razorpay)' },
          ],
        },
        render: (val) => (
          <span className="text-xs">
            {val === 'cod' ? '💵 COD' : '💳 Online'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Date',
        sortable: true,
        filterable: true,
        filter: { type: 'date-range', label: 'Order Date' },
        render: (val) => (
          <span className="text-xs text-[var(--text-subtle)] whitespace-nowrap">
            {formatDate(val)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl mb-1">Orders</h1>
          <p className="text-sm text-[var(--text-subtle)]">
            {orders.length} total orders
          </p>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={orders}
        loading={loading}
        keyField="_id"
        emptyMessage="No orders yet"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={[
          {
            label: '✓ Confirm',
            onClick: (ids) => handleBulkStatus(ids, 'confirmed'),
          },
          {
            label: '🚚 Ship',
            onClick: (ids) => handleBulkStatus(ids, 'shipped'),
          },
          {
            label: '📦 Deliver',
            onClick: (ids) => handleBulkStatus(ids, 'delivered'),
          },
        ]}
      />
    </>
  );
}