// ============================================================
// MAXVOLT — Admin products manager
// ============================================================

import { useEffect, useState, useMemo } from 'react';
import { api } from '@lib/api';
import { useProducts } from '@context/ProductsContext';
import { useCategories } from '@context/CategoriesContext';
import { formatPrice, resolveProductImage, resolveProductImages } from '@lib/utils';
import { useToast } from '@components/ui/Toast';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Select from '@components/ui/Select';
import Modal from '@components/ui/Modal';
import Badge from '@components/ui/Badge';

// Category labels are now loaded from the CategoriesContext at runtime.
// Kept as a fallback in case the DB is empty on first run.
const FALLBACK_CATEGORY_LABELS = {
  homeInverterBatteries: 'Home Inverter Batteries',
  homeInverters: 'Home Inverters',
  inverter: 'Inverters',
  carBatteries: 'Car Batteries',
  totoErickshawBatteries: 'TOTO / E-Rickshaw',
  ebikeBatteries: 'E-Bike Batteries',
  ups: 'UPS Systems',
};

const EMPTY_FORM = {
  brand: '',
  model: '',
  category: 'homeInverterBatteries',
  capacity: '',
  type: '',
  voltage: '',
  warranty: '',
  price: '',
  discountedPrice: '',
  availability: '',
  bestFor: '',
  va: '',
  stock: '',
  active: true,
  featured: false,
  images: [''], // array of strings (URL / base64 / filename)
};

/** Extract a usable array of images from a product document. */
function imagesFromProduct(product) {
  const list = resolveProductImages(product);
  if (list.length === 0) return [''];
  return list;
}

