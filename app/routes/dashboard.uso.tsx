import { useLoaderData } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { db } from "~/utils/db.server";
import { HiOutlineDocumentText } from "react-icons/hi";
import { BiMessageRounded, BiGhost, BiCoin } from "react-icons/bi";
import { AiOutlineCalendar, AiOutlineBarChart } from "react-icons/ai";
import { getAvailableCredits } from "server/llamaparse/credits.service";

export async function loader({ request }: Route.LoaderArgs) {
  const userFromSession = await getUserOrRedirect(request);

  const user = await db.user.findUnique({
    where: { id: userFromSession.id },
    select: {
      id: true,
      name: true,
      plan: true,
      purchasedConversations: true,
      chatbots: {
        select: {
          monthlyUsage: true,
        }
      },
      projects: true,
    }
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Obtener estadísticas del mes actual
  const monthlyMessages = await db.conversation.aggregate({
    where: {
      chatbot: {
        userId: user.id
      },
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    },
    _count: true
  });

  // Obtener historial de uso por mes (últimos 12 meses)
  const usageHistory = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const count = await db.conversation.aggregate({
      where: {
        chatbot: {
          userId: user.id
        },
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      _count: true
    });

    usageHistory.push({
      month: monthStart.toLocaleDateString('es-MX', { month: 'short' }),
      year: monthStart.getFullYear(),
      count: count._count,
    });
  }

  // Obtener mensajes por agente/chatbot (mostrar ACTIVE, incluir DRAFT si no tienen conversaciones)
  const messagesByAgent = await db.chatbot.findMany({
    where: {
      userId: user.id,
      status: {
        not: 'DELETED'
      }
    },
    select: {
      name: true,
      status: true,
      _count: {
        select: {
          conversations: {
            where: {
              createdAt: {
                gte: startOfMonth,
                lte: endOfMonth
              }
            }
          }
        }
      }
    }
  });

  // Obtener créditos disponibles
  const credits = await getAvailableCredits(user.id);

  // Obtener límites de conversaciones según el plan
  const { PLAN_LIMITS } = await import("server/chatbot/planLimits.server");
  const plan = (user.plan || "FREE") as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan];

  const conversationsUsed = user.chatbots.reduce(
    (sum, chatbot) => sum + chatbot.monthlyUsage,
    0
  );

  const conversationsLimit = limits.maxConversationsPerMonth;
  const purchasedConversations = user.purchasedConversations || 0;

  return {
    user: {
      name: user.name,
      plan: user.plan || 'FREE',
    },
    usage: {
      formmys: user.projects.length,
      formmysLimit: user.plan === 'FREE' ? 3 : user.plan === 'STARTER' ? 10 : user.plan === 'PRO' ? 50 : 'Ilimitado',
      messages: monthlyMessages._count,
      messagesLimit: user.plan === 'FREE' ? 0 : user.plan === 'STARTER' ? 200 : user.plan === 'PRO' ? 2000 : 10000,
      chatbots: user.chatbots.length,
      chatbotsLimit: user.plan === 'FREE' ? 0 : user.plan === 'STARTER' ? 0 : user.plan === 'PRO' ? 10 : 'Ilimitado',
      totalChatMessages: monthlyMessages._count,
      chatMessagesLimit: user.plan === 'FREE' ? 0 : user.plan === 'STARTER' ? 0 : user.plan === 'PRO' ? 250 : 1000,
      conversationsUsed,
      conversationsLimit: conversationsLimit === Infinity ? 'Ilimitado' : conversationsLimit,
      conversationsPurchased: purchasedConversations,
    },
    credits,
    usageHistory,
    messagesByAgent: messagesByAgent.map(agent => ({
      name: agent.name,
      messages: agent._count.conversations
    }))
  };
}

// Colores para el gráfico de pastel
const COLORS = ['#9A99EA', '#EDC75A', '#8AD7C9', '#F87171', '#D56D80', '#7FBE60', '#E4AE8E', '#76D3CB', '#BFDD78', '#ED695F'];

// Helper para calcular el porcentaje de uso
function calculateUsagePercentage(current: number, limit: number | string): number {
  if (limit === 'Ilimitado') {
    // Si es ilimitado, mostrar 10% siempre para dar feedback visual
    return current > 0 ? 10 : 0;
  }
  const limitNum = Number(limit);
  if (limitNum === 0) return 0;
  return Math.min((current / limitNum) * 100, 100);
}

export default function DashboardUso() {
  const { usage, credits, usageHistory, messagesByAgent } = useLoaderData<typeof loader>();

  // Calcular el máximo valor para el gráfico de barras
  const maxCount = Math.max(...usageHistory.map(h => h.count), 1);

  // Para mobile, mostrar solo los últimos 6 meses
  const mobileHistory = usageHistory.slice(-6);

  // Calcular el total de mensajes por agente para el gráfico circular
  const totalAgentMessages = messagesByAgent.reduce((sum, agent) => sum + agent.messages, 0);

  // Generar segmentos del gráfico de pastel (solo chatbots con mensajes)
  const agentsWithMessages = messagesByAgent.filter(agent => agent.messages > 0);
  const pieSegments = messagesByAgent.map((agent, index) => {
    const percentage = totalAgentMessages > 0 ? (agent.messages / totalAgentMessages) * 100 : 0;
    return {
      ...agent,
      percentage,
      color: COLORS[index % COLORS.length]
    };
  });

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl md:text-3xl heading text-gray-900 mb-4 md:mb-8">Uso de tu cuenta</h1>

        {/* Tarjetas de uso */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 xl:gap-6 mb-8">
          {/* Formmys */}
          <div className="bg-white rounded-3xl border border-outlines/60 p-3 xl:p-4">
            <div className="flex items-center gap-2 mb-2">
              <HiOutlineDocumentText className="w-4 h-4 text-gray-600" />
              <span className="text-xs lg:text-sm text-gray-600">Formmys</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 md:w-8 md:h-8 lg:w-10 lg:h-10 flex-shrink-0 hidden md:block">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                    fill="none"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="#A78BFA"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${(calculateUsagePercentage(usage.formmys, usage.formmysLimit) / 100) * 87.96} 87.96`}
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <p>
                <span className="text-lg xl:text-2xl font-bold text-gray-900 mr-1">
                  {usage.formmys}
                </span>
                <span className="text-sm xl:text-base text-gray-600">
                  de {usage.formmysLimit}
                </span>
                </p>
              </div>
            </div>
          </div>

          {/* Mensajes vía Formmy */}
          <div className="bg-white rounded-3xl border border-outlines/60 p-3 xl:p-4">
            <div className="flex items-center gap-2 mb-2 md:mb-4">
              <BiMessageRounded className="w-4 h-4 text-gray-600" />
              <span className="text-xs lg:text-sm text-gray-600"><span className="hidden xl:inline">Mensajes</span> Formmy</span>
            </div>
            <div className="flex items-center gap-4">
              <p>
                <span className="text-lg xl:text-2xl font-bold text-gray-900 mr-1">
                  {usage.messages}
                </span>
                <span className="text-sm xl:text-base text-gray-600">msjs</span>
              </p>
            </div>
          </div>

          {/* Chats/agentes */}
          <div className="bg-white rounded-3xl border border-outlines/60 p-3 xl:p-4">
            <div className="flex items-center gap-2 mb-2">
              <BiGhost className="w-4 h-4 text-gray-600" />
              <span className="text-xs lg:text-sm text-gray-600">Chats/agentes</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 md:w-8 md:h-8 lg:w-10 lg:h-10 flex-shrink-0 hidden md:block">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                    fill="none"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="#A78BFA"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${(calculateUsagePercentage(usage.chatbots, usage.chatbotsLimit) / 100) * 87.96} 87.96`}
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                  <p>
                <span className="text-lg xl:text-2xl font-bold text-gray-900 mr-1">
                  {usage.chatbots}
                </span>
                <span className="text-sm xl:text-base text-gray-600">
                  de {usage.chatbotsLimit}
                </span>
                </p>
              </div>
            </div>
          </div>
          {/* Conversaciones */}
          <div className="bg-white rounded-3xl border border-outlines/60 p-3 xl:p-4">
            <div className="flex items-center gap-2 mb-2">
              <BiMessageRounded className="w-4 h-4 text-gray-600" />
              <span className="text-xs lg:text-sm text-gray-600">Conversaciones</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 md:w-8 md:h-8 lg:w-10 lg:h-10 flex-shrink-0 hidden md:block">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                    fill="none"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="#F59E0B"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${(calculateUsagePercentage(usage.conversationsUsed, usage.conversationsLimit) / 100) * 87.96} 87.96`}
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <p>
                <span className="text-lg xl:text-2xl font-bold text-gray-900 mr-1">
                  {usage.conversationsUsed.toLocaleString()}
                </span>
                <span className="text-sm xl:text-base text-gray-600">
                  de {usage.conversationsLimit === 'Ilimitado' ? '∞' : usage.conversationsLimit.toLocaleString()}
                </span>
                </p>
              </div>
            </div>
            {usage.conversationsPurchased > 0 && (
              <div className="mt-2 pt-2 border-t border-outlines/30">
                <div className="flex items-center justify-between text-[10px] md:text-xs">
                  <span className="text-gray-500">Compradas:</span>
                  <span className="font-semibold text-amber-600">{usage.conversationsPurchased.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Créditos para herramientas */}
          <div className="bg-white rounded-3xl border border-outlines/60 p-3 xl:p-4">
            <div className="flex items-center gap-2 mb-2">
              <BiCoin className="w-4 h-4 text-gray-600" />
              <span className="text-xs lg:text-sm text-gray-600">Créditos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 md:w-8 md:h-8 lg:w-10 lg:h-10 flex-shrink-0 hidden md:block">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                    fill="none"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="#14B8A6"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${(calculateUsagePercentage(credits.monthlyUsed, credits.planLimit) / 100) * 87.96} 87.96`}
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <p>
                  <span className="text-lg xl:text-2xl font-bold text-gray-900 mr-1">{credits.monthlyUsed.toLocaleString()}</span>
                  <span className="text-sm xl:text-base text-gray-600">de {credits.planLimit.toLocaleString()}</span>
                </p>
              </div>
            </div>
            {credits.purchasedCredits > 0 && (
              <div className="mt-2 pt-2 border-t border-outlines/30">
                <div className="flex items-center justify-between text-[10px] md:text-xs">
                  <span className="text-gray-500">Comprados:</span>
                  <span className="font-semibold text-teal-600">{credits.purchasedCredits.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

     
        </div>

        {/* Historial de uso */}
        <div className="bg-white rounded-3xl border border-outlines/60 p-6 mb-8">
          <div className="flex  items-start gap-3 mb-6">
            <AiOutlineCalendar className="w-5 h-5 text-dark mt-1" />
            <h2 className="text-lg font-semibold text-gray-900">Historial de conversaciones</h2>
          </div>

          {/* Gráfico para mobile - 6 meses */}
          <div className="flex gap-3 md:hidden">
            <div className="flex flex-col justify-between h-52 text-xs text-gray-500">
              <span>{maxCount > 2000 ? `${Math.round(maxCount / 1000)}K` : maxCount}</span>
              <span>0</span>
            </div>
            <div className="flex-1 h-52">
              <div className="flex items-end justify-between h-full gap-2">
                {mobileHistory.map((month, index) => {
                  const isCurrentMonth = index === mobileHistory.length - 1;
                  const heightPercentage = (month.count / maxCount) * 100 || 5;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isCurrentMonth ? 'bg-purple-400' : 'bg-yellow-400'
                        }`}
                        style={{ height: `${heightPercentage}%`, minHeight: '4px' }}
                      />
                      <span className="text-xs text-gray-600 mt-2 capitalize">
                        {month.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gráfico para desktop - 12 meses */}
          <div className="hidden md:flex gap-3">
            <div className="flex flex-col justify-between h-52 text-xs text-gray-500">
              <span>{maxCount > 2000 ? `${Math.round(maxCount / 1000)}K` : maxCount}</span>
              <span>0</span>
            </div>
            <div className="flex-1 h-52">
              <div className="flex items-end justify-between h-full gap-2">
                {usageHistory.map((month, index) => {
                  const isCurrentMonth = index === usageHistory.length - 1;
                  const heightPercentage = (month.count / maxCount) * 100 || 5;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isCurrentMonth ? 'bg-purple-400' : 'bg-yellow-400'
                        }`}
                        style={{ height: `${heightPercentage}%`, minHeight: '4px' }}
                      />
                      <span className="text-xs text-gray-600 mt-2 capitalize">
                        {month.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Mensajes por agente */}
        <div className="bg-white rounded-3xl  border border-outlines/60 p-6">
          <div className="flex items-center gap-3 mb-6">
            <AiOutlineBarChart className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Mensajes por agente</h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-12">
            <div className="relative">
              {/* Gráfico de pastel SVG */}
              <svg className="w-64 h-64" viewBox="0 0 200 200">
                {/* Círculo gris de fondo siempre visible */}
                <circle cx="100" cy="100" r="90" fill="#E5E7EB" />

                {/* Segmentos de colores solo si hay mensajes */}
                {agentsWithMessages.map((agent, index) => {
                  const percentage = (agent.messages / totalAgentMessages) * 100;
                  const agentIndex = messagesByAgent.findIndex(a => a.name === agent.name);
                  const color = COLORS[agentIndex % COLORS.length];

                  // Si el agente tiene el 100%, dibujar un círculo completo
                  if (percentage >= 99.9) {
                    return (
                      <circle
                        key={agent.name}
                        cx="100"
                        cy="100"
                        r="90"
                        fill={color}
                      />
                    );
                  }

                  let startAngle = 0;
                  for (let i = 0; i < index; i++) {
                    startAngle += ((agentsWithMessages[i].messages / totalAgentMessages) * 100 / 100) * 360;
                  }
                  const endAngle = startAngle + (percentage / 100) * 360;

                  const startRad = (startAngle - 90) * (Math.PI / 180);
                  const endRad = (endAngle - 90) * (Math.PI / 180);

                  const x1 = 100 + 90 * Math.cos(startRad);
                  const y1 = 100 + 90 * Math.sin(startRad);
                  const x2 = 100 + 90 * Math.cos(endRad);
                  const y2 = 100 + 90 * Math.sin(endRad);

                  const largeArc = percentage > 50 ? 1 : 0;

                  const pathData = [
                    `M 100 100`,
                    `L ${x1} ${y1}`,
                    `A 90 90 0 ${largeArc} 1 ${x2} ${y2}`,
                    `Z`
                  ].join(' ');

                  return (
                    <path
                      key={agent.name}
                      d={pathData}
                      fill={color}
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* Círculo central blanco */}
                <circle cx="100" cy="100" r="60" fill="white" />
                <text x="100" y="95" textAnchor="middle" className="text-2xl font-bold fill-gray-900">
                  {totalAgentMessages}
                </text>
                <text x="100" y="115" textAnchor="middle" className="text-xs fill-gray-600">
                  mensajes totales
                </text>
              </svg>
            </div>

            {/* Lista de agentes */}
            {messagesByAgent.length > 0 ? (
              <div className="space-y-3">
                {pieSegments.map((segment, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: segment.color }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{segment.name}</span>
                      <span className="text-xs text-gray-500">
                        {segment.messages} mensajes ({segment.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p className="text-sm">No hay chatbots activos</p>
                <p className="text-xs mt-1">Crea un chatbot para comenzar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}