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

function SectionThumb({ src }) {
  const [error, setError] = useState(false);
  if (src && !error) {
    return (
      <img
        src={src}
        alt=""
        className="w-7 h-7 object-contain bg-[var(--bg-elev)] rounded"
        onError={() => setError(true)}
      />
    );
  }
  return <span className="w-7 inline-block text-center">🔋</span>;
}

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
        render: (_, section) => (
          <div className="flex gap-1">
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
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl mb-1">Homepage Sections</h1>
          <p className="text-sm text-[var(--text-subtle)]">
            {sections.length} section(s) configured
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
        emptyMessage="No sections yet"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Section Title"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Featured Home Batteries"
            />
            <Select
              label="Section Type"
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value }))
              }
            >
              {SECTION_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <p className="text-xs text-[var(--text-subtle)]">
            {TYPE_INFO[formData.type]?.desc || ''}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Display Order"
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, order: e.target.value }))
              }
              hint="Lower numbers appear first"
            />
            <div className="flex items-end pb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, active: e.target.checked }))
                  }
                  className="w-5 h-5 accent-accent"
                />
                Active (visible on homepage)
              </label>
            </div>
          </div>

          {/* Product picker */}
          <div className="form-group">
            <label className="block mb-2 font-semibold text-sm text-[var(--text)]">
              Products in this section ({selectedProducts.length} selected)
            </label>

            <input
              type="text"
              placeholder="Search products by brand or model..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] text-sm"
            />

            <div className="max-h-[400px] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-3 space-y-4">
              {Object.keys(grouped).length === 0 ? (
                <p className="text-sm text-[var(--text-subtle)] text-center py-6">
                  No products match your search.
                </p>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <div className="text-[0.65rem] uppercase tracking-widest font-bold text-[var(--text-subtle)] mb-2">
                      {category}
                    </div>
                    <div className="space-y-1">
                      {items.map((p) => {
                        const pid = p.id || p._id;
                        const checked = selectedProducts.includes(pid);
                        return (
                          <label
                            key={pid}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              checked
                                ? 'bg-accent/10 border border-accent/40'
                                : 'hover:bg-[var(--bg-elev)] border border-transparent'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProduct(pid)}
                              className="w-4 h-4 accent-accent shrink-0"
                            />
                            <SectionThumb src={resolveProductImage(p)} />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate text-[var(--text)]">
                                {p.brand} {p.model}
                              </div>
                              {p.capacity && (
                                <div className="text-xs text-[var(--text-subtle)]">
                                  {p.capacity}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingSection ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}