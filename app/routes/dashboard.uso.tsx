import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { db } from "~/utils/db.server";
import { HiOutlineDocumentText } from "react-icons/hi";
import { BiMessageRounded, BiGhost, BiChat } from "react-icons/bi";
import { AiOutlineCalendar, AiOutlineBarChart } from "react-icons/ai";

export async function loader({ request }: LoaderFunctionArgs) {
  const userFromSession = await getUserOrRedirect(request);

  const user = await db.user.findUnique({
    where: { id: userFromSession.id },
    include: {
      chatbots: true,
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

  // Obtener mensajes por agente/chatbot
  const messagesByAgent = await db.chatbot.findMany({
    where: { userId: user.id },
    select: {
      name: true,
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

  return {
    user: {
      name: user.name,
      plan: user.plan || 'FREE',
    },
    usage: {
      formmys: user.projects.length,
      formmysLimit: user.plan === 'FREE' ? 3 : user.plan === 'STARTER' ? 10 : 'Ilimitado',
      messages: monthlyMessages._count,
      messagesLimit: user.plan === 'FREE' ? 0 : user.plan === 'STARTER' ? 200 : user.plan === 'PRO' ? 2000 : 'Ilimitado',
      chatbots: user.chatbots.length,
      chatbotsLimit: user.plan === 'FREE' ? 0 : user.plan === 'STARTER' ? 2 : user.plan === 'PRO' ? 10 : 'Ilimitado',
      totalChatMessages: monthlyMessages._count,
      chatMessagesLimit: user.plan === 'FREE' ? 0 : user.plan === 'STARTER' ? 100 : user.plan === 'PRO' ? 2000 : 'Ilimitado',
    },
    usageHistory,
    messagesByAgent: messagesByAgent.map(agent => ({
      name: agent.name,
      messages: agent._count.conversations
    }))
  };
}

export default function DashboardUso() {
  const { user, usage, usageHistory, messagesByAgent } = useLoaderData<typeof loader>();

  // Calcular el máximo valor para el gráfico de barras
  const maxCount = Math.max(...usageHistory.map(h => h.count), 1);

  // Calcular el total de mensajes por agente para el gráfico circular
  const totalAgentMessages = messagesByAgent.reduce((sum, agent) => sum + agent.messages, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Uso de tu cuenta</h1>

        {/* Tarjetas de uso */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Formmys */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <HiOutlineDocumentText className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">Formmys</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#A78BFA"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(usage.formmys / (usage.formmysLimit === 'Ilimitado' ? usage.formmys : Number(usage.formmysLimit))) * 352} 352`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-semibold">
                    {usage.formmys} de {usage.formmysLimit}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mensajes vía Formmy */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <BiMessageRounded className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">Mensajes vía Formmy</span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {usage.messages} msjs recibidos
              </div>
            </div>
          </div>

          {/* Chats/agentes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <BiGhost className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">Chats/agentes</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#A78BFA"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(usage.chatbots / (usage.chatbotsLimit === 'Ilimitado' ? usage.chatbots : Number(usage.chatbotsLimit))) * 352} 352`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-semibold">
                    {usage.chatbots} de {usage.chatbotsLimit}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mensajes de chat */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <BiChat className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">Mensajes de chat</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#A78BFA"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(usage.totalChatMessages / (usage.chatMessagesLimit === 'Ilimitado' ? usage.totalChatMessages : Number(usage.chatMessagesLimit))) * 352} 352`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-semibold">
                    {usage.totalChatMessages} de {usage.chatMessagesLimit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historial de uso */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <AiOutlineCalendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Historial de uso</h2>
          </div>
          <div className="h-64">
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
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>0</span>
              <span>{maxCount > 2000 ? `${Math.round(maxCount / 1000)}K` : maxCount}</span>
            </div>
          </div>
        </div>

        {/* Mensajes por agente */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <AiOutlineBarChart className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Mensajes por agente</h2>
          </div>

          {messagesByAgent.length > 0 ? (
            <div className="flex items-center justify-center">
              <div className="relative">
                {/* Gráfico circular simple */}
                <div className="relative w-64 h-64">
                  <div className="absolute inset-0 rounded-full bg-purple-400" />
                  <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {totalAgentMessages}
                      </div>
                      <div className="text-sm text-gray-600">mensajes totales</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de agentes */}
              <div className="ml-8 space-y-2">
                {messagesByAgent.map((agent, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-400" />
                    <span className="text-sm text-gray-700">{agent.name}</span>
                    <span className="text-sm text-gray-500">({agent.messages} mensajes)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay datos de mensajes disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  );
}