import React, { useContext, useEffect, useState } from 'react';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useNavigate } from 'react-router-dom';

export default function Checkout() {
  const { cart, loadCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState('');
  const [adding, setAdding] = useState(false);
  const [newAddr, setNewAddr] = useState({ fullName: '', mobile: '', house: '', street: '', area: '', city: '', state: '', pinCode: '' });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/addresses').then((res) => {
      setAddresses(res.data.data || []);
      const def = (res.data.data || []).find((a) => a.isDefault);
      if (def) setSelected(def._id);
    }).catch(() => setAddresses([]));
  }, []);

  const addAddress = async () => {
    try {
      const res = await api.post('/addresses', newAddr);
      setAddresses(res.data.data);
      setAdding(false);
      setNewAddr({ fullName: '', mobile: '', house: '', street: '', area: '', city: '', state: '', pinCode: '' });
    } catch (err) {
      alert('Failed to add address');
    }
  };

  const placeOrder = async () => {
    if (!selected) return alert('Select an address');
    try {
      const res = await api.post('/orders', { addressId: selected, paymentMethod: 'COD' });
      await loadCart();
      alert('Order placed: ' + res.data.data.orderNumber);
      navigate('/');
    } catch (err) {
      alert('Failed to place order');
    }
  };

  if (!cart) return <Typography>Loading cart...</Typography>;
  if (!cart.items || cart.items.length === 0) return <Typography>Your cart is empty</Typography>;

  return (
    <Box>
      <Typography variant="h5">Checkout</Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Select address</Typography>
        <RadioGroup value={selected} onChange={(e) => setSelected(e.target.value)}>
          {addresses.map((a) => (
            <FormControlLabel key={a._id} value={a._id} control={<Radio />} label={`${a.fullName}, ${a.house}, ${a.city} - ${a.pinCode}`} />
          ))}
        </RadioGroup>
        {adding ? (
          <Box>
            <TextField label="Full name" value={newAddr.fullName} onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })} fullWidth />
            <TextField label="Mobile" value={newAddr.mobile} onChange={(e) => setNewAddr({ ...newAddr, mobile: e.target.value })} fullWidth />
            <TextField label="House/Flat" value={newAddr.house} onChange={(e) => setNewAddr({ ...newAddr, house: e.target.value })} fullWidth />
            <Button onClick={addAddress}>Save address</Button>
          </Box>
        ) : (
          <Button onClick={() => setAdding(true)}>Add new address</Button>
        )}
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Order Summary</Typography>
        {cart.items.map((i) => (
          <div key={i._id}>{i.name || (i.product && i.product.name)} x {i.qty} — ₹{i.price}</div>
        ))}
        <Button variant="contained" sx={{ mt: 2 }} onClick={placeOrder}>Place order (COD)</Button>
      </Box>
    </Box>
  );
}
