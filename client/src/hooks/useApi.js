import { useState, useCallback } from 'react';

/**
 * Generic hook for async API calls.
 * Returns { data, loading, error, execute, reset }
 */
const useApi = (apiFn, { immediate = false, initialData = null } = {}) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiFn(...args);
        const result = response.data?.data ?? response.data;
        setData(result);
        return result;
      } catch (err) {
        const msg =
          err.response?.data?.message || err.message || 'Something went wrong';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFn]
  );

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  return { data, loading, error, execute, reset };
};

export default useApi;
