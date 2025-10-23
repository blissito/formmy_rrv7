import { useState, useEffect } from "react";
import { ConfigMenu, EmbebidoButton, IntegracionesButton } from "../ConfigMenu";
import { StickyGrid } from "../PageContainer";
import {
  Card,
  IntegrationCard,
  MiniCardGroup,
  type IntegrationStatus,
} from "../common/Card";
import { useChipTabs } from "../common/ChipTabs";
import { CodeBlock } from "../common/CodeBlock";
import type { Chatbot, Integration as PrismaIntegration } from "@prisma/client";
import WhatsAppIntegrationModal from "../../integrations/WhatsAppIntegrationModal";
import WhatsAppCoexistenceModal from "../../integrations/WhatsAppCoexistenceModal";
import WhatsAppCoexistenceRealModal from "../../integrations/WhatsAppCoexistenceRealModal";
import WhatsAppEmbeddedSignupModal from "../../integrations/WhatsAppEmbeddedSignupModal";
import { WhatsAppTemplateCreator } from "../../integrations/WhatsAppTemplateCreator";
import { WhatsAppTemplateList } from "../../integrations/WhatsAppTemplateList";
import GmailIntegrationModal from "../../integrations/GmailIntegrationModal";
import { useDashboardTranslation } from "~/hooks/useDashboardTranslation";
// import GoogleCalendarComposioModal from "../../integrations/GoogleCalendarComposioModal"; // Deshabilitado - Próximamente
// import StripeIntegrationModal from "../../integrations/StripeIntegrationModal"; // Deshabilitado temporalmente

// Integraciones disponibles con sus configuraciones
const getAvailableIntegrations = (t: (key: string) => string) => [
  {
    id: "DENIK",
    name: "Deník",
    logo: "/assets/chat/denik.svg",
    description: t('integrations.denik.description'),
    isPermanent: true, // Integración permanente, siempre activa
  },
  {
    id: "SAVE_CONTACT",
    name: t('integrations.saveContact.name'),
    logo: "/assets/chat/users.svg",
    description: t('integrations.saveContact.description'),
    isPermanent: true, // Integración permanente, siempre activa
  },
  {
    id: "STRIPE",
    name: "Stripe",
    logo: "/assets/chat/stripe.png",
    description: t('integrations.stripe.description'),
    isPermanent: false,
  },
  {
    id: "GOOGLE_CALENDAR",
    name: "Google Calendar",
    logo: "/assets/chat/calendar.png",
    description: t('integrations.googleCalendar.description'),
    isPermanent: false,
  },
  {
    id: "SAT",
    name: "SAT México",
    logo: "/assets/chat/sat-logo.png",
    description: "Recolección inteligente de facturas CFDI, validación con SAT, gestión de contactos fiscales y detección de lista negra EFOS/EDOS. Tus clientes suben documentos 24/7 al chatbot.",
    isPermanent: false,
  },
  {
    id: "WHATSAPP",
    name: "WhatsApp",
    logo: "/assets/chat/whatsapp.svg",
    description: t('integrations.whatsapp.description'),
    isPermanent: false,
  },
  {
    id: "GMAIL",
    name: "Gmail",
    logo: "/assets/chat/gmail.png",
    description: t('integrations.gmail.description'),
    isPermanent: false,
  },
  {
    id: "INSTAGRAM",
    name: "Instagram",
    logo: "/assets/chat/instagram.svg",
    description: t('integrations.instagram.description'),
    isPermanent: false,
  },
  {
    id: "SHOPIFY",
    name: "Shopify",
    logo: "/assets/chat/shopify.svg",
    description: t('integrations.shopify.description'),
    isPermanent: false,
  },
  {
    id: "SLACK",
    name: "Slack",
    logo: "/assets/chat/slack.svg",
    description: t('integrations.slack.description'),
    isPermanent: false,
  },
] as const;

// Extender el tipo de integración con propiedades adicionales si es necesario
type Integration = PrismaIntegration & {
  // Propiedades adicionales si son necesarias
};

