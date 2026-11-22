import { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiRequest('/api/categories')
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('The categories response was invalid.');
        if (!cancelled) setCategories(data);
      })
      .catch((err) => { if (!cancelled) setError(err.message || 'Categories could not be loaded.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { categories, loading, error };
}
