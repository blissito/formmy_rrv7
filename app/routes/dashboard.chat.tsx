import { useSubmit, redirect } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { getUserChatbotsWithPlanInfo } from "server/chatbot/userModel.server";
import { PageContainer } from "~/components/chat/PageContainer";
import type { Route } from "./+types/chat";
import type { Chatbot, Permission } from "@prisma/client";
import toast from "react-hot-toast";
import { useState } from "react";
import { motion } from "framer-motion";
import ConfirmModal from "~/components/ConfirmModal";
import { effect } from "../utils/effect";
import { db } from "~/utils/db.server";
import { getChatbotAccessInfo } from "server/chatbot/chatbotAccess.server";
import { ChatbotCreateButton } from "~/components/chat/ChatbotCreateButton";
import { Button } from "~/components/Button";

interface InvitedChatbot extends Chatbot {
  userRole: string;
}

const findActiveChatbotPermissions = async (email: string): Promise<Permission[]> => {
  const permissions = await db.permission.findMany({
    where: { 
      email, 
      resourceType: "CHATBOT",
      OR: [{ status: "active" }, { status: "pending" }] 
    },
    include: {
      chatbot: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });
  const permissionsIdsToRemove = permissions
    .filter((p) => !p.chatbot)
    .map((p) => p.id);
  // this is necesary to not send empty permissions
  await db.permission.deleteMany({
    where: { id: { in: permissionsIdsToRemove } },
  });
  return permissions.filter((p) => !!p.chatbot);
};

/**
 * Loader function for the chat list route
 * Fetches all chatbots for the current user with plan information
 */
export const loader = async ({ request }: Route.LoaderArgs) => {
  // Get the current user or redirect to login
  const user = await getUserOrRedirect(request);
  
  // Get all chatbots for the user with plan information
  const chatbotsWithPlanInfo = await getUserChatbotsWithPlanInfo(user.id);
  
  // Get chatbot permissions for invitations
  const permissions = await findActiveChatbotPermissions(user.email);
  
  // Get access info for chatbot creation limits
  const accessInfo = await getChatbotAccessInfo(user.id);
  
  return {
    user,
    plan: chatbotsWithPlanInfo.plan,
    limits: chatbotsWithPlanInfo.limits,
    chatbots: chatbotsWithPlanInfo.chatbots,
    canCreateMore: chatbotsWithPlanInfo.limits.canCreateMore,
    invitedChatbots: permissions
      .filter((p) => p.status === "active")
      .map((p) => ({ ...p.chatbot, userRole: p.role })),
    permission: permissions.find((p) => p.status === "pending"), // Key: finds first pending invitation
    accessInfo,
  };
};

const updatePermission = async (
  status: "active" | "rejected",
  permissionId: string,
  userId: string
) => {
  return await db.permission.update({
    where: { id: permissionId },
    data: { status, userId },
  });
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await getUserOrRedirect(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "accept_invite") {
    const permissionId = formData.get("permissionId") as string;
    await updatePermission("active", permissionId, user.id);
    const permission = await db.permission.findUnique({
      where: { id: permissionId },
      include: { chatbot: true },
    });
    
    // Usar el slug del chatbot si existe, sino usar el ID
    const redirectPath = permission?.chatbot?.slug 
      ? `/dashboard/chat/${permission.chatbot.slug}` 
      : `/dashboard/chat/${permission?.chatbotId}`;
    
    throw redirect(redirectPath);
  }

  if (intent === "reject_invite") {
    const permissionId = formData.get("permissionId") as string;
    await updatePermission("rejected", permissionId, user.id);
    return { close: true };
  }

  return null;
};

/**
 * Main component for the chat list routeProps
 * This is a placeholder that will be implemented in a future task
 */
export default function DashboardChat({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();
  const {
    chatbots = [],
    plan,
    limits = { maxChatbots: 1 },
    canCreateMore,
    user,
    permission,
    invitedChatbots = [],
    accessInfo,
  } = loaderData;
  

  // Estado para controlar la visibilidad del modal de límite
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(!!permission);
  const [limitError, setLimitError] = useState<{
    error: string;
    currentCount: number;
    maxAllowed: number;
    isPro: boolean;
  } | null>(null);
  const [shouldDelete, setShouldDelete] = useState("");
  const [isLoading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await effect(
      async () => {
        const response = await fetch("/api/v1/chatbot", {
          method: "post",
          body: new URLSearchParams({
            intent: "delete_chatbot",
            chatbotId: shouldDelete,
          }),
        });
        const data = await response.json();

        if (!data.success && data.error) {
          toast.error(data.error);
        } else {
          submit({});
          setShouldDelete("");
        }
      },
      (error) => {
        console.error("Error al eliminar chatbot:", error);
        toast.error("Error al eliminar chatbot: " + error.message);
      }
    );
    setLoading(false);
  };

  const handleDeleteIntention = (id: string) => () => {
    setShouldDelete(id);
  };

  return (
    <>
      <PageContainer>
        <PageContainer.Title
          cta={
            <ChatbotCreateButton
              canCreate={accessInfo.creation.canCreate}
              showProTag={accessInfo.showProTag}
              currentCount={accessInfo.creation.currentOwnedCount}
              maxAllowed={accessInfo.creation.maxAllowed}
              proTagMessage={accessInfo.proTagMessage}
              isLoading={isLoading}
            >
              + Chatbot 
            </ChatbotCreateButton>
          }
        >
          Mis Chats IA
        </PageContainer.Title>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {chatbots.length > 0 || (invitedChatbots && invitedChatbots.length > 0) ? (
            <>
              {/* Chatbots propios */}
              {chatbots.map((chatbot: Chatbot, i: number) => (
                <PageContainer.ChatCard
                  onDelete={handleDeleteIntention(chatbot.id)}
                  key={`own-${i}`}
                  chatbot={chatbot}
                />
              ))}
              
              {/* Chatbots invitados */}
              {invitedChatbots && invitedChatbots.map((chatbot: InvitedChatbot, i: number) => (
                <PageContainer.ChatCard
                  key={`invited-${i}`}
                  chatbot={chatbot}
                  userRole={chatbot.userRole}
                  isInvited={true}
                />
              ))}
            </>
          ) : (
            <motion.div 
              className="mx-auto text-center flex flex-col justify-start md:justify-center w-full min-h-fit md:min-h-[60vh] col-span-full"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <img
                  className="flex dark:hidden w-[240px] md:w-[320px] mx-auto"
                  src="/assets/empty_ghost.svg"
                  alt="empty ghost"
                />
                <img
                  className="hidden dark:flex w-[240px] md:w-[320px] mx-auto"
                  src="/assets/empty-ghost-dark.svg"
                  alt="empty ghost"
                />
              </motion.div>
              <motion.h2 
                className="font-bold text-dark dark:text-white text-2xl mt-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                ¡Nada por aquí!
              </motion.h2>
              <motion.p 
                className="font-light text-lg mt-4 text-metal dark:text-gray-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
               Crea tu primer chatbot y empieza a atender a tus clientes 24/7.
              </motion.p>
            </motion.div>
          )}
        </section>
      </PageContainer>

      {/* Modal de eliminación */}
      {shouldDelete && (
        <ConfirmModal
          isOpen={!!shouldDelete}
          onClose={() => setShouldDelete("")}
          title="¿Estás segur@ de eliminar este chatbot?"
          message={`Si lo eliminas, toda la información y todas las conversaciones serán eliminadas de forma permanente.`}
          emojis="✋🏻⛔️🤖"
          footer={
            <div className="flex justify-center gap-4 md:gap-6 ">
              <button
                onClick={handleDelete}
                className="bg-danger text-white block  cursor-pointer rounded-full py-3 px-6"
              >
                Sí, quiero eliminarlo
              </button>
              <Button
                onClick={() => {
                  setShouldDelete("");
                }}
                variant="secondary"
                className="ml-0"
              >
                Cancelar
              </Button>
            </div>
          }
        />
      )}

      {/* Modal de límite de chatbots */}
      {limitError && (
        <ConfirmModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          title="Límite de chatbots alcanzado"
          message={`Has alcanzado el límite de ${limitError.maxAllowed} chatbots para tu plan actual. Actualiza a un plan superior para crear más chatbots.`}
          emojis="🤖🔒💼"
          footer={
            <div className="flex gap-6 mb-6">
              <button
                onClick={() => setShowLimitModal(false)}
                className="bg-gray-100 text-gray-600 mt-6 block mx-auto cursor-pointer rounded-full py-3 px-6"
              >
                Entendido
              </button>
              <button
                onClick={() => {
                  // Aquí puedes redirigir a la página de planes
                  window.location.href = "/planes";
                  setShowLimitModal(false);
                }}
                className="bg-brand-500 text-white mt-6 block mx-auto cursor-pointer rounded-full py-3 px-6"
              >
                Ver planes
              </button>
            </div>
          }
        />
      )}

      {/* Modal de invitación a chatbot */}
      {permission && (
        <ConfirmModal
          onClose={() => setShowInviteModal(false)}
          isOpen={showInviteModal}
          message={
            <div className="text-base font-normal text-center mb-6 text-gray-600 dark:text-space-400">
              <p>Te han invitado al Chatbot: <strong>{permission?.chatbot?.name}</strong></p>
              <p className="mt-2">Tu rol será: <strong className="text-brand-500">
                {permission?.role === "VIEWER" && "Viewer (Solo lectura)"}
                {permission?.role === "EDITOR" && "Editor (Lectura y escritura)"}
                {permission?.role === "ADMIN" && "Admin (Todos los permisos)"}
              </strong></p>
              <p className="mt-2 text-sm">Acepta la invitación si quieres ser parte del chatbot.</p>
            </div>
          }
          emojis="🤖✉️"
          footer={
            <div className="flex gap-4">
              <button
                onClick={() => {
                  submit(
                    { intent: "accept_invite", permissionId: permission.id },
                    { method: "post" }
                  );
                }}
                className="bg-brand-500 text-white mt-6 block mx-auto cursor-pointer rounded-full py-3 px-6 hover:bg-brand-600 transition-colors"
              >
                Aceptar invitación
              </button>
              <button
                onClick={() => {
                  submit(
                    { intent: "reject_invite", permissionId: permission.id },
                    { method: "post" }
                  );
                  setShowInviteModal(false);
                }}
                className="bg-gray-100 text-gray-600 mt-6 block mx-auto cursor-pointer rounded-full py-3 px-6 hover:bg-gray-200 transition-colors"
              >
                Rechazar
              </button>
            </div>
          }
        />
      )}
    </>
  );
}

export const meta = () => [
  { title: "Mis Chats IA" },
  { name: "description", content: "Administra tus chatbots IA" },
];
