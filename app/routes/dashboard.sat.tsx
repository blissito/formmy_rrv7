import { useLoaderData, useSearchParams, useFetcher, Form, Link } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { db } from "~/utils/db.server";
import {
  HiDocumentText,
  HiCheckCircle,
  HiClock,
  HiExclamation,
  HiDotsVertical,
  HiEye,
  HiCheck,
  HiX,
  HiRefresh,
  HiDownload,
  HiUpload,
  HiSearch,
  HiFilter,
  HiUserGroup,
  HiArrowLeft
} from "react-icons/hi";
import { useState, useEffect } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userFromSession = await getUserOrRedirect(request);

  const user = await db.user.findUnique({
    where: { id: userFromSession.id },
    include: {
      chatbots: {
        where: { status: { not: "DELETED" } },
      },
    },
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  // Obtener query params
  const url = new URL(request.url);
  const chatbotId = url.searchParams.get("chatbotId");
  const statusFilter = url.searchParams.get("status");
  const satStatusFilter = url.searchParams.get("satStatus");
  const searchQuery = url.searchParams.get("q");
  const period = url.searchParams.get("period") || "current_month";
  const invoiceType = url.searchParams.get("invoiceType") || "all"; // 'all', 'emitidas', 'recibidas'

  // Verificar si la integración SAT está activa para este chatbot
  if (chatbotId) {
    const satIntegration = await db.integration.findFirst({
      where: {
        chatbotId,
        platform: "SAT",
        isActive: true,
      },
    });

    if (!satIntegration) {
      throw new Response(
        "Integración SAT no activada. Por favor actívala desde la configuración del chatbot.",
        { status: 403 }
      );
    }
  }

  // Calcular rango de fechas según periodo
  const now = new Date();
  let startDate: Date;
  let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último día del mes actual

  switch (period) {
    case "current_month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_month":
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case "current_bimester":
      const currentBimester = Math.floor(now.getMonth() / 2);
      startDate = new Date(now.getFullYear(), currentBimester * 2, 1);
      endDate = new Date(now.getFullYear(), currentBimester * 2 + 2, 0);
      break;
    case "current_quarter":
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
      endDate = new Date(now.getFullYear(), currentQuarter * 3 + 3, 0);
      break;
    case "current_semester":
      const currentSemester = Math.floor(now.getMonth() / 6);
      startDate = new Date(now.getFullYear(), currentSemester * 6, 1);
      endDate = new Date(now.getFullYear(), currentSemester * 6 + 6, 0);
      break;
    case "current_year":
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    case "all":
      startDate = new Date(2020, 0, 1); // Fecha muy antigua
      endDate = new Date(2099, 11, 31); // Fecha muy futura
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Filtros base
  const where: any = {
    userId: user.id,
    fecha: {
      gte: startDate,
      lte: endDate,
    },
  };
  if (chatbotId) where.chatbotId = chatbotId;
  if (statusFilter) where.status = statusFilter;
  if (satStatusFilter) where.satStatus = satStatusFilter;
  if (searchQuery) {
    where.OR = [
      { uuid: { contains: searchQuery, mode: "insensitive" } },
      { nombreEmisor: { contains: searchQuery, mode: "insensitive" } },
      { rfcEmisor: { contains: searchQuery, mode: "insensitive" } },
      { concepto: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  // Filtrar por tipo de factura (emitidas vs recibidas)
  if (invoiceType === "emitidas") {
    where.tipo = "INGRESO"; // Facturas que yo emito
  } else if (invoiceType === "recibidas") {
    where.tipo = "EGRESO"; // Facturas que yo recibo
  }

  // Obtener facturas
  const invoices = await db.satInvoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      contact: {
        select: {
          name: true,
          rfc: true,
          isEFOS: true,
          isEDOS: true,
        },
      },
      chatbot: {
        select: {
          name: true,
        },
      },
    },
  });

  // Obtener contactos
  const contactsWhere: any = { userId: user.id };
  if (chatbotId) contactsWhere.chatbotId = chatbotId;

  const contacts = await db.satContact.findMany({
    where: contactsWhere,
    orderBy: { totalInvoices: "desc" },
    take: 50,
  });

  // Calcular métricas básicas (sin filtro de periodo para mostrar totales globales)
  const baseWhere: any = { userId: user.id };
  if (chatbotId) baseWhere.chatbotId = chatbotId;

  const totalInvoices = await db.satInvoice.count({ where: baseWhere });
  const approvedCount = await db.satInvoice.count({
    where: { ...baseWhere, status: "APPROVED" },
  });
  const needsReviewCount = await db.satInvoice.count({
    where: { ...baseWhere, status: "NEEDS_REVIEW" },
  });
  const pendingValidationCount = await db.satInvoice.count({
    where: { ...baseWhere, satStatus: "PENDING_VALIDATION" },
  });

  const alertContacts = await db.satContact.count({
    where: {
      userId: user.id,
      chatbotId: chatbotId || undefined,
      OR: [{ isEFOS: true }, { isEDOS: true }],
    },
  });

  // Calcular totales monetarios del periodo actual (solo facturas aprobadas)
  const approvedInvoicesWhere = { ...where, status: "APPROVED" };
  const approvedInvoices = await db.satInvoice.findMany({
    where: approvedInvoicesWhere,
    select: { subtotal: true, iva: true, total: true, tipo: true },
  });

  const totals = approvedInvoices.reduce(
    (acc, inv) => ({
      subtotal: acc.subtotal + inv.subtotal,
      iva: acc.iva + inv.iva,
      total: acc.total + inv.total,
    }),
    { subtotal: 0, iva: 0, total: 0 }
  );

  // Totales separados por tipo
  const emitidasInvoices = approvedInvoices.filter((i) => i.tipo === "INGRESO");
  const recibidasInvoices = approvedInvoices.filter((i) => i.tipo === "EGRESO");

  const totalsEmitidas = emitidasInvoices.reduce(
    (acc, inv) => ({
      subtotal: acc.subtotal + inv.subtotal,
      iva: acc.iva + inv.iva,
      total: acc.total + inv.total,
    }),
    { subtotal: 0, iva: 0, total: 0 }
  );

  const totalsRecibidas = recibidasInvoices.reduce(
    (acc, inv) => ({
      subtotal: acc.subtotal + inv.subtotal,
      iva: acc.iva + inv.iva,
      total: acc.total + inv.total,
    }),
    { subtotal: 0, iva: 0, total: 0 }
  );

  return {
    user,
    invoices,
    contacts,
    chatbots: user.chatbots,
    selectedChatbotId: chatbotId,
    period,
    periodLabel: getPeriodLabel(period, startDate, endDate),
    invoiceType,
    metrics: {
      total: totalInvoices,
      approved: approvedCount,
      needsReview: needsReviewCount,
      pendingValidation: pendingValidationCount,
      alertContacts,
    },
    totals,
    totalsEmitidas,
    totalsRecibidas,
    countsInPeriod: {
      emitidas: emitidasInvoices.length,
      recibidas: recibidasInvoices.length,
    },
  };
}

function getPeriodLabel(period: string, startDate: Date, endDate: Date): string {
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  switch (period) {
    case "current_month":
      return `${months[startDate.getMonth()]} ${startDate.getFullYear()}`;
    case "last_month":
      return `${months[startDate.getMonth()]} ${startDate.getFullYear()}`;
    case "current_bimester":
      return `Bimestre ${Math.floor(startDate.getMonth() / 2) + 1} ${startDate.getFullYear()}`;
    case "current_quarter":
      return `Trimestre ${Math.floor(startDate.getMonth() / 3) + 1} ${startDate.getFullYear()}`;
    case "current_semester":
      return `Semestre ${Math.floor(startDate.getMonth() / 6) + 1} ${startDate.getFullYear()}`;
    case "current_year":
      return `${startDate.getFullYear()}`;
    case "all":
      return "Histórico Completo";
    default:
      return `${months[startDate.getMonth()]} ${startDate.getFullYear()}`;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const userFromSession = await getUserOrRedirect(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "approve") {
    const invoiceId = formData.get("invoiceId") as string;
    await db.satInvoice.update({
      where: { id: invoiceId },
      data: { status: "APPROVED" },
    });
    return { success: true };
  }

  if (intent === "reject") {
    const invoiceId = formData.get("invoiceId") as string;
    await db.satInvoice.update({
      where: { id: invoiceId },
      data: { status: "PARSE_ERROR" },
    });
    return { success: true };
  }

  if (intent === "validate_sat") {
    const invoiceId = formData.get("invoiceId") as string;
    // TODO: Llamar servicio de validación SAT
    await db.satInvoice.update({
      where: { id: invoiceId },
      data: { satStatus: "VALIDATING" },
    });
    return { success: true };
  }

  if (intent === "update_contact") {
    const contactId = formData.get("contactId") as string;
    const category = formData.get("category") as string;
    const tags = formData.get("tags") as string;

    await db.satContact.update({
      where: { id: contactId },
      data: {
        category: category || null,
        tags: tags ? tags.split(",").map(t => t.trim()) : [],
      },
    });
    return { success: true };
  }

  return { success: false };
}

export default function SATDashboard() {
  const data = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "emitidas");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  const selectedChatbot = data.chatbots.find(
    (c: any) => c.id === data.selectedChatbotId
  );

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    searchParams.set("tab", tab);

    // Al cambiar de tab, actualizar el filtro de tipo de factura
    if (tab === "emitidas") {
      searchParams.set("invoiceType", "emitidas");
    } else if (tab === "recibidas") {
      searchParams.set("invoiceType", "recibidas");
    } else {
      searchParams.delete("invoiceType");
    }

    setSearchParams(searchParams);
  };

  const handleExportExcel = () => {
    // Construir datos para exportar respetando filtros actuales
    const dataToExport = data.invoices.map((inv: any) => ({
      UUID: inv.uuid,
      Fecha: new Date(inv.fecha).toLocaleDateString("es-MX"),
      RFC: inv.rfcEmisor,
      Emisor: inv.nombreEmisor,
      Concepto: inv.concepto,
      Subtotal: inv.subtotal,
      IVA: inv.iva,
      Total: inv.total,
      Status: inv.status,
      SAT: inv.satStatus,
    }));

    // TODO: Implementar exportación real con librería xlsx
    console.log("Exportando:", dataToExport);
    alert(`Exportando ${dataToExport.length} facturas del periodo ${data.periodLabel}`);
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 h-full">
      <div className="max-w-7xl mx-auto px-4 py-1 w-full">
        {/* Header + Controles en una línea */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Link
              to={selectedChatbot ? `/dashboard/chat/${selectedChatbot.slug}` : "/dashboard/chat"}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title="Volver al chatbot"
            >
              <HiArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </Link>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">
              📊 Formmy SAT <span className="text-xs font-normal text-gray-500 ml-2">{data.periodLabel}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de Periodo */}
            <select
              value={data.period}
              onChange={(e) => {
                searchParams.set("period", e.target.value);
                setSearchParams(searchParams);
              }}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
            >
              <option value="current_month">Mes Actual</option>
              <option value="last_month">Mes Anterior</option>
              <option value="current_bimester">Bimestre</option>
              <option value="current_quarter">Trimestre</option>
              <option value="current_semester">Semestre</option>
              <option value="current_year">Año {new Date().getFullYear()}</option>
              <option value="all">Histórico</option>
            </select>

            {/* Selector de Chatbot */}
            {data.chatbots.length > 1 && (
              <select
                value={data.selectedChatbotId || "all"}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "all") {
                    searchParams.delete("chatbotId");
                  } else {
                    searchParams.set("chatbotId", value);
                  }
                  setSearchParams(searchParams);
                }}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
              >
                <option value="all">Todos</option>
                {data.chatbots.map((chatbot) => (
                  <option key={chatbot.id} value={chatbot.id}>
                    {chatbot.name}
                  </option>
                ))}
              </select>
            )}

            {/* Botón Upload */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors font-medium flex items-center gap-1"
            >
              <HiUpload className="w-3 h-3" />
              Subir
            </button>
          </div>
        </div>

        {/* Totales y Métricas en una sola fila - Ultra compacto */}
        <div className="grid grid-cols-6 gap-2 mb-1">
          {/* Emitidas */}
          <div className="bg-white dark:bg-gray-800 rounded shadow p-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">💰</span>
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-1 py-0.5 rounded">
                {data.countsInPeriod.emitidas}
              </span>
            </div>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              ${(data.totalsEmitidas.total / 1000).toFixed(0)}k
            </p>
          </div>
          {/* Recibidas */}
          <div className="bg-white dark:bg-gray-800 rounded shadow p-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">📤</span>
              <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 px-1 py-0.5 rounded">
                {data.countsInPeriod.recibidas}
              </span>
            </div>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              ${(data.totalsRecibidas.total / 1000).toFixed(0)}k
            </p>
          </div>
          {/* Métricas */}
          <MetricCard
            icon={<HiCheckCircle className="w-4 h-4" />}
            label="Aprobadas"
            value={data.metrics.approved}
            color="green"
          />
          <MetricCard
            icon={<HiExclamation className="w-4 h-4" />}
            label="Revisión"
            value={data.metrics.needsReview}
            color="yellow"
          />
          <MetricCard
            icon={<HiClock className="w-4 h-4" />}
            label="Validar SAT"
            value={data.metrics.pendingValidation}
            color="orange"
          />
          <MetricCard
            icon={<HiExclamation className="w-4 h-4" />}
            label="Alertas"
            value={data.metrics.alertContacts}
            color="red"
            onClick={() => handleTabChange("alertas")}
          />
        </div>

        {/* Tabs */}
        <div className="mb-1 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4">
            <TabButton
              active={activeTab === "emitidas"}
              onClick={() => handleTabChange("emitidas")}
              icon={<HiDocumentText />}
            >
              Facturas Emitidas ({data.countsInPeriod.emitidas})
            </TabButton>
            <TabButton
              active={activeTab === "recibidas"}
              onClick={() => handleTabChange("recibidas")}
              icon={<HiDocumentText />}
            >
              Facturas Recibidas ({data.countsInPeriod.recibidas})
            </TabButton>
            <TabButton
              active={activeTab === "contactos"}
              onClick={() => handleTabChange("contactos")}
              icon={<HiUserGroup />}
            >
              Contactos ({data.contacts.length})
            </TabButton>
            <TabButton
              active={activeTab === "alertas"}
              onClick={() => handleTabChange("alertas")}
              icon={<HiExclamation />}
            >
              Alertas EFOS/EDOS ({data.metrics.alertContacts})
            </TabButton>
          </nav>
        </div>

        {/* Contenido por Tab */}
        {(activeTab === "emitidas" || activeTab === "recibidas") && (
          <>
            {/* Filtros y Búsqueda */}
            <div className="mb-2 flex flex-wrap gap-2">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por RFC, nombre, UUID, concepto..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value) {
                        searchParams.set("q", e.target.value);
                      } else {
                        searchParams.delete("q");
                      }
                      setSearchParams(searchParams);
                    }}
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <select
                value={searchParams.get("status") || "all"}
                onChange={(e) => {
                  if (e.target.value === "all") {
                    searchParams.delete("status");
                  } else {
                    searchParams.set("status", e.target.value);
                  }
                  setSearchParams(searchParams);
                }}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="all">Todos los status</option>
                <option value="APPROVED">✅ Aprobadas</option>
                <option value="NEEDS_REVIEW">⚠️ Requieren Revisión</option>
                <option value="PARSE_ERROR">❌ Error</option>
              </select>

              <select
                value={searchParams.get("satStatus") || "all"}
                onChange={(e) => {
                  if (e.target.value === "all") {
                    searchParams.delete("satStatus");
                  } else {
                    searchParams.set("satStatus", e.target.value);
                  }
                  setSearchParams(searchParams);
                }}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="all">Todos SAT status</option>
                <option value="PENDING_VALIDATION">⏳ Pendiente</option>
                <option value="VALID_VIGENTE">✅ Vigente</option>
                <option value="VALID_CANCELADA">❌ Cancelada</option>
              </select>

              <button
                onClick={handleExportExcel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <HiDownload className="w-4 h-4" />
                Exportar Excel
              </button>
            </div>

            {data.invoices.length === 0 ? (
              <EmptyState chatbotName={selectedChatbot?.name} onUpload={() => setShowUploadModal(true)} />
            ) : (
              <InvoicesList
                invoices={data.invoices}
                onViewDetails={setSelectedInvoice}
              />
            )}
          </>
        )}

        {activeTab === "contactos" && (
          <ContactsList
            contacts={data.contacts}
            onEdit={setSelectedContact}
          />
        )}

        {activeTab === "alertas" && (
          <AlertsList contacts={data.contacts.filter((c: any) => c.isEFOS || c.isEDOS)} />
        )}
      </div>

      {/* Modal de Detalles */}
      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Modal de Upload */}
      {showUploadModal && (
        <UploadInvoiceModal onClose={() => setShowUploadModal(false)} />
      )}

      {/* Modal de Edición de Contacto */}
      {selectedContact && (
        <EditContactModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </div>
  );
}

