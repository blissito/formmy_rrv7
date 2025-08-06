import {
  useState,
  useEffect,
  useRef,
  useMemo,
  forwardRef,
  type Ref,
} from "react";
import { useNavigate, useParams } from "react-router";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { Toggle } from "~/components/Switch";
import { Sorter } from "~/components/dragNdrop/NewSorter";
import { ProTag } from "~/components/ProTag";
import Formmy, {
  BASIC_INPUTS,
  configSchema,
  type ConfigSchema,
} from "~/components/formmys/FormyV1";
import { useFormmyEdition } from "~/contexts/FormmyEditionContext";
import type { ChangeEvent, FormEvent, SyntheticEvent, ReactNode } from "react";

interface FormmyDesignEditionProps {
  configuration: ConfigSchema;
  isPro: boolean;
  projectId: string;
  type: string;
}

export function FormmyDesignEdition({
  configuration,
  isPro,
  projectId,
  type,
}: FormmyDesignEditionProps) {
  const navigate = useNavigate();
  const { virtualConfig: config, updateVirtualConfig } = useFormmyEdition();
  const params = useParams();
  const [isProOpen2, setIsProOpen2] = useState(false);

  const isDisabled = useMemo(() => {
    const result = configSchema.safeParse(config);
    return !result.success;
  }, [config]);

  const handleInputOrder = (inputs: string[]) =>
    updateVirtualConfig({ inputs });
  const handleThemeChange = (theme: "light" | "dark") =>
    updateVirtualConfig({ theme });
  const handleBorderChange = (border: "redondo" | "cuadrado") =>
    updateVirtualConfig({ border });
  const handleColorChange = (ctaColor: string) =>
    updateVirtualConfig({ ctaColor });

  const handleWaterMark = (watermark: boolean) =>
    updateVirtualConfig({ watermark });

  const openCustomInputModal = () => {
    navigate("custom");
  };

  const getOrderFromConfig = () =>
    config.inputs
      .concat(BASIC_INPUTS.filter((name) => !config.inputs.includes(name)))
      .concat(
        isPro
          ? config.customInputs
              ?.map((obj) => obj.name as string)
              .filter((name) => !config.inputs.includes(name))
          : []
      );

  const [order, setOrder] = useState(getOrderFromConfig());

  useEffect(() => {
    const used = order.filter((name) => config.inputs.includes(name));
    handleInputOrder(used);
  }, [order]);

  useEffect(() => {
    setOrder(getOrderFromConfig());
  }, [config.customInputs]);

  const handleInputsUpdate = (inputs: string[]) => {
    updateVirtualConfig({ inputs });
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
    <article className="grid grid-cols-12 gap-8  h-full">
      <section className="col-span-12 md:col-span-4 noscroll">
        <div className="w-full h-fit">
          <p className="mb-4 text-base font-normal text-metal ">
            {type === "subscription" ? (
              <span>Tu Formmy de suscripción solo soporta email</span>
            ) : (
              <span>
                ¿Qué campos quieres agregar a tu formmy? Arrastra los campos
                para acomodarlos o eliminarlos.
              </span>
            )}
          </p>
          <form
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
            <p className="pt-2 font-normal text-metal">
              ¿Qué tema combina más con tu website?
            </p>
            <div className="pt-2 w-full">
              <select
                value={config.theme}
                onChange={(e) =>
                  handleThemeChange(e.target.value as "light" | "dark")
                }
                className="w-full px-3 py-2 border border-outlines rounded-md focus:outline-none focus:border-none focus:ring-1 focus:ring-brand-500 "
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
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
                    "flex dark:hidden w-full object-contain h-12",
                    config.border === "redondo"
                      ? " ring-brand-500 rounded-md ring"
                      : null
                  )}
                  src="/assets/rounded.svg"
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
                    "flex dark:hidden w-full object-contain h-12",
                    config.border === "cuadrado"
                      ? " ring-brand-500 rounded-md ring"
                      : null
                  )}
                  src="/assets/not-rounded.svg"
                  alt="no rounded input"
                />
                <p className="pt-2 text-space-600 dark:text-space-300">
                  Cuadrado
                </p>
              </button>
            </div>

            <p className="pt-6 pb-2 text-md font-normal text-metal">
              Elige o escribe el color del botón (hex)
            </p>
            <div className="flex gap-4">
              <label
                htmlFor="color"
                className="text-xs text-gray-400 flex items-center justify-between relative"
              >
                <input
                  onClick={(e: SyntheticEvent<HTMLInputElement>) =>
                    e.currentTarget.select()
                  }
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    handleColorChange(e.currentTarget.value);
                  }}
                  className="focus:border-brand-500 bg-transparent text-gray-600 focus:ring-brand-500 focus:outline-none ring-transparent active:ring-transparent pl-10 w-32 py-2 pr-0 rounded-lg border-gray-100 dark:border-clear/20"
                  id="color"
                  type="text"
                  value={config.ctaColor}
                />
                <ColorCube
                  style={{ backgroundColor: config.ctaColor }}
                  className="absolute top-[6px] left-2"
                />
              </label>
              <div className="flex items-center flex-wrap gap-2">
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
            </div>
            <div className="">
              <p className="pt-6 pb-2 text-md font-normal text-metal">
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

            {/* <div className="flex gap-4 mt-auto sticky w-full bottom-0 z-10 bg-gradient-to-b from-transparent to-clear pb-8 dark:to-space-900">
                <button
                  onClick={() => navigate("/dashboard/formmys/" + params.projectId)}
                  type="button"
                  className={twMerge(
                    "grow h-12 rounded-full text-base mt-10 disabled:bg-gray-100 bg-gray-200 text-gray-600 disabled:text-gray-400"
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
              </div> */}
          </form>
        </div>
      </section>
      <section
        className={twMerge(
          "col-span-12 md:col-span-8 h-fit  md:h-full md:min-h-[calc(100vh-300px)] ",
          config.theme
        )}
      >
        <Visualizer
          projectId={projectId}
          config={config}
          isPro={isPro}
          type={type}
          message="¡Así se verá tu Formmy! Y se comportará de forma responsiva y con fondo transparente."
        />
      </section>
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
    <div className="w-full h-full noscroll bg-slate-100 dark:bg-hole py-10 lg:py-0 overflow-scroll">
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
        onDragEnd={handleDrag}
        data-index={index}
        whileDrag={{ zIndex: 10 }}
        ref={ref}
        drag
        htmlFor={name}
        dragSnapToOrigin
        className={cn(
          "rounded-lg border font-light border-[#E3E1E1] dark:border-clear/20 py-1 px-2 text-sm text-gray-500 flex items-center justify-between w-32 h-[36px] bg-[white] dark:bg-transparent cursor-grab relative"
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
          className="rounded-full border-[1px] bg-transparent border-brand-500 ring-transparent focus:ring-1 focus:ring-brand-500 checked:bg-brand-500 enabled:hover:none focus:bg-transparent bg-brand-500 checked:hover:bg-brand-500 checked:focus:bg-brand-500"
        />
      </motion.label>
    );
  }
);

export const Palomita = ({ className }: { className?: string }) => (
  <span
    className={twMerge(
      "absolute top-2 right-2 text-[8px] text-white w-3 h-3 flex justify-center items-center bg-brand-500 rounded-full",
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
      "w-[20px] md:w-[28px] h-[20px] md:h-[28px] rounded cursor-pointer",
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
      className="text-center relative w-full"
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
          "w-full object-contain transition-all",
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
