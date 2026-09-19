import { useEffect, useState } from 'react';
import { api } from '@lib/api';
import { formatPrice, formatDate } from '@lib/utils';
import Badge from '@components/ui/Badge';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getAdminStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading stats...</p>;
  if (error) return <p className="text-red-400">Failed to load: {error}</p>;
  if (!stats) return null;

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats.totals?.revenue || 0), accent: true },
    { label: 'Orders', value: stats.totals?.orders || 0 },
    { label: 'Products', value: stats.totals?.products || 0 },
    { label: 'Quotes', value: stats.totals?.quotes || 0 },
    { label: 'Users', value: stats.totals?.users || 0 },
    { label: 'Orders Today', value: stats.today?.orders || 0 },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-dark-elevated border border-dark-border rounded-2xl p-6 flex flex-col gap-2"
          >
            <span className="text-xs uppercase tracking-widest text-[var(--text-subtle)]">
              {card.label}
            </span>
            <span
              className={`text-3xl font-extrabold ${
                card.accent ? 'text-secondary-light' : 'text-[var(--text)]'
              }`}
            >
              {card.value}
            </span>
          </div>
        ))}
      </div>

      <h2 className="text-xl mb-4">Recent Orders</h2>
      <div className="overflow-x-auto rounded-2xl border border-dark-border bg-dark-elevated mb-8">
        <table className="w-full text-sm">
          <thead className="bg-dark-muted">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Order</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Total</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {(stats.recentOrders || []).map((o) => (
              <tr key={o._id} className="hover:bg-accent/5">
                <td className="px-4 py-3">#{String(o._id).slice(-8).toUpperCase()}</td>
                <td className="px-4 py-3">{o.email || '-'}</td>
                <td className="px-4 py-3">{formatPrice(o.total)}</td>
                <td className="px-4 py-3"><Badge variant={o.status}>{o.status}</Badge></td>
                <td className="px-4 py-3">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl mb-4">Recent Quotes</h2>
      <div className="overflow-x-auto rounded-2xl border border-dark-border bg-dark-elevated">
        <table className="w-full text-sm">
          <thead className="bg-dark-muted">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Requirement</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {(stats.recentQuotes || []).map((q) => (
              <tr key={q._id} className="hover:bg-accent/5">
                <td className="px-4 py-3">{q.name}</td>
                <td className="px-4 py-3">{q.phone}</td>
                <td className="px-4 py-3">{q.requirement}</td>
                <td className="px-4 py-3"><Badge variant={q.status}>{q.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}