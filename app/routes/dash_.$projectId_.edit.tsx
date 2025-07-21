import type { LoaderFunction } from "react-router";
import { Link, useLoaderData } from "react-router";
import { IoReturnUpBackOutline } from "react-icons/io5";
import { BiSave } from "react-icons/bi";
import Code, { iconBtnClass } from "~/components/Code";
import Nav from "~/components/NavBar";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { db } from "~/utils/db.server";
import type { ProjectType, UserType } from "~/utils/zod";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

type LoaderData = {
  user: UserType;
  project: ProjectType;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await getUserOrRedirect(request);
  const projectId = params.projectId;
  try {
    const project = await db.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        answers: true, // consider appart to filter?
      },
    });
    return { project, user };
  } catch (e) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }
};

export default function Detail() {
  const { project, user } = useLoaderData<LoaderData>();
  return (
    <article className="min-h-screen pb-8">
      <Nav user={user} />
      <main className="pt-24 px-4 max-w-4xl mx-auto text-black dark:text-slate-400 pb-6">
        <nav className="flex flex-col items-end md:flex-row justify-between gap-4">
          <div className="flex flex-col items-start gap-2">
            <Link to={"/dash/" + project.id} className={iconBtnClass}>
              <IoReturnUpBackOutline />
            </Link>
            <h2 className="text-4xl font-bold">{project.name}</h2>
            <p>Id: {project.id}</p>
          </div>
          <div className="flex gap-2">
            <div className="tooltip" data-tip={"Guardar 💾"}>
              <button
                className={
                  "py-3 text-md rounded-md px-4 flex gap-2 bg-indigo-500 text-white dark:text-black border-none hover:bg-indigo-600"
                }
              >
                <span className="text-xl">
                  <BiSave />
                </span>
                <span>Guardar cambios</span>
              </button>
            </div>
            <input
              // onChange={onSearch}
              type="search"
              placeholder="Busca la configuración"
              className="input dark:bg-slate-800 bg-slate-300 min-w-[320px]"
              name="search"
            />
          </div>
        </nav>
        <Code project={project} />
        <SelectTheme />
      </main>
    </article>
  );
}

const SelectQuestions = () => {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelection = (selection: string) => {
    if (selected.includes(selection)) {
      setSelected((sel) => {
        return [...sel.filter((s) => s !== selection)];
      });
      return;
    }
    setSelected((sel) => [...new Set([...sel, selection])]);
  };

  return (
    <div className="w-full grid gap-4">
      <TextField
        name="name"
        label="Nombre"
        isSelected={selected.includes("name")}
        handleSelection={handleSelection}
      />
      <TextField
        name="email"
        label="Email"
        isSelected={selected.includes("email")}
        handleSelection={handleSelection}
      />
      <TextField
        name="tel"
        label="Teléfono"
        isSelected={selected.includes("tel")}
        handleSelection={handleSelection}
      />
      <TextField
        name="message"
        label="Mensaje"
        isSelected={selected.includes("message")}
        handleSelection={handleSelection}
      />
      <TextField
        name="color"
        label="Color del botón"
        isSelected={selected.includes("color")}
        handleSelection={handleSelection}
      />
    </div>
  );
};

const TextField = ({
  handleSelection,
  isSelected,
  name,
  label,
}: {
  handleSelection: (arg0: string) => void;
  isSelected: boolean;
  name: string;
  label: string;
}) => {
  return (
    <label
      htmlFor={name}
      className={twMerge(
        "cursor-pointer w-full block label-checked:ring label-checked:ring-indigo-500 rounded-md py-2 px-4 text-center border border-slate-800",
        isSelected && "ring ring-blue-500 "
      )}
    >
      <span>{label}</span>
      <input
        onChange={() => handleSelection(name)}
        hidden
        checked={isSelected}
        type="checkbox"
        className="input"
        name={name}
        id={name}
      />
    </label>
  );
};

const SelectTheme = () => {
  const [selected, setSelected] = useState("dark");
  const handleSelect = (theme: string) => {
    setSelected(theme);
  };
  return (
    <section className="flex gap-8">
      <div className="flex gap-4 flex-wrap flex-1">
        <button
          onClick={() => handleSelect("light")}
          className={twMerge(
            "border border-slate-800 cursor-pointer py-8 px-8 hover:ring hover:ring-indigo-800 rounded-md text-center",
            selected === "light" && "ring ring-blue-500 hover:ring-blue-500"
          )}
        >
          <img
            className="object-cover w-32"
            src="/assets/form_light.png"
            alt="light"
          />
          <span>Light</span>
        </button>
        <button
          onClick={() => handleSelect("dark")}
          className={twMerge(
            "border border-slate-800 cursor-pointer py-8 px-8 hover:ring hover:ring-indigo-800/50 rounded-md text-center",
            selected === "dark" && "ring ring-blue-500 hover:ring-blue-500"
          )}
        >
          <img
            className="object-cover w-32"
            src="/assets/form_dark.png"
            alt="light"
          />
          <span>Dark</span>
        </button>
        <SelectQuestions />
      </div>
      <div className="flex-1 bg-red-500">
        <iframe width="100%" height="100%" title="formy" src="/probando/form" />
      </div>
    </section>
  );
};
