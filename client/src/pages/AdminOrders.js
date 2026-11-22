import { apiRequest } from '../utils/api';
import { Alert, Box, Button, CircularProgress, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const statuses = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const result = await apiRequest(`/api/orders?${params}`, {}, token);
      setOrders(result.orders || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [search, status, token]);
  useEffect(() => { loadOrders(); }, [loadOrders]);

  const updateStatus = async (order) => {
    setSavingId(order._id);
    setError('');
    try {
      await apiRequest(`/api/orders/${order._id}/status`, { method: 'PUT', body: JSON.stringify({ status: order.orderStatus }) }, token);
      await loadOrders();
    } catch (err) { setError(err.message); }
    finally { setSavingId(''); }
  };

  return <Box className="page-container"><Paper sx={{ p: { xs: 2, md: 3 } }}><Typography variant="h4" component="h1" gutterBottom>Order management</Typography>
    <Box component="form" onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); }} sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}><TextField label="Search order number" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /><TextField select label="Status" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 190 }}><MenuItem value="">All statuses</MenuItem>{statuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField><Button type="submit" variant="contained">Search</Button></Box>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{loading ? <CircularProgress /> : !orders.length ? <Alert severity="info">No orders found.</Alert> : <TableContainer sx={{ overflowX: 'auto' }}><Table size="small" sx={{ minWidth: 850 }}><TableHead><TableRow><TableCell>Order</TableCell><TableCell>Customer</TableCell><TableCell>Date</TableCell><TableCell>Items</TableCell><TableCell>Total</TableCell><TableCell>Status</TableCell><TableCell>Update</TableCell></TableRow></TableHead><TableBody>{orders.map((order) => <TableRow key={order._id}><TableCell>{order.orderNumber}</TableCell><TableCell>{order.user?.name || order.user?.email || 'Customer'}</TableCell><TableCell>{new Date(order.createdAt).toLocaleDateString('en-IN')}</TableCell><TableCell>{order.items?.reduce((sum, item) => sum + item.qty, 0) || 0}</TableCell><TableCell>₹{Number(order.total || 0).toLocaleString('en-IN')}</TableCell><TableCell><Select size="small" value={order.orderStatus} onChange={(event) => setOrders((current) => current.map((item) => item._id === order._id ? { ...item, orderStatus: event.target.value } : item))}>{statuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></TableCell><TableCell><Button size="small" disabled={savingId === order._id} onClick={() => updateStatus(order)}>{savingId === order._id ? 'Saving…' : 'Save'}</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer>}
  </Paper></Box>;
}
