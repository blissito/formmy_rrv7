import { data as json, redirect } from "react-router";
import {
  Outlet,
  useFetcher,
  useLoaderData,
  useNavigate,
  useParams,
} from "react-router";
import {
  type ChangeEvent,
  useState,
  useEffect,
  useRef,
  useMemo,
  type FormEvent,
  type SyntheticEvent,
  useId,
  type ReactNode,
  forwardRef,
  type Ref,
} from "react";
import { twMerge } from "tailwind-merge";
import { Toggle } from "~/components/Switch";
import Formmy, {
  BASIC_INPUTS,
  configSchema,
  type ConfigSchema,
} from "~/components/formmys/FormyV1"; // importing v1 with its types and tools ;)
import useLocalStorage from "~/lib/hooks/useLocalStorage";
import { db } from "~/utils/db.server";
// import scrollbarStyles from "~/styles/app.css";
import { ProTag } from "~/components/ProTag";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { Sorter } from "~/components/dragNdrop/NewSorter";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";

// export const links = () => {
//   return [
//     {
//       rel: "stylesheet",
//       href: scrollbarStyles,
//     },
//   ];
// };

export const action = async ({ request, params }: ActionArgs) => {
  const formData = await request.formData();
  const form = Object.fromEntries(formData);

  if (form.intent === "update") {
    // validation
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
    // validation
    const validation = configSchema.safeParse(JSON.parse(form.data as string));
    if (!validation.success) {
      return json(null, { status: 400 });
    }
    // security and login check @TODO
    const current = await db.project.findUnique({
      where: {
        id: params.projectId,
      },
    });
    await db.project.update({
      where: { id: params.projectId },
      data: {
        config: { ...current.config, ...validation.data } as ConfigSchema,
      },
    });

    return redirect(`/config/${params.projectId}/message`);
  }
  // default:
  return null;
};

