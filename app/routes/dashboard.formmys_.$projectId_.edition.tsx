import {
  data as json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  Link,
} from "react-router";
import { useLoaderData, useSubmit, useNavigation } from "react-router";
import { ChipTabs, useChipTabs } from "~/components/chat/common/ChipTabs";
import { db } from "~/utils/db.server";
import { getUserOrRedirect, getProjectWithAccess, hasPermission } from "server/getUserUtils.server";
import { PageContainer } from "~/components/chat/PageContainer";

import { configSchema, type ConfigSchema } from "~/components/formmys/FormyV1";
import { FormmyMessageEdition } from "~/components/formmys/FormmyMessageEdition";
import { FormmyDesignEdition } from "~/components/formmys/FormmyDesignEdition";
import { Button } from "~/components/Button";
import OpenTabIcon from "~/components/ui/icons/OpenTab";
import {
  FormmyEditionProvider,
  useFormmyEdition,
} from "~/contexts/FormmyEditionContext";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const form = Object.fromEntries(formData);
  const user = await getUserOrRedirect(request);

  if (form.intent === "update") {
    // Check if user has update permission
    const canUpdate = await hasPermission(user.id, params.projectId!, "update");
    if (!canUpdate) {
      return json(null, { status: 403 });
    }

    const validation = configSchema.safeParse(JSON.parse(form.data as string));
    if (!validation.success) {
      return json(null, { status: 400 });
    }
    const project = await db.project.findUnique({
      where: { id: params.projectId },
    });
    await db.project.update({
      where: { id: params.projectId },
      data: {
        config: { ...project.config, ...validation.data } as ConfigSchema,
      },
    });
  }

  if (form.intent === "next") {
    // Check if user has update permission
    const canUpdate = await hasPermission(user.id, params.projectId!, "update");
    if (!canUpdate) {
      return json(null, { status: 403 });
    }

    const validation = configSchema.safeParse(JSON.parse(form.data as string));
    if (!validation.success) {
      return json(null, { status: 400 });
    }
    const current = await db.project.findUnique({
      where: { id: params.projectId },
    });
    await db.project.update({
      where: { id: params.projectId },
      data: {
        config: { ...current.config, ...validation.data } as ConfigSchema,
      },
    });

    return redirect(`/config/${params.projectId}/message`);
  }
  return null;
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const user = await getUserOrRedirect(request);
  const projectId = params.projectId!;
  
  // Use centralized function - requires update permission for edition
  const access = await getProjectWithAccess(user.id, projectId, "update");
  
  if (!access) {
    throw json(null, { status: 404 });
  }
  
  return {
    configuration: access.project.config as ConfigSchema,
    isPro: user.plan !== "FREE",
    projectId: access.project.id,
    type: access.project.type || "",
  };
};

const FormmyEditionPairContent = ({
  isPro,
  projectId,
  type,
}: {
  isPro: boolean;
  projectId: string;
  type: string;
}) => {
  const { currentTab, setCurrentTab } = useChipTabs(
    "Estilos",
    `edition_${projectId}`
  );
  const { virtualConfig, isDirty, setIsDirty } = useFormmyEdition();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append("intent", "update");
    formData.append("data", JSON.stringify(virtualConfig));

    submit(formData, {
      method: "post",
      action: `/dashboard/formmys/${projectId}/edition`,
    });
  };

  useEffect(() => {
    if (navigation.state === "idle" && isSaving) {
      setIsSaving(false);
      setIsDirty(false);
      const timer = setTimeout(() => {
        toast.success("Cambios guardados exitosamente");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [navigation.state, isSaving]);

  let content;

  switch (currentTab) {
    case "Estilos":
      content = (
        <FormmyDesignEdition
          configuration={virtualConfig}
          isPro={isPro}
          projectId={projectId}
          type={type}
        />
      );
      break;
    case "Mensaje":
      content = (
        <FormmyMessageEdition
          configuration={virtualConfig}
          isPro={isPro}
          projectId={projectId}
          type={type}
        />
      );
      break;
    default:
      content = (
        <FormmyDesignEdition
          configuration={virtualConfig}
          isPro={isPro}
          projectId={projectId}
          type={type}
        />
      );
  }

  return (
    <main className="w-full  min-h-[calc(100vh-250px)]">
      <div className="flex items-center justify-between mt-4 md:mt-8">
        <ChipTabs
          names={["Estilos", "Mensaje"]}
          onTabChange={setCurrentTab}
          activeTab={currentTab}
        />
        <div className="flex gap-2 md:gap-3">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`/preview/${projectId}`}
            className="h-10 w-10 border grid place-content-center border-outlines rounded-lg px-3 text-metal"
            variant="ghost"
          >
            <OpenTabIcon className="w-6 h-6" />
          </a>
          <Button
            className="h-10 border border-outlines rounded-lg px-2 md:px-3 text-metal"
            variant="ghost"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
          >
            <div className="flex gap-2 items-center">
              <img
                src="/assets/chat/diskette.svg"
                alt="diskette save button"
                className="w-5 h-5"
              />
              <span>{isSaving ? "Guardando..." : "Guardar"}</span>
            </div>
          </Button>
        </div>
      </div>
      <div className="w-full h-full min-h-[calc(100vh-300px)] mt-6">
        {content}
      </div>
      <Toaster position="top-right" />
    </main>
  );
};

export const FormmyEditionPair = ({
  configuration,
  isPro,
  projectId,
  type,
}: {
  configuration: ConfigSchema;
  isPro: boolean;
  projectId: string;
  type: string;
}) => {
  return (
    <FormmyEditionProvider initialConfig={configuration}>
      <FormmyEditionPairContent
        isPro={isPro}
        projectId={projectId}
        type={type}
      />
    </FormmyEditionProvider>
  );
};

export default function FormmyEditionRoute() {
  const { configuration, isPro, projectId, type } =
    useLoaderData<typeof loader>();

  return (
    <PageContainer>
      <PageContainer.Title
        className="mb-2 flex w-full justify-between  "
        back={`/dashboard/formmys/${projectId}`}
      >
        Edita tu Formmy
      </PageContainer.Title>
      <FormmyEditionPair
        configuration={configuration}
        isPro={isPro}
        projectId={projectId}
        type={type}
      />
    </PageContainer>
  );
}