/**
 * Hook para monitorear estado de sincronización de WhatsApp Coexistence
 * Hace polling cada 5 segundos hasta que la sincronización complete o falle
 */

import { useState, useEffect, useRef } from "react";

interface SyncStatus {
  integrationId: string;
  syncStatus: "pending" | "syncing" | "completed" | "failed" | null;
  syncAttempts: number;
  syncError: string | null;
  syncCompletedAt: string | null;
}

interface UseWhatsAppSyncStatusReturn {
  syncStatus: SyncStatus | null;
  isLoading: boolean;
  error: string | null;
  retrySync: () => Promise<void>;
}

export function useWhatsAppSyncStatus(
  integrationId: string | null | undefined,
  enabled: boolean = true
): UseWhatsAppSyncStatusReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch sync status
  const fetchSyncStatus = async () => {
    if (!integrationId || !enabled) return;

    try {
      const response = await fetch(
        `/api/v1/integrations/whatsapp/sync?integrationId=${integrationId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: SyncStatus = await response.json();
      setSyncStatus(data);
      setError(null);

      // ✅ Detener polling si la sincronización completó o falló
      if (data.syncStatus === "completed" || data.syncStatus === "failed") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err) {
      console.error("[useWhatsAppSyncStatus] Error:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  // Retry sync
  const retrySync = async () => {
    if (!integrationId) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/v1/integrations/whatsapp/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // ✅ Reiniciar polling después de retry
      await fetchSyncStatus();
      startPolling();
    } catch (err) {
      console.error("[useWhatsAppSyncStatus] Retry error:", err);
      setError(err instanceof Error ? err.message : "Error al reintentar");
    } finally {
      setIsLoading(false);
    }
  };

  // Start polling
  const startPolling = () => {
    if (intervalRef.current) return; // Ya está haciendo polling

    // Polling cada 5 segundos
    intervalRef.current = setInterval(() => {
      fetchSyncStatus();
    }, 5000);
  };

  // Fetch inicial + polling
  useEffect(() => {
    if (!integrationId || !enabled) {
      // Limpiar polling si se deshabilita
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Fetch inicial
    fetchSyncStatus();

    // Iniciar polling solo si syncStatus es "pending" o "syncing"
    if (
      syncStatus?.syncStatus === "pending" ||
      syncStatus?.syncStatus === "syncing"
    ) {
      startPolling();
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [integrationId, enabled, syncStatus?.syncStatus]);

  return {
    syncStatus,
    isLoading,
    error,
    retrySync,
  };
}
