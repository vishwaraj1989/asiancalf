import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircle from '@mui/icons-material/AccountCircle';
import InputBase from '@mui/material/InputBase';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AuthContext from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const doSearch = (e) => {
    e.preventDefault();
    navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography component={Link} to="/" variant="h6" sx={{ textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
          AsianCalf
        </Typography>
        <Box component="form" onSubmit={doSearch} sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <InputBase placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} sx={{ ml: 1 }} />
          <IconButton type="submit"><SearchIcon /></IconButton>
        </Box>
        <Button component={Link} to="/products">Shop</Button>
        <IconButton component={Link} to="/cart"><ShoppingCartIcon /></IconButton>
        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton component={Link} to="/account"><AccountCircle /></IconButton>
            <Button onClick={logout}>Logout</Button>
          </Box>
        ) : (
          <Button component={Link} to="/login">Login</Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
