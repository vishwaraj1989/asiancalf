import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CartContext from '../context/CartContext';


export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data.data)).catch(() => setProduct(null));
  }, [id]);

  if (!product) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4">{product.name}</Typography>
      <Typography variant="h6">₹{product.salePrice || product.price}</Typography>
      <Box sx={{ my: 2 }}>
        <Button variant="contained" onClick={async () => {
          try {
            await addToCart(product._id, 1);
            alert('Added to cart');
          } catch (e) {
            alert('Failed to add to cart');
          }
        }}>Add to cart</Button>
      </Box>
      <Typography>{product.description}</Typography>
    </Box>
  );
}
