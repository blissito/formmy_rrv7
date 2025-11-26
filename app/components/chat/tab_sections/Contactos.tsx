import type { Chatbot, User, Lead, ContactStatus } from "@prisma/client";
import { useState, useRef, useEffect } from "react";
import { HiOutlineSearch, HiChevronDown, HiOutlineDownload } from "react-icons/hi";
import { HiOutlineTrash, HiOutlineChat } from "react-icons/hi";
import { useNavigate, useFetcher, useRevalidator } from "react-router";
import DeleteIcon from "~/components/ui/icons/Delete";
import { cn } from "~/lib/utils";
import { useDashboardTranslation } from "~/hooks/useDashboardTranslation";

// Helper function to get status labels (must be called inside component with hook)
const getStatusLabels = (t: (key: string) => string): Record<ContactStatus, string> => ({
  NEW: t('contacts.status.new'),
  CONTACTED: t('contacts.status.contacted'),
  SCHEDULED: t('contacts.status.scheduled'),
  NEGOTIATING: t('contacts.status.negotiating'),
  ON_HOLD: t('contacts.status.on_hold'),
  CLOSED_WON: t('contacts.status.closed_won'),
  CLOSED_LOST: t('contacts.status.closed_lost'),
});

const STATUS_COLORS: Record<ContactStatus, string> = {
  NEW: "bg-brand-500/20 text-brand-600",
  CONTACTED: "bg-yellow-500/20 text-yellow-700",
  SCHEDULED: "bg-teal-500/20 text-teal-700",
  NEGOTIATING: "bg-orange-500/20 text-amber-600",
  ON_HOLD: "bg-gray-400/20 text-gray-700",
  CLOSED_WON: "bg-grass/20 text-grass",
  CLOSED_LOST: "bg-danger/20 text-danger",
};

const STATUS_SOLID_COLORS: Record<ContactStatus, string> = {
  NEW: "bg-brand-500",
  CONTACTED: "bg-yellow-500",
  SCHEDULED: "bg-sky",
  NEGOTIATING: "bg-orange-500",
  ON_HOLD: "bg-gray-400",
  CLOSED_WON: "bg-grass",
  CLOSED_LOST: "bg-danger",
};

