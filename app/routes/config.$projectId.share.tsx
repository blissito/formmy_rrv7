import { data as json } from "react-router";
import { Link, useLoaderData } from "react-router";
import { twMerge } from "tailwind-merge";
import { db } from "~/utils/db.server";
import { Visualizer } from "./config.$projectId.basic";
import type { ConfigSchema } from "~/components/formmys/FormyV1";
import { FiEdit3 } from "react-icons/fi";
import Message from "~/components/formmys/MessageV1";
import toast, { Toaster } from "react-hot-toast";
import { getUserOrNull } from "server/getUserUtils.server";
import { useState } from "react";
import { CopyOrCheckButton } from "~/components/CopyOrCheckButton";
import type { Route } from "./+types/config.$projectId.share";

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const user = await getUserOrNull(request);
  const project = await db.project.findUnique({
    where: {
      id: params.projectId,
    },
    select: { config: true, type: true, id: true },
  });
  if (!project) {
    throw json(null, { status: 404 });
  }

  const url = new URL(request.url);
  const isDev = process.env.NODE_ENV === "development";
  const height =
    project.type === "subscription"
      ? 158 //higth input size + 60 as water mark size
      : project.config.inputs.length * 108 + 220;
  const urls = {
    iframe: isDev
      ? `<iframe frameborder="0" id="formmy-iframe" title="formmy" width="560" height="${height}" src="http://${url.host}/embed/${project.id}" style="margin: 0 auto; display: block"
    ></iframe>`
      : `<iframe frameborder="0" id="formmy-iframe" title="formmy" width="560" height="${height}" src="https://${url.host}/embed/${project.id}" style="margin: 0 auto; display: block"
    ></iframe>`,
    preview: isDev
      ? `http://localhost:3000/preview/${project.id}`
      : `https://${url.host}/preview/${project.id}`,
  };

  return {
    urls,
    isPro: user?.plan === "PRO" ? true : false,
    projectId: project.id,
    config: project.config as ConfigSchema,
    type: project.type,
  };
};

export default function ShareConfig() {
  const { config, urls, projectId, isPro, type } =
    useLoaderData<typeof loader>();
  const [ok, setOk] = useState(false);
  const [showCheck, setShowCheck] = useState<string | null>(null);
  const preview = urls.preview;

  const iframe = urls.iframe;

  const handleCopy = (link: string) => () => {
    navigator.clipboard.writeText(link);
    toast.success("Link copiado al portapapeles", { position: "top-right" });
    // check icon
    setShowCheck(link);
    setTimeout(() => setShowCheck(false), 1000);
  };

  return (
    <>
      <Toaster />
      <article className="flex flex-wrap h-screen text-slate-700 dark:text-white dark:bg-space-900 ">
        <section className=" pt-12 md:px-12 px-4  w-full lg:min-w-[520px] h-full lg:max-w-[520px] overflow-y-scroll noscroll ">
          <div className="w-full h-full min-h-[740px]  flex flex-col relative">
            <Link
              to={"/config/" + projectId + "/basic"}
              className="float-left top-0	"
            >
              <div className="border-[1px] border-[#DFDFE9] text-[32px] flex justify-center items-center text-space-600 dark:text-gray-400 rounded-lg h-12 w-12">
                <FiEdit3 />
              </div>
            </Link>
            <img
              className="flex dark:hidden w-[70%] ml-[15%] mb-10"
              src="/assets/fantasma-globo.svg"
              alt=" felicidades brand"
            />
            <img
              className="hidden dark:flex w-[70%] ml-[15%] mb-10"
              src="/assets/congrats.svg"
              alt=" felicidades brand"
            />
            <div>
              <h2 className="text-3xl font-bold text-space-800 dark:text-white text-center">
                ¡Tu Formmy está listo!
              </h2>
              <p className="pt-6 py-2 text-md font-normal text-gray-600 dark:text-space-300">
                Solo copia y pega esta etiqueta en tu HTML o JSX.
              </p>
              <div className="relative">
                <input
                  placeholder={iframe}
                  type="text"
                  className="bg-brand-100 border-[1px] dark:bg-gray-900 dark:border-none w-full border-[#DFDFE9] focus:border-brand-500 focus:ring-brand-500 rounded-md py-2 px-4"
                />
                <button
                  type="button"
                  className="absolute right-4 top-3 text-gray-400 bg-brand-100 dark:bg-gray-900 pl-2 active:text-brand-500"
                  onClick={handleCopy(iframe)}
                >
                  <CopyOrCheckButton showCheck={showCheck === iframe} />
                </button>
              </div>
              <p className="pt-4 mt-4 py-2 text-md font-normal text-gray-600 dark:text-space-300">
                O comparte tu link directamente
              </p>
              <div className="relative">
                <input
                  placeholder={preview}
                  type="text"
                  className="bg-brand-100 dark:border-none dark:bg-gray-900 border-[1px] w-full border-[#DFDFE9] focus:border-brand-500 focus:ring-brand-500 rounded-md py-2 px-4"
                />
                <button
                  type="button"
                  className="absolute right-4 top-3 text-gray-400 bg-brand-100 dark:bg-gray-900 pl-2 active:text-brand-500"
                  onClick={handleCopy(preview)}
                >
                  <CopyOrCheckButton showCheck={showCheck === preview} />
                </button>
              </div>
            </div>
            <div className="flex gap-4 absolute w-full mt-auto bottom-0 z-10 bg-gradient-to-b from-transparent to-clear dark:to-space-900 pb-8">
              <a
                target="_blank"
                rel="noreferrer"
                href={preview}
                className=" bg-clear dark:bg-space-900 flex items-center justify-center grow h-12 rounded-full text-base mt-10 disabled:bg-gray-100 border-[1px] border-brand-500 text-brand-500 disabled:text-gray-400 "
              >
                Ir al preview
              </a>
              <Link
                to={`/dash/${projectId}`}
                className="hover:bg-brand-300 flex items-center justify-center grow-[2] h-12 rounded-full text-base mt-10 disabled:bg-gray-100 bg-brand-500 text-clear disabled:text-gray-400"
              >
                Ir al Dashboard
              </Link>
            </div>
          </div>
        </section>

        <section className={twMerge("grow h-full", config.theme)}>
          <div className="w-full h-full bg-slate-100 dark:bg-[#0D0E13] py-10 lg:py-0  relative">
            {ok ? (
              <Message config={config} showConfetti={ok} />
            ) : (
              <Visualizer
                type={type}
                onSubmit={() => setOk(true)}
                projectId={projectId}
                config={config}
                isPro={isPro}
                message=" ¡Prueba aquí tu formmy! Y no te preocupes, no se agaregarán las
            respuestas a tu dashboard."
              />
            )}
          </div>
        </section>
      </article>
    </>
  );
}
