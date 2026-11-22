import { apiRequest, mediaUrl } from '../utils/api';
import { Alert, Box, Button, CircularProgress, Divider, FormControlLabel, Paper, Radio, RadioGroup, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const priceFor = (item) => Number(item.cartPrice ?? item.salePrice ?? item.discountPrice ?? item.price ?? 0);
const emptyAddress = { fullName: '', mobile: '', house: '', street: '', area: '', city: '', state: '', pinCode: '', landmark: '' };
const marketplaceLinks = (item) => (item.marketplaceUrls?.length ? item.marketplaceUrls : item.marketplaceUrl ? [item.marketplaceUrl] : []).filter((url) => /^https?:\/\//i.test(url));

export default function Checkout() {
  const { token } = useAuth();
  const { items, cartError, cartReady, clearCart } = useCart();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [addingAddress, setAddingAddress] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');
  const subtotal = items.reduce((sum, item) => sum + priceFor(item) * item.qty, 0);
  const delivery = subtotal > 2000 ? 0 : 50;

  useEffect(() => {
    apiRequest('/api/addresses', {}, token)
      .then((result) => { setAddresses(result || []); setSelectedAddress((result || []).find((item) => item.isDefault)?._id || result?.[0]?._id || ''); })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingAddresses(false));
  }, [token]);

  const saveAddress = async (event) => {
    event.preventDefault();
    setSavingAddress(true);
    setError('');
    try {
      const result = await apiRequest('/api/addresses', { method: 'POST', body: JSON.stringify(addressForm) }, token);
      setAddresses(result || []);
      setSelectedAddress(result?.[result.length - 1]?._id || '');
      setAddressForm(emptyAddress);
      setAddingAddress(false);
    } catch (err) { setError(err.message); }
    finally { setSavingAddress(false); }
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!items.length) return setError('Your cart is empty.');
    if (!cartReady) return setError('Your cart is still syncing. Please try again in a moment.');
    if (!selectedAddress) return setError('Select or add a delivery address.');
    setPlacingOrder(true);
    setError('');
    try {
      const order = await apiRequest('/api/orders', { method: 'POST', body: JSON.stringify({ addressId: selectedAddress, paymentMethod: 'COD' }) }, token);
      await clearCart();
      navigate(`/order-success/${order._id}`, { state: { order } });
    } catch (err) { setError(err.message); }
    finally { setPlacingOrder(false); }
  };

  if (!cartReady || loadingAddresses) return <Box className="page-container" sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!items.length) return <Box className="page-container"><Paper sx={{ p: 3 }}><Typography variant="h4" gutterBottom>Checkout</Typography><Typography sx={{ mb: 2 }}>Your cart is empty.</Typography><Button component={RouterLink} to="/products" variant="contained">Browse products</Button></Paper></Box>;

  return <Box className="page-container"><Box className="checkout-layout"><Paper className="checkout-products">
    <Typography variant="h4" component="h1" gutterBottom>Checkout</Typography>
    <Typography color="text.secondary" sx={{ mb: 2 }}>Choose a delivery address and place your order with Cash on Delivery.</Typography>
    {(error || cartError) && <Alert severity="error" sx={{ mb: 2 }}>{error || cartError}</Alert>}
    <Typography variant="h6" sx={{ mb: 1 }}>Delivery address</Typography>
    {addresses.length > 0 && <RadioGroup value={selectedAddress} onChange={(event) => setSelectedAddress(event.target.value)}>{addresses.map((address) => <Paper variant="outlined" key={address._id} sx={{ mb: 1, p: 1 }}><FormControlLabel value={address._id} control={<Radio />} label={<Box><Typography fontWeight={700}>{address.fullName} · {address.mobile}</Typography><Typography variant="body2">{[address.house, address.street, address.area, address.city, address.state, address.pinCode, address.landmark].filter(Boolean).join(', ')}</Typography></Box>} /></Paper>)}</RadioGroup>}
    {!addingAddress ? <Button type="button" variant="outlined" onClick={() => setAddingAddress(true)} sx={{ mb: 2 }}>{addresses.length ? 'Add another address' : 'Add delivery address'}</Button> : <Paper variant="outlined" component="form" onSubmit={saveAddress} sx={{ p: 2, mb: 2 }}><Typography variant="subtitle1" sx={{ mb: 1 }}>New address</Typography><Box className="checkout-address-grid">{[['fullName', 'Full name'], ['mobile', 'Mobile number'], ['house', 'House / flat'], ['street', 'Street'], ['area', 'Area'], ['city', 'City'], ['state', 'State'], ['pinCode', 'PIN code'], ['landmark', 'Landmark (optional)']].map(([field, label]) => <TextField key={field} required={field !== 'landmark'} label={label} value={addressForm[field]} onChange={(event) => setAddressForm((current) => ({ ...current, [field]: event.target.value }))} />)}</Box><Box sx={{ display: 'flex', gap: 1, mt: 2 }}><Button type="submit" variant="contained" disabled={savingAddress}>{savingAddress ? 'Saving…' : 'Save address'}</Button><Button type="button" onClick={() => setAddingAddress(false)}>Cancel</Button></Box></Paper>}
    <Divider sx={{ my: 2 }} /><Typography variant="h6" sx={{ mb: 1 }}>Order items</Typography>
    {items.map((item) => { const image = item.primaryImage || item.images?.[0]; const links = marketplaceLinks(item); return <Box key={item._id} className="checkout-item"><Box className="checkout-image">{image && <img src={mediaUrl(image)} alt={item.name} />}</Box><Box sx={{ minWidth: 0 }}><Typography variant="h6">{item.name}</Typography><Typography>Quantity: {item.qty}</Typography><Typography className="checkout-price">₹{(priceFor(item) * item.qty).toLocaleString('en-IN')}</Typography><Button component={RouterLink} to={`/inquiry?product=${item._id}`} variant="outlined" size="small" sx={{ mt: 1 }}>Ask seller about this product</Button>{links.length > 0 && <Box className="marketplace-actions">{links.map((url) => <Button key={url} component="a" href={url} target="_blank" rel="noopener noreferrer" variant="text" endIcon={<LaunchRoundedIcon />}>Marketplace option</Button>)}</Box>}</Box></Box>; })}
    <Button type="button" fullWidth variant="contained" color="warning" size="large" disabled={placingOrder || !selectedAddress} onClick={placeOrder} sx={{ mt: 2 }}>{placingOrder ? 'Placing order…' : 'Place order (Cash on Delivery)'}</Button>
  </Paper><Paper className="checkout-summary"><Typography variant="h6">Order summary</Typography><Divider sx={{ my: 2 }} /><Typography>Items: {items.reduce((sum, item) => sum + item.qty, 0)}</Typography><Typography sx={{ mt: 1 }}>Subtotal: ₹{subtotal.toLocaleString('en-IN')}</Typography><Typography>Delivery: {delivery ? `₹${delivery}` : 'Free'}</Typography><Typography sx={{ fontSize: '1.25rem', mt: 1 }}>Order total: <strong>₹{(subtotal + delivery).toLocaleString('en-IN')}</strong></Typography><Button component={RouterLink} to="/cart" fullWidth variant="outlined" sx={{ mt: 2 }}>Back to cart</Button></Paper></Box></Box>;
}
