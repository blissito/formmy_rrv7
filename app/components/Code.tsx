import type { ProjectType } from "~/utils/zod";
import { BiCopy } from "react-icons/bi";
import { useRef, useState } from "react";

const LINK = "https://formy.blissmo.workers.dev";

export const iconBtnClass =
  "flex items-center py-2 border rounded-md px-2 hover:scale-105 active:scale-100 border-brand-500 text-brand-500";

export default function Code({ project }: { project: ProjectType }) {
  const url = LINK + "/" + project.slug + "/form";
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const copyToClipboard = () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    setCopied(true);
    navigator.clipboard.writeText(`<iframe src="${url}" />`);
    timeout.current = setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  return (
    <>
      <main className="pt-12 px-4 max-w-4xl mx-auto text-black dark:text-slate-400">
        <h2 className="text-2xl font-bold px-4">
          Solo copia y pega esta etiqueta en tu HTML o JSX.
        </h2>
      </main>
      <div className="text-center border border-indigo-500/60 rounded-md text-xl font-thin h-[8vh] flex items-center justify-center my-4 gap-4 text-slate-800 dark:text-slate-400 max-w-4xl mx-auto px-4">
        <h2 className="">
          {`
      <iframe width="100%" height="100%" title="formy" src="${url}" />
      `}
        </h2>

        <div className="tooltip" data-tip={copied ? "Copiado ✅" : "Copiar"}>
          <button onClick={copyToClipboard} className={iconBtnClass}>
            <BiCopy />
          </button>
        </div>
      </div>
    </>
  );
}
