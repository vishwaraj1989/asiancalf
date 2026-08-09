import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.data.products || []);
    } catch (err) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const deleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${productId}`);
      setProducts((prev) => prev.filter((product) => product._id !== productId));
    } catch (err) {
      alert('Delete failed');
    }
  };

  if (loading) return <Typography>Loading products...</Typography>;

  return (
    <div>
      <Typography variant="h4" gutterBottom>Products</Typography>
      <Button component={Link} to="/admin/products/add" variant="contained" sx={{ mb: 2 }}>Add Product</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Stock</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p._id}>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.sku}</TableCell>
              <TableCell>₹{p.salePrice || p.price}</TableCell>
              <TableCell>{p.stock}</TableCell>
              <TableCell>
                <Button component={Link} to={`/admin/products/edit/${p._id}`} size="small">Edit</Button>
                <Button size="small" onClick={() => deleteProduct(p._id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
