// ============================================================
// MAXVOLT — Admin filter presets & helpers
// ============================================================

import { useMemo } from 'react';

/**
 * Build category filter options from a list
 */
export function useCategoryOptions(categories) {
  return useMemo(() => {
    if (!categories?.length) return [];
    return categories.map((c) => ({
      value: c.slug || c._id,
      label: c.name,
    }));
  }, [categories]);
}

/**
 * Build brand filter options from products
 */
export function useBrandOptions(products) {
  return useMemo(() => {
    if (!products?.length) return [];
    const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
    return brands.map((b) => ({ value: b, label: b }));
  }, [products]);
}

/**
 * Build status filter options
 */
export const ORDER_STATUS_OPTIONS = [
  { value: 'placed', label: 'Placed' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

export const QUOTE_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export const SECTION_TYPE_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'sale', label: 'Sale' },
  { value: 'combo', label: 'Combo' },
  { value: 'new', label: 'New Arrivals' },
];

export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'customer', label: 'Customer' },
];

export const STOCK_OPTIONS = [
  { value: 'in', label: 'In Stock' },
  { value: 'low', label: 'Low Stock (< 5)' },
  { value: 'out', label: 'Out of Stock' },
];

export const AVAILABILITY_OPTIONS = [
  { value: 'Available', label: 'Available' },
  { value: 'Usually Available', label: 'Usually Available' },
  { value: 'Check Availability', label: 'Check Availability' },
];