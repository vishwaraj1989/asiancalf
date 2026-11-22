import { apiUrl } from '../utils/api';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import ProductGridCard from '../components/ProductGridCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  const availableDepartments = [...new Set(
    productCards
      .map(({ product }) => product.department)
      .filter((department) => typeof department === 'string' && department.trim())
  )].sort((left, right) => left.localeCompare(right));
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
        {!loading && !error && availableDepartments.length > 0 && (
          <Box component="section" sx={{ mb: 4 }} aria-label="Browse available departments">
            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Browse departments</Typography>
            <Box className="category-grid">
              {availableDepartments.map((department) => (
                <Button
                  key={department}
                  component={RouterLink}
                  to={`/products?department=${encodeURIComponent(department)}`}
                  className="category-tile"
                >
                  {department}
                </Button>
              ))}
            </Box>
          </Box>
        )}
        {!loading && !error && productCards.length === 0 && <Alert severity="info">No products are available right now.</Alert>}
        {!loading && !error && productCards.length > 0 && (
          <Box component="section" aria-label="Featured products">
            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Our collection</Typography>
            <div className="photo-grid">
              {productCards.map(({ product, image }) => <ProductGridCard key={product._id} product={product} image={image} />)}
            </div>
          </Box>
        )}
      </section>
    </div>
  );
}
