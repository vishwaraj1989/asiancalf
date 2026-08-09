import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => setStats(res.data.data)).catch(() => setStats(null));
  }, []);

  if (!stats) return <Typography>Loading dashboard...</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}><Paper sx={{ p: 2 }}>Total Products: {stats.totalProducts}</Paper></Grid>
        <Grid item xs={12} sm={6} md={3}><Paper sx={{ p: 2 }}>Active Products: {stats.activeProducts}</Paper></Grid>
        <Grid item xs={12} sm={6} md={3}><Paper sx={{ p: 2 }}>Total Customers: {stats.totalCustomers}</Paper></Grid>
        <Grid item xs={12} sm={6} md={3}><Paper sx={{ p: 2 }}>Total Orders: {stats.totalOrders}</Paper></Grid>
      </Grid>
    </Box>
  );
}