// @TODO loader with saved config
export const loader = async ({ params, request }: LoaderArgs) => {
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

export default function BasicConfig() {
  const { configuration, isPro, projectId, type } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [config, setConfig] = useState<ConfigSchema>(configuration); // @TODO: specific keys only
  const { save } = useLocalStorage();
  const renders = useRef(0);
  const params = useParams();
  const [isProOpen2, setIsProOpen2] = useState(false);

  // effects @TODO: remove config
  useEffect(() => {
    setConfig(configuration);
  }, [configuration]);

  useEffect(() => {
    if (renders.current > 0) {
      save("config", config);
    }
    renders.current += 1;
  }, [save, config]);

  // @TODO toaster when error
  useEffect(() => {}, [fetcher]);

  const isDisabled = useMemo(() => {
    const result = configSchema.safeParse(config);
    return !result.success;
  }, [config]);

  // handlers
  const handleInputOrder = (inputs: string[]) =>
    setConfig((c) => ({ ...c, inputs }));
  const handleThemeChange = (theme: "light" | "dark") =>
    setConfig((c) => ({ ...c, theme }));
  const handleBorderChange = (border: "redondo" | "cuadrado") =>
    setConfig((c) => ({ ...c, border }));
  const handleColorChange = (ctaColor: string) =>
    setConfig((c) => ({ ...c, ctaColor }));

  const handleWaterMark = (watermark: boolean) =>
    setConfig((c) => ({ ...c, watermark }));

  const handleSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    fetcher.submit(
      { intent: "next", data: JSON.stringify(config) },
      { method: "post" }
    );
  };

  const openCustomInputModal = () => {
    navigate("custom");
  };

  const getOrderFromConfig = () =>
    config.inputs // should we compute this in other place?
      .concat(BASIC_INPUTS.filter((name) => !config.inputs.includes(name)))
      .concat(
        isPro
          ? config.customInputs
              ?.map((obj) => obj.name as string)
              .filter((name) => !config.inputs.includes(name))
          : []
      );

  const [order, setOrder] = useState(getOrderFromConfig());
  // listeners:
  useEffect(() => {
    const used = order.filter((name) => config.inputs.includes(name));
    handleInputOrder(used);
    /* eslint-disable */
  }, [order]);

  useEffect(() => {
    setOrder(getOrderFromConfig());
  }, [config.customInputs]);

  const handleInputsUpdate = (inputs: string[]) => {
    setConfig((c) => ({ ...c, inputs }));
  };

  const getSorterInfo = (info: "names" | "active" | "onUpdate") => {
    if (info === "names") {
      if (type === "subscription") {
        return ["email"];
      } else if (type !== "subscription") {
        return getOrderFromConfig();
      }
    }
    if (info === "active") {
      if (type === "subscription") {
        return ["email"];
      } else if (type !== "subscription") {
        return configuration.inputs;
      }
    }

    if (info === "onUpdate") {
      if (type === "subscription") {
        return undefined;
      } else if (type !== "subscription") {
        return handleInputsUpdate;
      }
    }
  };

  return (
    <article className="flex flex-wrap h-[100vh] text-space-800 dark:text-white dark:bg-space-900  ">
      <section className=" w-full lg:min-w-[520px] h-full lg:max-w-[520px] pt-12 md:px-12 px-4 overflow-y-scroll noscroll">
        <div
          style={{ height: "calc(100vh - 160px)" }}
          className="w-full h-full "
        >
          <div className="h-full ">
            <h2 className="text-3xl font-bold text-space-800 dark:text-white">
              Configura tu formmy 🎯
            </h2>
            <p className="mb-4 pt-6 text-md font-normal text-gray-600 dark:text-space-300">
              {type === "subscription" ? (
                <span>Tu Formmy de suscripción solo soporta email</span>
              ) : (
                <span>
                  ¿Qué campos quieres agregar a tu formmy? Arrastra los campos
                  para acomodarlos o eliminarlos.
                </span>
              )}
            </p>
            <fetcher.Form
              onSubmit={handleSubmit}
              className="flex flex-col items-start h-full"
            >
              <Sorter
                names={getSorterInfo("names")}
                defaultActive={getSorterInfo("active")}
                onUpdate={getSorterInfo("onUpdate")}
              />
              {type !== "subscription" && (
                <button
                  onClick={
                    isPro ? openCustomInputModal : () => setIsProOpen2(true)
                  }
                  type="button"
                  className={twMerge(
                    "relative text-left text-gray-500 hover:text-gray-600 text-sm py-3",
                    !isPro && "mt-2"
                  )}
                >
                  <span>+ Agregar otro</span>
                  {!isPro && <ProTag />}
                </button>
              )}
              <p className="pt-6 text-md font-normal text-gray-600 dark:text-space-300">
                ¿Qué tema combina más con tu website?
              </p>
              <div className="flex pt-4 text-xs gap-4">
                <button
                  type="button"
                  className="text-center relative"
                  onClick={() => handleThemeChange("light")}
                >
                  <img
                    className={twMerge(
                      "w-full object-contain   transition-all",
                      config.theme === "light"
                        ? " ring-brand-500 rounded-md ring"
                        : null
                    )}
                    src="/assets/light-theme.svg"
                    alt=""
                  />
                  {config.theme === "light" && <Palomita />}
                  <p className="pt-2 fonr-light text-space-600 dark:text-space-300">
                    Light
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange("dark")}
                  className="text-center relative"
                >
                  <img
                    className={twMerge(
                      "flex dark:hidden w-full object-contain  transition-all",
                      config.theme === "dark"
                        ? " ring-brand-500 rounded-md ring"
                        : null
                    )}
                    src="/assets/dark-theme.svg"
                    alt="darkmode"
                  />
                  <img
                    className={twMerge(
                      "hidden dark:flex w-full object-contain  transition-all",
                      config.theme === "dark"
                        ? " ring-brand-500 rounded-md ring"
                        : null
                    )}
                    src="/assets/darkmode-dark.svg"
                    alt="darkmode"
                  />
                  {config.theme === "dark" && <Palomita />}
                  <p className="pt-2 text-space-600 dark:text-space-300">
                    Dark
                  </p>
                </button>
              </div>
              <p className="pt-6 text-md font-normal text-gray-600 dark:text-space-300">
                ¿Qué estilo te gusta más?
              </p>
              <div className="flex pt-4 text-xs gap-4">
                <button
                  type="button"
                  onClick={() => handleBorderChange("redondo")}
                  className="text-center relative"
                >
                  <img
                    className={twMerge(
                      "flex dark:hidden w-full object-contain",
                      config.border === "redondo"
                        ? " ring-brand-500 rounded-md ring"
                        : null
                    )}
                    src="/assets/rounded.svg"
                    alt=" rounded input"
                  />
                  <img
                    className={twMerge(
                      "hidden dark:flex w-full object-contain",
                      config.border === "redondo"
                        ? " ring-brand-500 rounded-md ring"
                        : null
                    )}
                    src="/assets/dark-rounded.svg"
                    alt=" rounded input"
                  />
                  {config.border === "redondo" && <Palomita />}
                  <p className="pt-2 text-space-600 dark:text-space-300">
                    Redondo
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleBorderChange("cuadrado")}
                  className="text-center relative"
                >
                  {config.border === "cuadrado" && <Palomita />}
                  <img
                    className={twMerge(
                      "flex dark:hidden w-full object-contain",
                      config.border === "cuadrado"
                        ? " ring-brand-500 rounded-md ring"
                        : null
                    )}
                    src="/assets/not-rounded.svg"
                    alt="no rounded input"
                  />
                  <img
                    className={twMerge(
                      "hidden dark:flex w-full object-contain",
                      config.border === "cuadrado"
                        ? " ring-brand-500 rounded-md ring"
                        : null
                    )}
                    src="/assets/dark-norounded.svg"
                    alt="no rounded input"
                  />
                  <p className="pt-2 text-space-600 dark:text-space-300">
                    Cuadrado
                  </p>
                </button>
              </div>

              <p className="pt-6 pb-4 text-md font-normal text-gray-600 dark:text-space-300">
                Elige o escribe el color del botón (hex)
              </p>
              <label
                htmlFor="color"
                className=" text-xs text-gray-400 flex items-center justify-between relative"
              >
                <input
                  onClick={(e: SyntheticEvent<HTMLInputElement>) =>
                    e.currentTarget.select()
                  }
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    handleColorChange(e.currentTarget.value);
                  }}
                  className=" focus:border-brand-500 bg-transparent text-gray-600 focus:ring-brand-500 focus:outline-none ring-transparent  active:ring-transparent pl-8 w-28 py-2 pr-2 rounded border-gray-100 dark:border-clear/20"
                  id="color"
                  type="text"
                  value={config.ctaColor}
                />
                <ColorCube
                  style={{ backgroundColor: config.ctaColor }}
                  className="absolute top-3 left-2"
                />
              </label>
              <div className="flex flex-wrap gap-1 mt-2 ">
                <ColorCube
                  hexColor="#bb333c"
                  onClick={() => handleColorChange("#bb333c")}
                />
                <ColorCube
                  hexColor="#f79c08"
                  onClick={() => handleColorChange("#f79c08")}
                />
                <ColorCube
                  hexColor="#705fe0"
                  onClick={() => handleColorChange("#705fe0")}
                />
                <ColorCube
                  hexColor="#F6C056"
                  onClick={() => handleColorChange("#F6C056")}
                />
                <ColorCube
                  onClick={() => handleColorChange("#69A753")}
                  hexColor="#69A753"
                />
                <ColorCube
                  onClick={() => handleColorChange("#ae7098")}
                  hexColor="#ae7098"
                />
                <ColorCube
                  onClick={() => handleColorChange("#1C7AE9")}
                  hexColor="#1C7AE9"
                />
              </div>
              {
                <div className="my-4">
                  <p className="pt-6 pb-4 text-md font-normal text-gray-600 dark:text-space-300">
                    Eliminar marca de agua
                  </p>
                  <div className="relative inline-block">
                    {!isPro && (
                      <ProTag
                        isOpen={isProOpen2}
                        onChange={(value) => setIsProOpen2(value)}
                      />
                    )}
                    <Toggle
                      isDisabled={!isPro}
                      onChange={handleWaterMark}
                      defaultValue={config.watermark}
                    />
                  </div>
                </div>
              }

              <div className="flex gap-4 mt-auto sticky w-full  bottom-0 z-10 bg-gradient-to-b from-transparent to-clear pb-8  dark:to-space-900 ">
                <button
                  onClick={() => navigate("/dash/" + params.projectId)}
                  type="button"
                  className={twMerge(
                    " grow h-12 rounded-full text-base mt-10 disabled:bg-gray-100 bg-gray-200 text-gray-600 disabled:text-gray-400"
                  )}
                >
                  Atrás
                </button>
                <button
                  disabled={isDisabled || fetcher.state !== "idle"}
                  type="submit"
                  className={twMerge(
                    "hover:bg-brand-300 grow-[2] h-12 rounded-full text-base mt-10 disabled:bg-gray-100 bg-brand-500 text-clear disabled:text-gray-400"
                  )}
                >
                  Continuar
                </button>
              </div>
            </fetcher.Form>
          </div>
        </div>
      </section>

      <section className={twMerge("grow h-full", config.theme)}>
        <Visualizer
          projectId={projectId}
          config={config}
          isPro={isPro}
          type={type}
          message="¡Así se verá tu Formmy! Y se comportará de forma responsiva y con fondo
        transparente."
        />
      </section>
      <Outlet />
    </article>
  );
}

