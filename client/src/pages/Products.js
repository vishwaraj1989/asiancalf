import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import ProductCard from '../components/ProductCard';
import api from '../services/api';
import Typography from '@mui/material/Typography';

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/products').then((res) => setProducts(res.data.data.products)).catch(() => setProducts([]));
  }, []);

  return (
    <div>
      <Typography variant="h4" gutterBottom>Shop</Typography>
      <Grid container spacing={2}>
        {products.map((p) => (
          <Grid item xs={12} sm={6} md={3} key={p._id}>
            <ProductCard product={p} />
          </Grid>
        ))}
      </Grid>
    </div>
  );
}
