import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <Box>
      <Box sx={{ bgcolor: '#eceff1', p: 6, borderRadius: 2, mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>Discover premium Indian goods</Typography>
        <Typography variant="h6" gutterBottom>Quality, trust and modern design from AsianCalf</Typography>
        <Button variant="contained" component={Link} to="/products">Shop Now</Button>
      </Box>
      <Typography variant="h5" gutterBottom>Featured products</Typography>
      <Typography color="text.secondary">Browse our curated selection on the Shop page.</Typography>
    </Box>
  );
}
