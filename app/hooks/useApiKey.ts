import { useEffect, useState } from "react";

interface ApiKeyData {
  id: string;
  key: string;
  name: string;
  keyType: string;
  isActive: boolean;
  rateLimit: number;
  requestCount: number;
  monthlyRequests: number;
  lastUsedAt: string | null;
  createdAt: string;
}

interface UseApiKeyResult {
  apiKey: ApiKeyData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to get or create the user's default API key
 */
export function useApiKey(): UseApiKeyResult {
  const [apiKey, setApiKey] = useState<ApiKeyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKey = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/apikey");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setApiKey(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch API key");
      }
    } catch (err) {
      console.error("Error fetching API key:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKey();
  }, []);

  return {
    apiKey,
    loading,
    error,
    refetch: fetchApiKey,
  };
}
