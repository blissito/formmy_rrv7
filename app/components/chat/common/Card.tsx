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
        "flex flex-col bg-[#fff] p-6 rounded-3xl shadow-lg border",
        className
      )}
    >
      <nav className="flex justify-between gap-3 items-baseline">
        <h3 className="text-2xl font-medium min-w-max mb-2">{title}</h3>
        {!noSearch && <SearchInput />}
      </nav>
      {text && <p className="text-gray-500 mb-6 text-xs">{text}</p>}
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
      className={cn("flex gap-3 p-4 rounded-2xl border-gray-300 border", {
        "border-brand-500": isSelected,
      })}
    >
      <input
        checked={isSelected}
        type="checkbox"
        className="w-4 h-4 rounded-full aspect-square ring ring-gray-300"
        onChange={(ev) => onSelect?.(ev.target.checked)}
      />
      <div>
        <h3
          className={cn("text-lg font-medium", {
            "text-brand-500": isSelected,
          })}
        >
          {title}
        </h3>
        <p
          className={cn("text-gray-600 text-xs", {
            "text-brand-300": isSelected,
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
  // status?: 'connected' | 'disconnected' | 'connecting';
  lastActivity?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onEdit?: () => void;
}) => {
  const isActive = integration?.isActive;
  const exists = !!integration;
  return (
    <div className="grid shadow-lg border border-gray-300 p-4 rounded-3xl">
      <div className="flex justify-between items-start">
        <img className="w-8 aspect-square mb-3" src={logo} alt="logo" />
        {exists &&
          (isActive ? (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Conectado
            </span>
          ) : (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              Necesita revisión
            </span>
          ))}
      </div>
      <h5 className="font-medium text-md mb-1">{name}</h5>
      <p className="text-[10px] mb-4 text-gray-600">{description}</p>
      {lastActivity && (
        <p className="text-[10px] text-gray-500 mb-2">
          Última actividad: {lastActivity}
        </p>
      )}
      <nav className="flex gap-2 mt-auto">
        {!exists ? (
          <SimpleButton className="grow" onClick={onConnect}>
            Conectar
          </SimpleButton>
        ) : (
          <>
            <SimpleButton className="grow" onClick={onEdit}>
              Editar
            </SimpleButton>
            <SimpleButton className="shrink-0" onClick={onDisconnect}>
              <img src="/assets/chat/notebook.svg" alt="Configuración" />
            </SimpleButton>
          </>
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
