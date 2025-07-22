import { useState, useCallback } from "react";

interface WebsiteData {
  url: string;
  includeRoutes?: string[];
  excludeRoutes?: string[];
  updateFrequency?: "yearly" | "monthly";
}

interface FetchWebsiteResult {
  content: string;
  routes: string[];
  error?: string;
}

export const useFetchWebsite = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWebsiteContent = useCallback(
    async (websiteData: WebsiteData): Promise<FetchWebsiteResult | null> => {
      setLoading(true);
      setError(null);

      try {
        // Llamar a la API del backend
        const response = await fetch("/api/v1/fetch-website", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(websiteData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Error del servidor: ${response.status}`
          );
        }

        const result: FetchWebsiteResult = await response.json();
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Error desconocido al obtener el sitio web";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    fetchWebsiteContent,
    loading,
    error,
  };
};
