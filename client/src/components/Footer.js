import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function Footer() {
  return (
    <Box component="footer" sx={{ py: 4, mt: 6, bgcolor: '#f5f5f5' }}>
      <Typography align="center">© {new Date().getFullYear()} AsianCalf — Premium Indian goods</Typography>
    </Box>
  );
}
