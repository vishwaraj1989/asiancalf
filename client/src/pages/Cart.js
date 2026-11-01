import { mediaUrl } from '../utils/api';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { Box, Button, Divider, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const priceFor = (item) => Number(item.salePrice || item.discountPrice || item.price || 0);

export default function Cart() {
  const { items, savedItems, wishlistIds, removeItem, removeSavedItem, saveForLater, moveToCart, setQuantity, toggleWishlist } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCustomer = user && user.role !== 'admin';
  const subtotal = items.reduce((total, item) => total + priceFor(item) * item.qty, 0);
  const totalItems = items.reduce((total, item) => total + item.qty, 0);

  const ProductRow = ({ item, saved = false }) => {
    const image = item.primaryImage || item.images?.[0];
    const unitPrice = priceFor(item);
    const liked = wishlistIds.includes(item._id);
    return <Box key={item._id} className="cart-item">
      <Box className="cart-item-image">{image && <img src={mediaUrl(image)} alt={item.name} />}</Box>
      <Box className="cart-item-info">
        <Typography component={RouterLink} to={`/products/${item._id}`} className="cart-item-name">{item.name}</Typography>
        <Typography variant="body2" color={item.stock > 0 ? 'success.main' : 'error.main'}>{item.stock > 0 ? 'In stock' : 'Currently unavailable'}</Typography>
        <Typography variant="body2" sx={{ my: .5 }}>{[item.department, item.productCategory, item.subcategory].filter(Boolean).join(' › ')}</Typography>
        <Box className="cart-item-actions">
          {!saved && <label>Qty <select value={item.qty} onChange={(event) => setQuantity(item._id, event.target.value)}>{Array.from({ length: Math.max(10, Number(item.stock) || 0) }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label>}
          {saved ? <><Button size="small" disabled={!item.stock} onClick={() => moveToCart(item._id)}>Move to cart</Button><Button size="small" onClick={() => removeSavedItem(item._id)}>Delete</Button></> : <><Button size="small" onClick={() => removeItem(item._id)}>Delete</Button>{isCustomer && <Button size="small" onClick={() => saveForLater(item._id)}>Save for later</Button>}</>}
          {isCustomer && <Tooltip title={liked ? 'Remove from liked items' : 'Add to liked items'}><IconButton size="small" aria-label="Toggle liked item" color={liked ? 'error' : 'default'} onClick={() => toggleWishlist(item._id)}>{liked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}</IconButton></Tooltip>}
        </Box>
      </Box>
      <Typography className="cart-item-price">₹{(unitPrice * item.qty).toLocaleString('en-IN')}</Typography>
    </Box>;
  };

  if (!items.length && (!isCustomer || !savedItems.length)) return <Box className="page-container"><Paper className="amazon-cart-main"><Typography variant="h4" gutterBottom>Your AsianCalf cart is empty</Typography><Typography sx={{ mb: 3 }}>Browse products and add what you need.</Typography><Button component={RouterLink} to="/" variant="contained" color="warning">Continue shopping</Button></Paper></Box>;

  return <Box className="page-container"><Box className="amazon-cart-layout"><Paper className="amazon-cart-main">
    <Typography variant="h4" component="h1">Shopping Cart</Typography>
    {items.length ? <><Typography color="text.secondary" sx={{ mb: 2 }}>Price</Typography><Divider />{items.map((item) => <ProductRow key={item._id} item={item} />)}<Divider /><Typography align="right" sx={{ mt: 2, fontSize: '1.15rem' }}>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''}): <strong>₹{subtotal.toLocaleString('en-IN')}</strong></Typography></> : <Typography sx={{ my: 3 }}>Your cart is empty. Your saved items are below.</Typography>}
    {isCustomer && savedItems.length > 0 && <Box sx={{ mt: 4 }}><Divider /><Typography variant="h5" component="h2" sx={{ mt: 3 }}>Saved for later ({savedItems.length} item{savedItems.length !== 1 ? 's' : ''})</Typography>{savedItems.map((item) => <ProductRow key={item._id} item={item} saved />)}</Box>}
  </Paper><Box className="cart-summary-column">{items.length > 0 && <Paper className="cart-summary"><Typography variant="body1">Your order is eligible for FREE Delivery.</Typography><Typography sx={{ mt: 2, fontSize: '1.25rem' }}>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''}): <strong>₹{subtotal.toLocaleString('en-IN')}</strong></Typography><Button fullWidth variant="contained" color="warning" sx={{ mt: 2 }} onClick={() => navigate('/checkout')}>Proceed to Buy</Button></Paper>}<Button component={RouterLink} to="/" sx={{ mt: 1 }}>← Continue shopping</Button></Box></Box></Box>;
}
