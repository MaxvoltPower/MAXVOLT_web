import { useEffect, useState } from 'react';
import { api } from '@lib/api';
import { useProducts } from '@context/ProductsContext';
import { useToast } from '@components/ui/Toast';
import { resolveProductImage } from '@lib/utils';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Select from '@components/ui/Select';
import Modal from '@components/ui/Modal';

const CATEGORY_LABELS = {
  homeInverterBatteries: 'Home Inverter Batteries',
  homeInverters: 'Home Inverters',
  inverter: 'Inverters',
  carBatteries: 'Car Batteries',
  totoErickshawBatteries: 'TOTO / E-Rickshaw',
  ebikeBatteries: 'E-Bike Batteries',
  ups: 'UPS Systems',
  upsOffice: 'UPS Systems',
};

export default function SectionsManager() {
  const { showToast } = useToast();
  const { products, reload } = useProducts();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const toggleProduct = (pid) => {
    setSelectedProducts((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
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

  // Group products by category
  const grouped = {};
  filteredProducts.forEach((p) => {
    const c = p.category || 'other';
    (grouped[c] = grouped[c] || []).push(p);
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl">Website Sections</h1>
        <Button onClick={openAdd} variant="primary">+ Add Section</Button>
      </div>

      <div className="surface mb-5 border-l-4 border-accent">
        <strong>💡 How sections work</strong>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Sections appear on the homepage in the order you set (lower number = higher up).
          Use <strong>Featured</strong> for "Featured Products", <strong>Sale</strong> for
          "Sale / Offers", and <strong>Combo</strong> for package deals.
          If you create a Featured section, it automatically replaces the default
          "Featured Home Batteries" fallback on the homepage.
        </p>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : !sections.length ? (
        <p className="text-center text-[var(--text-subtle)] py-12">
          No sections yet. Click "+ Add Section" to create one.
        </p>
      ) : (
        <div className="space-y-4">
          {sections.map((s) => (
            <div
              key={s._id}
              className="surface flex flex-wrap justify-between items-center gap-3"
            >
              <div>
                <h3 className="mb-1">{s.title}</h3>
                <span className="badge badge-new">{s.type}</span>
                <span
                  className={`badge ${
                    s.active !== false ? 'badge-delivered' : 'badge-failed'
                  } ml-1`}
                >
                  {s.active !== false ? 'Active' : 'Hidden'}
                </span>
                <span className="text-sm text-[var(--text-subtle)] ml-2">
                  {(s.products || []).length} product(s)
                </span>
                <span className="text-sm text-[var(--text-subtle)] ml-2">
                  Order: {s.order || 0}
                </span>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => openEdit(s)} variant="outline" size="sm">
                  Edit
                </Button>
                <Button onClick={() => handleDelete(s._id)} variant="secondary" size="sm">
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

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
              <option value="featured">Featured Products</option>
              <option value="sale">Sale / Offers</option>
              <option value="combo">Combo / Package Offers</option>
              <option value="new">New Arrivals</option>
            </Select>

            <Input
              label="Display Order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData((p) => ({ ...p, order: e.target.value }))}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm">
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
            <div className="max-h-80 overflow-y-auto border border-dark-border rounded-lg p-2 bg-dark-muted">
              {!filteredProducts.length ? (
                <div className="p-4 text-center text-[var(--text-subtle)]">
                  No products match
                </div>
              ) : (
                Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat} className="mb-2">
                    <div className="text-xs uppercase tracking-widest text-[var(--text-subtle)] px-2 py-1.5 font-bold">
                      {CATEGORY_LABELS[cat] || cat}
                    </div>
                    {items.map((p) => {
                      const pid = p._id || p.id;
                      const checked = selectedProducts.includes(pid);
                      const img = p.image
                        ? resolveProductImage(p)
                        : null;
                      const price = p.discountedPrice || p.price || 0;
                      return (
                        <label
                          key={pid}
                          className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-dark-elevated"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleProduct(pid)}
                            className="w-4 h-4 accent-secondary"
                          />
                          {img ? (
                            <img
                              src={img}
                              alt=""
                              className="w-7 h-7 object-contain bg-dark-elevated rounded"
                            />
                          ) : (
                            <span className="w-7 inline-block text-center">🔋</span>
                          )}
                          <span className="flex-1 text-sm text-[var(--text)]">
                            {p.brand} {p.model}
                          </span>
                          <span className="text-xs text-[var(--text-subtle)]">
                            ₹{price}
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
              className="w-5 h-5 accent-secondary"
            />
            Active
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