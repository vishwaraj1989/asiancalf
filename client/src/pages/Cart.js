import React, { useContext } from 'react';
import CartContext from '../context/CartContext';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link, useNavigate } from 'react-router-dom';

// Note: cart items may include populated product or stored fields

export default function Cart() {
  const { cart, updateItem } = useContext(CartContext);
  const navigate = useNavigate();
  if (!cart) return <Typography>Loading...</Typography>;
  if (!cart.items || cart.items.length === 0) return <Typography>Your cart is empty</Typography>;
  const subtotal = cart.items.reduce((s, i) => s + (i.price || (i.product && i.product.price) || 0) * i.qty, 0);
  return (
    <div>
      <Typography variant="h5">Your Cart</Typography>
      {cart.items.map((it) => (
        <div key={it._id} style={{ marginBottom: 8 }}>
          {it.name || (it.product && it.product.name)} — Qty: {it.qty} — ₹{it.price}
          <Button size="small" onClick={() => updateItem(it.product._id || it.product, Math.max(0, it.qty - 1))}>-</Button>
          <Button size="small" onClick={() => updateItem(it.product._id || it.product, it.qty + 1)}>+</Button>
        </div>
      ))}
      <Typography variant="h6">Subtotal: ₹{subtotal}</Typography>
      <Button variant="contained" component={Link} to="/checkout">Proceed to checkout</Button>
    </div>
  );
}
