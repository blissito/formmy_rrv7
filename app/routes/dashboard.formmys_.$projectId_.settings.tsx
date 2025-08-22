import { data as json, redirect } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { db } from "~/utils/db.server";
import { getUserOrRedirect, getUserOrNull, getProjectWithAccess, getRolePermissions } from "server/getUserUtils.server";
import { Role } from "@prisma/client";
import { type Notifications, notificationsSchema } from "~/utils/zod";
import type { Route } from "./+types/dash_.$projectId_.settings.notifications";
import { PageContainer, StickyGrid } from "~/components/chat/PageContainer";
import {
  ConfigMenu,
  GeneralButton,
  NotificacionesButton,
  UsuariosButton,
} from "~/components/chat/ConfigMenu";
import { useChipTabs } from "~/components/chat/common/ChipTabs";
import { useState } from "react";
import { NotificationsConfig } from "~/components/formmys/NotificationsConfig";
import { GeneralConfig } from "~/components/formmys/GeneralConfig";
import UsersConfig from "~/components/formmys/UsersConfig";

export const action = async ({ request, params }: Route.ActionArgs) => {
  const user = await getUserOrNull(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    // @TODO: delete files from firebase
    await db.answer.deleteMany({ where: { projectId: params.projectId } }); // cascade deleting
    await db.project.delete({ where: { id: params.projectId } });
    return redirect("/dashboard/formmys");
  }

  // Handle invitation with role
  if (intent === "send_invite_with_role") {
    const email = (formData.get("email") as string).toLowerCase();
    const role = formData.get("role") as string;
    if (!email || email === user?.email) return { success: false };

    
    const roleEnum = role as Role;
    const permissions = getRolePermissions(roleEnum);

    const permissionData = {
      email: String(email),
      role: roleEnum,
      can: permissions,
      projectId: String(params.projectId),
      resourceType: "PROJECT" as const,
    };
    
    const exists = await db.permission.findFirst({
      where: { email, projectId: params.projectId },
    });
    if (exists) return json({ success: true }, { status: 200 });
    
    // If user exists, link to them
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
    // sendInvite({ project, email }); // Comentado por ahora si no tienes la función
    return { success: true };
  }
  
  // Keep old handler for backward compatibility
  if (intent === "send_invite") {
    const email = (formData.get("email") as string).toLowerCase();
    if (!email || email === user?.email) return { success: false };

    
    const permissions = getRolePermissions(Role.VIEWER);

    const permissionData = {
      email: String(email),
      role: Role.VIEWER,
      can: permissions,
      projectId: String(params.projectId),
      resourceType: "PROJECT" as const,
    };
    const exists = await db.permission.findFirst({
      where: { email, projectId: params.projectId },
    });
    if (exists) return json({ success: true }, { status: 200 });
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
    // sendInvite({ project, email }); // Comentado por ahora si no tienes la función
    return { success: true };
  }

  if (intent === "delete_permission") {
    const permissionId = formData.get("permissionId") as string;
    if (!permissionId) return json(null, { status: 404 });

    await db.permission.delete({ where: { id: permissionId } });
    return null;
  }

  const notifications = Object.fromEntries(formData);
  const validData = notificationsSchema.parse(notifications) as Notifications;

  await db.project.update({
    where: { id: params.projectId },
    data: { settings: { notifications: validData } },
  });

  return null;
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  const projectId = params.projectId!;
  
  // Settings require delete permission (admin level)
  const access = await getProjectWithAccess(user.id, projectId, "delete");
  
  if (!access) {
    throw json(null, { status: 404 });
  }
  
  // Get project with permissions included
  const projectWithPermissions = await db.project.findUnique({
    where: { id: projectId },
    include: {
      permissions: {
        include: {
          user: true,
        },
      },
    },
  });
  
  const isPro = user.plan !== "FREE";
  return {
    isPro,
    notifications: projectWithPermissions?.settings?.notifications,
    project: projectWithPermissions!,
    user,
    permissions: projectWithPermissions!.permissions,
  };
};

export default function Route() {
  const {
    notifications = { new: false, members: false, warning: false }, // true defaults ;)
    isPro,
    project,
    user,
    permissions,
  } = useLoaderData<typeof loader>();
  // let settings = {};
  const fetcher = useFetcher();

  const updateSettingsWarning = (bool: boolean) =>
    fetcher.submit({ ...notifications, warning: bool }, { method: "post" });

  const updateSettingsMembers = (bool: boolean) =>
    fetcher.submit({ ...notifications, members: bool }, { method: "post" });

  const updateSettingsNew = (bool: boolean) => {
    if (!isPro) {
      fetcher.submit(
        { new: bool, members: false, warning: false },
        { method: "post" }
      );
      return;
    }
    fetcher.submit({ ...notifications, new: bool }, { method: "post" });
  };

  const { currentTab, setCurrentTab } = useChipTabs(
    "general",
    `settings_${project.id}`
  );
  const [isCopied, setIsCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [match, set] = useState("");

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };
  const handleDelete = () => {
    fetcher.submit({ intent: "delete" }, { method: "post" });
    // toast({ text: "Tu formmy se ha eliminado correctamente 🥺" });
  };
  return (
    <PageContainer>
      <PageContainer.Title
        className=" flex w-full justify-between"
        back={`/dashboard/formmys/`}
      >
        Configuración
      </PageContainer.Title>
      <StickyGrid>
        <ConfigMenu>
          <GeneralButton
            current={currentTab}
            onClick={() => setCurrentTab("general")}
          />
          <NotificacionesButton
            current={currentTab}
            onClick={() => setCurrentTab("notificaciones")}
          />
          <UsuariosButton
            current={currentTab}
            onClick={() => setCurrentTab("usuarios")}
          />
        </ConfigMenu>

        {currentTab === "general" && (
          <GeneralConfig
            project={project}
            isCopied={isCopied}
            showConfirm={showConfirm}
            match={match}
            fetcherState={fetcher.state}
            onCopyToClipboard={copyToClipboard}
            onSetShowConfirm={setShowConfirm}
            onSetMatch={set}
            onHandleDelete={handleDelete}
          />
        )}

        {currentTab === "notificaciones" && (
          <NotificationsConfig
            notifications={notifications}
            isPro={isPro}
            onUpdateNew={updateSettingsNew}
            onUpdateMembers={updateSettingsMembers}
            onUpdateWarning={updateSettingsWarning}
          />
        )}

        {currentTab === "usuarios" && (
          <>
            <UsersConfig
              user={user}
              permissions={permissions}
              projectName={project.name}
              projectId={project.id}
            />
          </>
        )}
      </StickyGrid>
    </PageContainer>
  );
}
