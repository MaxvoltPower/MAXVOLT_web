// ============================================================
// MAXVOLT — Product filters
// ============================================================

export default function ProductFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  brand,
  onBrandChange,
  sort,
  onSortChange,
  categories = [],
  brands = [],
  categoryLabels = {},
}) {
  const selectClass =
    'w-full px-4 py-3 rounded-xl border-[1.5px] border-dark-border bg-dark-muted text-[var(--text)] text-sm cursor-pointer hover:border-dark-border-strong transition-colors';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 max-w-6xl mx-auto">
      <div className="relative sm:col-span-2 lg:col-span-1">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border-[1.5px] border-dark-border bg-dark-muted text-[var(--text)] text-sm"
          aria-label="Search products"
        />
      </div>

      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className={selectClass}
        aria-label="Filter by category"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {categoryLabels[c] || c}
          </option>
        ))}
      </select>

      <select
        value={brand}
        onChange={(e) => onBrandChange(e.target.value)}
        className={selectClass}
        aria-label="Filter by brand"
      >
        <option value="">All Brands</option>
        {brands.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className={selectClass}
        aria-label="Sort products"
      >
        <option value="default">Sort: Default</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="name-asc">Name: A–Z</option>
        <option value="name-desc">Name: Z–A</option>
      </select>
    </div>
  );
}