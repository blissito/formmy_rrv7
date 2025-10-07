import type { Chatbot, User, Contact, ContactStatus } from "@prisma/client";
import { useState, useRef, useEffect } from "react";
import { HiOutlineSearch, HiChevronDown, HiOutlineDownload } from "react-icons/hi";
import { HiOutlineTrash, HiOutlineChat } from "react-icons/hi";
import { useNavigate, useFetcher, useRevalidator } from "react-router";
import { cn } from "~/lib/utils";

const STATUS_LABELS: Record<ContactStatus, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  SCHEDULED: "Agendado",
  NEGOTIATING: "Negociando",
  ON_HOLD: "En Pausa",
  CLOSED_WON: "Ganado",
  CLOSED_LOST: "Perdido",
};

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
}: {
  value: ContactStatus;
  onChange: (status: ContactStatus) => void;
  disabled: boolean;
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
        {STATUS_LABELS[value]}
        <HiChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-40 bg-white rounded-lg shadow-lg border border-outlines overflow-hidden">
          {Object.entries(STATUS_LABELS).map(([statusValue, label]) => (
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
  contacts,
}: {
  chatbot: Chatbot;
  user: User;
  contacts: Contact[];
}) => {
  const navigate = useNavigate();
  const statusFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const exportFetcher = useFetcher();
  const revalidator = useRevalidator();
  const [searchTerm, setSearchTerm] = useState("");
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, ContactStatus>>({});

  // Filtrar contactos según el término de búsqueda
  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.phone?.toLowerCase().includes(searchLower) ||
      contact.company?.toLowerCase().includes(searchLower)
    );
  });

  const handleStatusChange = (contactId: string, newStatus: ContactStatus) => {
    console.log("🔄 Actualizando status:", { contactId, newStatus });

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
        console.log("✅ Status update successful");
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
    if (!confirm("¿Estás seguro de que quieres eliminar este contacto?")) {
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
        console.log("✅ Contact deleted successfully");
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
    const headers = ["Nombre", "Email", "Teléfono", "Empresa", "Cargo", "Estatus", "Origen", "Fecha"];
    const rows = filteredContacts.map(contact => [
      contact.name || "",
      contact.email || "",
      contact.phone || "",
      contact.company || "",
      contact.position || "",
      STATUS_LABELS[contact.status || "NEW"],
      contact.source,
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
    link.setAttribute("download", `contactos_${chatbot.slug}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewConversation = (conversationId: string | null) => {
    if (!conversationId) {
      alert("Este contacto no tiene una conversación asociada");
      return;
    }
    // Navegar a la tab de conversaciones con el ID de la conversación
    const url = `/dashboard/chat/${chatbot.slug}?tab=Conversaciones&conversation=${conversationId}`;
    navigate(url);
  };

  if (contacts.length === 0) {
    return (
      <section className="h-full min-h-[60vh] place-items-center grid pb-6 ">
        <div>
          <img
            className="w-40 md:w-[200px] mx-auto"
            src="/dash/comming.svg"
            alt="no contacts"
          />
          <h3 className="text-2xl font-bold text-dark text-center heading mt-6">
            Sin Contactos
          </h3>
          <p className="paragraph text-center text-metal mt-3 max-w-md mx-auto">
            Aún no has capturado contactos con tu chatbot. Los contactos se
            guardarán automáticamente cuando los usuarios proporcionen su
            información durante las conversaciones.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="h-full w-full pb-4 md:pb-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-dark">
            Contactos ({contacts.length})
          </h3>
          <p className="text-sm text-metal mt-1">
            💡 Tip: Los contactos se guardan automáticamente cuando tu chatbot usa la herramienta save_contact.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredContacts.length === 0}
        className={cn(
                "enabled:cursor-pointer enabled:active:scale-95 w-10 h-10 grid place-items-center",
                "enabled:hover:bg-gray-50 enabled:hover:shadow-sm transition-all",
                "rounded-xl p-1 border border-gray-300",
              )}          
              >
          <img className="pointer-events-none" src="/assets/chat/download.svg" alt="download" />
          </button>
          <div className="relative w-80">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-metal w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border placeholder:text-sm border-outlines rounded-full focus:outline-none focus:ring-0 focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-outlines overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-surfaceTwo border-b border-outlines">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark w-[22%]">
                  Contacto
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark w-[12%]">
                  Teléfono
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark w-[14%]">
                  Empresa
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark w-[12%]">
                  Cargo
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark w-[11%]">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark w-[9%]">
                  Origen
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark w-[12%]">
                  Estatus
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark w-[8%]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outlines/50">
              {filteredContacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="hover:bg-brand-100/50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex flex-col overflow-hidden">
                      <div className="text-sm font-medium text-dark truncate">
                        {contact.name || "-"}
                      </div>
                      <div className="text-xs text-irongray mt-1 truncate">
                        {contact.email || "-"}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-metal truncate">{contact.phone || "-"}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-metal truncate">
                      {contact.company || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-metal truncate">
                      {contact.position || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-irongray truncate">
                      {new Date(contact.capturedAt).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex justify-start">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        contact.source.toLowerCase() === 'whatsapp'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-cloud/20 text-teal-700'
                      }`}>
                        {contact.source.toLowerCase() === 'whatsapp' ? 'WhatsApp' : 'Web'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex justify-start">
                      <StatusDropdown
                        value={optimisticStatuses[contact.id] || contact.status || "NEW"}
                        onChange={(newStatus) => handleStatusChange(contact.id, newStatus)}
                        disabled={statusFetcher.state !== "idle"}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewConversation(contact.conversationId)}
                        disabled={!contact.conversationId}
                        className={`p-2 rounded-lg transition-colors ${
                          contact.conversationId
                            ? 'hover:bg-surfaceThree text-metal '
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={contact.conversationId ? "Ver conversación" : "Sin conversación"}
                      >
                        <HiOutlineChat className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        disabled={deleteFetcher.state !== "idle"}
                        className="p-2 rounded-lg  text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                        title="Eliminar contacto"
                      >
                        <HiOutlineTrash className="w-5 h-5" />
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
              No se encontraron contactos con "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
