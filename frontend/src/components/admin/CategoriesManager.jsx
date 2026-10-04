// ============================================================
// MAXVOLT — Admin categories manager (enhanced)
// ============================================================

import { useEffect, useState, useMemo } from 'react';
import { api } from '@lib/api';
import { useCategories } from '@context/CategoriesContext';
import { useProducts } from '@context/ProductsContext';
import { useToast } from '@components/ui/Toast';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Modal from '@components/ui/Modal';
import AdminTable from './AdminTable';

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  image: '',
  icon: '📦',
  order: 0,
  active: true,
};

function autoSlug(name) {
  if (!name) return '';
  const words = String(name)
    .trim()
    .replace(/[^A-Za-z0-9\s-]/g, '')
    .split(/[\s-]+/)
    .filter(Boolean);
  if (words.length === 0) return '';
  return words
    .map((w, i) =>
      i === 0
        ? w.charAt(0).toLowerCase() + w.slice(1)
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join('');
}

export default function CategoriesManager() {
  const { showToast } = useToast();
  const { reload: reloadCategories } = useCategories();
  const { reload: reloadProducts } = useProducts();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        api.getCategories(true),
        api.getProducts('?limit=1000&all=1').catch(() => ({ items: [] })),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(prods?.items || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const productCountBySlug = useMemo(() => {
    const out = {};
    for (const p of products) {
      const k = p.category;
      if (!k) continue;
      out[k] = (out[k] || 0) + 1;
    }
    return out;
  }, [products]);

  const openAdd = () => {
    setEditing(null);
    setFormData({ ...EMPTY, order: categories.length + 1 });
    setSlugTouched(false);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      image: cat.image || '',
      icon: cat.icon || '📦',
      order: cat.order ?? 0,
      active: cat.active !== false,
    });
    setSlugTouched(true);
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'name' && !slugTouched) {
        next.slug = autoSlug(value);
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!formData.name.trim()) {
      showToast('Name is required', 'warning');
      return;
    }
    if (!formData.slug.trim()) {
      showToast('Slug is required', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        image: formData.image.trim(),
        icon: formData.icon.trim() || '📦',
        order: Number(formData.order) || 0,
        active: formData.active !== false,
      };
      if (editing) {
        await api.updateCategory(editing._id, payload);
        showToast('Category updated', 'success');
      } else {
        await api.createCategory(payload);
        showToast('Category created', 'success');
      }
      setModalOpen(false);
      await load();
      reloadCategories();
      reloadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    const inUse = productCountBySlug[cat.slug] || 0;
    if (inUse > 0) {
      showToast(
        `Cannot delete: ${inUse} product(s) still use "${cat.name}". Reassign them first.`,
        'error'
      );
      return;
    }
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteCategory(cat._id);
      showToast('Category deleted', 'success');
      await load();
      reloadCategories();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const toggleActive = async (cat) => {
    try {
      await api.updateCategory(cat._id, { active: cat.active === false });
      showToast(cat.active === false ? 'Category shown' : 'Category hidden', 'success');
      await load();
      reloadCategories();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleBulkToggleActive = async (ids, active) => {
    try {
      await Promise.all(ids.map((id) => api.updateCategory(id, { active })));
      showToast(`${ids.length} category(ies) ${active ? 'shown' : 'hidden'}`, 'success');
      setSelectedIds([]);
      await load();
      reloadCategories();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'icon',
        label: '',
        width: '60px',
        sortable: false,
        searchable: false,
        render: (val, cat) => {
          if (cat.image) {
            return (
              <img
                src={cat.image}
                alt=""
                className="w-10 h-10 object-cover rounded-md bg-[var(--bg-muted)]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            );
          }
          return (
            <div className="w-10 h-10 grid place-items-center bg-[var(--bg-muted)] rounded-md text-lg">
              {val || '📦'}
            </div>
          );
        },
      },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        filterable: true,
        filter: { type: 'text', placeholder: 'Filter name...' },
        render: (val) => <span className="font-semibold">{val || '—'}</span>,
      },
      {
        key: 'slug',
        label: 'Slug',
        sortable: true,
        filterable: true,
        filter: { type: 'text', placeholder: 'Filter slug...' },
        render: (val) => (
          <span className="text-xs font-mono text-[var(--text-subtle)]">
            {val || '—'}
          </span>
        ),
      },
      {
        key: 'description',
        label: 'Description',
        sortable: false,
        searchable: true,
        render: (val) => (
          <span className="text-xs text-[var(--text-muted)] max-w-[200px] block truncate">
            {val || '—'}
          </span>
        ),
      },
      {
        key: 'productCount',
        label: 'Products',
        sortable: true,
        sorter: (a, b, rowA, rowB) => {
          const countA = productCountBySlug[rowA.slug] || 0;
          const countB = productCountBySlug[rowB.slug] || 0;
          return countA - countB;
        },
        filterable: true,
        filter: {
          type: 'number-range',
          label: 'Product Count',
          customFilter: true,
        },
        render: (_, cat) => {
          const count = productCountBySlug[cat.slug] || 0;
          return (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                count > 0
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-slate-500/15 text-slate-400'
              }`}
            >
              {count}
            </span>
          );
        },
      },
      {
        key: 'order',
        label: 'Order',
        sortable: true,
        filterable: true,
        filter: { type: 'number-range', label: 'Display Order' },
        render: (val) => <span className="tabular-nums">{val ?? 0}</span>,
      },
      {
        key: 'active',
        label: 'Status',
        sortable: true,
        filterable: true,
        filter: { type: 'boolean', trueLabel: 'Visible', falseLabel: 'Hidden' },
        render: (val, cat) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleActive(cat);
            }}
            className="inline-flex"
            title={val === false ? 'Click to show' : 'Click to hide'}
          >
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                val === false
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-emerald-500/15 text-emerald-400'
              }`}
            >
              {val === false ? 'Hidden' : 'Visible'}
            </span>
          </button>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        sortable: false,
        searchable: false,
        render: (_, cat) => (
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEdit(cat);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--border-strong)] text-xs font-semibold hover:bg-[var(--bg-muted)]"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(cat);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-semibold hover:bg-red-500/25"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [productCountBySlug]
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl mb-1">Categories</h1>
          <p className="text-sm text-[var(--text-subtle)]">
            {categories.length} categories configured
          </p>
        </div>
        <Button onClick={openAdd} variant="primary" size="sm">
          + Add Category
        </Button>
      </div>

      <AdminTable
        columns={columns}
        data={categories}
        loading={loading}
        keyField="_id"
        emptyMessage="No categories yet"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={[
          {
            label: '✓ Show',
            onClick: (ids) => handleBulkToggleActive(ids, true),
          },
          {
            label: '✗ Hide',
            onClick: (ids) => handleBulkToggleActive(ids, false),
          },
        ]}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Category' : 'Add Category'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Home Inverter Batteries"
          />

          <Input
            label="Slug (URL key)"
            name="slug"
            required
            value={formData.slug}
            onChange={(e) => {
              setSlugTouched(true);
              handleChange(e);
            }}
            placeholder="homeInverterBatteries"
            hint="Used in URLs and to match products. Auto-generated from the name."
          />

          <div className="form-group">
            <label className="block mb-2 font-semibold text-sm text-[var(--text)]">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Short description shown on the homepage card"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Image URL"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
            />
            <Input
              label="Icon (fallback)"
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              placeholder="🏠"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Display Order"
              name="order"
              type="number"
              value={formData.order}
              onChange={handleChange}
            />
            <div className="flex items-end pb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="w-5 h-5 accent-accent"
                />
                Visible on homepage
              </label>
            </div>
          </div>

          {formData.image && (
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <img
                src={formData.image}
                alt="Preview"
                className="w-full h-40 object-cover bg-[var(--bg-muted)]"
                onError={(e) => {
                  e.currentTarget.style.opacity = '0.3';
                }}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}