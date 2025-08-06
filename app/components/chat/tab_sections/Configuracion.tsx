import { ConfigMenu } from "../ConfigMenu";
import { StickyGrid } from "../PageContainer";
import { GeneralButton } from "../ConfigMenu";
import { NotificacionesButton } from "../ConfigMenu";
import { UsuariosButton } from "../ConfigMenu";
import { SeguridadButton } from "../ConfigMenu";
import { useState, useEffect } from "react";
import { useChipTabs } from "../common/ChipTabs";
import { Card } from "../common/Card";
import type { Chatbot, Permission, User } from "@prisma/client";
import { Toggle } from "~/components/Switch";
import { Input } from "../common/Input";
import { Select } from "../common/Select";
import { IoInformationCircleOutline } from "react-icons/io5";
import { Button } from "~/components/Button";
import { ChatbotUsersTable } from "~/components/chat/tab_sections/ChatbotUsersTable";
import { AddUserModal } from "~/components/chat/common/AddUserModal";

interface ConfiguracionProps {
  chatbot: Chatbot;
  user: any; // Replace 'any' with the correct User type if available
}

export const Configuracion = ({ chatbot, user }: ConfiguracionProps) => {
  const { currentTab, setCurrentTab } = useChipTabs("seguridad", `configuracion_${chatbot.id}`);
  const [isCopied, setIsCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [permissions, setPermissions] = useState<(Permission & { user?: User | null })[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  
  // Estado para notificaciones
  const [notifications, setNotifications] = useState({
    weeklyDigest: chatbot.settings?.notifications?.weeklyDigest ?? true,
    usageLimit: chatbot.settings?.notifications?.usageLimit ?? true,
    configChanges: chatbot.settings?.notifications?.configChanges ?? false,
  });
  
  // Estado para seguridad
  const [security, setSecurity] = useState({
    allowedDomains: chatbot.settings?.security?.allowedDomains?.join(", ") ?? "",
    status: chatbot.settings?.security?.status ?? "public",
    rateLimit: chatbot.settings?.security?.rateLimit ?? 100,
  });
  
  const handleNotificationChange = async (field: string, value: boolean) => {
    const newNotifications = { ...notifications, [field]: value };
    setNotifications(newNotifications);
    
    const formData = new FormData();
    formData.append("intent", "update_notifications");
    formData.append("chatbotId", chatbot.id);
    formData.append("weeklyDigest", String(newNotifications.weeklyDigest));
    formData.append("usageLimit", String(newNotifications.usageLimit));
    formData.append("configChanges", String(newNotifications.configChanges));
    
    try {
      await fetch("/api/v1/chatbot", {
        method: "POST",
        body: formData,
      });
    } catch (error) {
      console.error("Error updating notifications:", error);
    }
  };
  
  // Cargar usuarios al montar o cambiar de tab
  useEffect(() => {
    if (currentTab === "usuarios") {
      loadUsers();
    }
  }, [currentTab]);
  
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    const formData = new FormData();
    formData.append("intent", "get_chatbot_users");
    formData.append("chatbotId", chatbot.id);
    
    try {
      const response = await fetch("/api/v1/chatbot", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setPermissions(data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  const handleAddUser = async (email: string, role: string) => {
    setIsAddingUser(true);
    const formData = new FormData();
    formData.append("intent", "add_chatbot_user");
    formData.append("chatbotId", chatbot.id);
    formData.append("email", email);
    formData.append("role", role);
    
    try {
      const response = await fetch("/api/v1/chatbot", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        setShowAddUserModal(false);
        loadUsers(); // Recargar la lista
      } else {
        const error = await response.json();
        alert(error.error || "Error al agregar usuario");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Error al agregar usuario");
    } finally {
      setIsAddingUser(false);
    }
  };
  
  const handleSecurityUpdate = async () => {
    setIsUpdating(true);
    const formData = new FormData();
    formData.append("intent", "update_security");
    formData.append("chatbotId", chatbot.id);
    formData.append("allowedDomains", security.allowedDomains);
    formData.append("status", security.status);
    formData.append("rateLimit", String(security.rateLimit));
    
    try {
      await fetch("/api/v1/chatbot", {
        method: "POST",
        body: formData,
      });
    } catch (error) {
      console.error("Error updating security:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // @TODO: make historial work

  return (
    <StickyGrid>
      <ConfigMenu>
        <GeneralButton
          current={currentTab}
          onClick={() => setCurrentTab("general")}
        />
        <NotificacionesButton
          current={currentTab}
          onClick={() => setCurrentTab("notificaciones")}
        />
        <UsuariosButton
          current={currentTab}
          onClick={() => setCurrentTab("usuarios")}
        />
        <SeguridadButton
          current={currentTab}
          onClick={() => setCurrentTab("seguridad")}
        />
      </ConfigMenu>

      {currentTab === "general" && (
        <section className="grid gap-5">
          <Card title="General">
            <div className="mb-6 mt-2 md:mt-4">
              <span className="text-sm text-gray-600 block mb-2">
                Id de tu chatbot
              </span>
              <nav className="flex gap-2 items-center">
                <p className="font-mono text-sm">{chatbot.id}</p>
                <button
                  onClick={() => copyToClipboard(chatbot.id)}
                  className="w-6 h-6 p-1 rounded-lg hover:bg-gray-100 border border-gray-300 flex items-center justify-center transition-colors"
                  aria-label="Copiar ID"
                  title="Copiar al portapapeles"
                >
                  {isCopied ? (
                    <svg
                      className="w-3.5 h-3.5 text-green-500"
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
                  ) : (
                    <img
                      src="/assets/chat/copy.svg"
                      alt="Copiar"
                      className="w-3.5 h-3.5"
                    />
                  )}
                </button>
              </nav>
            </div>
            <div className="mb-6">
              <span className="text-sm text-gray-600 block mb-2">Tamaño</span>
              <p>{chatbot.contextSizeKB || 400} KB</p>
            </div>
            <div className="mb-0">
              <span className="text-sm text-gray-600 block mb-2">
                Historial del chat
              </span>
              <p>7 días</p>
            </div>
          </Card>
          <Card
            title="Eliminar chatbot"
    
          >
           <div className="flex flex-col md:flex-row gap-6">
            <p className="text-metal max-w-[700px]">Una vez que elimines tu chatbot, tu agente será eliminado al igual que toda la información que subiste. Está acción es irreversible, así que asegúrate de que está es la acción que quieres tomar.</p>
            <button
              disabled
              className="block max-w-full md:max-w-[220px] ml-auto disabled:opacity-50 disabled:cursor-not-allowed w-full bg-red-500 text-white py-2 px-4 h-10 rounded-full"
            >
              Eliminar
            </button>
           </div>        
          </Card>
        </section>
      )}

      {currentTab === "notificaciones" && (
        <section className="">
          <Card title="Configura tus notificaciones">
            <main className="grid gap-6 mt-4">
              <Toggler 
                title="Resumen semanal" 
                text="Recibe un correo con un resumen de las conversaciones del día"
                value={notifications.weeklyDigest}
                onChange={() => handleNotificationChange("weeklyDigest", !notifications.weeklyDigest)}
              />
              <Toggler 
                title="Límite de uso" 
                text="Recibe un correo cuando estes cerca del límite de uso de mensajes"
                value={notifications.usageLimit}
                onChange={() => handleNotificationChange("usageLimit", !notifications.usageLimit)}
              />
              <Toggler 
                title="Configuración" 
                text="Recibe un correo cuando haya cambios importantes en la configuración de tu chat"
                value={notifications.configChanges}
                onChange={() => handleNotificationChange("configChanges", !notifications.configChanges)}
              />
            </main>
          </Card>
        </section>
      )}

      {currentTab === "usuarios" && (
        <section className="">
          <Card 
            title="Administra usuarios" 
            text={`${permissions.length + 1} usuario${permissions.length !== 0 ? 's' : ''}`}
            action={
              <Button 
                onClick={() => setShowAddUserModal(true)}
                className="h-9"
              >
                Agregar usuario
              </Button>
            }
          >
            <ChatbotUsersTable
              isLoading={isLoadingUsers}
              permissions={permissions}
              user={user}
              chatbotId={chatbot.id}
              onUpdate={loadUsers}
            />
          </Card>
          
          {showAddUserModal && (
            <AddUserModal
              isLoading={isAddingUser}
              onClose={() => setShowAddUserModal(false)}
              onSubmit={handleAddUser}
              projectName={chatbot.name}
            />
          )}
        </section>
      )}

      {currentTab === "seguridad" && (
        <section className="">
          <Card title="Configura tu seguridad" text="Aumenta la seguridad de tu chatbot permitiendo la conexión desde dominios específicos y estableciendo un límite de mensajes por minuto.">
            <main className="flex flex-col gap-4">
              <Input
                label="Limita el acceso a tu agente"
                placeholder="www.ejemplo.app, www.ejemplo.mx"
                value={security.allowedDomains}
                onChange={(value) => setSecurity({...security, allowedDomains: value})}
              />
              <section>
                <Select
                  options={[
                    { value: "public", label: "Público" },
                    { value: "private", label: "Privado" },
                  ]}
                  label="Estado"
                  placeholder="Selecciona un estado"
                  value={security.status}
                  onChange={(value) => setSecurity({...security, status: value})}
                />
                <div className="flex gap-1 items-start text-[12px] text-gray-400 mt-px">
                  <span className="mt-[2px]">
                    <IoInformationCircleOutline />
                  </span>
                  <p>
                    Privado: Nadie puede acceder a tu agente excepto tú (desde
                    tu cuenta). Público: Otras personas pueden chatear con tu
                    agente, desde el enlace directo o desde tu sitio web.
                  </p>
                </div>
              </section>
              <section>
                <Select
                  value={String(security.rateLimit)}
                  options={[
                    { value: "100", label: "100 consultas por minuto" },
                    { value: "50", label: "50 consultas por minuto" },
                    { value: "20", label: "20 consultas por minuto" },
                  ]}
                  label="Límite de consultas por minuto"
                  placeholder="Selecciona un estado"
                  onChange={(value) => setSecurity({...security, rateLimit: parseInt(value)})}
                />
                <div className="flex gap-1 items-start text-[12px] text-gray-400 mt-px">
                <span className="mt-[2px]">
                    <IoInformationCircleOutline />
                  </span>
                  <p>
                    Al llegar al límite, le usuario verá el mensaje «Estamos
                    recibiendo demasiados mensajes, espera un momento y vuelve a
                    intentarlo.»
                  </p>
                </div>
              </section>
              <div className="flex w-full justify-end">
              <Button 
                className="w-full md:w-fit h-10 !mr-0"
                onClick={handleSecurityUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? "Actualizando..." : "Actualizar"}
              </Button>
              </div>
            </main>
          </Card>
        </section>
      )}
    </StickyGrid>
  );
};

export const Toggler = ({
  text,
  title,
  value,
  onChange,
}: {
  text: string;
  title?: string;
  value?: boolean;
  onChange?: () => void;
}) => {
  return (
    <div className="flex gap-2 items-center justify-between">
      <div className="flex flex-col">
      <h4 className="dark font-medium">{title}</h4>
      <p className="text-sm text-gray-600">{text}</p>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
};
