import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const readList = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [items, setItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setSavedItems([]);
      setWishlistIds([]);
      return;
    }
    setItems(readList(`asianCalfCart:${userId}`));
    setSavedItems(readList(`asianCalfSavedItems:${userId}`));
    setWishlistIds(readList(`asianCalfWishlist:${userId}`));
  }, [userId]);

  const save = useCallback((next) => {
    setItems(next);
    if (userId) localStorage.setItem(`asianCalfCart:${userId}`, JSON.stringify(next));
  }, [userId]);
  const saveLater = useCallback((next) => {
    setSavedItems(next);
    if (userId) localStorage.setItem(`asianCalfSavedItems:${userId}`, JSON.stringify(next));
  }, [userId]);
  const saveWishlist = useCallback((next) => {
    setWishlistIds(next);
    if (userId) localStorage.setItem(`asianCalfWishlist:${userId}`, JSON.stringify(next));
  }, [userId]);

  const value = useMemo(() => ({
    items,
    savedItems,
    wishlistIds,
    addItem(product) { const found = items.find((item) => item._id === product._id); save(found ? items.map((item) => item._id === product._id ? { ...item, qty: item.qty + 1 } : item) : [...items, { ...product, qty: 1 }]); },
    setQuantity(id, qty) { const nextQty = Math.max(1, Number(qty) || 1); save(items.map((item) => item._id === id ? { ...item, qty: nextQty } : item)); },
    removeItem(id) { save(items.filter((item) => item._id !== id)); },
    saveForLater(id) {
      const item = items.find((cartItem) => cartItem._id === id);
      if (!item) return;
      save(items.filter((cartItem) => cartItem._id !== id));
      saveLater(savedItems.some((savedItem) => savedItem._id === id) ? savedItems : [...savedItems, item]);
    },
    moveToCart(id) {
      const item = savedItems.find((savedItem) => savedItem._id === id);
      if (!item) return;
      saveLater(savedItems.filter((savedItem) => savedItem._id !== id));
      const cartItem = items.find((currentItem) => currentItem._id === id);
      save(cartItem ? items.map((currentItem) => currentItem._id === id ? { ...currentItem, qty: currentItem.qty + item.qty } : currentItem) : [...items, item]);
    },
    removeSavedItem(id) { saveLater(savedItems.filter((item) => item._id !== id)); },
    toggleWishlist(id) { saveWishlist(wishlistIds.includes(id) ? wishlistIds.filter((itemId) => itemId !== id) : [...wishlistIds, id]); },
    clearCart() { save([]); },
    clearShoppingView() {
      setItems([]);
      setSavedItems([]);
      setWishlistIds([]);
    },
  }), [items, savedItems, wishlistIds, save, saveLater, saveWishlist]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
