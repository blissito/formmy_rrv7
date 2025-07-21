import { data as json } from "react-router";
import {
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
} from "react-router";
import { useEffect, useState } from "react";
import { type ConfigSchema } from "~/components/formmys/FormyV1";
import GrayGhost from "~/SVGs/GrayGhost";
import { db } from "~/utils/db.server";
import { NakedFormmy } from "./preview.$projectId";

// @todo: need a way to decide what version should be deliver (loader)
export const loader = async ({ params, request }: LoaderArgs) => {
  const project = await db.project.findUnique({
    where: {
      id: params.projectId,
    },
    select: { User: true, config: true, id: true, type: true },
  });
  if (!project)
    throw json(
      { message: `Formmy con id: ${params.projectId}, no encontrado` },
      { status: 404 }
    );
  const isPro = project.User.plan === "PRO";
  delete project.User;
  return {
    isPro,
    project,
  };
};

export default function Embed() {
  const { project, isPro } = useLoaderData<typeof loader>();
  const [isLoading, set] = useState(true);

  if (isLoading)
    return (
      <LoadingGhost
        ctaColor={project.config.ctaColor as string}
        onFinish={() => set(false)}
      />
    );

  return (
    <>
      <NakedFormmy
        config={project.config as ConfigSchema}
        isPro={isPro}
        projectId={project.id}
        type={project.type}
      />
    </>
  );
}

const LoadingGhost = ({
  ctaColor = "rgb(154 153 234)",
  onFinish,
}: {
  ctaColor?: string;
  onFinish?: () => void;
}) => {
  const [fakeLoad, setFakeLoad] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      setFakeLoad(50);
      setTimeout(() => {
        setFakeLoad(100);
        setTimeout(() => {
          onFinish?.();
        }, 100);
      }, 200);
    }, 300);
    /* eslint-disable */
  }, []);
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <GrayGhost />
      <div className="w-[200px] h-2 rounded-full bg-gray-100/30">
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: fakeLoad + "%",
            background: ctaColor,
          }}
        />
      </div>
    </div>
  );
};

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    // No log
    return <Custom404 />;
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}

const Custom404 = () => (
  <article className="grid place-items-center h-screen">
    <section className="grid place-items-center font-semibold text-xl">
      <img src="/assets/iframe/404_iframe.svg" alt="404 ilustration" />
      <h2>404 ¡Vaya! </h2>
      <h3>
        Este{" "}
        <a
          href="https://formmy.app"
          rel="noreferrer"
          target="_blank"
          className="text-brand-300 hover:text-brand-500 transition-all hover:underline font-bold"
        >
          Formmy
        </a>{" "}
        ya no está disponible
      </h3>
    </section>
  </article>
);
