import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: '',
    sku: '',
    price: '',
    salePrice: '',
    stock: '',
    category: '',
    description: '',
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data.categories || [])).catch(() => setCategories([]));
    if (id) {
      api.get(`/products/${id}`).then((res) => {
        const productData = res.data.data;
        setProduct({
          name: productData.name || '',
          sku: productData.sku || '',
          price: productData.price || '',
          salePrice: productData.salePrice || '',
          stock: productData.stock || '',
          category: productData.category?._id || '',
          description: productData.description || '',
        });
      }).catch(() => {
        alert('Unable to load product');
      });
    }
  }, [id]);

  const handleChange = (field) => (event) => {
    setProduct({ ...product, [field]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: product.name,
        sku: product.sku,
        price: Number(product.price),
        salePrice: product.salePrice ? Number(product.salePrice) : undefined,
        stock: Number(product.stock),
        category: product.category,
        description: product.description,
      };
      if (id) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      navigate('/admin/products');
    } catch (err) {
      alert('Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>{id ? 'Edit' : 'Add'} Product</Typography>
      <TextField label="Name" value={product.name} onChange={handleChange('name')} fullWidth margin="normal" required />
      <TextField label="SKU" value={product.sku} onChange={handleChange('sku')} fullWidth margin="normal" required />
      <TextField label="Price" value={product.price} onChange={handleChange('price')} fullWidth margin="normal" required type="number" />
      <TextField label="Sale Price" value={product.salePrice} onChange={handleChange('salePrice')} fullWidth margin="normal" type="number" />
      <TextField label="Stock" value={product.stock} onChange={handleChange('stock')} fullWidth margin="normal" required type="number" />
      <TextField
        select
        label="Category"
        value={product.category}
        onChange={handleChange('category')}
        fullWidth
        margin="normal"
        required
      >
        {categories.map((category) => (
          <MenuItem key={category._id} value={category._id}>{category.name}</MenuItem>
        ))}
      </TextField>
      <TextField
        multiline
        minRows={4}
        label="Description"
        value={product.description}
        onChange={handleChange('description')}
        fullWidth
        margin="normal"
      />
      <Button type="submit" variant="contained" disabled={loading} sx={{ mt: 2 }}>
        {id ? 'Update' : 'Create'} Product
      </Button>
    </Box>
  );
}
