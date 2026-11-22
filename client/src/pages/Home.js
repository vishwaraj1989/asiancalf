import { apiUrl } from '../utils/api';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import ProductGridCard from '../components/ProductGridCard';
import { useCategories } from '../hooks/useCategories';
import { categoryDepartments } from '../utils/categoryTaxonomy';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  useEffect(() => {
    const loadAllProducts = async () => {
      const firstResponse = await fetch(apiUrl('/api/products?limit=100'));
      const firstBody = await firstResponse.json();
      if (!firstResponse.ok || !firstBody.success) throw new Error(firstBody.message || 'Products could not be loaded.');
      const { products: firstProducts = [], pages = 1 } = firstBody.data;
      const remaining = await Promise.all(Array.from(
        { length: Math.max(0, pages - 1) },
        (_, index) => fetch(apiUrl(`/api/products?limit=100&page=${index + 2}`)).then((response) => response.json())
      ));
      setProducts([...firstProducts, ...remaining.flatMap((body) => body.success ? body.data.products || [] : [])]);
    };
    loadAllProducts().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const productCards = products
    .map((product, index) => ({ product, index, image: product.primaryImage || product.images?.[0] }))
    .filter(({ image }) => Boolean(image))
    .sort((a, b) => {
      const aOrder = Number(a.product.homePageOrder) || Number.MAX_SAFE_INTEGER;
      const bOrder = Number(b.product.homePageOrder) || Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder || a.index - b.index;
    });
  const departments = [...new Set(productCards.map(({ product }) => product.department || 'Other products'))];
  const browseDepartments = categoryDepartments(categories).filter((department) => department !== 'Other products');

  return (
    <div className="page-container">
      <section className="catalog-section">
        <Box className="catalog-heading">
          <Box>
            <Typography component="h1">Discover our collection</Typography>
            <Typography>Thoughtfully selected pieces for everyday spaces.</Typography>
          </Box>
          <Typography className="catalog-count">{loading ? 'Loading collection…' : `${productCards.length} item${productCards.length !== 1 ? 's' : ''}`}</Typography>
        </Box>
        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
        {error && <Alert severity="error">{error} Check the backend API configuration.</Alert>}
        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Browse departments</Typography>
          {categoriesLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>}
          {categoriesError && <Alert severity="error">{categoriesError}</Alert>}
          {!categoriesLoading && !categoriesError && categories.length === 0 && <Alert severity="info">No categories are available yet.</Alert>}
          {!categoriesLoading && !categoriesError && browseDepartments.length > 0 && <Box className="category-grid">{browseDepartments.map((department) => <Button key={department} component={RouterLink} to={`/products?department=${encodeURIComponent(department)}`} className="category-tile">{department}</Button>)}</Box>}
        </Box>
        {!loading && !error && productCards.length === 0 && <Alert severity="info">No products are available right now.</Alert>}
        {!loading && !error && departments.some((department) => department !== 'Other products') && <Box className="home-department-nav" aria-label="Browse departments">{departments.filter((department) => department !== 'Other products').map((department) => <Button key={department} component={RouterLink} to={`/products?department=${encodeURIComponent(department)}`} variant="outlined">{department}</Button>)}</Box>}
        {!loading && !error && departments.map((department) => (
          <Box component="section" className="home-department-section" key={department}>
            <Typography component={RouterLink} to={`/products?department=${encodeURIComponent(department)}`} className="home-department-title">{department} →</Typography>
            <div className="photo-grid">
              {productCards.filter(({ product }) => (product.department || 'Other products') === department).map(({ product, image }) => <ProductGridCard key={product._id} product={product} image={image} />)}
            </div>
          </Box>
        ))}
      </section>
    </div>
  );
}
