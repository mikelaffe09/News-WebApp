import { useEffect, useState } from 'react';
import { Category } from '../../types';
import { getErrorMessage } from '../../utils/errors';
import { getCategories } from './categoryService';
import { CategoryQueryOptions } from './categoryTypes';

export function useCategories(options: CategoryQueryOptions = {}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = options.limit;
  const orderBy = options.orderBy ?? 'sort_order';

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);

    getCategories({ limit, orderBy })
      .then(data => {
        if (active) setCategories(data);
      })
      .catch(err => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [limit, orderBy]);

  return { categories, loading, error };
}
