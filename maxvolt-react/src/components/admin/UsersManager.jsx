import { useEffect, useState } from 'react';
import { api } from '@lib/api';
import { formatDate } from '@lib/utils';
import { useToast } from '@components/ui/Toast';
import Badge from '@components/ui/Badge';

export default function UsersManager() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async (q = '') => {
    setLoading(true);
    try {
      const data = await api.getUsers(q);
      setUsers(data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRoleChange = async (uid, role) => {
    if (!confirm(`Change role to "${role}"?`)) return;
    try {
      await api.setUserRole(uid, role);
      showToast('Role updated', 'success');
      load(search);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl">Users</h1>
        <input
          type="text"
          placeholder="Search by email/name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            load(e.target.value);
          }}
          className="max-w-xs px-4 py-2.5 rounded-xl border-[1.5px] border-dark-border bg-dark-muted"
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : !users.length ? (
        <p className="text-center text-[var(--text-subtle)] py-12">No users found</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-dark-border bg-dark-elevated">
          <table className="w-full text-sm">
            <thead className="bg-dark-muted">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Name</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Email</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Role</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Joined</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid || u._id} className="border-t border-dark-border hover:bg-accent/5">
                  <td className="px-3 py-3">{u.displayName || '-'}</td>
                  <td className="px-3 py-3">{u.email || '-'}</td>
                  <td className="px-3 py-3">
                    <Badge variant={u.role === 'admin' ? 'won' : 'new'}>
                      {u.role || 'customer'}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-[var(--text-subtle)]">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => handleRoleChange(u.uid, 'customer')}
                      className="px-3 py-1.5 rounded-lg border-2 border-dark-border-strong text-xs font-semibold hover:bg-dark-muted mr-1"
                    >
                      Make Customer
                    </button>
                    <button
                      onClick={() => handleRoleChange(u.uid, 'admin')}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-primary-light to-primary text-white text-xs font-semibold"
                    >
                      Make Admin
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