import { AppBar, Badge, Box, Button, Toolbar, Typography } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { user, signOut } = useAuth(); const { items, clearShoppingView } = useCart(); const count = items.reduce((total, item) => total + item.qty, 0);
  const handleSignOut = () => { clearShoppingView(); signOut(); };
  return <AppBar position="sticky" elevation={0} className="site-header"><Toolbar className="site-toolbar"><Box className="site-primary-nav"><Typography component={RouterLink} to="/" className="site-brand">Asian<span>Calf</span></Typography><Button component={RouterLink} to="/" aria-label="Home" title="Home"><HomeOutlinedIcon /></Button></Box><Box className="nav-actions"><Button component={RouterLink} to="/inquiry">Inquiry</Button><Button id="cart-nav-link" component={RouterLink} to="/cart" className="nav-cart">Cart <Badge badgeContent={count} className="cart-badge" /></Button>{user ? <>{user.role === 'admin' && <><Button component={RouterLink} to="/admin/products">Admin products</Button><Button component={RouterLink} to="/seller/dashboard">Seller Dashboard</Button></>}{user.role === 'seller' && <Button component={RouterLink} to="/seller/dashboard">Seller Dashboard</Button>}<Button onClick={handleSignOut}>Sign out</Button></> : <Button component={RouterLink} to="/login" className="nav-signin">Sign in</Button>}</Box></Toolbar></AppBar>;
}
