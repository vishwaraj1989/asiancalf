import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useCategories } from './useCategories';
import { categoryAssignmentPayload, categoryIdForProduct, normalizeCategoryName, productMatchesCategory } from '../utils/categoryProducts';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function CategoryProbe({ onChange }) {
  const state = useCategories();
  React.useEffect(() => onChange(state), [state, onChange]);
  return null;
}

describe('category browsing data', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    jest.restoreAllMocks();
  });

  test('loads the existing category endpoint and reports loaded categories', async () => {
    const categories = [{ _id: 'cat-1', name: 'Kitchen' }];
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: categories }),
    });
    const onChange = jest.fn();

    await act(async () => root.render(<CategoryProbe onChange={onChange} />));

    expect(fetchMock).toHaveBeenCalledWith('/api/categories', expect.any(Object));
    expect(onChange).toHaveBeenLastCalledWith({ categories, loading: false, error: '' });
  });

  test('surfaces API errors and leaves the category list empty', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, message: 'Category service unavailable' }),
    });
    const onChange = jest.fn();

    await act(async () => root.render(<CategoryProbe onChange={onChange} />));

    expect(onChange).toHaveBeenLastCalledWith({ categories: [], loading: false, error: 'Category service unavailable' });
  });

  test('reports a valid empty category response without an API error', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });
    const onChange = jest.fn();

    await act(async () => root.render(<CategoryProbe onChange={onChange} />));

    expect(onChange).toHaveBeenLastCalledWith({ categories: [], loading: false, error: '' });
  });

  test('matches products by category ID and retains exact legacy-name matching', () => {
    const categories = [{ _id: 'cat-1', name: 'Kitchen' }];
    expect(productMatchesCategory({ category: { _id: 'cat-1', name: 'Kitchen' } }, 'cat-1', categories)).toBe(true);
    expect(productMatchesCategory({ category: 'cat-1' }, 'cat-1', categories)).toBe(true);
    expect(productMatchesCategory({ productCategory: '  KITCHEN  ' }, 'cat-1', categories)).toBe(true);
    expect(productMatchesCategory({ categoryName: 'Kitchen' }, 'cat-1', categories)).toBe(true);
    expect(productMatchesCategory({ category: 'Kitchen' }, 'cat-1', categories)).toBe(true);
    expect(productMatchesCategory({ productCategory: 'Furniture' }, 'cat-1', categories)).toBe(false);
    expect(productMatchesCategory({ department: 'Kitchen' }, 'cat-1', categories)).toBe(true);
    expect(productMatchesCategory({ category: { _id: 'cat-2' }, productCategory: 'Kitchen' }, 'cat-1', [...categories, { _id: 'cat-2', name: 'Furniture' }])).toBe(false);
    expect(productMatchesCategory({}, '', categories)).toBe(true);
    expect(normalizeCategoryName('  KITCHEN  ')).toBe('kitchen');
  });

  test('editing keeps an existing category ID and category-only assignment changes no other fields', () => {
    const product = { _id: 'product-1', category: { _id: 'cat-1', name: 'Kitchen' }, images: ['/uploads/one.jpg'] };
    expect(categoryIdForProduct(product)).toBe('cat-1');
    expect(categoryIdForProduct({ category: 'cat-2' })).toBe('cat-2');
    expect(categoryIdForProduct({ productCategory: 'Kitchen' })).toBe('');
    expect(categoryAssignmentPayload('cat-2')).toEqual({ category: 'cat-2' });
  });
});
