import { Toggle } from "~/components/Switch";
import { BsThreeDots } from "react-icons/bs";
import { MdOutlineEmail } from "react-icons/md";
import FloatingMenu from "~/components/common/FloatingMenu";
import { type Permission, type User } from "@prisma/client";
import { TrashIcon } from "~/components/icons/TrashIcon";
import { twMerge } from "tailwind-merge";

interface ChatbotUsersTableProps {
  isLoading?: boolean;
  permissions: (Permission & { user?: User | null })[];
  user: User;
  chatbotId: string;
  onUpdate?: () => void;
}

export const ChatbotUsersTable = ({
  isLoading,
  user,
  permissions,
  chatbotId,
  onUpdate,
}: ChatbotUsersTableProps) => {
  return (
    <article>
      <section className="grid grid-cols-10 md:text-sm text-xs px-4 text-dark ">
        <h6 className="col-span-1"></h6>
        <h6 className="col-span-4 md:col-span-3">Email</h6>
        <h6 className="col-span-2 hidden md:block">Rol</h6>
        <h6 className="col-span-2">Estatus</h6>
        <h6 className="col-span-1">Notificaciones</h6>
        <h6 className="col-span-1"></h6>
      </section>
      <section>
        {/* Owner row */}
        <UserRow 
          user={user}
          isOwner={true}
          isLoading={isLoading}
          chatbotId={chatbotId}
          onUpdate={onUpdate}
        />
        
        {/* Permission rows */}
        {permissions.map((permission) => (
          <UserRow 
            key={permission.id}
            permission={permission}
            isOwner={false}
            isLoading={isLoading}
            chatbotId={chatbotId}
            onUpdate={onUpdate}
          />
        ))}
      </section>
    </article>
  );
};

interface UserRowProps {
  user?: User;
  permission?: Permission & { user?: User | null };
  isOwner: boolean;
  isLoading?: boolean;
  chatbotId: string;
  onUpdate?: () => void;
}

export const UserRow = ({
  user,
  permission,
  isOwner,
  isLoading,
  chatbotId,
  onUpdate,
}: UserRowProps) => {
  
  const handleToggleNotifications = async (value: boolean) => {
    if (!permission) return;
    
    const formData = new FormData();
    formData.append("intent", "toggle_chatbot_user_notifications");
    formData.append("permissionId", permission.id);
    formData.append("value", String(value));
    
    try {
      await fetch("/api/v1/chatbot", {
        method: "POST",
        body: formData,
      });
      onUpdate?.();
    } catch (error) {
      console.error("Error toggling notifications:", error);
    }
  };
  
  const handleAction = async (action: string) => {
    if (!permission) return;
    
    if (action === "eliminar") {
      const formData = new FormData();
      formData.append("intent", "remove_chatbot_user");
      formData.append("permissionId", permission.id);
      
      try {
        await fetch("/api/v1/chatbot", {
          method: "POST",
          body: formData,
        });
        onUpdate?.();
      } catch (error) {
        console.error("Error removing user:", error);
      }
    } else if (action === "reenviar") {
      // TODO: Implementar reenvío de invitación
      console.log("Reenviar invitación");
    }
  };

  const menuItems = [
    {
      label: "Reenviar",
      icon: <MdOutlineEmail className="w-4 h-4" />,
      onClick: () => handleAction("reenviar"),
      className: "text-blue-600 hover:bg-blue-50"
    },
    {
      label: "Eliminar",
      icon: <TrashIcon fill="tomato" />,
      onClick: () => handleAction("eliminar"),
      className: "text-red-600 hover:bg-red-50",
    },
  ];

  const avatar = "/home/ghosty-avatar.svg";

  const displayUser = isOwner ? user : permission?.user;
  const displayEmail = isOwner ? user?.email : permission?.email;
  const displayName = isOwner ? user?.name : permission?.user?.name;
  const displayPicture = isOwner ? user?.picture : permission?.user?.picture;

  return (
    <section className="grid items-center grid-cols-10 my-3 border border-outlines md:p-4 p-2 rounded-xl">
      <div className="col-span-1">
        <img
          onError={(ev: any) => {
            ev.target.onerror = null;
            ev.target.src = avatar;
          }}
          className="md:w-10 md:h-10 w-6 h-6 rounded-full object-cover"
          src={displayPicture ?? avatar}
          alt={displayName ?? "avatar"}
        />
      </div>

      <p className="font-medium text-xs md:text-sm truncate col-span-4 md:col-span-3">
        {displayEmail}
      </p>
      <p className="col-span-2 text-xs md:text-sm text-metal hidden md:block">
        {isOwner ? "Propietario" : getRoleLabel(permission?.role)}
      </p>
      <p className="col-span-2 text-xs md:text-sm">
        <Status status={isOwner ? "active" : permission?.status || "pending"} />
      </p>
      
      <div className="col-span-1 scale-75">
        {permission?.status === "active" && (
          <Toggle
            onChange={() => handleToggleNotifications(!permission.notifications)}
            value={permission?.notifications ?? true}
          />
        )}
        {isOwner && <Toggle value={true} isDisabled />}
      </div>
      
      {!isOwner && (
        <div className="col-span-1 grid place-content-center">
          <FloatingMenu
            items={menuItems}
            buttonClassName="text-2xl text-gray-600 hover:bg-gray-100 p-1 rounded-full"
            buttonLabel="Opciones del usuario"
          />
        </div>
      )}
      
      {isOwner && <div className="col-span-1"></div>}
    </section>
  );
};

// Helper function to get role label
const getRoleLabel = (role?: string): string => {
  if (!role) return "Invitado";
  
  switch (role) {
    case "VIEWER":
      return "Viewer";
    case "EDITOR":
      return "Editor";
    case "ADMIN":
      return "Admin";
    default:
      return "Invitado";
  }
};

const Status = ({ status }: { status: string }) => {
  const statusColors = {
    active: "text-green-500",
    pending: "text-[#51B8BF]",
    rejected: "text-red-500",
  };
  
  return (
    <p className={twMerge(
      "col-span-2 text-xs md:text-sm capitalize",
      statusColors[status as keyof typeof statusColors] || "text-gray-500"
    )}>
      {status === "active" ? "Activo" : status === "pending" ? "Pendiente" : status}
    </p>
  );
};