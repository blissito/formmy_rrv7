/**
 * Componente para mostrar estado de sincronización de WhatsApp Coexistence
 * Muestra un indicador visual con polling automático
 */

import { useWhatsAppSyncStatus } from "~/hooks/useWhatsAppSyncStatus";

interface WhatsAppSyncStatusProps {
  integrationId: string;
}

export function WhatsAppSyncStatus({ integrationId }: WhatsAppSyncStatusProps) {
  const { syncStatus, isLoading, error, retrySync } = useWhatsAppSyncStatus(integrationId);

  if (!syncStatus) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center space-x-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400" />
          <p className="text-sm text-gray-600">Verificando estado...</p>
        </div>
      </div>
    );
  }

  // ✅ Completado
  if (syncStatus.syncStatus === "completed") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center space-x-3">
          <svg
            className="h-5 w-5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <div>
            <p className="font-medium text-green-900">Sincronización completada</p>
            <p className="text-sm text-green-700">
              Tus contactos e historial están listos
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ⚠️ Pendiente o Sincronizando
  if (syncStatus.syncStatus === "pending" || syncStatus.syncStatus === "syncing") {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center space-x-3">
          <div className="h-5 w-5">
            <div className="h-full w-full animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
          <div>
            <p className="font-medium text-blue-900">
              {syncStatus.syncStatus === "pending"
                ? "Sincronización pendiente..."
                : "Sincronizando..."}
            </p>
            <p className="text-sm text-blue-700">
              Esto puede tomar varios minutos. Los webhooks llegarán automáticamente.
            </p>
            {syncStatus.syncAttempts > 0 && (
              <p className="mt-1 text-xs text-blue-600">
                Intento #{syncStatus.syncAttempts}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ❌ Fallido
  if (syncStatus.syncStatus === "failed") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <svg
              className="h-5 w-5 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-red-900">Sincronización fallida</p>
              {syncStatus.syncError && (
                <p className="mt-1 text-sm text-red-700">{syncStatus.syncError}</p>
              )}
              <p className="mt-1 text-xs text-red-600">
                Intentos: {syncStatus.syncAttempts}
              </p>
            </div>
          </div>

          <button
            onClick={retrySync}
            disabled={isLoading}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? "Reintentando..." : "Reintentar sincronización"}
          </button>
        </div>
      </div>
    );
  }

  // Estado desconocido
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm text-gray-600">Estado desconocido</p>
    </div>
  );
}
