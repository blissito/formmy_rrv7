import { Effect, pipe } from "effect";
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
  apiKeyData: ApiKeyData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseApiKeyOptions {
  chatbotId: string;
}

/**
 * Hook to get or create the user's default API key
 * @param options Options for the hook
 * @param options.chatbotId The ID of the chatbot to get the API key for
 */
export function useApiKey({ chatbotId }: UseApiKeyOptions): UseApiKeyResult {
  const [apiKeyData, setApiKeyData] = useState<ApiKeyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKey = () => {
    if (!chatbotId) {
      setError("Chatbot ID is required");
      setLoading(false);
      return;
    }

    const effect = pipe(
      Effect.tryPromise({
        try: () =>
          fetch(`/api/v1/apikey?chatbotId=${encodeURIComponent(chatbotId)}`),
        catch: (error) => new Error(`Failed to fetch: ${error}`),
      }),
      Effect.flatMap((response) =>
        response.ok
          ? Effect.succeed(response)
          : Effect.fail(new Error(`HTTP error! status: ${response.status}`))
      ),
      Effect.flatMap((response) =>
        Effect.tryPromise({
          try: () => response.json(),
          catch: (error) => new Error(`Failed to parse JSON: ${error}`),
        })
      ),
      Effect.match({
        onSuccess: (data: ApiKeyData) => {
          setApiKeyData(data);
          setLoading(false);
        },
        onFailure: (error) => {
          console.error("Error in API key effect:", error);
          setError(error.message);
          setLoading(false);
        },
      })
    );

    // Run the effect
    Effect.runPromise(effect);
  };

  useEffect(() => {
    if (chatbotId) {
      fetchApiKey();
    }
  }, [chatbotId]);

  return {
    apiKeyData,
    loading,
    error,
    refetch: fetchApiKey,
  };
}
