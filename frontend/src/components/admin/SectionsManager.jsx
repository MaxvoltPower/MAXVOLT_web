import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

const TYPE_INFO = {
  featured: {
    label: 'Featured Products',
    desc: 'Standard product grid on the homepage.',
    color: 'text-brand-light',
  },
  sale: {
    label: 'Sale / Offers',
    desc: 'Adds a "Sale" badge in the header + a link to /sale. All products across sale sections appear on the sale page.',
    color: 'text-red-400',
  },
  combo: {
    label: 'Combo / Package',
    desc: 'Groups products as a bundle. A "Combo" link appears in the header + a /combo page lists all bundles with "Add Combo to Cart".',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Group products by category
  const grouped = {};
  filteredProducts.forEach((p) => {
    const c = p.category || 'other';
    (grouped[c] = grouped[c] || []).push(p);
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl mb-1">Website Sections</h1>
          <p className="text-sm text-[var(--text-subtle)]">
            Control what appears on the homepage, sale page and combo page.
          </p>
        </div>
        <Button onClick={openAdd} variant="primary">
          + Add Section
        </Button>
      </div>

      {/* Help card */}
      <div className="surface mb-5 border-l-4 border-accent">
        <strong className="text-[var(--text)]">💡 How sections work</strong>
        <ul className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
          <li>
            <strong className="text-[var(--text)]">Featured</strong> — normal product
            grid on the homepage.
          </li>
          <li>
            <strong className="text-red-400">Sale</strong> — adds a live "Sale" badge
            in the header and shows all sale products on the{' '}
            <code className="text-xs bg-[var(--bg-muted)] px-1.5 py-0.5 rounded">/sale</code>{' '}
            page.
          </li>
          <li>
            <strong className="text-accent">Combo</strong> — appears as a bundle with
            an "Add Whole Combo to Cart" button. All combos are listed on the{' '}
            <code className="text-xs bg-[var(--bg-muted)] px-1.5 py-0.5 rounded">/combo</code>{' '}
            page.
          </li>
          <li>
            <strong className="text-emerald-400">New</strong> — highlighted as new
            stock.
          </li>
          <li className="pt-2 text-xs">
            Lower <strong>Order</strong> numbers appear higher on the page.
          </li>
        </ul>
      </div>

      {loading ? (
        <p className="py-12 text-center text-[var(--text-subtle)]">Loading sections...</p>
      ) : !sections.length ? (
        <p className="text-center text-[var(--text-subtle)] py-12">
          No sections yet. Click "+ Add Section" to create one.
        </p>
      ) : (
        <div className="space-y-4">
          {sections.map((s) => {
            const info = TYPE_INFO[s.type] || TYPE_INFO.featured;
            return (
              <div
                key={s._id}
                className="surface flex flex-wrap justify-between items-start gap-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 text-[var(--text)]">{s.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`font-bold uppercase tracking-wide ${info.color}`}>
                      {info.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                        s.active !== false
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {s.active !== false ? 'Active' : 'Hidden'}
                    </span>
                    <span className="text-[var(--text-subtle)]">
                      {(s.products || []).length} product(s)
                    </span>
                    <span className="text-[var(--text-subtle)]">
                      Order: {s.order || 0}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-subtle)] mt-1.5">{info.desc}</p>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  {s.type === 'sale' && s.active !== false && (
                    <Link
                      to="/sale"
                      className="inline-flex items-center px-3 py-2 rounded-lg border-2 border-red-500/50 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-colors"
                    >
                      View Sale Page
                    </Link>
                  )}
                  {s.type === 'combo' && s.active !== false && (
                    <Link
                      to="/combo"
                      className="inline-flex items-center px-3 py-2 rounded-lg border-2 border-accent/50 text-accent text-xs font-semibold hover:bg-accent/10 transition-colors"
                    >
                      View Combo Page
                    </Link>
                  )}
                  <Button onClick={() => openEdit(s)} variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button onClick={() => handleDelete(s._id)} variant="secondary" size="sm">
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
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
            placeholder="e.g., Summer Sale, Featured Products, Combo Pack"
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
              hint="Lower numbers appear first."
            />
          </div>

          {/* Type-specific hint */}
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
                      {CATEGORY_LABELS[cat] || cat}
                    </div>
                    {items.map((p) => {
                      const pid = p._id || p.id;
                      const checked = selectedProducts.includes(pid);
                      const img = p.image ? resolveProductImage(p) : null;
                      const price = p.discountedPrice || p.price || 0;
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
                            <img
                              src={img}
                              alt=""
                              className="w-7 h-7 object-contain bg-[var(--bg-elev)] rounded"
                            />
                          ) : (
                            <span className="w-7 inline-block text-center">🔋</span>
                          )}
                          <span className="flex-1 text-sm text-[var(--text)] truncate">
                            {p.brand} {p.model}
                          </span>
                          <span className="text-xs text-[var(--text-subtle)] shrink-0">
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