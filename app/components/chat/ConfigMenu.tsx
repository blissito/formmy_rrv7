import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

export const ConfigMenu = ({
  only = [],
  current,
  children,
}: {
  children?: ReactNode;
  only?: string[];
  current: string;
}) => {
  if (children) {
    return <article className="min-w-[220px] group">{children}</article>;
  }
  return (
    <article className="min-w-[220px] group">
      <MenuButton
        hidden={!only.includes("files")}
        isActive={current.includes("files")}
        to="/chat/nuevo"
        src={"/assets/chat/document.svg"}
      >
        Archivos
      </MenuButton>
      <MenuButton
        hidden={!only.includes("text")}
        to="/text"
        src={"/assets/chat/increase.svg"}
      >
        Texto
      </MenuButton>
      <MenuButton
        hidden={!only.includes("website")}
        to="/website"
        src={"/assets/chat/earth.svg"}
      >
        Website
      </MenuButton>
      <MenuButton
        hidden={!only.includes("questions")}
        to="/questions"
        src={"/assets/chat/message.svg"}
      >
        Preguntas específicas
      </MenuButton>
      <MenuButton
        hidden={!only.includes("gdrive")}
        to="/gdrive"
        src={"/assets/chat/google_drive.svg"}
      >
        Google drive
      </MenuButton>
      <MenuButton
        hidden={!only.includes("notion")}
        to="/notion"
        src={"/assets/chat/notion.svg"}
      >
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

ConfigMenu.MenuButton = MenuButton;
