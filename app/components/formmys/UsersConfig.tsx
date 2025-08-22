import { Card } from "~/components/chat/common/Card";
import { Button } from "~/components/Button";
import { twMerge } from "tailwind-merge";
import { useFetcher, useNavigation, useActionData } from "react-router";
import { type Permission, type User } from "@prisma/client";
import { TrashIcon } from "~/components/icons/TrashIcon";
import { InputModalFormWithRole } from "~/components/InputModalFormWithRole";
import { useEffect, useState } from "react";
import Spinner from "~/components/Spinner";
import { Pluralize } from "~/components/Pluralize";
import { Toggle } from "~/components/Switch";
import { UsersTable } from "../chat/tab_sections/UsersTable";

interface UsersConfigProps {
  user: User;
  permissions: Permission[];
  projectName: string;
  projectId: string;
}

export default function UsersConfig({
  user,
  permissions,
  projectId,
}: UsersConfigProps) {
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const actionData = useActionData();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (
      actionData &&
      (actionData.success === true || actionData.success === false)
    ) {
      setShowModal(false);
    }
  }, [actionData]);

  const isPlural = permissions.length > 1 || permissions.length === 0;

  return (
    <section className="grid gap-5 relative">
      <Card navClassName="!mb-0" title="Usuarios">
        <p className="text-xs text-gray-600 dark:text-gray-400 tracking-wide mb-8">
          {permissions.length}{" "}
          <Pluralize
            singleWord="usuario"
            isPlural={isPlural}
            pluralWord="usuarios"
          />{" "}
          <Pluralize
            singleWord="agregado"
            isPlural={isPlural}
            pluralWord="agregados"
          />
        </p>
        <Button
          variant="primary"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 absolute top-0 right-6 h-10"
        >
          <span>+ Usuario</span>
        </Button>
        <UsersTable
          user={user}
          permissions={permissions}
          projectId={projectId}
          isLoading={fetcher.state === "submitting"}
        />

        {showModal && (
          <InputModalFormWithRole
            isLoading={navigation.state !== "idle"}
            onClose={() => setShowModal(false)}
            title="Agregar usuario al proyecto"
          />
        )}
      </Card>
    </section>
  );
}

const UserTable = ({
  isLoading,
  user,
  permissions,
  projectId,
}: {
  isLoading?: boolean;
  permissions: Permission[];
  user: User;
  projectId: string;
}) => {
  return (
    <section className="my-6 rounded-t-lg">
      <Row className="bg-brand-300/20 dark:bg-transparent rounded-t-xl px-4 py-1">
        <UserTableHeader />
      </Row>

      <Row>
        <UserInfo isOwner user={user} />
      </Row>

      {permissions.map((p) => (
        <Row key={p.email}>
          <UserInfo
            permission={p}
            isLoading={isLoading}
            projectId={projectId}
          />
        </Row>
      ))}
    </section>
  );
};

const UserInfo = ({
  isLoading,
  permission,
  isOwner = false,
  user,
  projectId,
}: {
  user?: User;
  isLoading?: boolean;
  isOwner?: boolean;
  permission: Permission | User;
  projectId: string;
}) => {
  const fetcher = useFetcher();

  const handleToggleNotifications = (value: boolean) => {
    fetcher.submit(
      {
        intent: "toggle_notifications_for_permission",
        permissionId: permission.id,
        value,
      },
      { method: "POST", action: "/api/formmy" }
    );
  };

  const avatar =
    "https://secure.gravatar.com/avatar/23709cd232fbb194583b2af3fe6889dd?s=256&d=mm&r=g";

  return (
    <>
      <div className="flex col-span-3 items-center gap-2">
        <img
          onError={(ev) => {
            ev.target.onerror = null;
            ev.target.src = avatar;
          }}
          className="w-[30px] h-[30px] rounded-full object-cover m-1"
          src={
            (isOwner && user ? user.picture : permission?.user?.picture) ??
            avatar
          }
          alt={
            isOwner && user ? user.name : (permission?.user?.name ?? "avatar")
          }
        />
        <p className="flex flex-col">
          <span className="font-bold text-xs text-gray-600 dark:text-white">
            {isOwner ? user?.name : permission.user?.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-light">
            {isOwner && user ? user.email : permission?.email}
          </span>
        </p>
      </div>
      <p className="font-light">{isOwner ? "Propietario" : "Invitado"}</p>
      <p
        className={twMerge(
          "font-light text-[#66B86C] dark:text-[#37E8A3] capitalize",
          permission?.status === "pending" &&
            "text-yellow-500 dark:text-yellow-500",
          permission?.status === "rejected" &&
            "text-[#ED695F] dark:text-[#EB5757]"
        )}
      >
        {isOwner ? "Active" : permission?.status}
      </p>
      <fetcher.Form
        method="post"
        className={twMerge("flex gap-3 items-center", isOwner && "hidden")}
      >
        <input
          className="hidden"
          name="permissionId"
          defaultValue={permission?.id}
        />
        <input type="hidden" name="intent" value="delete_permission" />
        <button type="submit" className="group-hover:visible invisible">
          {isLoading ? <Spinner /> : <TrashIcon fill="tomato" />}
        </button>
        {permission?.status === "active" && (
          <Toggle
            onChange={handleToggleNotifications}
            defaultValue={permission?.notifications}
          />
        )}
      </fetcher.Form>
    </>
  );
};

const UserTableHeader = () => {
  const classs = "text-space-800 dark:text-white text-xs font-bold py-1";
  return (
    <>
      <p className={twMerge(classs, "col-span-3")}>Usuario</p>
      <p className={classs}>Role</p>
      <p className={classs}>Estatus</p>
      <p className={classs}>Notificaciones</p>
    </>
  );
};

const Row = ({
  className,
  ...props
}: {
  className?: string;
  [x: string]: any;
}) => {
  return (
    <div
      className={twMerge(
        "grid grid-cols-6 px-4 py-3 gap-2 border-b border-b-indigo-100 dark:border-b-white/10 text-xs items-center group",
        className
      )}
      {...props}
    />
  );
};
