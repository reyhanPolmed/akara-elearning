import { useEffect, useState, type DependencyList } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ApiError } from "./api-client";
import { useAuth } from "./auth-context";

type ApiResourceState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
};

function getReadableError(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Data tidak dapat dimuat.";
}

export function useApiResource<T>(
  loader: () => Promise<T>,
  dependencies: DependencyList = []
): ApiResourceState<T> {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearSession } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);

    void loader()
      .then((result) => {
        if (!mounted) return;
        setData(result);
      })
      .catch((caught) => {
        if (!mounted) return;

        if (caught instanceof ApiError && caught.status === 401) {
          clearSession();
          navigate("/login", {
            replace: true,
            state: { from: location.pathname },
          });
          return;
        }

        setError(getReadableError(caught));
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [...dependencies, reloadKey]);

  return {
    data,
    error,
    loading,
    reload: () => setReloadKey((current) => current + 1),
  };
}
