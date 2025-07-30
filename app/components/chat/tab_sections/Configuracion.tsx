import { ConfigMenu } from "../ConfigMenu";
import { StickyGrid } from "../PageContainer";
import { GeneralButton } from "../ConfigMenu";
import { NotificacionesButton } from "../ConfigMenu";
import { UsuariosButton } from "../ConfigMenu";
import { SeguridadButton } from "../ConfigMenu";
import { useState } from "react";
import { useChipTabs } from "../common/ChipTabs";
import { Card } from "../common/Card";
import type { Chatbot } from "@prisma/client";
import { Toggle } from "~/components/Switch";
import { UsersTable } from "./UsersTable";
import { Input } from "../common/Input";
import { Select } from "../common/Select";
import { IoInformationCircleOutline } from "react-icons/io5";
import { Button } from "~/components/Button";

export const Configuracion = ({ chatbot }: { chatbot: Chatbot }) => {
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
            <div className="mb-6 mt-4">
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
        <section className="">
          <Card title="Configura tus notificaciones">
            <main className="grid gap-6 mt-4">
              <Toggler title="Resumen semanal" text="Recibe un correo con un resumen de las conversaciones del día" />
              <Toggler title="Límite de uso" text="Recibe un correo cuando estes cerca del límite de uso de mensajes" />
              <Toggler title="Configuración" text="Recibe un correo cuando haya cambios importantes en la configuración de tu chat" />
            </main>
          </Card>
        </section>
      )}

      {currentTab === "usuarios" && (
        <section className="">
          <Card title="Administra usuarios" text="3 usuarios">
            <UsersTable />
          </Card>
        </section>
      )}

      {currentTab === "seguridad" && (
        <section className="">
          <Card title="Configura tu seguridad" text="Aumenta la seguridad de tu chatbot permitiendo la conexión desde dominios específicos y estableciendo un límite de mensajes por minuto.">
            <main className="flex flex-col gap-4">
              <Input
                label="Limita el acceso a tu agente"
                placeholder="www.ejemplo.app, www.ejemplo.mx"
              />
              <section>
                <Select
                  options={[
                    { value: "published", label: "Público" },
                    { value: "draft", label: "Borrador" },
                  ]}
                  label="Estado"
                  placeholder="Selecciona un estado"
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
                  defaultValue="100"
                  options={[
                    { value: "100", label: "100 consultas por minuto" },
                    { value: "50", label: "50 consultas por minuto" },
                    { value: "20", label: "20 consultas por minuto" },
                  ]}
                  label="Límite de consultas por minuto"
                  placeholder="Selecciona un estado"
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
              <Button className="!mr-0">Actualizar</Button>
              </div>
            </main>
          </Card>
        </section>
      )}
    </StickyGrid>
  );
};

const Toggler = ({
  text,
  title,
  onChange,
}: {
  text: string;
  title?: string;
  onChange?: () => void;
}) => {
  return (
    <div className="flex gap-2 items-center justify-between">
      <div className="flex flex-col">
      <h4 className="dark font-medium">{title}</h4>
      <p className="text-sm text-gray-600">{text}</p>
      </div>
      <Toggle onChange={onChange} />
    </div>
  );
};
