import { type ReactNode } from "react";
import { cn } from "~/lib/utils";
import { SearchInput } from "./SearchInput";
import type { Integration as PrismaIntegration } from "@prisma/client";
import { VscDebugDisconnect } from "react-icons/vsc";

export const Card = ({
  title,
  text,
  children,
  className,
  navClassName,
  noSearch = true,
  action,
}: {
  noSearch?: true;
  className?: string;
  navClassName?: string;
  children?: ReactNode;
  title?: string;
  text?: ReactNode;
  action?: ReactNode;
  [x: string]: unknown;
}) => {
  return (
    <article
      className={cn(
        "flex flex-col bg-[#fff] p-4 md:p-6 rounded-3xl font-light  border border-outlines shadow-standard",
        className
      )}
    >
      <nav className={cn("flex justify-between gap-3 items-center mb-4 md:mb-6", navClassName)}>
        <div>
          <h3 className="text-xl md:text-2xl font-medium min-w-max text-dark ">
            {title}
          </h3>
          {text && <p className="text-metal mb-2 text-base">{text}</p>}
        </div>
        {!noSearch && !action && <SearchInput />}
        {action && <div className="flex-shrink-0">{action}</div>}
      </nav>
      {!text && <div className="mb-0"></div>}
      <section>{children}</section>
    </article>
  );
};

export const MiniCard = ({
  isSelected,
  onSelect,
  title,
  text,
}: {
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
  title: string;
  text: string;
}) => {
  return (
    <label
      className={cn("flex gap-3 p-3 md:p-4 rounded-2xl border-outlines border", {
        "border-outlines": isSelected,
      })}
    >
      <input
        checked={isSelected}
        type="checkbox"
        className="w-4 h-4 mt-[6px] rounded-full text-brand-500 border-outlines focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        onChange={(ev) => onSelect?.(ev.target.checked)}
      />
      <div>
        <h3
          className={cn("text-base md:text-lg text-dark font-medium", {
            "text-dark": isSelected,
          })}
        >
          {title}
        </h3>
        <p
          className={cn("text-irongray text-xs", {
            "text-irongray": isSelected,
          })}
        >
          {text}
        </p>
      </div>
    </label>
  );
};

export const MiniCardGroup = ({
  selectedMinicard,
  onSelect,
  children,
}: {
  selectedMinicard: string | null;
  onSelect: (minicard: string) => void;
  children: ReactNode;
}) => {
  return (
    <article>
      <section className="grid lg:grid-cols-2 grid-cols-2 gap-4">
        {/* <MiniCard
          isSelected={selectedMinicard === "sdk"}
          title="Usar el SDK"
          text="El SDK te permite usar todas las funciones avanzadas del agente"
          onSelect={() => onSelect("sdk")}
        /> */}
        <MiniCard
          isSelected={selectedMinicard === "iframe"}
          title="Embeber iframe"
          text="Agrega el chat en cualquier lugar de tu sitio web con un simple iframe."
          onSelect={() => onSelect("iframe")}
        />
        <MiniCard
          isSelected={selectedMinicard === "link"}
          title="Obtener link"
          text="Accede a tu chatbot directamente o usa el link dentro de tu sitio web."
          onSelect={() => onSelect("link")}
        />
      </section>
      {children}
    </article>
  );
};

export type IntegrationStatus = "connected" | "disconnected" | "connecting";

export const IntegrationCard = ({
  name,
  logo,
  integration,
  description,
  lastActivity,
  onConnect,
  onDisconnect,
  onEdit,
}: {
  name: string;
  logo: string;
  integration?: PrismaIntegration;
  description: string;
  lastActivity?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onEdit?: () => void;
}) => {
  const isActive = integration?.isActive;
  const exists = !!integration;

  const getButtonText = () => {
    if (!exists) return "Conectar";
    if (isActive) return "Conectado";
    return "Desconectado";
  };

  const getButtonAction = () => {
    if (!exists) return onConnect;
    if (isActive) return onEdit;
    return onConnect;
  };

  const isConnected = exists && isActive;

  return (
    <div className="grid shadow-standard border border-outlines p-4 rounded-2xl">
      <img className="w-8 aspect-square mb-3" src={logo} alt="logo" />
      <div className="flex items-center justify-between mb-1">
        <h5 className="font-medium text-md mb-0">{name}</h5>
        {/* {exists && (
          <div className="">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-1 ${
                  isActive ? "bg-green-400" : "bg-red-400"
                }`}
              ></span>
              {isActive ? "Activo" : "Inactivo"}
            </span>
            {lastActivity && (
              <p className="text-xs text-metal mt-1">
                Última actividad: {lastActivity}
              </p>
            )}
          </div>
        )} */}
      </div>
      <p className="text-sm mb-4 text-metal">{description}</p>

      {/* Status indicator */}

      <nav className="flex gap-2">
        <SimpleButton
          className={`grow ${
            isConnected ? "text-success border-success bg-success/20 hover:bg-success/30" : "text-metal"
          }`}
          onClick={getButtonAction()}
        >
          {getButtonText()}
        </SimpleButton>

        {exists && (
          <SimpleButton
            className="shrink-0 w-[40px] px-0"
            onClick={onEdit}
            title="Configurar"
          >
            <img src="/assets/chat/notebook.svg" alt="Configurar" />
          </SimpleButton>
        )}

        {isConnected && (
          <SimpleButton
            className="shrink-0 text-danger w-[40px] px-0"
            onClick={onDisconnect}
            title="Desconectar"
          >
          <VscDebugDisconnect className="text-2xl" />
          </SimpleButton>
        )}
      </nav>
    </div>
  );
};

const SimpleButton = ({
  className,
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "max-h-10 min-h-10 ",
        "active:scale-95",
        "hover:bg-[#F6F6FA] hover:shadow-sm transition-all",
        "border-gray-300 border py-2 px-4 rounded-lg min-w-max grid place-items-center",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
};
