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
      <div className="mb-4 rounded-xl border border-brand-200 dark:border-brand-500/30 bg-brand-50 dark:bg-brand-500/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="h-4 w-4 rounded-full border-2 border-brand-500 dark:border-brand-400 border-t-transparent animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-space-800 dark:text-clear">
              Sincronizando conversaciones de WhatsApp
            </p>
            <p className="text-xs text-space-600 dark:text-gray-400 mt-0.5">
              Tus contactos e historial llegarán en unos minutos (DEBUG: syncStatus={syncStatus?.syncStatus || "null"})
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
