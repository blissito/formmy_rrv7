import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

export const ConfigMenu = ({ current }: { current: string }) => {
  return (
    <article className="min-w-[220px] group">
      <MenuButton
        isActive={current.includes("files")}
        to="/files"
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
  isActive,
  src,
  to,
}: {
  isActive?: boolean;
  to: string;
  src?: string;
  children: ReactNode;
}) => {
  return (
    <Link
      to={to}
      className={cn("flex gap-2", "rounded-xl py-3 px-2 min-w-[200px]", {
        "bg-brand-500/10 group-hover:bg-transparent": isActive,
        "hover:bg-brand-500/10 hover:shadow-sm": !isActive && true,
      })}
    >
      <span className="w-6">
        <img alt="files-icon" src={src} />
      </span>
      <span className="block min-w-max">{children}</span>
    </Link>
  );
};
