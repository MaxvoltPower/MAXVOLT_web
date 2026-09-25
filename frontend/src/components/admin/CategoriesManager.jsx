// ============================================================
// MAXVOLT — Admin categories manager
// ============================================================

import { useEffect, useState, useMemo } from 'react';
import { api } from '@lib/api';
import { useCategories } from '@context/CategoriesContext';
import { useProducts } from '@context/ProductsContext';
import { useToast } from '@components/ui/Toast';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Modal from '@components/ui/Modal';
import Badge from '@components/ui/Badge';

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  image: '',
  icon: '📦',
  order: 0,
  active: true,
};

/** Auto-derive a slug preview from the name */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Auto-slug from name unless the user has manually edited the slug
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

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl mb-1">Categories</h1>
          <p className="text-sm text-[var(--text-subtle)]">
            Add, edit, reorder, and hide product categories shown on the homepage.
          </p>
        </div>
        <Button onClick={openAdd} variant="primary" size="sm">
          + Add Category
        </Button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-[var(--text-subtle)]">Loading categories...</p>
      ) : categories.length === 0 ? (
        <div className="surface text-center py-12">
          <div className="text-4xl mb-3 opacity-60">📦</div>
          <p className="mb-4 text-[var(--text-muted)]">No categories yet.</p>
          <Button onClick={openAdd} variant="primary">Create your first category</Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-dark-border bg-dark-elevated">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-dark-muted">
              <tr>
                <th className="px-3 py-3 w-16"></th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Name</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Slug</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Products</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Order</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Status</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} className="border-t border-dark-border hover:bg-accent/5">
                  <td className="px-3 py-3">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt=""
                        className="w-11 h-11 object-cover rounded-md bg-dark-muted"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-11 h-11 grid place-items-center bg-dark-muted rounded-md text-lg">
                        {cat.icon || '📦'}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 font-semibold">{cat.name}</td>
                  <td className="px-3 py-3 text-xs font-mono text-[var(--text-subtle)]">
                    {cat.slug}
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={productCountBySlug[cat.slug] ? 'delivered' : 'pending'}>
                      {productCountBySlug[cat.slug] || 0}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{cat.order ?? 0}</td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => toggleActive(cat)}
                      className="inline-flex"
                      title={cat.active === false ? 'Click to show' : 'Click to hide'}
                    >
                      <Badge variant={cat.active === false ? 'failed' : 'delivered'}>
                        {cat.active === false ? 'Hidden' : 'Visible'}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <button
                      onClick={() => openEdit(cat)}
                      className="px-3 py-1.5 rounded-lg border-2 border-dark-border-strong text-xs font-semibold hover:bg-dark-muted mr-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
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
              hint="Full-width cover image on the category card."
            />
            <Input
              label="Icon (fallback)"
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              placeholder="🏠"
              hint="Shown when no image URL is set."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Display Order"
              name="order"
              type="number"
              value={formData.order}
              onChange={handleChange}
              hint="Lower numbers appear first."
            />
            <div className="flex items-end pb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="w-5 h-5 accent-secondary"
                />
                Visible on homepage
              </label>
            </div>
          </div>

          {formData.image && (
            <div className="rounded-xl border border-dark-border overflow-hidden">
              <img
                src={formData.image}
                alt="Preview"
                className="w-full h-40 object-cover bg-dark-muted"
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