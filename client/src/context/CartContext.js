import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import AuthContext from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [cart, setCart] = useState({ items: [] });

  const loadCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data.data || { items: [] });
    } catch (err) {
      setCart({ items: [] });
    }
  };

  useEffect(() => {
    if (token) loadCart();
    else setCart({ items: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const addToCart = async (productId, qty = 1) => {
    const res = await api.post('/cart/add', { productId, qty });
    setCart(res.data.data);
    return res.data;
  };

  const updateItem = async (productId, qty) => {
    const res = await api.post('/cart/update', { productId, qty });
    setCart(res.data.data);
    return res.data;
  };

  const clearCart = async () => {
    await api.post('/cart/clear');
    setCart({ items: [] });
  };

  return <CartContext.Provider value={{ cart, addToCart, updateItem, clearCart, loadCart }}>{children}</CartContext.Provider>;
};

export default CartContext;
