import { Box, Typography } from '@mui/material';
export default function Footer() { return <Box component="footer" className="site-footer"><Typography className="footer-brand">Asian<span>Calf</span></Typography><Typography variant="body2">Curated finds, simple shopping.</Typography><Typography variant="caption">© {new Date().getFullYear()} AsianCalf</Typography></Box>; }
