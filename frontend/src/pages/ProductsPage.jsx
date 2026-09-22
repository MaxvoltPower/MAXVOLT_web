// ============================================================
// MAXVOLT — Products listing page
// ============================================================

import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProducts, normalizeCategory } from '@context/ProductsContext';
import ProductGrid from '@components/products/ProductGrid';
import ProductFilters from '@components/products/ProductFilters';
import { parsePriceToNumber } from '@lib/utils';

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

export default function ProductsPage() {
  const { products, loading, getProductsByCategory } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [brand, setBrand] = useState('');
  const [sort, setSort] = useState('default');

  useEffect(() => {
    const cat = searchParams.get('category') || '';
    setCategory(cat);
  }, [searchParams]);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      const c = normalizeCategory(p.category);
      if (c) set.add(c);
    });
    return Array.from(set);
  }, [products]);

  const brands = useMemo(() => {
    const set = new Set();
    products.forEach((p) => p.brand && set.add(p.brand));
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let list = category ? getProductsByCategory(category) : [...products];

    if (brand) list = list.filter((p) => p.brand === brand);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        const hay = `${p.brand || ''} ${p.model || ''} ${p.capacity || ''} ${
          p.type || ''
        } ${p.va || ''}`.toLowerCase();
        return hay.includes(q);
      });
    }

    // Sort
    const sorted = [...list];
    if (sort === 'price-asc') {
      sorted.sort(
        (a, b) =>
          parsePriceToNumber(a.discountedPrice || a.price) -
          parsePriceToNumber(b.discountedPrice || b.price)
      );
    } else if (sort === 'price-desc') {
      sorted.sort(
        (a, b) =>
          parsePriceToNumber(b.discountedPrice || b.price) -
          parsePriceToNumber(a.discountedPrice || a.price)
      );
    } else if (sort === 'name-asc') {
      sorted.sort((a, b) =>
        `${a.brand || ''} ${a.model || ''}`.localeCompare(
          `${b.brand || ''} ${b.model || ''}`
        )
      );
    } else if (sort === 'name-desc') {
      sorted.sort((a, b) =>
        `${b.brand || ''} ${b.model || ''}`.localeCompare(
          `${a.brand || ''} ${a.model || ''}`
        )
      );
    }

    return sorted;
  }, [products, category, brand, search, sort, getProductsByCategory]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    if (cat) setSearchParams({ category: cat });
    else setSearchParams({});
  };

  const activeCategoryLabel = CATEGORY_LABELS[category] || '';

  return (
    <>
      {/* Hero / breadcrumb */}
      <section className="bg-gradient-to-br from-[#001f3f] to-[#003366] text-white py-8 sm:py-10">
        <div className="container-custom">
          <nav
            className="flex items-center gap-2 text-xs sm:text-sm mb-3 opacity-90 flex-wrap"
            aria-label="Breadcrumb"
          >
            <Link to="/" className="hover:text-secondary-light transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/80">Products</span>
            {activeCategoryLabel && (
              <>
                <span>/</span>
                <span className="text-white/80">{activeCategoryLabel}</span>
              </>
            )}
          </nav>
          <h1 className="text-white mb-2">
            {activeCategoryLabel || 'All Products'}
          </h1>
          <p className="text-sm sm:text-base opacity-90">
            Browse our complete range of batteries, inverters, and power solutions
          </p>
        </div>
      </section>

      <section className="container-custom py-8 sm:py-10">
        <ProductFilters
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={handleCategoryChange}
          brand={brand}
          onBrandChange={setBrand}
          sort={sort}
          onSortChange={setSort}
          categories={categories}
          brands={brands}
          categoryLabels={CATEGORY_LABELS}
        />

        <div className="text-center text-xs sm:text-sm text-[var(--text-subtle)] mb-5">
          {filtered.length
            ? `${filtered.length} product${filtered.length === 1 ? '' : 's'} found`
            : 'No products found'}
        </div>

        <ProductGrid
          products={filtered}
          loading={loading}
          emptyMessage="No products match your filters"
        />
      </section>
    </>
  );
}