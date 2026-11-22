import { apiRequest } from '../utils/api';
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Account() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { apiRequest('/api/auth/me', {}, token).then(setProfile).catch((err) => setError(err.message)); }, [token]);
  return <Box className="page-container"><Paper sx={{ p: { xs: 2, md: 3 } }}><Typography variant="h4" component="h1" gutterBottom>My account</Typography>{error && <Alert severity="error">{error}</Alert>}{!profile && !error ? <CircularProgress /> : profile && <><Typography>Name: {profile.name}</Typography><Typography>Email: {profile.email}</Typography><Typography>Mobile: {profile.mobile || 'Not added'}</Typography><Typography>Account: {profile.role}</Typography><Button component={RouterLink} to="/my-orders" variant="contained" sx={{ mt: 2 }}>View my orders</Button>{profile.addresses?.length > 0 && <Box sx={{ mt: 3 }}><Typography variant="h6">Saved addresses</Typography>{profile.addresses.map((address) => <Typography key={address._id}>{[address.fullName, address.house, address.street, address.area, address.city, address.state, address.pinCode].filter(Boolean).join(', ')}</Typography>)}</Box>}</>}</Paper></Box>;
}