export default function ProductsManager() {
  const { reload } = useProducts();
  const { categories: dbCategories, labels: categoryLabelsFromDb } = useCategories();
  const { showToast } = useToast();

  const CATEGORY_LABELS =
    dbCategories && dbCategories.length > 0
      ? categoryLabelsFromDb
      : FALLBACK_CATEGORY_LABELS;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts('?limit=1000&all=1');
      setProducts(data.items || []);
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

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      brand: product.brand || '',
      model: product.model || '',
      category: product.category || 'homeInverterBatteries',
      capacity: product.capacity || '',
      type: product.type || '',
      voltage: product.voltage || '',
      warranty: product.warranty || '',
      price: product.price || '',
      discountedPrice: product.discountedPrice || '',
      availability: product.availability || '',
      bestFor: product.bestFor || '',
      va: product.va || '',
      stock: product.stock ?? '',
      active: product.active !== false,
      featured: product.featured === true,
      images: imagesFromProduct(product),
    });
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      await api.deleteProduct(id);
      showToast('Product deleted', 'success');
      load();
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      // Clean image list: drop empty entries, keep order
      const cleanImages = (formData.images || [])
        .map((s) => (typeof s === 'string' ? s.trim() : ''))
        .filter(Boolean);

      const payload = {
        ...formData,
        images: cleanImages,
        image: cleanImages[0] || null,
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct._id, payload);
        showToast('Product updated', 'success');
      } else {
        await api.createProduct(payload);
        showToast('Product created', 'success');
      }
      setModalOpen(false);
      load();
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // ---- Image array helpers ----
  const updateImage = (index, value) => {
    setFormData((prev) => {
      const next = [...prev.images];
      next[index] = value;
      return { ...prev, images: next };
    });
  };

  const addImageField = () => {
    setFormData((prev) => ({ ...prev, images: [...prev.images, ''] }));
  };

  const removeImageField = (index) => {
    setFormData((prev) => {
      const next = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: next.length ? next : [''] };
    });
  };

  const moveImage = (index, direction) => {
    setFormData((prev) => {
      const next = [...prev.images];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, images: next };
    });
  };

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${p.brand || ''} ${p.model || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, categoryFilter, search]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl">Products</h1>
        <Button onClick={handleAdd} variant="primary" size="sm">
          + Add Product
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by model/brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs px-4 py-2.5 rounded-xl border-[1.5px] border-dark-border bg-dark-muted text-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:max-w-xs px-4 py-2.5 rounded-xl border-[1.5px] border-dark-border bg-dark-muted text-sm cursor-pointer"
        >
          <option value="">All Categories</option>
          {dbCategories && dbCategories.length > 0
            ? dbCategories.map((c) => (
                <option key={c._id || c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))
            : Object.entries(FALLBACK_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
        </select>
      </div>

      {loading ? (
        <p className="py-12 text-center text-[var(--text-subtle)]">
          Loading products...
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-[var(--text-subtle)]">
          No products found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-dark-border bg-dark-elevated">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-dark-muted">
              <tr>
                <th className="px-3 py-3 w-16"></th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">
                  Brand
                </th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">
                  Model
                </th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">
                  Category
                </th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">
                  Price
                </th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">
                  Stock
                </th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const img = resolveProductImage(p);
                return (
                  <tr
                    key={p._id}
                    className="border-t border-dark-border hover:bg-accent/5"
                  >
                    <td className="px-3 py-3">
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="w-11 h-11 object-contain bg-dark-muted rounded-md"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-11 h-11 grid place-items-center bg-dark-muted rounded-md">
                          🔋
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">{p.brand}</td>
                    <td className="px-3 py-3">{p.model}</td>
                    <td className="px-3 py-3 text-xs">
                      {CATEGORY_LABELS[p.category] || p.category}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {formatPrice(p.discountedPrice || p.price)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={p.stock > 0 ? 'delivered' : 'failed'}>
                        {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={p.active !== false ? 'delivered' : 'failed'}>
                        {p.active !== false ? 'Active' : 'Hidden'}
                      </Badge>
                      {p.featured && (
                        <Badge variant="new" className="ml-1">
                          Featured
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(p)}
                        className="px-3 py-1.5 rounded-lg border-2 border-dark-border-strong text-xs font-semibold hover:bg-dark-muted mr-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-secondary to-secondary-light text-white text-xs font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Brand"
              name="brand"
              required
              value={formData.brand}
              onChange={handleChange}
            />
            <Input
              label="Model"
              name="model"
              required
              value={formData.model}
              onChange={handleChange}
            />
          </div>

          <Select
            label="Category"
            name="category"
            required
            value={formData.category}
            onChange={handleChange}
          >
            {dbCategories && dbCategories.length > 0
              ? dbCategories.map((c) => (
                  <option key={c._id || c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))
              : Object.entries(FALLBACK_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              hint='Free text — e.g. "150Ah", "12V / 160Ah". The calculator parses this automatically.'
            />
            <Input
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Voltage"
              name="voltage"
              value={formData.voltage}
              onChange={handleChange}
            />
            <Input
              label="Warranty"
              name="warranty"
              value={formData.warranty}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="MRP (₹ or range)"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g. 9500 or 9500 - 10500"
            />
            <Input
              label="Discounted Price (₹)"
              name="discountedPrice"
              type="number"
              value={formData.discountedPrice}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="VA (for inverters/UPS)"
              name="va"
              value={formData.va}
              onChange={handleChange}
              hint='Free text — e.g. "700VA", "650VA / 360W". The calculator parses this automatically.'
            />
            <Input
              label="Stock Quantity"
              name="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Availability"
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              placeholder="Available / Usually Available / Check Availability"
            />
            <Input
              label="Best For"
              name="bestFor"
              value={formData.bestFor}
              onChange={handleChange}
            />
          </div>

          {/* ---------- Images ---------- */}
          <div className="form-group">
            <label className="block mb-2 font-semibold text-sm text-[var(--text)]">
              Product Images
            </label>
            <p className="text-xs text-[var(--text-subtle)] mb-3">
              Paste a full URL (<code>https://…</code>), a data URL
              (<code>data:image/…</code>), an absolute path
              (<code>/assets/images/foo.jpg</code>), or just a filename
              (<code>foo.jpg</code>). The first image is used as the main
              thumbnail. Up to ~1.8 MB per image.
            </p>

            <div className="space-y-3">
              {formData.images.map((img, index) => {
                const preview = resolveProductImage({ image: img });
                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-xl border border-dark-border bg-dark-muted"
                  >
                    {/* Preview */}
                    <div className="w-16 h-16 shrink-0 rounded-lg bg-dark-elevated border border-dark-border grid place-items-center overflow-hidden">
                      {preview ? (
                        <img
                          src={preview}
                          alt=""
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent && !parent.querySelector('.img-warn')) {
                              const span = document.createElement('span');
                              span.className = 'img-warn text-xl';
                              span.textContent = '⚠️';
                              parent.appendChild(span);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-xl text-[var(--text-subtle)]">🖼️</span>
                      )}
                    </div>

                    {/* Input + controls */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={img}
                        onChange={(e) => updateImage(index, e.target.value)}
                        placeholder="https://… or foo.jpg or data:image/…"
                        className="w-full px-3 py-2 rounded-lg border-[1.5px] border-dark-border bg-dark-elevated text-xs font-mono"
                      />
                      {index === 0 && (
                        <p className="text-[10px] text-emerald-400 mt-1 font-semibold uppercase tracking-wide">
                          Main image
                        </p>
                      )}
                    </div>

                    {/* Reorder + remove */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveImage(index, -1)}
                        disabled={index === 0}
                        className="w-7 h-7 rounded-md border border-dark-border text-xs hover:bg-dark-elevated disabled:opacity-30"
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(index, 1)}
                        disabled={index === formData.images.length - 1}
                        className="w-7 h-7 rounded-md border border-dark-border text-xs hover:bg-dark-elevated disabled:opacity-30"
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="w-7 h-7 rounded-md border border-red-500/40 text-xs text-red-400 hover:bg-red-500/10"
                        aria-label="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addImageField}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg border-[1.5px] border-dashed border-dark-border-strong text-xs font-semibold hover:bg-dark-muted hover:border-accent transition-all"
            >
              + Add another image
            </button>
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="w-5 h-5 accent-secondary"
              />
              Active (visible on website)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="w-5 h-5 accent-secondary"
              />
              Featured (show on homepage)
            </label>
          </div>

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
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}