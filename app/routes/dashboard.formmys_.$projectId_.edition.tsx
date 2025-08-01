import { data as json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { ChipTabs, useChipTabs } from "~/components/chat/common/ChipTabs";
import { db } from "~/utils/db.server";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { PageContainer } from "~/components/chat/PageContainer";

import { configSchema, type ConfigSchema } from "~/components/formmys/FormyV1";
import { FormmyMessageEdition } from "~/components/formmys/FormmyMessageEdition";
import { FormmyDesignEdition } from "~/components/formmys/FormmyDesignEdition";
import { Button } from "~/components/Button";
import OpenTabIcon from "~/components/ui/icons/OpenTab";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const form = Object.fromEntries(formData);

  if (form.intent === "update") {
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
  const project = await db.project.findUnique({
    where: { id: params.projectId },
    select: { id: true, type: true, config: true },
  });
  if (!project) throw json(null, { status: 404 });
  return {
    configuration: project.config as ConfigSchema,
    isPro: user.plan === "PRO" ? true : false,
    projectId: project.id,
    type: project.type || "",
  };
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
  const { currentTab, setCurrentTab } = useChipTabs("Estilos");

  let content;

  switch (currentTab) {
    case "Estilos":
      content = (
        <FormmyDesignEdition
          configuration={configuration}
          isPro={isPro}
          projectId={projectId}
          type={type}
        />
      );
      break;
    case "Mensaje Final":
      content = (
        <FormmyMessageEdition
          configuration={configuration}
          isPro={isPro}
          projectId={projectId}
          type={type}
        />
      );
      break;
    default:
      content = (
        <FormmyDesignEdition
          configuration={configuration}
          isPro={isPro}
          projectId={projectId}
          type={type}
        />
      );
  }

  return (
    <main className="w-full  min-h-[calc(100vh-250px)]">
        <div className="flex items-center justify-between mt-8">
          <ChipTabs
            names={["Estilos", "Mensaje Final"]}
            onTabChange={setCurrentTab}
            activeTab={currentTab}
          />
          <div className="flex gap-3">
        <Button className="h-10 border border-outlines rounded-lg px-3 text-metal" variant="ghost">
          <OpenTabIcon className="w-6 h-6"/>
        </Button>
        <Button className="h-10 border border-outlines rounded-lg px-3 text-metal" variant="ghost"
        // onClick={handleSave} 
        // isLoading={isSaving}
        >
                 <div className="flex gap-2 items-center">
                   <img
                     src="/assets/chat/diskette.svg"
                     alt="diskette save button"
                     className="w-5 h-5"
                   />
                   Guardar
                   {/* <span>{isSaving ? "Guardando..." : "Guardar"}</span> */}
                 </div>
               </Button>
      </div>
        </div>
        <div className="w-full h-full min-h-[calc(100vh-300px)] mt-6">
          {content}
        </div>
    </main>
  );
};

export default function FormmyEditionRoute() {
  const { configuration, isPro, projectId, type } =
    useLoaderData<typeof loader>();

  return (
    <PageContainer>
      <PageContainer.Title
      className="mb-2 flex w-full justify-between "  back={`/dashboard/formmys/${projectId}`}>
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
