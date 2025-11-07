/**
 * Banner minimalista para mostrar sincronización de WhatsApp
 * Solo aparece en Conversaciones cuando hay sync activo
 */

import { useWhatsAppSyncStatus } from "~/hooks/useWhatsAppSyncStatus";
import { useWhatsAppIntegration } from "~/hooks/useWhatsAppIntegration";

interface WhatsAppSyncBannerProps {
  chatbotId: string;
}

export function WhatsAppSyncBanner({ chatbotId }: WhatsAppSyncBannerProps) {
  const { integration, isLoading: isLoadingIntegration } = useWhatsAppIntegration(chatbotId);
  const { syncStatus } = useWhatsAppSyncStatus(integration?.id || null, !!integration);

  // TEMPORALMENTE COMENTADO: SIEMPRE MOSTRAR EL BANNER PARA DEBUG
  // // No mostrar nada mientras carga
  // if (isLoadingIntegration) {
  //   return null;
  // }

  // // No mostrar nada si no hay integración o ya completó
  // if (!syncStatus || syncStatus.syncStatus === "completed" || syncStatus.syncStatus === null) {
  //   return null;
  // }

  // Estado: Pending o Sincronizando (SIEMPRE VISIBLE AHORA)
  // if (syncStatus.syncStatus === "pending" || syncStatus.syncStatus === "syncing") {
    return (
      <div className="relative z-[9999] mb-4 rounded-xl border-4 border-orange-500 bg-orange-100 px-6 py-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full border-4 border-orange-600 border-t-transparent animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-orange-900">
              🔥 BANNER DE DEBUG - SIEMPRE VISIBLE 🔥
            </p>
            <p className="text-sm text-orange-700 mt-1 font-mono">
              syncStatus={syncStatus?.syncStatus || "null"} | integration={integration?.id?.slice(0, 8) || "null"}
            </p>
          </div>
        </div>
      </div>
    );
  // }

  // TEMPORALMENTE COMENTADO: Estado de Error
  // return (
  //   <div className="mb-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3">
  //     <div className="flex items-start gap-3">
  //       <div className="flex-shrink-0">
  //         <svg
  //           className="h-5 w-5 text-red-600 dark:text-red-400"
  //           fill="none"
  //           viewBox="0 0 24 24"
  //           stroke="currentColor"
  //         >
  //           <path
  //             strokeLinecap="round"
  //             strokeLinejoin="round"
  //             strokeWidth={2}
  //             d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
  //           />
  //         </svg>
  //       </div>
  //       <div className="flex-1 min-w-0">
  //         <p className="text-sm font-medium text-space-800 dark:text-clear">
  //           Error al sincronizar WhatsApp
  //         </p>
  //         {syncStatus.syncError && (
  //           <p className="text-xs text-space-600 dark:text-gray-400 mt-1">
  //             {syncStatus.syncError}
  //           </p>
  //         )}
  //       </div>
  //     </div>
  //   </div>
  // );
}
