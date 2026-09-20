import { classNames } from '@lib/utils';

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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 max-w-6xl mx-auto">
      <input
        type="text"
        placeholder="🔍 Search products..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="px-4 py-3 rounded-xl border-[1.5px] border-dark-border bg-dark-muted text-[var(--text)]"
      />

      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="px-4 py-3 rounded-xl border-[1.5px] border-dark-border bg-dark-muted text-[var(--text)] cursor-pointer"
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
        className="px-4 py-3 rounded-xl border-[1.5px] border-dark-border bg-dark-muted text-[var(--text)] cursor-pointer"
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
        className="px-4 py-3 rounded-xl border-[1.5px] border-dark-border bg-dark-muted text-[var(--text)] cursor-pointer"
      >
        <option value="default">Sort: Default</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="name-asc">Name: A-Z</option>
        <option value="name-desc">Name: Z-A</option>
      </select>
    </div>
  );
}