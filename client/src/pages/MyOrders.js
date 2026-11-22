import { apiRequest } from '../utils/api';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MyOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    apiRequest('/api/orders/my', {}, token).then(setOrders).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [token]);
  return <Box className="page-container"><Typography variant="h4" component="h1" sx={{ mb: 2 }}>My orders</Typography>{error && <Alert severity="error">{error}</Alert>}{loading ? <CircularProgress /> : !orders.length ? <Alert severity="info">You haven’t placed an order yet. <Button component={RouterLink} to="/products">Browse products</Button></Alert> : <Box sx={{ display: 'grid', gap: 2 }}>{orders.map((order) => <Card key={order._id}><CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}><Box><Typography variant="h6">Order {order.orderNumber}</Typography><Typography color="text.secondary">{new Date(order.createdAt).toLocaleDateString('en-IN')} · {order.items?.length || 0} product{order.items?.length === 1 ? '' : 's'}</Typography><Typography sx={{ mt: 1 }}>Status: <strong>{order.orderStatus}</strong> · Total: <strong>₹{Number(order.total || 0).toLocaleString('en-IN')}</strong></Typography></Box><Button component={RouterLink} to={`/order-success/${order._id}`} variant="outlined">View order</Button></CardContent></Card>)}</Box>}</Box>;
}
