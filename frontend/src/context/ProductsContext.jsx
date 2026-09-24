import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@lib/api';
import { fallbackProducts } from '@data/products';

const ProductsContext = createContext(null);

const CATEGORY_KEYS = {
  homeInverterBatteries: 'homeInverterBatteries',
  homeInverters: 'homeInverters',
  inverter: 'homeInverters',
  carBatteries: 'carBatteries',
  totoErickshawBatteries: 'totoErickshawBatteries',
  ebikeBatteries: 'ebikeBatteries',
  ups: 'ups',
  upsOffice: 'ups',
  home_inverter_batteries: 'homeInverterBatteries',
  home_inverters: 'homeInverters',
  car_batteries: 'carBatteries',
  toto_erickshaw_batteries: 'totoErickshawBatteries',
  ebike_batteries: 'ebikeBatteries',
};

export function normalizeCategory(cat) {
  if (!cat) return 'homeInverterBatteries';
  return CATEGORY_KEYS[cat] || cat;
}

/** Attach a stable `id` to every product so callers don't have to juggle id/_id. */
function withStableId(p) {
  if (!p) return p;
  if (p.id) return p;
  if (p._id) return { ...p, id: String(p._id) };
  return p;
}

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [groupedProducts, setGroupedProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sections, setSections] = useState([]);

  const hydrateProducts = useCallback((items) => {
    const normalized = items.map(withStableId);
    setProducts(normalized);

    const grouped = {
      homeInverterBatteries: [],
      homeInverters: [],
      carBatteries: [],
      totoErickshawBatteries: [],
      ebikeBatteries: [],
      ups: [],
    };

    normalized.forEach((p) => {
      const key = normalizeCategory(p.category);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });

    setGroupedProducts(grouped);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getProducts('?limit=1000');
      if (data?.items?.length) {
        hydrateProducts(data.items);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('API unavailable, using fallback:', err.message);
    }

    // Fallback
    try {
      const flat = [];
      for (const key in fallbackProducts) {
        if (Array.isArray(fallbackProducts[key])) {
          fallbackProducts[key].forEach((p) =>
            flat.push({ ...p, category: normalizeCategory(key) })
          );
        }
      }
      hydrateProducts(flat);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load products:', err);
    }

    setLoading(false);
  }, [hydrateProducts]);

  const loadSections = useCallback(async () => {
    try {
      const data = await api.getSections();
      setSections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load sections:', err.message);
      setSections([]);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadSections();
  }, [loadProducts, loadSections]);

  const findProductById = useCallback(
    (id) => {
      if (!id) return null;
      return products.find((p) => p.id === id || p._id === id) || null;
    },
    [products]
  );

  const getProductsByCategory = useCallback(
    (category) => {
      const key = normalizeCategory(category);
      return groupedProducts[key] || [];
    },
    [groupedProducts]
  );

  const getFeaturedProducts = useCallback(
    (limit = 4) => {
      const flagged = products.filter((p) => p.featured === true);
      if (flagged.length >= limit) return flagged.slice(0, limit);

      const homePool = (groupedProducts.homeInverterBatteries || []).filter(
        (p) => !flagged.includes(p)
      );
      const combined = [...flagged, ...homePool];

      if (combined.length >= limit) return combined.slice(0, limit);

      const extraAny = products.filter((p) => !combined.includes(p));
      return [...combined, ...extraAny].slice(0, limit);
    },
    [products, groupedProducts]
  );

  const value = {
    products,
    groupedProducts,
    loading,
    error,
    sections,
    findProductById,
    getProductsByCategory,
    getFeaturedProducts,
    reload: loadProducts,
    reloadSections: loadSections,
    normalizeCategory,
  };

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}