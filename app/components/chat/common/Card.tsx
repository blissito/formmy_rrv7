import { type ReactNode } from "react";
import { cn } from "~/lib/utils";
import { SearchInput } from "./SearchInput";
import type { Integration as PrismaIntegration } from "@prisma/client";

export const Card = ({
  title,
  text,
  children,
  className,
  noSearch = true,
}: {
  noSearch?: true;
  className?: string;
  children?: ReactNode;
  title?: string;
  text?: ReactNode;
  [x: string]: unknown;
}) => {
  return (
    <article
      className={cn(
        "flex flex-col bg-[#fff] p-6 rounded-3xl font-light  border border-outlines shadow-standard",
        className
      )}
    >
      <nav className="flex justify-between gap-3 items-baseline">
        <h3 className="text-2xl font-medium min-w-max text-dark mb-2">
          {title}
        </h3>
        {!noSearch && <SearchInput />}
      </nav>
      {text && <p className="text-metal mb-6 text-base ">{text}</p>}
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
      className={cn("flex gap-3 p-4 rounded-2xl border-outlines border", {
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
          className={cn("text-lg text-dark font-medium", {
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
      <section className="grid lg:grid-cols-3 grid-cols-2 gap-4">
        <MiniCard
          isSelected={selectedMinicard === "sdk"}
          title="Usar el SDK"
          text="El SDK te permite usar todas las funciones avanzadas del agente"
          onSelect={() => onSelect("sdk")}
        />
        <MiniCard
          isSelected={selectedMinicard === "iframe"}
          title="Embeber el iframe"
          text="Agrega el chat en cualquier lugar de tu sitio web con un simple iframe."
          onSelect={() => onSelect("iframe")}
        />
        <MiniCard
          isSelected={selectedMinicard === "link"}
          title="Obtener el Link"
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
      <h5 className="font-medium text-md mb-1">{name}</h5>
      <p className="text-sm mb-4 text-metal">{description}</p>

      {/* Status indicator */}
      {exists && (
        <div className="mb-3">
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
      )}

      <nav className="flex gap-2">
        <SimpleButton
          className={`grow ${
            isConnected ? "text-green-600 border-green-300" : "text-metal"
          }`}
          onClick={getButtonAction()}
        >
          {getButtonText()}
        </SimpleButton>

        {exists && (
          <SimpleButton
            className="shrink-0"
            onClick={onEdit}
            title="Configurar"
          >
            <img src="/assets/chat/notebook.svg" alt="Configurar" />
          </SimpleButton>
        )}

        {isConnected && (
          <SimpleButton
            className="shrink-0 text-red-600 border-red-300"
            onClick={onDisconnect}
            title="Desconectar"
          >
            <img src="/assets/chat/recyclebin.svg" alt="Desconectar" />
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
        "active:scale-95",
        "hover:bg-gray-50 hover:shadow-sm transition-all",
        "border-gray-300 border py-2 px-4 rounded-xl min-w-max",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
};
