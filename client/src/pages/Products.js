import { apiUrl } from '../utils/api';
import { Alert, Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductGridCard from '../components/ProductGridCard';
import CategoryHierarchyFields from '../components/CategoryHierarchyFields';
import { useCategories } from '../hooks/useCategories';
import { productMatchesCategory } from '../utils/categoryProducts';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [department, setDepartment] = useState(searchParams.get('department') || '');
  const [productCategory, setProductCategory] = useState(searchParams.get('productCategory') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [subcategory, setSubcategory] = useState(searchParams.get('subcategory') || '');
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const query = searchParams.get('search') || '';
        const first = await fetch(apiUrl(`/api/products?limit=100${query ? `&search=${encodeURIComponent(query)}` : ''}`));
        const body = await first.json();
        if (!first.ok || !body.success) throw new Error(body.message || 'Products could not be loaded.');
        const { products: firstPage = [], pages = 1 } = body.data;
        const otherPages = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, index) => fetch(apiUrl(`/api/products?limit=100&page=${index + 2}${query ? `&search=${encodeURIComponent(query)}` : ''}`)).then((response) => response.json())));
        if (!cancelled) setProducts([...firstPage, ...otherPages.flatMap((page) => page.success ? page.data.products || [] : [])]);
      } catch (loadError) { if (!cancelled) setError(loadError.message); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [searchParams]);

  const filteredProducts = useMemo(() => products
    .filter((product) => !department || product.department === department)
    .filter((product) => !productCategory || product.productCategory === productCategory)
    .filter((product) => productMatchesCategory(product, category, categories))
    .filter((product) => !subcategory || product.subcategory === subcategory)
    .map((product, index) => ({ product, index, image: product.primaryImage || product.images?.[0] }))
    .sort((a, b) => (Number(a.product.homePageOrder) || Number.MAX_SAFE_INTEGER) - (Number(b.product.homePageOrder) || Number.MAX_SAFE_INTEGER) || a.index - b.index),
  [products, department, productCategory, category, subcategory, categories]);

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (search.trim()) next.search = search.trim();
    if (department) next.department = department;
    if (productCategory) next.productCategory = productCategory;
    if (category) next.category = category;
    if (subcategory) next.subcategory = subcategory;
    setSearchParams(next);
  };

  const updateCategorySelection = (selection) => {
    setDepartment(selection.department);
    setProductCategory(selection.productCategory);
    setCategory(selection.categoryId);
    setSubcategory(selection.subcategory);
  };

  return <Box className="page-container"><section className="catalog-section">
    <Box className="catalog-heading"><Box><Typography component="h1">Shop products</Typography><Typography>Browse products by department and category.</Typography></Box><Typography className="catalog-count">{loading ? 'Loading…' : `${filteredProducts.length} item${filteredProducts.length !== 1 ? 's' : ''}`}</Typography></Box>
    <Box component="form" onSubmit={submit} className="product-filter-form">
      <TextField label="Search products" value={search} onChange={(event) => setSearch(event.target.value)} />
      <CategoryHierarchyFields
        categories={categories}
        values={{ department, productCategory, subcategory, categoryId: category }}
        onChange={updateCategorySelection}
        disabled={categoriesLoading || Boolean(categoriesError)}
      />
      <Button type="submit" variant="contained">Apply filters</Button>
    </Box>
    {categoriesError && <Alert severity="error" sx={{ mb: 2 }}>{categoriesError}</Alert>}
    {!categoriesLoading && !categoriesError && categories.length === 0 && <Alert severity="info" sx={{ mb: 2 }}>No categories are available yet.</Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box> : filteredProducts.length ? <div className="photo-grid">{filteredProducts.map(({ product, image }) => <ProductGridCard key={product._id} product={product} image={image} />)}</div> : <Alert severity="info">No products match these filters.</Alert>}
  </section></Box>;
}
