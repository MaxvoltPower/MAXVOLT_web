// ============================================================
// MAXVOLT — Categories context
// Loads categories once, exposes them to the whole app, and
// provides a slug → display-name lookup for convenience.
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { api } from '@lib/api';

const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCategories(false);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load categories:', err.message);
      setCategories([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // slug → name
  const labels = useMemo(() => {
    const out = {};
    for (const c of categories) out[c.slug] = c.name;
    return out;
  }, [categories]);

  const getCategoryBySlug = useCallback(
    (slug) => categories.find((c) => c.slug === slug) || null,
    [categories]
  );

  const value = {
    categories,
    loading,
    error,
    labels,
    getCategoryBySlug,
    reload: load,
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within a CategoriesProvider');
  return ctx;
}