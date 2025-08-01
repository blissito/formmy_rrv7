import { Toggle } from "~/components/Switch";
import { BsThreeDots } from "react-icons/bs";
import { MdOutlineEmail } from "react-icons/md";
import FloatingMenu from "~/components/common/FloatingMenu";
import { type Permission, type User } from "@prisma/client";
import { Form, useFetcher } from "react-router";
import { TrashIcon } from "~/components/icons/TrashIcon";
import Spinner from "~/components/Spinner";
import { twMerge } from "tailwind-merge";

interface UsersTableProps {
  isLoading?: boolean;
  permissions: Permission[];
  user: User;
  projectId: string;
}

export const UsersTable = ({
  isLoading,
  user,
  permissions,
  projectId,
}: UsersTableProps) => {
  return (
    <article>
      <section className="grid grid-cols-10 text-sm px-4 text-dark ">
        <h6 className="col-span-1"></h6>
        <h6 className="col-span-2">Email</h6>
        <h6 className="col-span-2">Rol</h6>
        <h6 className="col-span-2">Estatus</h6>
        <h6 className="col-span-2">Notificaciones</h6>
        <h6 className="col-span-1"></h6>
      </section>
      <section>
        {/* Owner row */}
        <UserRow 
          user={user}
          isOwner={true}
          isLoading={isLoading}
          projectId={projectId}
        />
        
        {/* Permission rows */}
        {permissions.map((permission) => (
          <UserRow 
            key={permission.email}
            permission={permission}
            isOwner={false}
            isLoading={isLoading}
            projectId={projectId}
          />
        ))}
      </section>
    </article>
  );
};

interface UserRowProps {
  user?: User;
  permission?: Permission;
  isOwner: boolean;
  isLoading?: boolean;
  projectId: string;
}

export const UserRow = ({
  user,
  permission,
  isOwner,
  isLoading,
  projectId,
}: UserRowProps) => {
  const fetcher = useFetcher();
  
  const handleToggleNotifications = (value: boolean) => {
    fetcher.submit(
      {
        intent: "toggle_notifications_for_permission",
        permissionId: permission?.id,
        value,
      },
      { method: "POST", action: "/api/formmy" }
    );
  };
  const handleAction = (action: string) => {
    if (action === "eliminar") {
      fetcher.submit(
        {
          intent: "delete_permission",
          permissionId: permission?.id,
        },
        { method: "POST", action: "/api/formmy" }
      );
    } else if (action === "reenviar") {
      fetcher.submit(
        {
          intent: "resend_invitation",
          permissionId: permission?.id,
        },
        { method: "POST", action: "/api/formmy" }
      );
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


  const avatar =
    "/home/ghosty-avatar.svg";

  const displayUser = isOwner ? user : permission?.user;
  const displayEmail = isOwner ? user?.email : permission?.email;
  const displayName = isOwner ? user?.name : permission?.user?.name;
  const displayPicture = isOwner ? user?.picture : permission?.user?.picture;

  return (
    <section className="grid items-center grid-cols-10 my-3 border border-outlines p-4 rounded-xl">
      <div className="col-span-1">
        <img
          onError={(ev) => {
            ev.target.onerror = null;
            ev.target.src = avatar;
          }}
          className="w-10 h-10 rounded-full object-cover"
          src={displayPicture ?? avatar}
          alt={displayName ?? "avatar"}
        />
      </div>

      <p className="font-medium text-sm truncate col-span-2">
        {displayEmail}
      </p>

      <p className="col-span-2 text-sm text-metal">{isOwner ? "Propietario" : "Invitado"}</p>
      
      <p className="col-span-2 text-sm">
        <Status status={isOwner ? "active" : permission?.status || "pending"} />
      </p>
      
      <div className="col-span-2 scale-75">
        {permission?.status === "active" && (
          <Toggle
            onChange={handleToggleNotifications}
            defaultValue={permission?.notifications}
          />
        )}
        {isOwner && <Toggle defaultValue={true} disabled />}
      </div>
      
      {!isOwner && (
        <div className="col-span-1">
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

// @TODO: add colors
const Status = ({ status }: { status: string }) => {
  const statusColors = {
    active: "text-green-500",
    pending: "text-[#51B8BF]",
    rejected: "text-red-500",
  };
  
  return (
    <p className={twMerge(
      "col-span-2 text-sm capitalize",
      statusColors[status as keyof typeof statusColors] || "text-gray-500"
    )}>
      {status}
    </p>
  );
};
