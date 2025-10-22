import { useLoaderData, useSearchParams } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { db } from "~/utils/db.server";
import { HiDocumentText, HiCheckCircle, HiClock, HiExclamation } from "react-icons/hi";

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

  // Obtener chatbotId de query params (opcional)
  const url = new URL(request.url);
  const chatbotId = url.searchParams.get("chatbotId");

  // Filtro: chatbot específico o todos
  const where: any = { userId: user.id };
  if (chatbotId) {
    where.chatbotId = chatbotId;
  }

  // Obtener facturas
  const invoices = await db.sATInvoice.findMany({
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

  // Calcular métricas
  const totalInvoices = await db.sATInvoice.count({ where });
  const approvedCount = await db.sATInvoice.count({
    where: { ...where, status: "APPROVED" },
  });
  const needsReviewCount = await db.sATInvoice.count({
    where: { ...where, status: "NEEDS_REVIEW" },
  });
  const pendingValidationCount = await db.sATInvoice.count({
    where: { ...where, satStatus: "PENDING_VALIDATION" },
  });

  // Obtener contactos con alertas EFOS/EDOS
  const alertContacts = await db.sATContact.count({
    where: {
      userId: user.id,
      OR: [{ isEFOS: true }, { isEDOS: true }],
    },
  });

  return {
    user,
    invoices,
    chatbots: user.chatbots,
    selectedChatbotId: chatbotId,
    metrics: {
      total: totalInvoices,
      approved: approvedCount,
      needsReview: needsReviewCount,
      pendingValidation: pendingValidationCount,
      alertContacts,
    },
  };
}

export default function SATDashboard() {
  const data = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedChatbot = data.chatbots.find(
    (c: any) => c.id === data.selectedChatbotId
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                📊 SAT México - Gestión de Facturas
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Sistema inteligente de recolección y validación fiscal
              </p>
            </div>

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
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">Todos los chatbots</option>
                {data.chatbots.map((chatbot) => (
                  <option key={chatbot.id} value={chatbot.id}>
                    {chatbot.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <MetricCard
            icon={<HiDocumentText className="w-6 h-6" />}
            label="Total Facturas"
            value={data.metrics.total}
            color="blue"
          />
          <MetricCard
            icon={<HiCheckCircle className="w-6 h-6" />}
            label="Auto-aprobadas"
            value={data.metrics.approved}
            color="green"
          />
          <MetricCard
            icon={<HiExclamation className="w-6 h-6" />}
            label="Requieren Revisión"
            value={data.metrics.needsReview}
            color="yellow"
          />
          <MetricCard
            icon={<HiClock className="w-6 h-6" />}
            label="Pendientes Validar"
            value={data.metrics.pendingValidation}
            color="orange"
          />
          <MetricCard
            icon={<HiExclamation className="w-6 h-6" />}
            label="Alertas EFOS/EDOS"
            value={data.metrics.alertContacts}
            color="red"
          />
        </div>

        {/* Contenido Principal */}
        {data.invoices.length === 0 ? (
          <EmptyState chatbotName={selectedChatbot?.name} />
        ) : (
          <InvoicesList invoices={data.invoices} />
        )}
      </div>
    </div>
  );
}

// ========================================
// Componentes
// ========================================

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "green" | "yellow" | "orange" | "red";
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ chatbotName }: { chatbotName: any }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full mb-6">
        <HiDocumentText className="w-10 h-10 text-blue-600 dark:text-blue-300" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        ¡Bienvenido a SAT México!
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
        Sistema completo de gestión fiscal para contadores mexicanos.
        {chatbotName && (
          <span>
            {" "}
            Los clientes de <strong>{chatbotName}</strong> podrán subir facturas
            24/7 vía WhatsApp.
          </span>
        )}
      </p>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 max-w-2xl mx-auto text-left">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ✨ Features disponibles:
        </h3>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li className="flex items-start">
            <span className="mr-2">✅</span>
            <span>
              <strong>Parseo Inteligente 4 Niveles:</strong> XML gratis, PDF
              simple gratis, LlamaParse avanzado
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✅</span>
            <span>
              <strong>Auto-aprobación:</strong> Facturas con &gt;90% de confianza
              se aprueban automáticamente
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✅</span>
            <span>
              <strong>Validación SAT:</strong> Integración con Facturama para
              validar status fiscal
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✅</span>
            <span>
              <strong>Gestión de Contactos:</strong> Auto-extracción de
              proveedores/clientes con validación SAT
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">⚠️</span>
            <span>
              <strong>Alertas Lista Negra:</strong> Detección automática de
              EFOS/EDOS
            </span>
          </li>
        </ul>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Próximos pasos:</strong> Configura el chatbot para recibir
            facturas por WhatsApp o sube tu primera factura manualmente.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          disabled
        >
          📤 Subir Primera Factura (Próximamente)
        </button>
      </div>
    </div>
  );
}

function InvoicesList({ invoices }: { invoices: any[] }) {
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
                      {invoice.parseMethod.replace("_", " ")}
                    </div>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