// ========================================
// Componentes
// ========================================

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 py-1.5 px-1 border-b-2 font-medium text-xs transition-colors
        ${
          active
            ? "border-blue-600 text-blue-600 dark:text-blue-400"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
        }
      `}
    >
      {icon}
      {children}
    </button>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "green" | "yellow" | "orange" | "red";
  onClick?: () => void;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
    green: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
    yellow:
      "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300",
    orange:
      "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300",
    red: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-2 ${
        onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ chatbotName, onUpload }: { chatbotName: any; onUpload: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full mb-2">
        <HiDocumentText className="w-6 h-6 text-blue-600 dark:text-blue-300" />
      </div>
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">
        ¡Bienvenido a Formmy SAT!
      </h2>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        Sistema completo de gestión fiscal para contadores mexicanos.
        {chatbotName && (
          <span> Los clientes de <strong>{chatbotName}</strong> podrán subir facturas 24/7.</span>
        )}
      </p>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3 max-w-2xl mx-auto">
        <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-1.5 text-center">
          ✨ Features disponibles:
        </h3>
        <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300 text-left">
          <li className="flex items-start">
            <span className="mr-1.5">✅</span>
            <span><strong>Parseo Inteligente:</strong> XML gratis, PDF simple gratis, FormmyParse avanzado</span>
          </li>
          <li className="flex items-start">
            <span className="mr-1.5">✅</span>
            <span><strong>Auto-aprobación:</strong> Facturas con &gt;90% de confianza automáticas</span>
          </li>
          <li className="flex items-start">
            <span className="mr-1.5">✅</span>
            <span><strong>Validación SAT:</strong> Integración con Facturama para validar status fiscal</span>
          </li>
          <li className="flex items-start">
            <span className="mr-1.5">✅</span>
            <span><strong>Gestión de Contactos:</strong> Auto-extracción de proveedores/clientes</span>
          </li>
          <li className="flex items-start">
            <span className="mr-1.5">⚠️</span>
            <span><strong>Alertas Lista Negra:</strong> Detección automática de EFOS/EDOS</span>
          </li>
        </ul>
      </div>

      <button
        onClick={onUpload}
        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-1.5 mx-auto"
      >
        <HiUpload className="w-4 h-4" />
        Subir Primera Factura
      </button>
    </div>
  );
}

function InvoicesList({
  invoices,
  onViewDetails,
}: {
  invoices: any[];
  onViewDetails: (invoice: any) => void;
}) {
  const fetcher = useFetcher();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const formatParseMethod = (method: string) => {
    return method
      .replace("LLAMAPARSE", "FORMMY")
      .replace(/_/g, " ");
  };

  const handleAction = (intent: string, invoiceId: string) => {
    fetcher.submit(
      { intent, invoiceId },
      { method: "post" }
    );
    setOpenDropdown(null);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      APPROVED: {
        bg: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        label: "✅ Aprobada",
      },
      NEEDS_REVIEW: {
        bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        label: "⚠️ Requiere Revisión",
      },
      PARSE_ERROR: {
        bg: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        label: "❌ Error",
      },
    };
    return badges[status as keyof typeof badges] || badges.APPROVED;
  };

  const getSATStatusBadge = (status: string) => {
    const badges = {
      PENDING_VALIDATION: {
        bg: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        label: "⏳ Pendiente",
      },
      VALID_VIGENTE: {
        bg: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        label: "✅ Vigente",
      },
      VALID_CANCELADA: {
        bg: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        label: "❌ Cancelada",
      },
    };
    return badges[status as keyof typeof badges] || badges.PENDING_VALIDATION;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Facturas Recientes
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Factura
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Emisor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Confianza
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                SAT
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {invoices.map((invoice) => {
              const statusBadge = getStatusBadge(invoice.status);
              const satBadge = getSATStatusBadge(invoice.satStatus);

              return (
                <tr
                  key={invoice.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.uuid.substring(0, 8)}...
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {invoice.chatbot.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {invoice.nombreEmisor}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {invoice.rfcEmisor}
                      {invoice.contact?.isEFOS && (
                        <span className="ml-1 text-red-600">⚠️ EFOS</span>
                      )}
                      {invoice.contact?.isEDOS && (
                        <span className="ml-1 text-red-600">⚠️ EDOS</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(invoice.fecha).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                    ${invoice.total.toLocaleString("es-MX")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {Math.round(invoice.confidence * 100)}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatParseMethod(invoice.parseMethod)}
                    </div>
                    {invoice.warnings?.length > 0 && (
                      <div className="mt-1">
                        <span
                          className="inline-flex items-center text-xs text-yellow-600 dark:text-yellow-400 cursor-help"
                          title={invoice.warnings.join(", ")}
                        >
                          ⚠️ {invoice.warnings.length}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.bg}`}
                    >
                      {statusBadge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${satBadge.bg}`}
                    >
                      {satBadge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center relative">
                    <button
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === invoice.id ? null : invoice.id
                        )
                      }
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <HiDotsVertical className="w-5 h-5" />
                    </button>

                    {openDropdown === invoice.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-gray-600">
                        <button
                          onClick={() => onViewDetails(invoice)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 rounded-t-lg"
                        >
                          <HiEye className="w-4 h-4" />
                          Ver Detalles
                        </button>
                        {invoice.status === "NEEDS_REVIEW" && (
                          <>
                            <button
                              onClick={() => handleAction("approve", invoice.id)}
                              className="w-full text-left px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                            >
                              <HiCheck className="w-4 h-4" />
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleAction("reject", invoice.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                            >
                              <HiX className="w-4 h-4" />
                              Rechazar
                            </button>
                          </>
                        )}
                        {invoice.satStatus === "PENDING_VALIDATION" && (
                          <button
                            onClick={() =>
                              handleAction("validate_sat", invoice.id)
                            }
                            className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                          >
                            <HiRefresh className="w-4 h-4" />
                            Validar en SAT
                          </button>
                        )}
                        {(invoice.xmlUrl || invoice.pdfUrl) && (
                          <button
                            onClick={() => {
                              const url = invoice.xmlUrl || invoice.pdfUrl;
                              if (url) window.open(url, "_blank");
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 rounded-b-lg border-t border-gray-200 dark:border-gray-600"
                          >
                            <HiDownload className="w-4 h-4" />
                            Descargar Archivo
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvoiceDetailsModal({
  invoice,
  onClose,
}: {
  invoice: any;
  onClose: () => void;
}) {
  const fetcher = useFetcher();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Detalle de Factura
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">UUID</label>
              <p className="text-sm text-gray-900 dark:text-white font-mono">{invoice.uuid}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</label>
              <p className="text-sm text-gray-900 dark:text-white">{invoice.tipo}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Concepto</label>
            <p className="text-sm text-gray-900 dark:text-white">{invoice.concepto}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Subtotal</label>
              <p className="text-lg font-bold text-gray-900 dark:text-white">${invoice.subtotal.toLocaleString("es-MX")}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">IVA</label>
              <p className="text-lg font-bold text-gray-900 dark:text-white">${invoice.iva.toLocaleString("es-MX")}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</label>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">${invoice.total.toLocaleString("es-MX")}</p>
            </div>
          </div>
          {invoice.warnings?.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-2">⚠️ Advertencias</h3>
              <ul className="list-disc list-inside space-y-1">
                {invoice.warnings.map((warning: string, i: number) => (
                  <li key={i} className="text-sm text-yellow-800 dark:text-yellow-300">{warning}</li>
                ))}
              </ul>
            </div>
          )}
          {invoice.status === "NEEDS_REVIEW" && (
            <div className="flex gap-3">
              <button onClick={() => { fetcher.submit({ intent: "approve", invoiceId: invoice.id }, { method: "post" }); onClose(); }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                <HiCheck className="w-5 h-5" />Aprobar Factura
              </button>
              <button onClick={() => { fetcher.submit({ intent: "reject", invoiceId: invoice.id }, { method: "post" }); onClose(); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                <HiX className="w-5 h-5" />Rechazar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactsList({
  contacts,
  onEdit,
}: {
  contacts: any[];
  onEdit: (contact: any) => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Contactos ({contacts.length})</h2>
      </div>
      {contacts.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">No hay contactos registrados</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">RFC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Facturas</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alertas</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white font-mono">{contact.rfc}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{contact.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{contact.totalInvoices}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">${contact.totalAmount.toLocaleString("es-MX")}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {contact.isEFOS || contact.isEDOS ? (
                      <div className="flex gap-1 justify-center">
                        {contact.isEFOS && <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded">EFOS</span>}
                        {contact.isEDOS && <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded">EDOS</span>}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => onEdit(contact)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AlertsList({ contacts }: { contacts: any[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">⚠️ Alertas EFOS/EDOS ({contacts.length})</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Contactos en lista negra del SAT que requieren atención inmediata</p>
      </div>
      {contacts.length === 0 ? (
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-3">
            <HiCheckCircle className="w-8 h-8 text-green-600 dark:text-green-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">¡Sin Alertas!</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">No hay contactos con alertas EFOS o EDOS en este momento</p>
        </div>
      ) : (
        <div className="p-6 space-y-4">
          {contacts.map((contact) => (
            <div key={contact.id} className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{contact.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">RFC: {contact.rfc}</p>
                  <div className="flex gap-2 mt-2">
                    {contact.isEFOS && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded font-medium">⚠️ EFOS</span>}
                    {contact.isEDOS && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded font-medium">⚠️ EDOS</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{contact.totalInvoices} facturas</div>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">${contact.totalAmount.toLocaleString("es-MX")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UploadInvoiceModal({ onClose }: { onClose: () => void }) {
  const fetcher = useFetcher();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parseMode, setParseMode] = useState("auto");

  const isUploading = fetcher.state === "submitting" || fetcher.state === "loading";
  const uploadResult = fetcher.data as any;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isUploading) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, isUploading]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith(".xml") || f.name.endsWith(".pdf")
    );
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(
        (f) => f.name.endsWith(".xml") || f.name.endsWith(".pdf")
      );
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("parseMode", parseMode);

    fetcher.submit(formData, {
      method: "post",
      action: "/api/sat/upload",
      encType: "multipart/form-data",
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Subir Facturas</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <HiX className="w-6 h-6" />
          </button>
        </div>
        <div className="px-6 py-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600"
            }`}
          >
            <HiUpload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Arrastra tus facturas aquí
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Formatos soportados: XML, PDF (máx. 10MB por archivo)
              <br />
              <strong>✨ Soporta múltiples archivos</strong>
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept=".xml,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors inline-block">
                Seleccionar archivos
              </span>
            </label>
          </div>

          {/* Lista de archivos seleccionados */}
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Archivos seleccionados ({selectedFiles.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <HiDocumentText className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-900 dark:text-white truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 ml-2"
                    >
                      <HiX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modo de Parseo
            </label>
            <select
              value={parseMode}
              onChange={(e) => setParseMode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="auto">Automático (Recomendado)</option>
              <option value="XML_LOCAL">XML Local (Gratis, solo .xml)</option>
              <option value="PDF_SIMPLE">PDF Simple (Gratis, calidad básica)</option>
              <option value="FORMMY_CE">FormmyParse CE (1 crédito/pág)</option>
              <option value="FORMMY_AG">FormmyParse AG (3 créditos/pág)</option>
              <option value="FORMMY_AG_PLUS">
                FormmyParse AG+ (6 créditos/pág, OCR avanzado)
              </option>
            </select>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              El modo automático selecciona el mejor método según el tipo de archivo
            </p>
          </div>
        </div>
        {/* Resultados del upload */}
        {uploadResult && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
            <div
              className={`rounded-lg p-4 ${
                uploadResult.success && uploadResult.errors === 0
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : uploadResult.errors > 0
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              }`}
            >
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {uploadResult.success && uploadResult.errors === 0
                  ? "✅ Procesamiento Completado"
                  : uploadResult.errors > 0
                  ? "⚠️ Procesamiento con Errores"
                  : "❌ Error"}
              </h4>
              {uploadResult.success && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white dark:bg-gray-800 rounded p-2 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Procesadas</p>
                      <p className="text-lg font-bold">{uploadResult.processed}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded p-2 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Aprobadas</p>
                      <p className="text-lg font-bold text-green-600">{uploadResult.approved}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded p-2 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Errores</p>
                      <p className="text-lg font-bold text-red-600">{uploadResult.errors}</p>
                    </div>
                  </div>

                  {uploadResult.needsReview > 0 && (
                    <p className="text-xs bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
                      ⚠️ <strong>{uploadResult.needsReview}</strong> facturas requieren revisión manual
                    </p>
                  )}

                  {/* Mostrar detalles de errores */}
                  {uploadResult.results && uploadResult.errors > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">Detalles de errores:</p>
                      {uploadResult.results
                        .filter((r: any) => !r.success)
                        .map((result: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-red-100 dark:bg-red-900/30 p-2 rounded text-xs"
                          >
                            <p className="font-semibold text-red-900 dark:text-red-200">
                              📄 {result.fileName}
                            </p>
                            <p className="text-red-700 dark:text-red-300 mt-1">
                              {result.error || "Error desconocido"}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Mostrar resumen de exitosas */}
                  {uploadResult.results && uploadResult.processed > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">Facturas procesadas correctamente:</p>
                      {uploadResult.results
                        .filter((r: any) => r.success)
                        .map((result: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-green-100 dark:bg-green-900/30 p-2 rounded text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-green-900 dark:text-green-200">
                                📄 {result.fileName}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                result.status === "APPROVED"
                                  ? "bg-green-600 text-white"
                                  : "bg-yellow-600 text-white"
                              }`}>
                                {result.status === "APPROVED" ? "✅ Aprobada" : "⚠️ Revisar"}
                              </span>
                            </div>
                            <p className="text-green-700 dark:text-green-300 mt-1">
                              Total: ${result.total?.toLocaleString("es-MX")} | Confianza: {Math.round(result.confidence * 100)}%
                            </p>
                          </div>
                        ))}
                    </div>
                  )}

                  {uploadResult.errors === 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-3 font-medium">
                      ✨ ¡Listo! Cierra el modal y recarga la página para ver las facturas.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isUploading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Procesando facturas...
              </span>
            ) : selectedFiles.length > 0 ? (
              <span>
                <strong>{selectedFiles.length}</strong> archivo
                {selectedFiles.length > 1 ? "s" : ""} listo
                {selectedFiles.length > 1 ? "s" : ""} para procesar
              </span>
            ) : null}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadResult?.success ? "Cerrar" : "Cancelar"}
            </button>
            {!uploadResult?.success && (
              <button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    Procesar {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditContactModal({
  contact,
  onClose,
}: {
  contact: any;
  onClose: () => void;
}) {
  const fetcher = useFetcher();
  const [category, setCategory] = useState(contact.category || "");
  const [tags, setTags] = useState(contact.tags?.join(", ") || "");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Editar Contacto
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={contact.name}
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              RFC
            </label>
            <input
              type="text"
              value={contact.rfc}
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-mono cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <input
              type="text"
              value={contact.type}
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoría
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ej: Gasolinera, Papelería, Servicios"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Clasifica el contacto para facilitar búsquedas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Etiquetas
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ej: frecuente, importante, local"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Separadas por comas
            </p>
          </div>

          {(contact.isEFOS || contact.isEDOS) && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">
                ⚠️ Alertas SAT
              </h3>
              <div className="flex gap-2">
                {contact.isEFOS && (
                  <span className="text-xs bg-red-600 text-white px-2 py-1 rounded font-medium">
                    EFOS
                  </span>
                )}
                {contact.isEDOS && (
                  <span className="text-xs bg-red-600 text-white px-2 py-1 rounded font-medium">
                    EDOS
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              fetcher.submit(
                {
                  intent: "update_contact",
                  contactId: contact.id,
                  category,
                  tags,
                },
                { method: "post" }
              );
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
