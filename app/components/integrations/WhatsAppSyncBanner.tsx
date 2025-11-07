/**
 * Banner para debugging de sincronización de WhatsApp
 * SIEMPRE VISIBLE - Muestra estado real de la sincronización
 */

import { useWhatsAppSyncStatus } from "~/hooks/useWhatsAppSyncStatus";
import { useWhatsAppIntegration } from "~/hooks/useWhatsAppIntegration";

interface WhatsAppSyncBannerProps {
  chatbotId: string;
}

export function WhatsAppSyncBanner({ chatbotId }: WhatsAppSyncBannerProps) {
  const { integration, isLoading: isLoadingIntegration } = useWhatsAppIntegration(chatbotId);
  const { syncStatus, retrySync } = useWhatsAppSyncStatus(integration?.id || null, !!integration);

  // Determinar el estado visual
  const status = syncStatus?.syncStatus || "no_integration";

  // Configuración por estado
  const statusConfig = {
    no_integration: {
      color: "gray",
      icon: "❌",
      title: "Sin integración de WhatsApp",
      spinning: false,
    },
    pending: {
      color: "yellow",
      icon: "⏳",
      title: "Sincronización pendiente",
      spinning: false,
    },
    syncing: {
      color: "blue",
      icon: "🔄",
      title: "Sincronizando WhatsApp...",
      spinning: true,
    },
    completed: {
      color: "green",
      icon: "✅",
      title: "Sincronización completada",
      spinning: false,
    },
    failed: {
      color: "red",
      icon: "⚠️",
      title: "Error en sincronización",
      spinning: false,
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.no_integration;

  // Estilos por estado usando las clases del app
  const getStylesByStatus = () => {
    switch (status) {
      case "pending":
        return {
          container: "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
          spinner: "border-yellow-600",
          title: "text-yellow-900 dark:text-yellow-100",
        };
      case "syncing":
        return {
          container: "border-brand-400 bg-brand-50 dark:bg-brand-900/20",
          spinner: "border-brand-600",
          title: "text-brand-900 dark:text-brand-100",
        };
      case "completed":
        return {
          container: "border-green-400 bg-green-50 dark:bg-green-900/20",
          spinner: "border-green-600",
          title: "text-green-900 dark:text-green-100",
        };
      case "failed":
        return {
          container: "border-red-400 bg-red-50 dark:bg-red-900/20",
          spinner: "border-red-600",
          title: "text-red-900 dark:text-red-100",
        };
      default: // no_integration
        return {
          container: "border-gray-400 bg-gray-50 dark:bg-gray-900/20",
          spinner: "border-gray-600",
          title: "text-gray-900 dark:text-gray-100",
        };
    }
  };

  const styles = getStylesByStatus();

  return (
    <div className={`mb-4 rounded-xl border-2 ${styles.container} px-4 py-3 shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {config.spinning ? (
            <div className={`h-6 w-6 rounded-full border-3 ${styles.spinner} border-t-transparent animate-spin`} />
          ) : (
            <div className="text-2xl">{config.icon}</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${styles.title}`}>
            {config.title}
          </p>

          {/* Debug info */}
          <div className="mt-2 space-y-1 text-xs font-mono text-irongray dark:text-gray-400">
            <div>Status: <span className="font-bold text-dark dark:text-clear">{status}</span></div>
            <div>Integration ID: <span className="font-bold text-dark dark:text-clear">{integration?.id?.slice(0, 12) || "null"}...</span></div>
            <div>Loading: <span className="font-bold text-dark dark:text-clear">{isLoadingIntegration ? "true" : "false"}</span></div>
            {syncStatus?.syncAttempts !== undefined && (
              <div>Attempts: <span className="font-bold text-dark dark:text-clear">{syncStatus.syncAttempts}</span></div>
            )}
            {syncStatus?.syncError && (
              <div className="text-red-600 dark:text-red-400 mt-1">Error: {syncStatus.syncError}</div>
            )}
            {syncStatus?.syncCompletedAt && (
              <div>Completed: {new Date(syncStatus.syncCompletedAt).toLocaleString()}</div>
            )}
          </div>

          {/* Botón de retry si falló */}
          {status === "failed" && (
            <button
              onClick={retrySync}
              className="mt-3 px-3 py-1.5 text-xs font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 active:scale-95 transition-all"
            >
              🔄 Reintentar sincronización
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
