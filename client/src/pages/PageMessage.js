import { Alert, Box, Button, Paper, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
export default function PageMessage({ title, children }) { return <Box className="page-container"><Paper sx={{ p: 4 }}><Typography variant="h4" gutterBottom>{title}</Typography>{children || <><Alert severity="info" sx={{ mb: 2 }}>This page is ready for its content.</Alert><Button component={RouterLink} to="/" variant="contained">Browse products</Button></>}</Paper></Box>; }
