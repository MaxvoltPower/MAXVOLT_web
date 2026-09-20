import { useEffect, useState } from 'react';
import { api } from '@lib/api';
import { formatDate } from '@lib/utils';
import { useToast } from '@components/ui/Toast';
import Badge from '@components/ui/Badge';

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];

export default function QuotesManager() {
  const { showToast } = useToast();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <>
      <h1 className="text-2xl mb-6">Quote Requests</h1>

      {loading ? (
        <p>Loading...</p>
      ) : !quotes.length ? (
        <p className="text-center text-[var(--text-subtle)] py-12">No quotes yet</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-dark-border bg-dark-elevated">
          <table className="w-full text-sm">
            <thead className="bg-dark-muted">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Date</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Name</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Phone</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Email</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Requirement</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Status</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q._id} className="border-t border-dark-border hover:bg-accent/5">
                  <td className="px-3 py-3 text-[var(--text-subtle)]">
                    {formatDate(q.createdAt)}
                  </td>
                  <td className="px-3 py-3">{q.name}</td>
                  <td className="px-3 py-3">
                    <a href={`tel:${q.phone}`} className="text-accent">
                      {q.phone}
                    </a>
                  </td>
                  <td className="px-3 py-3">{q.email || '-'}</td>
                  <td className="px-3 py-3">{q.requirement}</td>
                  <td className="px-3 py-3">
                    <select
                      value={q.status}
                      onChange={(e) => handleUpdate(q._id, e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-dark-border bg-dark-muted text-sm cursor-pointer"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => handleDelete(q._id)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-secondary to-secondary-light text-white text-xs font-semibold"
                    >
                      Delete
                    </button>
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