export const Visualizer = ({
  projectId,
  message,
  config,
  isPro,
  onSubmit,
  type,
}: {
  type: "subscription" | "contact";
  onSubmit?: () => void;
  projectId: string;
  config: ConfigSchema;
  isPro: boolean;
  message: string;
}) => {
  return (
    <div className="w-full h-full bg-slate-100 dark:bg-hole py-10 lg:py-0 overflow-scroll">
      <p className="text-space-800/40 dark:text-gray-400 font-light text-center w-full py-6 ">
        {message}
      </p>
      <div className="grid place-items-center h-[90%]">
        <Formmy
          type={type}
          onSubmit={onSubmit}
          projectId={projectId}
          isDemo
          config={config}
          size="sm"
          isPro={isPro}
        />
      </div>
    </div>
  );
};

export const CheckInput = forwardRef(
  (
    {
      onChange,
      name,
      isDisabled,
      label,
      isChecked,
      index,
      onUpdate,
    }: {
      index?: number;
      isDisabled?: boolean;
      onChange?: (arg0: string, arg1?: SyntheticEvent) => void;
      name: string;
      isChecked?: boolean;
      label?: string;
      onUpdate?: (prevIndex: number, newIndex: number) => void;
    },
    ref: Ref<HTMLLabelElement>
  ) => {
    const handleDrag = (event: { clientX: number; clientY: number }) => {
      const nodes = document.elementsFromPoint(event.clientX, event.clientY);

      nodes.forEach((node) => {
        const indx = Number(node.dataset?.index);
        if (!isNaN(indx) && index !== indx) {
          onUpdate?.(index, indx);
        }
      });
    };

    return (
      <motion.label
        whileTap={{ cursor: "grabbing" }}
        layoutId={name}
        key={name}
        layout
        onDragEnd={handleDrag} // @todo improve
        data-index={index}
        whileDrag={{ zIndex: 10 }}
        ref={ref}
        drag
        htmlFor={name}
        dragSnapToOrigin
        className={cn(
          "rounded-lg border font-light border-outlines py-1 px-2 text-sm text-dark flex items-center justify-between w-28 md:w-32 h-[36px] bg-[white]  cursor-grab relative",
          {
            "": true,
          }
        )}
      >
        <span className="truncate pointer-events-none"> {label}</span>
        <input
          disabled={isDisabled}
          name={name}
          onChange={(event) => onChange?.(name, event.target.checked)}
          id={name}
          type="checkbox"
          checked={isChecked}
          className="rounded-full border-[1px] bg-transparent border-brand-500 ring-transparent focus:ring-1 focus:ring-brand-500 checked:bg-brand-500 	enabled:hover:none focus:bg-transparent bg-brand-500 checked:hover:bg-brand-500 checked:focus:bg-brand-500 "
        />
      </motion.label>
    );
  }
);

