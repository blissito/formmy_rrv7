import { data as json } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { ProTag } from "~/components/ProTag";
import Spinner from "~/components/Spinner";
import { Toggle } from "~/components/Switch";
import { db } from "~/utils/db.server";
import { getUserOrNull } from "server/getUserUtils.server";
import { type Notifications, notificationsSchema } from "~/utils/zod";
import type { Route } from "./+types/dash_.$projectId_.settings.notifications";
import { PageContainer, StickyGrid } from "~/components/chat/PageContainer";
import { ConfigMenu, GeneralButton, NotificacionesButton, UsuariosButton } from "~/components/chat/ConfigMenu";
import { Card } from "~/components/chat/common/Card";
import { Toggler } from "~/components/chat/tab_sections/Configuracion";
import { UsersTable } from "~/components/chat/tab_sections/UsersTable";
import { useChipTabs } from "~/components/chat/common/ChipTabs";
import { useState } from "react";
import { NotificationsConfig } from "~/components/formmys/NotificationsConfig";

export const action = async ({ request, params }: Route.ActionArgs) => {
  const formData = await request.formData();
  const notifications = Object.fromEntries(formData);
  const validData = notificationsSchema.parse(notifications) as Notifications;
 

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  await db.project.update({
    where: { id: params.projectId },
    data: { settings: { notifications: validData } },
  });

  return null;
};

// @TODO we need to know if user is prom in this route
export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const user = await getUserOrNull(request); // why? well, not sure... just don't want to redirect.
  const project = await db.project.findUnique({
    where: { id: params.projectId },
  });
  if (!project) throw json(null, { status: 404 });
  const isPro = user?.plan === "PRO" ? true : false;
  return {
    isPro,
    notifications: project.settings?.notifications,
  };
};

export default function Route() {
  const {
    notifications = { new: false, members: false, warning: false }, // true defaults ;)
    isPro,
  } = useLoaderData<typeof loader>();
  // let settings = {};
  const fetcher = useFetcher();

  const updateSettingsWarning = (bool: boolean) =>
    fetcher.submit({ ...notifications, warning: bool }, { method: "post" });

  const updateSettingsMembers = (bool: boolean) =>
    fetcher.submit({ ...notifications, members: bool }, { method: "post" });

  const updateSettingsNew = (bool: boolean) => {
    if (!isPro) {
      fetcher.submit(
        { new: bool, members: false, warning: false },
        { method: "post" }
      );
      return;
    }
    fetcher.submit({ ...notifications, new: bool }, { method: "post" });
  };

  const { currentTab, setCurrentTab } = useChipTabs("seguridad");
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };
  return (
    <PageContainer>
      <PageContainer.Title
        className="mb-8 flex w-full justify-between" 
        back={`/dashboard/formmys/`}
      >
       Configuración
      </PageContainer.Title>
       <StickyGrid >
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
            
            </ConfigMenu>
      
            {currentTab === "general" && (
              <section className="grid gap-5">
                <Card title="General">
                  <div className="mb-6 mt-4">
                    <span className="text-sm text-gray-600 block mb-2">
                      Id de tu Formmy
                    </span>
                    <nav className="flex gap-2 items-center">
                {/* <p className="font-mono text-sm">{project.id}</p> */}
                {/* <button
                  onClick={() => copyToClipboard(project.id)}
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
                </button> */}
              </nav>
                  </div>
                  <div className="mb-6">
                    <span className="text-sm text-gray-600 block mb-2">Tamaño</span>
                  
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
                 <div className="flex gap-6">
                  <p className="text-metal max-w-[700px]">Una vez que elimines tu chatbot, tu agente será eliminado al igual que toda la información que subiste. Está acción es irreversible, así que asegúrate de que está es la acción que quieres tomar.</p>
                  <button
                    disabled
                    className="block max-w-[220px] ml-auto disabled:opacity-50 disabled:cursor-not-allowed w-full bg-red-500 text-white py-2 px-4 rounded-full"
                  >
                    Eliminar
                  </button>
                 </div>        
                </Card>
              </section>
            )}
      
            {currentTab === "notificaciones" && (
              <NotificationsConfig
                notifications={notifications}
                isPro={isPro}
                onUpdateNew={updateSettingsNew}
                onUpdateMembers={updateSettingsMembers}
                onUpdateWarning={updateSettingsWarning}
              />
            )}
      
            {currentTab === "usuarios" && (
              <section className="">
                <Card title="Administra usuarios" text="3 usuarios">
                  <UsersTable />
                </Card>
              </section>
            )}
      
       
          </StickyGrid>
   
    </PageContainer>
  );
}