// Extender el tipo Chatbot para incluir la propiedad slug
type ChatbotWithSlug = Chatbot & {
  slug: string;
  // Otras propiedades del chatbot que necesites
};

// Props del componente Codigo
interface CodigoProps {
  chatbot: ChatbotWithSlug;
  integrations: Integration[];
  user: {
    id: string;
    subscriptionPlan?: string;
    // Otras propiedades del usuario que necesites
  };
}

export const Codigo = ({ chatbot, integrations, user }: CodigoProps) => {
  const { t } = useDashboardTranslation();
  const availableIntegrations = getAvailableIntegrations(t);

  const { currentTab, setCurrentTab } = useChipTabs(
    "integrations",
    `codigo_${chatbot.id}`
  );
  const { currentTab: miniCard, setCurrentTab: setMiniCard } = useChipTabs(
    "iframe",
    `codigo_mini_${chatbot.id}`
  );
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(
    null
  );
  // Estado para el estado de conexión de las integraciones
  // Función para inicializar el estado de integraciones
  const initializeIntegrationStatus = (integrations: Integration[]) => {
    const status: Record<string, IntegrationStatus> = {};

    // Debug: Verificar qué integraciones están llegando
    console.log("🔍 Debug - Integraciones recibidas:", integrations);
    console.log(
      "🔍 Debug - Cantidad de integraciones:",
      integrations?.length || 0
    );

    // Inicializar todas las integraciones disponibles
    availableIntegrations.forEach((availableIntegration) => {
      // Denik y Gestión de contactos son integraciones permanentes, siempre conectadas
      if (availableIntegration.isPermanent) {
        status[availableIntegration.id.toLowerCase()] = "connected";
      } else if (availableIntegration.id === "GMAIL") {
        // Gmail: Iniciar como disconnected, luego actualizar con estado real de BD
        status[availableIntegration.id.toLowerCase()] = "disconnected";
      } else if (availableIntegration.id === "STRIPE") {
        // Stripe deshabilitado temporalmente (en desarrollo)
        status[availableIntegration.id.toLowerCase()] = "onhold";
      } else if (availableIntegration.id === "WHATSAPP") {
        // WhatsApp disponible - iniciar como disconnected
        status[availableIntegration.id.toLowerCase()] = "disconnected";
      } else if (availableIntegration.id === "SAT") {
        // SAT disponible - iniciar como disconnected
        status[availableIntegration.id.toLowerCase()] = "disconnected";
      } else {
        // Todas las demás integraciones están en "onhold" (próximamente)
        status[availableIntegration.id.toLowerCase()] = "onhold";
      }
    });

    // Verificar si hay integraciones existentes y actualizar su estado
    if (integrations && integrations.length > 0) {
      integrations.forEach((integration, index) => {
        console.log(`🔍 Debug - Integración ${index}:`, {
          id: integration.id,
          platform: integration.platform,
          isActive: integration.isActive,
          chatbotId: integration.chatbotId,
        });

        const platformKey = integration.platform.toLowerCase();

        // Stripe siempre debe estar en "onhold" (deshabilitado temporalmente)
        if (platformKey === "stripe") {
          status[platformKey] = "onhold";
          console.log("🔒 Stripe forzado a estado: onhold (deshabilitado temporalmente)");
          return;
        }

        // Google Calendar siempre debe estar en "onhold" (próximamente)
        if (platformKey === "google_calendar") {
          status[platformKey] = "onhold";
          console.log("🔒 Google Calendar forzado a estado: onhold (próximamente)");
          return;
        }

        // Si la integración existe pero está inactiva, mostrarla como desconectada
        // Si está activa, mostrarla como conectada
        const integrationStatus = integration.isActive
          ? "connected"
          : "disconnected";
        status[platformKey] = integrationStatus;

        console.log(
          `✅ Debug - ${integration.platform} encontrado, estado:`,
          integrationStatus,
          "(isActive:",
          integration.isActive,
          ")"
        );
      });
    } else {
      console.log("⚠️ Debug - No hay integraciones o array vacío");
    }

    console.log("🔍 Debug - Estado final de integraciones:", status);
    return status;
  };

  const [integrationStatus, setIntegrationStatus] = useState<
    Record<string, IntegrationStatus>
  >(() => initializeIntegrationStatus(integrations));

  // Sincronizar estado cuando cambien las props de integrations
  // pero preservar estados "connected" del estado local
  useEffect(() => {
    console.log(
      "🔄 Debug - Props de integrations cambiaron, sincronizando estado inteligentemente"
    );

    setIntegrationStatus((prevStatus) => {
      const newStatus = initializeIntegrationStatus(integrations);

      // Preservar cualquier estado "connected" del estado local si no hay contradición en BD
      const mergedStatus = { ...newStatus };
      Object.keys(prevStatus).forEach((key) => {
        if (prevStatus[key] === "connected") {
          const integration = integrations.find(
            (i) => i.platform.toLowerCase() === key
          );

          // Preservar estado conectado si:
          // 1. No hay integración en BD (estado local temporal)
          // 2. La integración en BD está activa
          if (!integration || integration.isActive) {
            mergedStatus[key] = "connected";
            console.log(`🔄 Debug - Preservando estado conectado para ${key}`);
          } else {
            console.log(
              `🔄 Debug - Integración ${key} existe pero está inactiva, respetando BD`
            );
          }
        }
      });

      console.log("🔄 Debug - Estado anterior:", prevStatus);
      console.log("🔄 Debug - Estado de BD:", newStatus);
      console.log("🔄 Debug - Estado merged:", mergedStatus);

      return mergedStatus;
    });
  }, [integrations]);
  // Estados para controlar los modales de integración
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppCoexistenceModalOpen, setWhatsAppCoexistenceModalOpen] =
    useState(false);
  const [
    whatsAppCoexistenceRealModalOpen,
    setWhatsAppCoexistenceRealModalOpen,
  ] = useState(false);
  const [whatsAppEmbeddedSignupModalOpen, setWhatsAppEmbeddedSignupModalOpen] =
    useState(false);
  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  // const [googleCalendarModalOpen, setGoogleCalendarModalOpen] = useState(false); // Deshabilitado - Próximamente
  // const [stripeModalOpen, setStripeModalOpen] = useState(false); // Deshabilitado temporalmente

  // Solo Embedded Signup - sin manual
  const useEmbeddedSignup = true;

  console.log("🔍 Debug - Embedded Signup only:", { useEmbeddedSignup });

  const handleConnect = (integrationId: string) => {
    console.log("🔍 Debug - Conectando integración:", integrationId);

    // No hacer nada para integraciones permanentes o en onhold
    const integration = availableIntegrations.find(
      (i) => i.id === integrationId
    );
    if (integration?.isPermanent) {
      console.log(
        "🔍 Debug - Integración permanente, no requiere conexión:",
        integrationId
      );
      return;
    }

    // No permitir conexión de integraciones en "onhold"
    if (integrationStatus[integrationId.toLowerCase()] === "onhold") {
      console.log(
        "🔍 Debug - Integración en onhold, próximamente disponible:",
        integrationId
      );
      return;
    }

    setIntegrationStatus((prev) => ({
      ...prev,
      [integrationId.toLowerCase()]: "connecting",
    }));

    setSelectedIntegration(integrationId);

    // Abrir el modal correspondiente
    if (integrationId === "WHATSAPP") {
      // Usar Embedded Signup ahora que la empresa está activada
      setWhatsAppEmbeddedSignupModalOpen(true);
    } else if (integrationId === "GMAIL") {
      setGmailModalOpen(true);
    } else if (integrationId === "GOOGLE_CALENDAR") {
      console.log("🔒 Google Calendar está en onhold, no se puede conectar");
      return; // Integración deshabilitada temporalmente
    } else if (integrationId === "STRIPE") {
      console.log("🔒 Stripe está en onhold temporalmente");
      return; // Deshabilitado temporalmente
    } else if (integrationId === "SAT") {
      // SAT: Crear integración en BD como activa y redirigir al dashboard
      setIntegrationStatus((prev) => ({
        ...prev,
        sat: "connecting",
      }));

      // Crear/actualizar integración en BD directamente como activa (upsert)
      fetch("/api/v1/integration", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          intent: "upsert",
          chatbotId: chatbot.id,
          platform: "SAT",
          token: "sat_enabled", // Token dummy, SAT no usa OAuth
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Error al crear integración SAT");
          }
          return res.json();
        })
        .then(async (data) => {
          // Activar la integración
          const integrationId = data.integration.id;
          const activateRes = await fetch("/api/v1/integration", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              intent: "update",
              integrationId,
              isActive: "true",
            }),
          });

          if (!activateRes.ok) {
            throw new Error("Error al activar integración SAT");
          }

          setIntegrationStatus((prev) => ({
            ...prev,
            sat: "connected",
          }));
          setSelectedIntegration(null);
          // Redirigir al dashboard SAT
          window.location.href = `/dashboard/sat?chatbotId=${chatbot.id}`;
        })
        .catch((err) => {
          console.error("Error activando SAT:", err);
          alert(`Error al activar SAT: ${err.message}`);
          setIntegrationStatus((prev) => ({
            ...prev,
            sat: "disconnected",
          }));
        });
    } else {
      // Para otras integraciones, simular conexión
      setTimeout(() => {
        setIntegrationStatus((prev) => ({
          ...prev,
          [integrationId.toLowerCase()]: "connected",
        }));
      }, 1000);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    console.log("🔍 Debug - Desconectando integración:", integrationId);

    // Actualizar estado local inmediatamente para UI responsiva
    setIntegrationStatus((prev) => ({
      ...prev,
      [integrationId.toLowerCase()]: "disconnected",
    }));

    try {
      // Buscar la integración real para obtener su ID
      const existingIntegration = integrations.find(
        (i) => i.platform === integrationId
      );

      if (existingIntegration) {
        // Hacer llamada al API para desactivar la integración
        const response = await fetch("/api/v1/chatbot", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            intent: "toggle_integration_status",
            integrationId: existingIntegration.id,
            isActive: "false",
          }),
        });

        if (!response.ok) {
          throw new Error(`Error al desconectar: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Debug - Integración desconectada exitosamente:", data);
      } else {
        console.log("⚠️ Debug - No se encontró integración para desconectar");
      }
    } catch (error) {
      console.error("❌ Error al desconectar integración:", error);

      // Revertir estado local en caso de error
      setIntegrationStatus((prev) => ({
        ...prev,
        [integrationId.toLowerCase()]: "connected",
      }));

      // Mostrar error al usuario
      alert(t('integrations.disconnectError'));
    }
  };

  const handleEdit = (integrationId: string) => {
    console.log("🔍 Debug - Editando integración:", integrationId);
    setSelectedIntegration(integrationId);

    if (integrationId === "WHATSAPP") {
      // Usar Embedded Signup también para editar
      setWhatsAppEmbeddedSignupModalOpen(true);
    } else if (integrationId === "GMAIL") {
      setGmailModalOpen(true);
    } else if (integrationId === "GOOGLE_CALENDAR") {
      console.log("🔒 Google Calendar está en onhold, no se puede editar");
      return; // Integración deshabilitada temporalmente
    } else if (integrationId === "STRIPE") {
      console.log("🔒 Stripe está en onhold temporalmente");
      return; // Deshabilitado temporalmente
    } else if (integrationId === "SAT") {
      // SAT: Redirigir al dashboard
      window.location.href = `/dashboard/sat?chatbotId=${chatbot.id}`;
    }
  };

  // Manejador de éxito para la integración de WhatsApp
  const handleWhatsAppSuccess = (integration: any) => {
    console.log("🔍 Debug - WhatsApp integración exitosa:", integration);

    if (selectedIntegration) {
      // Actualizar el estado local
      setIntegrationStatus((prev) => ({
        ...prev,
        [selectedIntegration.toLowerCase()]: "connected" as const,
      }));

      setWhatsAppModalOpen(false);
      setWhatsAppCoexistenceModalOpen(false);
      setWhatsAppCoexistenceRealModalOpen(false);
      setWhatsAppEmbeddedSignupModalOpen(false);
      setSelectedIntegration(null);

      // Mostrar notificación de éxito
      // Aquí podrías usar tu sistema de notificaciones
      const isEmbeddedSignup = integration.embeddedSignup;
      const isCoexistence = integration.coexistenceMode;

      let message = t('integrations.whatsappSuccessDefault');
      if (isEmbeddedSignup) {
        message = t('integrations.whatsappSuccessEmbedded');
      } else if (isCoexistence) {
        message = t('integrations.whatsappSuccessCoexistence');
      }
      alert(message);

      // Nota: En una aplicación real, podrías querer actualizar el estado
      // de las integraciones sin recargar la página, pero para este ejemplo
      // lo hacemos simple con una recarga
      window.location.reload();
    }
  };

  // const handleGoogleCalendarSuccess = (integration: any) => {
  //   console.log("🔍 Debug - Google Calendar integración exitosa:", integration);

  //   if (selectedIntegration) {
  //     // Actualizar el estado local
  //     setIntegrationStatus((prev) => ({
  //       ...prev,
  //       [selectedIntegration.toLowerCase()]: "connected" as const,
  //     }));

  //     // setGoogleCalendarModalOpen(false);
  //     setSelectedIntegration(null);

  //     // Mostrar notificación de éxito
  //     // Aquí podrías usar tu sistema de notificaciones
  //     alert("¡Integración de Google Calendar configurada correctamente!");

  //     // Nota: En una aplicación real, podrías querer actualizar el estado
  //     // de las integraciones sin recargar la página, pero para este ejemplo
  //     // lo hacemos simple con una recarga
  //     window.location.reload();
  //   }
  // };

  // Manejador de éxito para la integración de Gmail
  const handleGmailSuccess = (data: any) => {
    console.log("🔍 Debug - Gmail integración exitosa:", data);

    // Actualizar el estado local para mostrar como conectado
    setIntegrationStatus((prev) => ({
      ...prev,
      gmail: "connected" as const,
    }));

    setGmailModalOpen(false);
    setSelectedIntegration(null);

    // Recargar para reflejar la integración activa
    window.location.reload();
  };

  // Manejador de éxito para la integración de Stripe (deshabilitado)

  const handleStripeSuccess = (integration: any) => {
    console.log("🔍 Debug - Stripe integración exitosa:", integration);
    console.log("🔍 Debug - Estado anterior:", integrationStatus);

    // Actualizar el estado local para mostrar como conectado
    setIntegrationStatus((prev) => {
      const newStatus = {
        ...prev,
        stripe: "connected" as const,
      };
      console.log("🔍 Debug - Nuevo estado:", newStatus);
      return newStatus;
    });

    // setStripeModalOpen(false); // Comentado porque el modal está deshabilitado
    setSelectedIntegration(null);

    console.log("✅ Debug - Stripe conectado sin recargar página");
  };

  // Función para manejar OAuth2 de Google Calendar - Deshabilitada (integración en onhold)
  /* const handleGoogleCalendarOAuth = async () => {
    try {
      // Primero crear la integración (el servidor usará las credenciales del entorno)
      const response = await fetch("/api/v1/integration", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          intent: "create",
          chatbotId: chatbot.id,
          platform: "GOOGLE_CALENDAR",
          token: "", // Token will be set later via OAuth callback
          calendarId: "primary",
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error Response:", errorData);
        throw new Error(
          `Error al crear la integración: ${response.status} - ${errorData}`
        );
      }

      const data = await response.json();
      const integrationId = data.integration.id;
      const integration = data.integration;

      // Crear URL de OAuth con state conteniendo datos de integración
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.append("client_id", integration.clientId);
      authUrl.searchParams.append("redirect_uri", integration.redirectUri);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append(
        "scope",
        "https://www.googleapis.com/auth/calendar"
      );
      authUrl.searchParams.append("access_type", "offline");
      authUrl.searchParams.append("prompt", "consent");

      // Incluir datos de integración en state
      const state = encodeURIComponent(
        JSON.stringify({
          integrationId,
          clientId: integration.clientId,
          clientSecret: integration.clientSecret,
          redirectUri: integration.redirectUri,
        })
      );
      authUrl.searchParams.append("state", state);

      // Abrir popup de OAuth
      const popup = window.open(
        authUrl.toString(),
        "google-oauth",
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );

      if (!popup) {
        throw new Error(
          "No se pudo abrir la ventana de autorización. Verifica que no esté bloqueada por el navegador."
        );
      }

      // Escuchar mensajes del popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === "oauth_success") {
          // Actualizar estado de integración
          setIntegrationStatus((prev) => ({
            ...prev,
            google_calendar: "connected",
          }));

          // Limpiar listener
          window.removeEventListener("message", handleMessage);

          // Mostrar notificación de éxito
          alert("¡Integración de Google Calendar configurada correctamente!");

          // Recargar para actualizar la lista de integraciones
          window.location.reload();
        } else if (event.data.type === "oauth_error") {
          // Actualizar estado de integración a error
          setIntegrationStatus((prev) => ({
            ...prev,
            google_calendar: "disconnected",
          }));

          // Limpiar listener
          window.removeEventListener("message", handleMessage);

          // Mostrar error
          alert(
            `Error en la autorización: ${event.data.description || "Error desconocido"}`
          );
        }
      };

      window.addEventListener("message", handleMessage);
    } catch (error) {
      console.error("Error en OAuth2 de Google Calendar:", error);

      // Actualizar estado de integración a error
      setIntegrationStatus((prev) => ({
        ...prev,
        google_calendar: "disconnected",
      }));

      // Mostrar error al usuario
      alert(
        error instanceof Error
          ? error.message
          : "Error desconocido en la autorización"
      );
    }
  }; */

  return (
    <StickyGrid>
      <section>
        <ConfigMenu>
          <EmbebidoButton
            current={currentTab}
            onClick={() => setCurrentTab("embed")}
          />
          <IntegracionesButton
            current={currentTab}
            onClick={() => setCurrentTab("integrations")}
          />
        </ConfigMenu>
      </section>
      {currentTab === "embed" && (
        <section className="w-full">
          <Card
            title={t('integrations.embedTitle')}
            text={
              <div>
                <p className="text-metal font-normal">
                  {t('integrations.embedDescription')}{" "}
                  <a href="/blog/como-embeber-chatbot-formmy-sitio-web" className="underline" target="_blank">
                    {t('integrations.embedMoreInfo')}
                  </a>
                </p>
              </div>
            }
          >
            <section>
              <MiniCardGroup selectedMinicard={miniCard} onSelect={setMiniCard}>
                {miniCard === "iframe" && <Iframe chatbot={chatbot} />}
                {miniCard === "link" && <LinkBlock chatbot={chatbot} />}
              </MiniCardGroup>
            </section>
          </Card>
        </section>
      )}
      {currentTab === "integrations" && (
        <article className="grid lg:grid-cols-3 grid-cols-1 md:grid-cols-2 gap-4 py-3">
          {availableIntegrations.map((availableIntegration) => {
            const existingIntegration = integrations.find(
              (i) => i.platform === availableIntegration.id
            );

            const currentStatus = integrationStatus[availableIntegration.id.toLowerCase()];
            const isOnHold = currentStatus === "onhold";

            return (
              <IntegrationCard
                integration={existingIntegration}
                key={availableIntegration.id}
                name={availableIntegration.name}
                logo={availableIntegration.logo}
                description={availableIntegration.description}
                status={currentStatus}
                lastActivity={
                  currentStatus === "connected"
                    ? t('integrations.alwaysActive')
                    : undefined
                }
                onConnect={isOnHold ? undefined : () => handleConnect(availableIntegration.id)}
                onDisconnect={
                  availableIntegration.isPermanent || isOnHold
                    ? undefined // No se puede desconectar integraciones permanentes o en onhold
                    : () => handleDisconnect(availableIntegration.id)
                }
                onEdit={
                  availableIntegration.isPermanent || isOnHold
                    ? undefined // No se puede editar integraciones permanentes o en onhold
                    : () => handleEdit(availableIntegration.id)
                }
                isPermanent={availableIntegration.isPermanent}
              />
            );
          })}

          {selectedIntegration === "WHATSAPP" && (
            <>
              <WhatsAppIntegrationModal
                isOpen={whatsAppModalOpen}
                onClose={() => setWhatsAppModalOpen(false)}
                chatbotId={chatbot.id}
                onSuccess={handleWhatsAppSuccess}
                existingIntegration={(() => {
                  const whatsappIntegration = integrations.find(
                    (integration) => integration.platform === "WHATSAPP"
                  );
                  if (!whatsappIntegration) return null;

                  return {
                    id: whatsappIntegration.id,
                    phoneNumberId: whatsappIntegration.phoneNumberId || "",
                    businessAccountId:
                      whatsappIntegration.businessAccountId || "",
                    webhookVerifyToken:
                      whatsappIntegration.webhookVerifyToken || undefined,
                  };
                })()}
              />
              <WhatsAppCoexistenceModal
                isOpen={whatsAppCoexistenceModalOpen}
                onClose={() => setWhatsAppCoexistenceModalOpen(false)}
                chatbotId={chatbot.id}
                onSuccess={handleWhatsAppSuccess}
                existingIntegration={(() => {
                  const whatsappIntegration = integrations.find(
                    (integration) => integration.platform === "WHATSAPP"
                  );
                  if (!whatsappIntegration) return null;

                  return {
                    id: whatsappIntegration.id,
                    phoneNumberId: whatsappIntegration.phoneNumberId || "",
                    businessAccountId:
                      whatsappIntegration.businessAccountId || "",
                    webhookVerifyToken:
                      whatsappIntegration.webhookVerifyToken || undefined,
                  };
                })()}
              />
              <WhatsAppCoexistenceRealModal
                isOpen={whatsAppCoexistenceRealModalOpen}
                onClose={() => setWhatsAppCoexistenceRealModalOpen(false)}
                chatbotId={chatbot.id}
                onSuccess={handleWhatsAppSuccess}
                existingIntegration={(() => {
                  const whatsappIntegration = integrations.find(
                    (integration) => integration.platform === "WHATSAPP"
                  );
                  if (!whatsappIntegration) return null;

                  return {
                    id: whatsappIntegration.id,
                    phoneNumberId: whatsappIntegration.phoneNumberId || "",
                    businessAccountId:
                      whatsappIntegration.businessAccountId || "",
                    webhookVerifyToken:
                      whatsappIntegration.webhookVerifyToken || undefined,
                  };
                })()}
              />
              <WhatsAppEmbeddedSignupModal
                isOpen={whatsAppEmbeddedSignupModalOpen}
                onClose={() => setWhatsAppEmbeddedSignupModalOpen(false)}
                chatbotId={chatbot.id}
                onSuccess={handleWhatsAppSuccess}
                existingIntegration={(() => {
                  const whatsappIntegration = integrations.find(
                    (integration) => integration.platform === "WHATSAPP"
                  );
                  if (!whatsappIntegration) return null;

                  return {
                    id: whatsappIntegration.id,
                    phoneNumberId: whatsappIntegration.phoneNumberId || "",
                    businessAccountId:
                      whatsappIntegration.businessAccountId || "",
                    webhookVerifyToken:
                      whatsappIntegration.webhookVerifyToken || undefined,
                  };
                })()}
              />

              {/* WhatsApp Template Management - Solo mostrar si hay integración activa */}
              {(() => {
                const whatsappIntegration = integrations.find(
                  (integration) => integration.platform === "WHATSAPP" && integration.isActive
                );

                if (!whatsappIntegration) return null;

                return (
                  <div className="mt-8 space-y-6">
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        {t('integrations.whatsappTemplatesTitle')}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        {t('integrations.whatsappTemplatesDescription')}
                      </p>
                    </div>

                    <WhatsAppTemplateCreator
                      chatbotId={chatbot.id}
                      onSuccess={(template) => {
                        console.log('Template created:', template);
                        // Optionally trigger a refresh or show a toast
                      }}
                    />

                    <WhatsAppTemplateList chatbotId={chatbot.id} />
                  </div>
                );
              })()}
            </>
          )}

          {/* Stripe está temporalmente deshabilitado */}
          {/* {selectedIntegration === "STRIPE" && (
            <StripeIntegrationModal
              isOpen={stripeModalOpen}
              onClose={() => setStripeModalOpen(false)}
              onSuccess={handleStripeSuccess}
              chatbotId={chatbot.id}
              existingIntegration={(() => {
                const stripeIntegration = integrations.find(
                  (integration) => integration.platform === "STRIPE"
                );
                if (!stripeIntegration) return null;

                return {
                  id: stripeIntegration.id,
                  stripeApiKey: stripeIntegration.stripeApiKey || "",
                  stripePublishableKey:
                    stripeIntegration.stripePublishableKey || "",
                  stripeWebhookSecret:
                    stripeIntegration.stripeWebhookSecret || "",
                  isActive: stripeIntegration.isActive,
                };
              })()}
            />
          )} */}

          {selectedIntegration === "GMAIL" && (
            <GmailIntegrationModal
              isOpen={gmailModalOpen}
              onClose={() => setGmailModalOpen(false)}
              onSuccess={handleGmailSuccess}
              chatbot={chatbot}
            />
          )}

          {/* Google Calendar está en "onhold" (próximamente) - Modal deshabilitado */}
          {/* {selectedIntegration === "GOOGLE_CALENDAR" && (
            <GoogleCalendarComposioModal
              isOpen={googleCalendarModalOpen}
              chatbotId={chatbot.id}
              onClose={() => {
                setGoogleCalendarModalOpen(false);
                setSelectedIntegration(null);
              }}
              onSuccess={() => {
                console.log("✅ Google Calendar conectado exitosamente");
                setIntegrationStatus((prev) => ({
                  ...prev,
                  google_calendar: "connected" as const,
                }));
                setGoogleCalendarModalOpen(false);
                setSelectedIntegration(null);
              }}
            />
          )} */}
        </article>
      )}
    </StickyGrid>
  );
};

interface LinkBlockProps {
  chatbot: {
    slug: string;
  };
}

const LinkBlock = ({ chatbot }: LinkBlockProps) => {
  const { t } = useDashboardTranslation();
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://formmy-v2.fly.dev";
  const chatUrl = `${baseUrl}/chat/embed?slug=${chatbot.slug}`;

  const codeToCopy = `
<a href="${chatUrl}" target="_blank" rel="noopener noreferrer">
  ${t('integrations.embedLinkText')}
</a>
`;

  const instructions = [
    { step: "1", description: t('integrations.embedLinkStep1') },
    { step: "2", description: t('integrations.embedLinkStep2') },
    { step: "3", description: t('integrations.embedLinkStep3') },
  ];

  return (
    <CodeBlock
      title={t('integrations.setupInstructions')}
      language="html"
      code={codeToCopy}
      instructions={instructions}
    />
  );
};

const Iframe = ({ chatbot }: { chatbot: { slug: string } }) => {
  const { t } = useDashboardTranslation();
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://formmy-v2.fly.dev";

  const codeToCopy = `
<script type="module">
  import Chatbot from "${baseUrl}/widget.js"
  Chatbot.init({
    chatbotSlug: "${chatbot.slug}",
    apiHost: "${baseUrl}"
  })
</script>
`;

  const instructions = [
    { step: "1", description: t('integrations.embedWidgetStep1') },
    { step: "2", description: t('integrations.embedWidgetStep2') },
    { step: "3", description: t('integrations.embedWidgetStep3') },
    { step: "4", description: t('integrations.embedWidgetStep4') },
    { step: "5", description: t('integrations.embedWidgetStep5') },
    { step: "6", description: t('integrations.embedWidgetStep6') },
  ];

  return (
    <CodeBlock
      title={t('integrations.setupInstructions')}
      language="html"
      code={codeToCopy}
      instructions={instructions}
    />
  );
};
