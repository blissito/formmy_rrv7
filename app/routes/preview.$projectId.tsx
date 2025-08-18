import { data as json } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useEffect } from "react";
import { twMerge } from "tailwind-merge";
import Formmy, { type ConfigSchema } from "~/components/formmys/FormyV1";
import Message from "~/components/formmys/MessageV1";
import { db } from "~/utils/db.server";
import getBasicMetaTags from "~/utils/getBasicMetaTags";

export const loader = async ({ params }: LoaderArgs) => {
  const project = await db.project.findUnique({
    where: {
      id: params.projectId,
    },
    select: {
      User: true,
      settings: false,
      userId: false,
      email: false,
      config: true,
      id: true,
      type: true,
    },
  });
  if (!project) throw json(null, { status: 404 });
  const isPro = project.User.plan === "PRO";
  delete project.User;
  return {
    isPro,
    project,
  };
};

export default function () {
  const { project, isPro } = useLoaderData<typeof loader>();

  useEffect(() => {
    document.body.classList.add(project.config.theme ?? "");
    /* eslint-disable */
  }, []);
  return (
    <AllFormmy
      type={project.type}
      isPro={isPro}
      config={project.config}
      projectId={project.id}
    />
  );
}

export const AllFormmy = ({
  isPro,
  config,
  projectId,
  type,
}: {
  type: string | null;
  projectId: string;
  isPro: boolean;
  config: ConfigSchema;
}) => {
  const fetcher = useFetcher();
  const ok = fetcher.data ? JSON.parse(fetcher.data).ok : false;

  return (
    <main
      className={twMerge(
        "bg-clear dark:bg-space-900 min-h-screen flex items-center py-20",
        config.theme
      )}
    >
      <Message
        type={type}
        showConfetti={ok}
        config={config}
        className={twMerge(ok ? "flex" : "hidden")} // a better way to render faster
      />

      {!ok && (
        <div className="max-w-lg mx-auto w-full">
          <h2 className="text-space-800 dark:text-white font-semibold text-3xl text-center mb-10">
            Completa el formulario
          </h2>
          <Formmy
            type={type}
            isPro={isPro}
            fetcher={fetcher}
            config={config}
            projectId={projectId}
          />
        </div>
      )}
    </main>
  );
};

export const NakedFormmy = ({
  isPro,
  config,
  projectId,
  type,
}: {
  type?: string | null;
  projectId: string;
  isPro: boolean;
  config: ConfigSchema;
}) => {
  const fetcher = useFetcher();
  const ok = fetcher.data ? JSON.parse(fetcher.data).ok : false;
  return (
    <>
      <Message
        type={type}
        showConfetti={ok}
        config={config}
        className={ok ? undefined : "hidden"}
      />
      {!ok && (
        <Formmy
          fetcher={fetcher}
          isPro={isPro}
          config={config as ConfigSchema}
          projectId={projectId}
          type={type}
        />
      )}
    </>
  );
};

export const meta = () =>
  getBasicMetaTags({
    title: "Completa el formulario",
    description:
      "Completa el formulario",
  });
