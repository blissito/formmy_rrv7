import { Button } from "~/components/Button";
import { FaUsers } from "react-icons/fa";
import { twMerge } from "tailwind-merge";
import { getUserOrRedirect, getProjectWithAccess } from "server/getUserUtils.server";
import { data as json } from "react-router";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
} from "react-router";
import { type Permission, type User } from "@prisma/client";
import { TrashIcon } from "~/components/icons/TrashIcon";
import { InputModalFormWithRole } from "~/components/InputModalFormWithRole";
import { useEffect, useState } from "react";
import { db } from "~/utils/db.server";
import Spinner from "~/components/Spinner";
import { sendInvite } from "~/utils/notifyers/sendInvite";
import { Pluralize } from "~/components/Pluralize";
import { Toggle } from "~/components/Switch";

export const action = async ({ request, params }: ActionArgs) => {
  const user = await getUserOrRedirect(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // @TODO: validate permission is owner? ??
  if (intent === "send_invite") {
    const email = (formData.get("email") as string).toLowerCase();
    if (!email || email === user.email) return { success: false };

    const permissionData = {
      email: String(email),
      can: { read: true },
      projectId: String(params.projectId), // @TODO: check if exists
      resourceType: "PROJECT" as const,
    };
    const exists = await db.permission.findFirst({
      where: { email, projectId: params.projectId, resourceType: "PROJECT" },
    });
    if (exists) return json({ success: true }, { status: 200 }); // retun null equivalent
    // if user add it
    const userExists = await db.user.findUnique({ where: { email } });
    if (userExists) {
      // @ts-ignore
      permissionData.userId = userExists.id;
    }
    await db.permission.create({ data: permissionData });
    const project = await db.project.findUnique({
      where: { id: params.projectId },
    });
    //@ts-ignore
    sendInvite({ project, email });
    return { success: true };
  }

  if (intent === "delete_permission") {
    const permissionId = formData.get("permissionId") as string;
    if (!permissionId) return json(null, { status: 404 });

    await db.permission.delete({ where: { id: permissionId } });
  }

  return null;
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  const projectId = params.projectId!;
  
  // Access settings requires delete permission (admin level)
  const access = await getProjectWithAccess(user.id, projectId, "delete");
  
  if (!access) {
    throw json(null, { status: 404 });
  }
  
  const permissions = await db.permission.findMany({
    where: {
      projectId: access.project.id,
      resourceType: "PROJECT",
    },
    include: {
      project: true,
      user: true,
    },
  });
  return {
    user,
    permissions,
    projectName: access.project.name,
  };
};

export default function Route() {
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const { user, permissions, projectName } = useLoaderData<typeof loader>();
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
    <article>
      <h1 className="font-bold text-xl">
        Usuarios de <span className="text-brand-500">{projectName}</span>
      </h1>
      <hr className="mt-2 mb-6 dark:border-t-white/10" />
      <nav className="flex justify-between items-center">
        <p className="text-xs text-gray-600 dark:text-gray-400 tracking-wide">
          {permissions.length}
          {/* {permissions.length} usuario{permissions.length > 1 ? "s" : null}{" "}
          agregado */}{" "}
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
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setShowModal(true)}
            className="flex items-center py-1 px-2 text-sm h-8 rounded-md gap-2 max-w-[120px] m-0 hover:scale-105 transition-all hover:bg-brand-300 bg-brand-500 justify-center"
          >
            <span>
              <FaUsers className="text-lg" />
            </span>
            <span>Agregar</span>
          </Button>
        </div>
      </nav>
      <UserTable
        user={user}
        permissions={permissions}
        isLoading={navigation.state !== "idle"}
      />
      {showModal && (
        <InputModalFormWithRole
          isLoading={navigation.state !== "idle"}
          onClose={() => setShowModal(false)}
          title="Ingresa el correo del usuario"
        />
      )}
    </article>
  );
}

const UserTable = ({
  isLoading,
  user,
  permissions,
}: {
  isLoading?: boolean;
  permissions: Permission[];
  user: User;
}) => {
  return (
    <section className="my-6 rounded-t-lg">
      <Row className="bg-brand-300/20 dark:bg-transparent   rounded-t-xl px-4 py-1">
        <UserTableHeader />
      </Row>

      <Row>
        <UserInfo isOwner user={user} />
      </Row>

      {permissions.map((p) => (
        <Row key={p.email}>
          <UserInfo permission={p} isLoading={isLoading} />
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
}: {
  user?: User;
  isLoading?: boolean;
  isOwner?: boolean;
  permission: Permission | User;
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
  // @TODO clean up
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
          alt={isOwner && user ? user.name : permission?.user?.name ?? "avatar"}
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
      {/* <p className="font-light">3 diciembre 2023</p> */}
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
      <Form
        method="post"
        className={twMerge("flex gap-3 items-center", isOwner && "hidden")}
      >
        <input
          className="hidden"
          name="permissionId"
          defaultValue={permission?.id}
        />
        <button
          name="intent"
          value="delete_permission"
          type="submit"
          className="group-hover:visible invisible"
        >
          {isLoading ? <Spinner /> : <TrashIcon fill="tomato" />}
        </button>
        {permission?.status === "active" && (
          <Toggle
            onChange={handleToggleNotifications}
            defaultValue={permission?.notifications}
          />
        )}
      </Form>
    </>
  );
};

const UserTableHeader = () => {
  const classs = "text-space-800 dark:text-white text-xs font-bold py-1";
  return (
    <>
      <p className={twMerge(classs, "col-span-3")}>Usuario</p>
      {/* <p className={classs}>Fecha</p> */}
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
