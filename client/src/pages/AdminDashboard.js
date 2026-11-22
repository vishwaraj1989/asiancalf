import { apiRequest } from '../utils/api';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const statLabels = [
  ['totalProducts', 'Products'], ['activeProducts', 'Active products'], ['totalCustomers', 'Customers'],
  ['totalOrders', 'Orders'], ['pendingOrders', 'Pending orders'], ['deliveredOrders', 'Delivered'],
  ['cancelledOrders', 'Cancelled'], ['todaysOrders', "Today's orders"],
];

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { apiRequest('/api/admin/dashboard', {}, token).then(setStats).catch((err) => setError(err.message)); }, [token]);
  return <Box className="page-container"><Typography variant="h4" component="h1" sx={{ mb: 2 }}>Admin dashboard</Typography>{error && <Alert severity="error">{error}</Alert>}{!stats && !error ? <CircularProgress /> : stats && <>
    <Box className="admin-dashboard-grid">{statLabels.map(([key, label]) => <Card key={key}><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4">{Number(stats[key] || 0).toLocaleString('en-IN')}</Typography></CardContent></Card>)}</Box>
    <Typography sx={{ mt: 2 }}>Today's sales: <strong>₹{Number(stats.todaysSales || 0).toLocaleString('en-IN')}</strong> · Total sales: <strong>₹{Number(stats.totalSales || 0).toLocaleString('en-IN')}</strong></Typography>
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 3 }}><Button component={RouterLink} to="/admin/products" variant="contained">Manage products</Button><Button component={RouterLink} to="/admin/categories" variant="outlined">Manage categories</Button><Button component={RouterLink} to="/admin/orders" variant="outlined">Manage orders</Button></Box>
  </>}</Box>;
}
