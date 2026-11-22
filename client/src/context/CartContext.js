import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const readList = (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
const itemFromApi = (item) => {
  const product = item.product && typeof item.product === 'object' ? item.product : item.productSnapshot || item;
  return { ...product, _id: String(product._id || item.product), qty: Number(item.qty) || 1, cartPrice: Number(item.price) };
};

export function CartProvider({ children }) {
  const { user, token } = useAuth();
  const userId = user?.id || user?._id || 'guest';
  const storageKey = `asianCalfCart:${userId}`;
  const [items, setItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [cartError, setCartError] = useState('');
  const [cartReady, setCartReady] = useState(false);

  const save = useCallback((next) => {
    setItems(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }, [storageKey]);
  const saveLater = useCallback((next) => {
    setSavedItems(next);
    localStorage.setItem(`asianCalfSavedItems:${userId}`, JSON.stringify(next));
  }, [userId]);
  const saveWishlist = useCallback((next) => {
    setWishlistIds(next);
    localStorage.setItem(`asianCalfWishlist:${userId}`, JSON.stringify(next));
  }, [userId]);

  const syncFromApi = useCallback(async () => {
    const cart = await apiRequest('/api/cart', {}, token);
    const next = (cart.items || []).filter((item) => item.product).map(itemFromApi);
    save(next);
    return next;
  }, [save, token]);

  useEffect(() => {
    const localItems = readList(storageKey);
    const guestItems = userId === 'guest' ? [] : readList('asianCalfCart:guest');
    setSavedItems(readList(`asianCalfSavedItems:${userId}`));
    setWishlistIds(readList(`asianCalfWishlist:${userId}`));
    setItems(localItems);
    setCartError('');
    setCartReady(false);
    if (!token) { setCartReady(true); return; }

    let cancelled = false;
    (async () => {
      try {
        const cart = await apiRequest('/api/cart', {}, token);
        let remoteItems = (cart.items || []).filter((item) => item.product).map(itemFromApi);
        const itemsToImport = new Map();
        // Preserve pre-API local carts while merging them with any server cart.
        // The quantity comparison below avoids adding the same cached items twice.
        for (const item of [...localItems, ...guestItems]) {
          const current = itemsToImport.get(item._id);
          itemsToImport.set(item._id, { ...item, qty: Math.max(current?.qty || 0, Number(item.qty) || 1) });
        }
        for (const item of itemsToImport.values()) {
          const inCart = remoteItems.find((current) => current._id === item._id)?.qty || 0;
          if (item.qty > inCart) {
            await apiRequest('/api/cart/add', { method: 'POST', body: JSON.stringify({ productId: item._id, qty: item.qty - inCart }) }, token);
          }
        }
        if (itemsToImport.size) {
          const merged = await apiRequest('/api/cart', {}, token);
          remoteItems = (merged.items || []).filter((item) => item.product).map(itemFromApi);
        }
        if (!cancelled) {
          save(remoteItems);
          if (guestItems.length) localStorage.removeItem('asianCalfCart:guest');
        }
      } catch (error) {
        if (!cancelled) setCartError(error.message);
      } finally {
        if (!cancelled) setCartReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [storageKey, token, userId, save]);

  const syncMutation = useCallback(async (path, body) => {
    if (!token) return;
    try {
      await apiRequest(path, { method: 'POST', body: JSON.stringify(body) }, token);
      await syncFromApi();
      setCartError('');
    } catch (error) { setCartError(error.message); }
  }, [syncFromApi, token]);

  const value = useMemo(() => ({
    items,
    savedItems,
    wishlistIds,
    cartError,
    cartReady,
    addItem(product) {
      const existing = items.find((item) => item._id === product._id);
      const next = existing
        ? items.map((item) => item._id === product._id ? { ...item, qty: item.qty + 1 } : item)
        : [...items, { ...product, qty: 1 }];
      save(next);
      if (token) syncMutation('/api/cart/add', { productId: product._id, qty: 1 });
    },
    setQuantity(id, qty) {
      const nextQty = Math.max(0, Number(qty) || 0);
      save(nextQty ? items.map((item) => item._id === id ? { ...item, qty: nextQty } : item) : items.filter((item) => item._id !== id));
      if (token) syncMutation('/api/cart/update', { productId: id, qty: nextQty });
    },
    removeItem(id) {
      save(items.filter((item) => item._id !== id));
      if (token) syncMutation('/api/cart/update', { productId: id, qty: 0 });
    },
    saveForLater(id) {
      const item = items.find((cartItem) => cartItem._id === id);
      if (!item) return;
      save(items.filter((cartItem) => cartItem._id !== id));
      saveLater(savedItems.some((savedItem) => savedItem._id === id) ? savedItems : [...savedItems, item]);
      if (token) syncMutation('/api/cart/update', { productId: id, qty: 0 });
    },
    moveToCart(id) {
      const item = savedItems.find((savedItem) => savedItem._id === id);
      if (!item) return;
      saveLater(savedItems.filter((savedItem) => savedItem._id !== id));
      const cartItem = items.find((currentItem) => currentItem._id === id);
      save(cartItem ? items.map((currentItem) => currentItem._id === id ? { ...currentItem, qty: currentItem.qty + item.qty } : currentItem) : [...items, item]);
      if (token) syncMutation('/api/cart/add', { productId: id, qty: item.qty });
    },
    removeSavedItem(id) { saveLater(savedItems.filter((item) => item._id !== id)); },
    toggleWishlist(id) { saveWishlist(wishlistIds.includes(id) ? wishlistIds.filter((itemId) => itemId !== id) : [...wishlistIds, id]); },
    async clearCart() {
      save([]);
      if (token) {
        try { await apiRequest('/api/cart/clear', { method: 'POST' }, token); setCartError(''); }
        catch (error) { setCartError(error.message); }
      }
    },
    clearShoppingView() { setItems([]); setSavedItems([]); setWishlistIds([]); },
    reloadCart: syncFromApi,
  }), [items, savedItems, wishlistIds, cartError, cartReady, save, saveLater, saveWishlist, syncMutation, syncFromApi, token]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
