import { apiRequest } from '../utils/api';
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OrderSuccess() {
  const { id } = useParams();
  const { token } = useAuth();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!id || order) return;
    apiRequest(`/api/orders/${id}`, {}, token).then(setOrder).catch((err) => setError(err.message));
  }, [id, order, token]);
  return <Box className="page-container"><Paper sx={{ maxWidth: 760, mx: 'auto', p: { xs: 2, md: 4 }, textAlign: 'center' }}><Typography variant="h4" component="h1" gutterBottom>Order placed</Typography>{error && <Alert severity="error">{error}</Alert>}{!order && !error ? <CircularProgress /> : order && <><Typography color="success.main" fontWeight={700}>Thank you. Your COD order has been received.</Typography><Typography sx={{ mt: 2 }}>Order number: <strong>{order.orderNumber}</strong></Typography><Typography>Order status: {order.orderStatus}</Typography><Typography>Total: ₹{Number(order.total || 0).toLocaleString('en-IN')}</Typography>{order.address && <Typography sx={{ mt: 2 }}>Delivering to: {[order.address.fullName, order.address.house, order.address.street, order.address.area, order.address.city, order.address.state, order.address.pinCode].filter(Boolean).join(', ')}</Typography>}<Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mt: 3 }}><Button component={RouterLink} to="/my-orders" variant="contained">My orders</Button><Button component={RouterLink} to="/products" variant="outlined">Continue shopping</Button></Box></>}</Paper></Box>;
}
