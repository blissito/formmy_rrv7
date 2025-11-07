/**
 * Banner sutil para mostrar estado de sincronización de WhatsApp
 * Solo se muestra cuando hay algo relevante que comunicar
 */

import { useWhatsAppSyncStatus } from "~/hooks/useWhatsAppSyncStatus";
import { useWhatsAppIntegration } from "~/hooks/useWhatsAppIntegration";

interface WhatsAppSyncBannerProps {
  chatbotId: string;
}

type SyncStatus = "not_synced" | "pending" | "syncing" | "completed" | "failed";

export function WhatsAppSyncBanner({ chatbotId }: WhatsAppSyncBannerProps) {
  const { integration, isLoading: isLoadingIntegration } = useWhatsAppIntegration(chatbotId);
  const { syncStatus, retrySync } = useWhatsAppSyncStatus(integration?.id || null, !!integration);

  // Determinar el estado real basado en los datos
  const getStatus = (): SyncStatus => {
    // Si no hay integración, no mostrar nada (retornar early)
    if (!integration) return "not_synced";

    // Si la integración existe pero nunca se ha iniciado sincronización
    if (!syncStatus?.syncStatus) return "not_synced";

    // Si hay sincronización, usar el status real
    return syncStatus.syncStatus as SyncStatus;
  };

  const status = getStatus();

  // No mostrar banner si está completado o si nunca se ha sincronizado
  if (status === "completed" || status === "not_synced" || !integration) {
    return null;
  }

  // Configuración por estado
  const statusConfig: Record<SyncStatus, { icon: string; text: string; color: string; showRetry: boolean }> = {
    not_synced: {
      icon: "ℹ️",
      text: "Sin sincronizar",
      color: "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300",
      showRetry: false,
    },
    pending: {
      icon: "⏳",
      text: "Sincronización pendiente",
      color: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200",
      showRetry: false,
    },
    syncing: {
      icon: "🔄",
      text: "Sincronizando WhatsApp...",
      color: "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200",
      showRetry: false,
    },
    completed: {
      icon: "✅",
      text: "Sincronización completada",
      color: "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200",
      showRetry: false,
    },
    failed: {
      icon: "⚠️",
      text: "Error en sincronización",
      color: "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200",
      showRetry: true,
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`mb-3 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${config.color}`}>
      <div className="flex items-center gap-2">
        <span>{config.icon}</span>
        <span className="font-medium">{config.text}</span>
      </div>

      {config.showRetry && (
        <button
          onClick={retrySync}
          className="rounded px-2 py-1 text-xs font-medium bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