// Dropdown de estatus personalizado
const StatusDropdown = ({
  value,
  onChange,
  disabled,
  statusLabels,
  hasLimitedSpace,
}: {
  value: ContactStatus;
  onChange: (status: ContactStatus) => void;
  disabled: boolean;
  statusLabels: Record<ContactStatus, string>;
  hasLimitedSpace?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (status: ContactStatus) => {
    onChange(status);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative flex items-center justify-start" >
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-start gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${STATUS_COLORS[value]} ${
          disabled ? "opacity-50 cursor-wait" : "hover:opacity-80 cursor-pointer"
        }`}
      >
        {statusLabels[value]}
        <HiChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-2 w-40 bg-white rounded-lg shadow-lg border border-outlines ${
          hasLimitedSpace ? "max-h-32 overflow-y-auto" : "overflow-hidden"
        }`}>
          {Object.entries(statusLabels).map(([statusValue, label]) => (
            <button
              key={statusValue}
              type="button"
              onClick={() => handleSelect(statusValue as ContactStatus)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-surfaceFour transition-colors flex items-center gap-2 ${
                value === statusValue ? "bg-outlines/10" : ""
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${STATUS_SOLID_COLORS[statusValue as ContactStatus]}`}></span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const Contactos = ({
  chatbot,
  user,
  contacts: initialContacts,
}: {
  chatbot: Chatbot;
  user: User;
  contacts: Lead[];
}) => {
  const { t } = useDashboardTranslation();
  const STATUS_LABELS = getStatusLabels(t);
  const navigate = useNavigate();
  const statusFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const exportFetcher = useFetcher();
  const leadsFetcher = useFetcher<{ success: boolean; leads: Lead[] }>(); // ⚡ Nuevo fetcher para cargar leads
  const revalidator = useRevalidator();
  const [searchTerm, setSearchTerm] = useState("");
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, ContactStatus>>({});

  // ⚡ Cargar leads bajo demanda cuando se monta el componente
  useEffect(() => {
    if (leadsFetcher.state === "idle" && !leadsFetcher.data) {
      leadsFetcher.load(`/api/v1/leads?chatbotId=${chatbot.id}`);
    }
  }, [chatbot.id, leadsFetcher]);

  // ⚡ Usar leads del fetcher o array vacío mientras carga
  const contacts = leadsFetcher.data?.leads || initialContacts;
  const isLoadingLeads = leadsFetcher.state === "loading";

  // Filtrar contactos según el término de búsqueda
  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.phone?.toLowerCase().includes(searchLower) ||
      contact.productInterest?.toLowerCase().includes(searchLower)
    );
  });

  const handleStatusChange = (contactId: string, newStatus: ContactStatus) => {

    // Actualización optimista
    setOptimisticStatuses(prev => ({ ...prev, [contactId]: newStatus }));

    // Submit usando fetcher
    statusFetcher.submit(
      {
        intent: "update_status",
        contactId,
        status: newStatus,
      },
      {
        method: "POST",
        action: "/api/v1/contacts",
        encType: "application/json",
      }
    );
  };

  // Limpiar estado optimista y revalidar cuando el fetcher termine
  useEffect(() => {
    if (statusFetcher.state === "idle" && statusFetcher.data) {
      if (statusFetcher.data.success) {
        setOptimisticStatuses({});
        revalidator.revalidate();
      } else {
        console.error("❌ Status update failed:", statusFetcher.data.error);
        alert(`Error: ${statusFetcher.data.error}`);
        setOptimisticStatuses({});
      }
    }
  }, [statusFetcher.state, statusFetcher.data, revalidator]);

  const handleDeleteContact = (contactId: string) => {
    if (!confirm(t('contacts.confirmDelete'))) {
      return;
    }

    deleteFetcher.submit(
      {
        intent: "delete_contact",
        contactId,
      },
      {
        method: "POST",
        action: "/api/v1/contacts",
        encType: "application/json",
      }
    );
  };

  // Revalidar cuando el delete fetcher termine
  useEffect(() => {
    if (deleteFetcher.state === "idle" && deleteFetcher.data) {
      if (deleteFetcher.data.success) {
        revalidator.revalidate();
      } else {
        console.error("❌ Delete failed:", deleteFetcher.data.error);
        alert(`Error: ${deleteFetcher.data.error}`);
      }
    }
  }, [deleteFetcher.state, deleteFetcher.data, revalidator]);

  // Manejar exportación a CSV
  const handleExportCSV = () => {
    // Generar CSV en el cliente directamente
    const headers = [
      t('contacts.name'),
      t('contacts.email'),
      t('contacts.phone'),
      t('contacts.company'),
      t('contacts.contactStatus'),
      t('contacts.source'),
      t('contacts.date')
    ];
    const rows = filteredContacts.map(contact => [
      contact.name || "",
      contact.email || "",
      contact.phone || "",
      contact.productInterest || "",
      STATUS_LABELS[contact.status || "NEW"],
      "chatbot", // Leads siempre vienen de save_contact_info
      new Date(contact.capturedAt).toLocaleDateString("es-MX"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_${chatbot.slug}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewConversation = (conversationId: string | null) => {
    if (!conversationId) {
      alert(t('contacts.noConversationAssociated'));
      return;
    }
    // Navegar a la tab de conversaciones con el ID de la conversación
    const url = `/dashboard/chat/${chatbot.slug}?tab=Conversaciones&conversation=${conversationId}`;
    navigate(url);
  };

  // ⚡ Mostrar loading state mientras se cargan los leads
  if (isLoadingLeads) {
    return (
      <section className="h-full min-h-[60vh] place-items-center grid pb-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-metal mt-4">{t('contacts.loading') || 'Cargando contactos...'}</p>
        </div>
      </section>
    );
  }

  if (contacts.length === 0) {
    return (
      <section className="h-full min-h-[60vh] place-items-center grid pb-6 ">
        <div>
          <img
            className="w-80 md:w-[400px] mx-auto"
            // src="/dash/comming.svg"
            src="/rotating_ghost.png"
            alt="no contacts"
          />
          <h3 className="text-2xl font-bold text-dark text-center heading mt-6">
            {t('contacts.noContacts')}
          </h3>
          <p className="paragraph text-center text-metal mt-3 max-w-md mx-auto">
            {t('contacts.noContactsDescription')}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-fit w-full pb-4 md:pb-8">
      <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h3 className="text-lg md:text-xl font-semibold text-dark">
            {t('contacts.title')} ({contacts.length})
          </h3>
          <p className="text-xs lg:text-sm text-metal mt-1 hidden sm:block">
            {t('contacts.autoSaveTip')}
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredContacts.length === 0}
        className={cn(
                "enabled:cursor-pointer enabled:active:scale-95 w-9 h-9 md:w-10 md:h-10 grid place-items-center",
                "enabled:hover:bg-gray-50 enabled:hover:shadow-sm transition-all",
                "rounded-xl p-1 border border-gray-300",
              )}
              >
          <img className="pointer-events-none w-5 h-5 md:w-6 md:h-6" src="/assets/chat/download.svg" alt="download" />
          </button>
          <div className="relative flex-1 md:w-80 md:flex-initial">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-metal w-4 h-4 md:w-5 md:h-5" />
            <input
              type="text"
              placeholder={t('contacts.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2 border text-sm placeholder:text-xs md:placeholder:text-sm border-outlines rounded-full focus:outline-none focus:ring-0 focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-outlines overflow-hidden">
        <div className="overflow-x-auto md:overflow-x-visible">
          <table className="w-full table-fixed min-w-[800px] md:min-w-0">
            <thead className="bg-surfaceTwo border-b border-outlines">
              <tr>
                <th className="pl-4 md:pl-6 pr-2 py-3 text-left text-xs md:text-sm font-medium text-dark w-[20%] md:w-[16%]">
                  {t('contacts.contact')}
                </th>
                <th className="px-2 md:px-2 py-3 text-left text-xs md:text-sm font-medium text-dark w-[15%] md:w-[10%]">
                  {t('contacts.phone')}
                </th>
                <th className="px-2 md:px-2 py-3 text-left text-xs md:text-sm font-medium text-dark w-[25%] md:w-[24%]">
                  {t('contacts.company')}
                </th>
                <th className="px-2 md:px-2 py-3 text-left text-xs md:text-sm font-medium text-dark w-[13%] hidden lg:table-cell">
                  {t('contacts.date')}
                </th>
                <th className="px-2 md:px-2 py-3 text-left text-xs md:text-sm font-medium text-dark w-[12%] md:w-[9%] hidden md:table-cell">
                  {t('contacts.source')}
                </th>
                <th className="px-2 md:px-2 py-3 text-left text-xs md:text-sm font-medium text-dark w-[18%] md:w-[10%]">
                  {t('contacts.contactStatus')}
                </th>
                <th className="px-2 md:px-2 py-3 text-left text-xs md:text-sm font-medium text-dark w-[13%] md:w-[6%]">
                  {t('contacts.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outlines/50">
              {filteredContacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="hover:bg-brand-100/50 transition-colors"
                >
                  <td className="pl-4 md:pl-6 pr-2 py-3 md:py-4">
                    <div className="flex flex-col overflow-hidden">
                      <div className="text-xs md:text-sm font-medium text-dark truncate">
                        {contact.name || "-"}
                      </div>
                      <div className="text-[10px] md:text-xs text-irongray mt-1 truncate">
                        {contact.email || "-"}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 md:px-2 py-3 md:py-4 whitespace-nowrap">
                    <div className="text-xs md:text-sm text-metal truncate">{contact.phone || "-"}</div>
                  </td>
                  <td className="px-2 md:px-2 py-3 md:py-4">
                    <div className="text-xs md:text-sm text-metal line-clamp-2">
                      {contact.productInterest || "-"}
                    </div>
                  </td>
                  <td className="px-2 md:px-2 py-3 md:py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="text-xs md:text-sm text-irongray truncate">
                      {new Date(contact.capturedAt).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="px-2 md:px-2 py-3 md:py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="flex justify-start">
                      <span className={`px-2 py-1 text-[10px] md:text-xs font-medium rounded-full ${
                        contact.source === 'whatsapp'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {contact.source === 'whatsapp' ? 'WhatsApp' : 'Web'}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 md:px-2 py-3 md:py-4 whitespace-nowrap">
                    <div className="flex justify-start">
                      <StatusDropdown
                        value={optimisticStatuses[contact.id] || contact.status || "NEW"}
                        onChange={(newStatus) => handleStatusChange(contact.id, newStatus)}
                        disabled={statusFetcher.state !== "idle"}
                        statusLabels={STATUS_LABELS}
                        hasLimitedSpace={filteredContacts.length < 3}
                      />
                    </div>
                  </td>
                  <td className="px-2 md:px-2 py-3 md:py-4 whitespace-nowrap">
                    <div className="flex items-center justify-start gap-1 md:gap-2">
                      <button
                        onClick={() => handleViewConversation(contact.conversationId)}
                        disabled={!contact.conversationId}
                        className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                          contact.conversationId
                            ? 'hover:bg-surfaceThree text-metal '
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={contact.conversationId ? t('contacts.viewConversation') : t('contacts.noConversation')}
                      >
                        <HiOutlineChat className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        disabled={deleteFetcher.state !== "idle"}
                        className="p-1.5 md:p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                        title={t('contacts.deleteContact')}
                      >
                        <DeleteIcon className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredContacts.length === 0 && searchTerm && (
          <div className="py-12 text-center">
            <p className="text-metal">
              {t('contacts.noSearchResults').replace('{search}', searchTerm)}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
