import { useEffect, useState } from 'react';
import { api } from '@lib/api';
import { formatPrice, formatDate } from '@lib/utils';
import { useToast } from '@components/ui/Toast';
import Badge from '@components/ui/Badge';

const STATUSES = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersManager() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <>
      <h1 className="text-2xl mb-6">Orders</h1>

      {loading ? (
        <p>Loading...</p>
      ) : !orders.length ? (
        <p className="text-center text-[var(--text-subtle)] py-12">No orders yet</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-dark-border bg-dark-elevated">
          <table className="w-full text-sm">
            <thead className="bg-dark-muted">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Order</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Customer</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Items</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Total</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Payment</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Status</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-t border-dark-border hover:bg-accent/5">
                  <td className="px-3 py-3">#{String(o._id).slice(-8).toUpperCase()}</td>
                  <td className="px-3 py-3">{o.email || '-'}</td>
                  <td className="px-3 py-3 text-xs">
                    {o.items?.map((i) => `${i.model} ×${i.qty}`).join(', ')}
                  </td>
                  <td className="px-3 py-3">{formatPrice(o.total)}</td>
                  <td className="px-3 py-3">
                    <Badge variant={o.paymentStatus === 'paid' ? 'paid' : 'new'}>
                      {o.paymentStatus || 'pending'}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => handleUpdateStatus(o._id, e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-dark-border bg-dark-muted text-sm cursor-pointer"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3 text-[var(--text-subtle)]">
                    {formatDate(o.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}