import { useState, type ReactNode } from "react";
import { cn } from "~/lib/utils";
import { SearchInput } from "./SearchInput";
import Markdown from "react-markdown";
import { children } from "effect/Fiber";
// import { SearchInput } from "./SearchInput";

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
          title="User el SDK"
          text="El SDK Te permite user todas las funciones avanzadas del agente"
          onSelect={() => onSelect("sdk")}
        />
        <MiniCard
          isSelected={selectedMinicard === "iframe"}
          title="Embeber el iframe"
          text="Agrega el chat en cualquier lugar de su sitio web."
          onSelect={() => onSelect("iframe")}
        />
        <MiniCard
          isSelected={selectedMinicard === "link"}
          title="Obtener el Link"
          text="Accede a tu chatbot directamente o usa el linkd entro de tu sitio web."
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
  description,
}: {
  name: string;
  logo: string;
  description: string;
}) => {
  return (
    <div className="grid shadow-lg border border-gray-300 p-4 rounded-3xl">
      <img className="w-8 aspect-square mb-3" src={logo} alt="logo" />
      <h5 className="font-medium text-md mb-1">{name}</h5>
      <p className="text-[10px] mb-4 text-gray-600">{description}</p>
      <nav className="flex gap-2">
        <SimpleButton className="grow">Conectar</SimpleButton>
        <SimpleButton className="shrink-0">
          <img src="/assets/chat/notebook.svg" alt="" />
        </SimpleButton>
      </nav>
    </div>
  );
};

const SimpleButton = ({
  className,
  children,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <button
      className={cn(
        "enabled:active:scale-95",
        "hover:bg-gray-50 hover:shadow-sm transition-all",
        "border-gray-300 border py-2 px-4 rounded-xl min-w-max",
        className
      )}
    >
      {children}
    </button>
  );
};
