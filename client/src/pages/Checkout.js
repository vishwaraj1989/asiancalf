import { mediaUrl } from '../utils/api';
import { Box, Button, Divider, Paper, Typography } from '@mui/material';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import { Link as RouterLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const priceFor = (item) => Number(item.salePrice || item.discountPrice || item.price || 0);
const linksFor = (item) => (item.marketplaceUrls?.length ? item.marketplaceUrls : item.marketplaceUrl ? [item.marketplaceUrl] : []).filter((url) => /^https?:\/\//i.test(url));
const marketplaceName = (url, index) => {
  try { return new URL(url).hostname.replace(/^www\./, '').split('.')[0] || `Marketplace ${index + 1}`; }
  catch { return `Marketplace ${index + 1}`; }
};

export default function Checkout() {
  const { items } = useCart();
  const subtotal = items.reduce((total, item) => total + priceFor(item) * item.qty, 0);
  if (!items.length) return <Box className="page-container"><Paper className="amazon-cart-main"><Typography variant="h4" gutterBottom>Checkout</Typography><Typography sx={{ mb: 2 }}>Your cart is empty.</Typography><Button component={RouterLink} to="/" variant="contained">Continue shopping</Button></Paper></Box>;
  return <Box className="page-container"><Box className="checkout-layout"><Paper className="checkout-products"><Typography variant="h4" gutterBottom>Review your order</Typography><Typography color="text.secondary" sx={{ mb: 2 }}>Choose a marketplace or send the seller an inquiry about any product.</Typography><Divider />
    {items.map((item) => {
      const image = item.primaryImage || item.images?.[0];
      const links = linksFor(item);
      return <Box key={item._id} className="checkout-item"><Box className="checkout-image">{image && <img src={mediaUrl(image)} alt={item.name} />}</Box><Box sx={{ minWidth: 0 }}><Typography variant="h6">{item.name}</Typography><Typography variant="body2" color="text.secondary">{[item.department, item.productCategory, item.subcategory].filter(Boolean).join(' › ')}</Typography><Typography sx={{ mt: 1 }}>Quantity: <strong>{item.qty}</strong></Typography><Typography className="checkout-price">₹{(priceFor(item) * item.qty).toLocaleString('en-IN')}</Typography><Button component={RouterLink} to={`/inquiry?product=${item._id}`} variant="outlined" sx={{ mt: 1.5 }}>Purchase from seller</Button>{links.length > 0 && <Box className="marketplace-links"><Box className="marketplace-heading"><Typography variant="body2" fontWeight={700}>Or purchase from a marketplace</Typography><Typography variant="caption">Choose a marketplace below</Typography></Box><Box className="marketplace-actions">{links.map((url, index) => <Button key={url} component="a" href={url} target="_blank" rel="noopener noreferrer" variant="contained" className="marketplace-button" endIcon={<LaunchRoundedIcon />}>Click to purchase on {marketplaceName(url, index)}</Button>)}</Box></Box>}</Box></Box>;
    })}
  </Paper><Paper className="checkout-summary"><Typography variant="h6">Order Summary</Typography><Divider sx={{ my: 2 }} /><Typography>Items: {items.reduce((total, item) => total + item.qty, 0)}</Typography><Typography sx={{ fontSize: '1.35rem', mt: 1 }}>Order total: <strong>₹{subtotal.toLocaleString('en-IN')}</strong></Typography><Button component={RouterLink} to="/cart" fullWidth variant="outlined" sx={{ mt: 2 }}>Back to cart</Button></Paper></Box></Box>;
}
