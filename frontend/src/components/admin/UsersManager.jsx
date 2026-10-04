// ============================================================
// MAXVOLT — Admin users manager (enhanced)
// ============================================================

import { useEffect, useState, useMemo } from 'react';
import { api } from '@lib/api';
import { formatDate } from '@lib/utils';
import { useToast } from '@components/ui/Toast';
import Badge from '@components/ui/Badge';
import AdminTable from './AdminTable';
import { ROLE_OPTIONS } from '@hooks/useAdminFilters';

export default function UsersManager() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
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
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleBulkRole = async (uids, role) => {
    if (!confirm(`Change ${uids.length} user(s) role to "${role}"?`)) return;
    try {
      await Promise.all(uids.map((uid) => api.setUserRole(uid, role)));
      showToast(`${uids.length} user(s) updated`, 'success');
      setSelectedIds([]);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'displayName',
        label: 'Name',
        sortable: true,
        filterable: true,
        filter: { type: 'text', placeholder: 'Filter name...' },
        render: (val, user) => (
          <div>
            <div className="font-medium">{val || '—'}</div>
            {user.phone && (
              <div className="text-xs text-[var(--text-subtle)]">{user.phone}</div>
            )}
          </div>
        ),
      },
      {
        key: 'email',
        label: 'Email',
        sortable: true,
        filterable: true,
        filter: { type: 'text', placeholder: 'Filter email...' },
        render: (val) => <span className="text-sm">{val || '—'}</span>,
      },
      {
        key: 'role',
        label: 'Role',
        sortable: true,
        filterable: true,
        filter: { type: 'select', options: ROLE_OPTIONS },
        render: (val) => (
          <Badge variant={val === 'admin' ? 'won' : 'new'}>
            {val || 'customer'}
          </Badge>
        ),
      },
      {
        key: 'city',
        label: 'City',
        sortable: true,
        filterable: true,
        filter: { type: 'text', placeholder: 'Filter city...' },
        render: (val) => <span className="text-sm">{val || '—'}</span>,
      },
      {
        key: 'createdAt',
        label: 'Joined',
        sortable: true,
        filterable: true,
        filter: { type: 'date-range', label: 'Join Date' },
        render: (val) => (
          <span className="text-xs text-[var(--text-subtle)] whitespace-nowrap">
            {formatDate(val)}
          </span>
        ),
      },
      {
        key: 'lastLoginAt',
        label: 'Last Login',
        sortable: true,
        render: (val) => (
          <span className="text-xs text-[var(--text-subtle)] whitespace-nowrap">
            {val ? formatDate(val) : 'Never'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        sortable: false,
        searchable: false,
        render: (_, user) => (
          <div className="flex gap-1">
            {user.role !== 'admin' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleChange(user.uid, 'admin');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-brand/15 text-brand-light text-xs font-semibold hover:bg-brand/25"
              >
                Make Admin
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleChange(user.uid, 'customer');
                }}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--border-strong)] text-xs font-semibold hover:bg-[var(--bg-muted)]"
              >
                Make Customer
              </button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl mb-1">Users</h1>
          <p className="text-sm text-[var(--text-subtle)]">
            {users.length} registered users
          </p>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={users}
        loading={loading}
        keyField="uid"
        emptyMessage="No users found"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={[
          {
            label: '👑 Make Admin',
            onClick: (uids) => handleBulkRole(uids, 'admin'),
          },
          {
            label: '👤 Make Customer',
            onClick: (uids) => handleBulkRole(uids, 'customer'),
          },
        ]}
      />
    </>
  );
}