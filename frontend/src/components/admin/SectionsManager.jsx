// ============================================================
// MAXVOLT — Admin sections manager (enhanced)
// ============================================================

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@lib/api';
import { useProducts } from '@context/ProductsContext';
import { useToast } from '@components/ui/Toast';
import { resolveProductImage } from '@lib/utils';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Select from '@components/ui/Select';
import Modal from '@components/ui/Modal';
import AdminTable from './AdminTable';
import { SECTION_TYPE_OPTIONS } from '@hooks/useAdminFilters';

const TYPE_INFO = {
  featured: {
    label: 'Featured Products',
    desc: 'Standard product grid on the homepage.',
    color: 'text-brand-light',
  },
  sale: {
    label: 'Sale / Offers',
    desc: 'Adds a "Sale" badge in the header + a link to /sale.',
    color: 'text-red-400',
  },
  combo: {
    label: 'Combo / Package',
    desc: 'Groups products as a bundle.',
    color: 'text-accent',
  },
  new: {
    label: 'New Arrivals',
    desc: 'Highlighted as new stock on the homepage.',
    color: 'text-emerald-400',
  },
};

export default function SectionsManager() {
  const { showToast } = useToast();
  const { products, reload } = useProducts();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    type: 'featured',
    order: 0,
    active: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getSections();
      setSections(data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditingSection(null);
    setFormData({ title: '', type: 'featured', order: 0, active: true });
    setSelectedProducts([]);
    setProductSearch('');
    setModalOpen(true);
  };

  const openEdit = (section) => {
    setEditingSection(section);
    setFormData({
      title: section.title || '',
      type: section.type || 'featured',
      order: section.order || 0,
      active: section.active !== false,
    });
    setSelectedProducts(section.products || []);
    setProductSearch('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this section?')) return;
    try {
      await api.deleteSection(id);
      showToast('Section deleted', 'success');
      load();
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleBulkDelete = async (ids) => {
    if (!confirm(`Delete ${ids.length} section(s)?`)) return;
    try {
      await Promise.all(ids.map((id) => api.deleteSection(id)));
      showToast(`${ids.length} section(s) deleted`, 'success');
      setSelectedIds([]);
      load();
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleBulkToggleActive = async (ids, active) => {
    try {
      await Promise.all(
        ids.map((id) => api.updateSection(id, { active }))
      );
      showToast(`${ids.length} section(s) ${active ? 'activated' : 'hidden'}`, 'success');
      setSelectedIds([]);
      load();
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const toggleProduct = (pid) => {
    setSelectedProducts((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Section title is required', 'warning');
      return;
    }
    const payload = {
      ...formData,
      title: formData.title.trim(),
      order: Number(formData.order) || 0,
      products: selectedProducts,
    };
    try {
      if (editingSection) {
        await api.updateSection(editingSection._id, payload);
        showToast('Section updated', 'success');
      } else {
        await api.createSection(payload);
        showToast('Section created', 'success');
      }
      setModalOpen(false);
      load();
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!productSearch) return true;
    return `${p.brand || ''} ${p.model || ''}`
      .toLowerCase()
      .includes(productSearch.toLowerCase());
  });

  const grouped = {};
  filteredProducts.forEach((p) => {
    const c = p.category || 'other';
    (grouped[c] = grouped[c] || []).push(p);
  });

  const columns = useMemo(
    () => [
      {
        key: 'title',
        label: 'Title',
        sortable: true,
        filterable: true,
        filter: { type: 'text', placeholder: 'Filter title...' },
        render: (val) => <span className="font-semibold">{val || '—'}</span>,
      },
      {
        key: 'type',
        label: 'Type',
        sortable: true,
        filterable: true,
        filter: { type: 'select', options: SECTION_TYPE_OPTIONS },
        render: (val) => {
          const info = TYPE_INFO[val] || TYPE_INFO.featured;
          return (
            <span className={`text-xs font-bold uppercase ${info.color}`}>
              {info.label}
            </span>
          );
        },
      },
      {
        key: 'products',
        label: 'Products',
        sortable: true,
        sorter: (a, b) => (a?.length || 0) - (b?.length || 0),
        render: (val) => (
          <span className="text-sm">{(val || []).length} product(s)</span>
        ),
      },
      {
        key: 'order',
        label: 'Order',
        sortable: true,
        filterable: true,
        filter: { type: 'number-range', label: 'Display Order' },
        render: (val) => <span className="tabular-nums">{val || 0}</span>,
      },
      {
        key: 'active',
        label: 'Status',
        sortable: true,
        filterable: true,
        filter: { type: 'boolean', trueLabel: 'Active', falseLabel: 'Hidden' },
        render: (val) => (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
              val !== false
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-red-500/15 text-red-400'
            }`}
          >
            {val !== false ? 'Active' : 'Hidden'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        sortable: false,
        searchable: false,
        render: (_, section) => {
          const info = TYPE_INFO[section.type] || TYPE_INFO.featured;
          return (
            <div className="flex flex-wrap gap-1">
              {section.type === 'sale' && section.active !== false && (
                <Link
                  to="/sale"
                  className="px-2 py-1.5 rounded-lg border border-red-500/50 text-red-400 text-xs font-semibold hover:bg-red-500/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Sale
                </Link>
              )}
              {section.type === 'combo' && section.active !== false && (
                <Link
                  to="/combo"
                  className="px-2 py-1.5 rounded-lg border border-accent/50 text-accent text-xs font-semibold hover:bg-accent/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Combo
                </Link>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(section);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--border-strong)] text-xs font-semibold hover:bg-[var(--bg-muted)]"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(section._id);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-semibold hover:bg-red-500/25"
              >
                Delete
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl mb-1">Website Sections</h1>
          <p className="text-sm text-[var(--text-subtle)]">
            {sections.length} sections configured
          </p>
        </div>
        <Button onClick={openAdd} variant="primary" size="sm">
          + Add Section
        </Button>
      </div>

      <AdminTable
        columns={columns}
        data={sections}
        loading={loading}
        keyField="_id"
        emptyMessage="No sections yet. Click '+ Add Section' to create one."
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={[
          {
            label: '✓ Activate',
            onClick: (ids) => handleBulkToggleActive(ids, true),
          },
          {
            label: '✗ Hide',
            onClick: (ids) => handleBulkToggleActive(ids, false),
          },
          {
            label: '🗑️ Delete',
            variant: 'danger',
            onClick: handleBulkDelete,
          },
        ]}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSection ? 'Edit Section' : 'Add Section'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Section Title"
            required
            value={formData.title}
            onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
            placeholder="e.g., Summer Sale, Featured Products"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Section Type"
              required
              value={formData.type}
              onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
            >
              {SECTION_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>

            <Input
              label="Display Order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData((p) => ({ ...p, order: e.target.value }))}
              hint="Lower numbers appear first."
            />
          </div>

          {TYPE_INFO[formData.type] && (
            <div className="p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
              <strong className={TYPE_INFO[formData.type].color}>
                {TYPE_INFO[formData.type].label}:
              </strong>{' '}
              {TYPE_INFO[formData.type].desc}
            </div>
          )}

          <div>
            <label className="block mb-2 font-semibold text-sm text-[var(--text)]">
              Select Products{' '}
              <span className="text-[var(--text-subtle)] font-normal">
                ({selectedProducts.length} selected)
              </span>
            </label>
            <input
              type="text"
              placeholder="🔍 Search by brand or model..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-80 overflow-y-auto border border-[var(--border)] rounded-lg p-2 bg-[var(--bg-muted)]">
              {!filteredProducts.length ? (
                <div className="p-4 text-center text-[var(--text-subtle)]">
                  No products match
                </div>
              ) : (
                Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat} className="mb-2">
                    <div className="text-xs uppercase tracking-widest text-[var(--text-subtle)] px-2 py-1.5 font-bold">
                      {cat}
                    </div>
                    {items.map((p) => {
                      const pid = p._id || p.id;
                      const checked = selectedProducts.includes(pid);
                      const img = p.image ? resolveProductImage(p) : null;
                      return (
                        <label
                          key={pid}
                          className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-[var(--bg-elev)]"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleProduct(pid)}
                            className="w-4 h-4 accent-accent"
                          />
                          {img ? (
                            <img src={img} alt="" className="w-7 h-7 object-contain bg-[var(--bg-elev)] rounded" />
                          ) : (
                            <span className="w-7 inline-block text-center">🔋</span>
                          )}
                          <span className="flex-1 text-sm text-[var(--text)] truncate">
                            {p.brand} {p.model}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData((p) => ({ ...p, active: e.target.checked }))}
              className="w-5 h-5 accent-accent"
            />
            <span className="text-sm">Active (visible to customers)</span>
          </label>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}