export const Palomita = ({ className }: { className?: string }) => (
  <span
    className={twMerge(
      "absolute top-2 right-2 text-[8px] text-white w-3 h-3 flex justify-center items-center bg-brand-500 rounded-full ",
      className
    )}
  >
    &#10003;
  </span>
);

export const ColorCube = ({
  className,
  onClick,
  style,
  hexColor = "#bb333c",
}: {
  onClick?: () => void;
  style?: { backgroundColor: string };
  className?: string;
  hexColor?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={twMerge(
      "w-4 h-4 rounded cursor-pointer",
      `bg-[${hexColor}]`,
      className
    )}
    style={{
      backgroundColor: hexColor,
      ...style,
    }}
  />
);

export const SelectableImage = ({
  onClick,
  src,
  text = null,
  name,
  defaultValue,
}: {
  onClick?: () => void;
  name?: string;
  defaultValue?: string;
  src: string;
  text?: ReactNode;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  useEffect(() => {}, [inputRef.current]);
  return (
    <label
      onClick={onClick}
      role="button"
      htmlFor={id}
      className="text-center relative w-full "
    >
      <input
        ref={inputRef}
        id={id}
        className="peer/radio hidden"
        name={name}
        type="radio"
        value={defaultValue}
      />
      <img
        className={twMerge(
          "w-full object-contain   transition-all",
          "peer-checked/radio:ring-brand-500 peer-checked/radio:rounded-md peer-checked/radio:ring"
        )}
        src={src || "/assets/light-theme.svg"}
        alt=""
      />
      <Palomita className="peer-checked/radio:block hidden" />
      <p className="pt-2 text-xs text-space-600 dark:text-space-300 peer-checked/radio:text-gray-500">
        {text}
      </p>
    </label>
  );
};
