import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

export const ConfigMenu = ({
  current,
  children,
}: {
  children?: ReactNode;
  current?: string;
}) => {
  if (children) {
    return <article className="min-w-[220px] group">{children}</article>;
  }
  return (
    <article className="min-w-[220px] group">
      <MenuButton
        isActive={current?.includes("files")}
        to="/chat/nuevo"
        src={"/assets/chat/document.svg"}
      >
        Archivos
      </MenuButton>
      <MenuButton to="/text" src={"/assets/chat/increase.svg"}>
        Texto
      </MenuButton>
      <MenuButton to="/website" src={"/assets/chat/earth.svg"}>
        Website
      </MenuButton>
      <MenuButton to="/questions" src={"/assets/chat/message.svg"}>
        Preguntas específicas
      </MenuButton>
      <MenuButton to="/gdrive" src={"/assets/chat/google_drive.svg"}>
        Google drive
      </MenuButton>
      <MenuButton to="/notion" src={"/assets/chat/notion.svg"}>
        Notion
      </MenuButton>
    </article>
  );
};

const MenuButton = ({
  children,
  hidden,
  isActive,
  onClick,
  src,
  icon,
  to,
}: {
  onClick?: () => void;
  hidden?: boolean;
  isActive?: boolean;
  to?: string;
  src?: string;
  icon?: ReactNode;
  children: ReactNode;
}) => {
  if (typeof onClick === "function") {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex gap-2",
          "rounded-xl py-3 px-2 min-w-[200px]",
          "mb-1",
          {
            "bg-brand-500/10": isActive,
            "hover:bg-brand-500/10 hover:shadow-sm": true,
            hidden,
          }
        )}
      >
        <span className="w-6 flex items-center justify-center">
          {icon ? (
            <span className="text-lg">{icon}</span>
          ) : (
            <img alt="files-icon" src={src} />
          )}
        </span>
        <span className="block min-w-max">{children}</span>
      </button>
    );
  }
  // else
  return (
    <Link
      to={to || ""}
      className={cn("flex gap-2", "rounded-xl py-3 px-2 min-w-[200px]", {
        "bg-brand-500/10 group-hover:bg-transparent": isActive,
        "hover:bg-brand-500/10 hover:shadow-sm": !isActive && true,
        hidden,
      })}
    >
      <span className="w-6 flex items-center justify-center">
        {icon ? (
          <span className="text-lg">{icon}</span>
        ) : (
          <img alt="files-icon" src={src} />
        )}
      </span>
      <span className="block min-w-max">{children}</span>
    </Link>
  );
};

export const ArchivosButton = ({
  onClick,
  current,
}: {
  onClick?: () => void;
  current?: string;
}) => {
  return (
    <MenuButton
      onClick={onClick}
      isActive={current?.includes("files")}
      to="/chat/nuevo"
      src={"/assets/chat/document.svg"}
    >
      Archivos
    </MenuButton>
  );
};

export const IntegracionesButton = ({
  onClick,
  current,
}: {
  onClick?: () => void;
  current?: string;
}) => {
  return (
    <MenuButton
      onClick={onClick}
      isActive={current?.includes("integrations")}
      to="/chat/nuevo"
      src={"/assets/chat/database.svg"}
    >
      Integraciones
    </MenuButton>
  );
};

export const EmbebidoButton = ({
  onClick,
  current,
}: {
  onClick?: () => void;
  current?: string;
}) => {
  return (
    <MenuButton
      onClick={onClick}
      isActive={current?.includes("embed")}
      to="/chat/nuevo"
      src={"/assets/chat/code.svg"}
    >
      Embebido
    </MenuButton>
  );
};

export const TextButton = ({
  onClick,
  current,
}: {
  onClick?: () => void;
  current?: string;
}) => {
  return (
    <MenuButton
      onClick={onClick}
      isActive={current?.includes("text")}
      to="/chat/nuevo"
      src={"/assets/chat/increase.svg"}
    >
      Texto
    </MenuButton>
  );
};

export const WebsiteButton = ({
  onClick,
  current,
}: {
  onClick?: () => void;
  current?: string;
}) => {
  return (
    <MenuButton
      onClick={onClick}
      isActive={current?.includes("website")}
      to="/chat/nuevo"
      src={"/assets/chat/earth.svg"}
    >
      Website
    </MenuButton>
  );
};

export const PreguntasButton = ({
  onClick,
  current,
}: {
  onClick?: () => void;
  current?: string;
}) => {
  return (
    <MenuButton
      onClick={onClick}
      isActive={current?.includes("preguntas")}
      to="/chat/nuevo"
      src={"/assets/chat/message.svg"}
    >
      Preguntas específicas
    </MenuButton>
  );
};

export const GoogleDriveButton = ({
  onClick,
  current,
}: {
  onClick?: () => void;
  current?: string;
}) => {
  return (
    <MenuButton
      onClick={onClick}
      isActive={current?.includes("google_drive")}
      to="/chat/nuevo"
      src={"/assets/chat/google_drive.svg"}
    >
      Google drive
    </MenuButton>
  );
};

export const NotionButton = ({
  onClick,
  current,
}: {
  onClick?: () => void;
  current?: string;
}) => {
  return (
    <MenuButton
      onClick={onClick}
      isActive={current?.includes("notion")}
      to="/chat/nuevo"
      src={"/assets/chat/notion.svg"}
    >
      Notion
    </MenuButton>
  );
};

ConfigMenu.MenuButton = MenuButton;
