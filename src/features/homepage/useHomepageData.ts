import { useEffect, useState } from 'react';
import { getErrorMessage } from '../../utils/errors';
import { getHomepageData } from './homepageService';
import { HomepageData } from './homepageTypes';

export function useHomepageData() {
  const [data, setData] = useState<HomepageData>({
    breaking: [],
    hero: null,
    featured: [],
    latest: [],
    trending: [],
    categories: [],
    categoryArticles: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getHomepageData()
      .then(homepageData => {
        if (active) setData(homepageData);
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
  }, []);

  return { ...data, loading, error };
}
