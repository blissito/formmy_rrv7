import { type Fetcher, useFetcher } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import Spinner from "../Spinner";
import type { CustomInputType, ConfigSchema } from "~/utils/zod";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";
import type { ZodError } from "zod";
export { type ConfigSchema, configSchema } from "~/utils/zod"; // This is for importing v1 all together on other pages

export const BASIC_INPUTS = ["name", "email", "message", "phone", "company"];
export const getLabel = (name: string) => {
  switch (name) {
    case "company":
      return "Empresa";
    case "phone":
      return "Teléfono";
    case "message":
      return "Mensaje";
    case "email":
      return "Email";
    case "name":
      return "Nombre";
    default:
      return name;
  }
};

export const getPlaceholder = (name: string) => {
  switch (name) {
    case "company":
      return "";
    case "phone":
      return "";
    case "message":
      return "Escribe tu mensaje";
    case "email":
      return "ejemplo@gmail.com";
    case "name":
      return "";
    default:
      return name;
  }
};

export default function Formmy({
  onSubmit,
  type,
  isDemo = false,
  size,
  config,
  isPro,
  fetcher,
  projectId,
}: {
  type: "subscription" | "contact";
  fetcher?: Fetcher & { Form: any };
  onSubmit?: () => void;
  projectId: string;
  isPro?: boolean;
  customInputs?: CustomInputType[];
  isDemo?: boolean;
  config: ConfigSchema;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}) {
  const localFetcher = useFetcher();
  fetcher ??= localFetcher;
  const maxWidth = size === "sm" ? "max-w-[420px]" : null;
  const rounded = config.border === "redondo" ? "rounded-full" : undefined;
  const containerRounded =
    config.border === "redondo" ? "rounded-3xl" : "rounded-lg";
  const sortedObjects = config.inputs.map((name) => {
    if (BASIC_INPUTS.includes(name)) {
      return {
        name,
        title: getLabel(name),
        type: name === "message" ? "textarea" : "text",
        placeholder: getPlaceholder(name),
        isRequired: name === "email",
        options: [],
      };
    } else {
      return config.customInputs.find((inp) => inp.title === name);
    }
  });
  const isDisabled = fetcher.state !== "idle";
  const handleSubmit =
    isDemo && !onSubmit
      ? () => false
      : isDemo && onSubmit
      ? onSubmit
      : undefined; // used only for demos

  const errors: ZodError[] = fetcher.data
    ? JSON.parse(fetcher.data).errors
    : [];

  return (
    <article
      className={twMerge(
        "mx-auto w-full h-full flex items-center justify-center bg-transparent",
        maxWidth,
        config.theme
      )}
    >
      <section
        className={twMerge(
          "bg-transparent px-4 py-8 w-full",
          "dark:bg-transparent dark:text-white",
          containerRounded
        )}
      >
        <fetcher.Form
          method="post"
          action="/api/formmy"
          onSubmit={handleSubmit}
          className={cn({
            "flex items-end": type === "subscription",
          })}
        >
          <input type="hidden" name="projectId" value={projectId} />
          <AnimatePresence>
            <CustomInputs
              className={cn({
                "m-0": type === "subscription",
              })}
              errors={errors}
              config={config}
              customInputs={
                isPro
                  ? sortedObjects
                  : sortedObjects.filter((it) =>
                      BASIC_INPUTS.includes(it.name || it.title)
                    )
              }
            />
            <button
              name="intent"
              value="submit_formmy"
              disabled={isDisabled}
              key={"button"}
              className={cn(
                "bg-[#323232] text-clear w-full py-3 px-4 rounded-lg font-semibold text-sm",
                "hover:scale-[1.01] hover:disabled:scale-100 active:scale-100 transition-all flex justify-center items-center",
                rounded,
                {
                  "h-10 mb-[10px] w-fit": type === "subscription",
                }
              )}
              // type={isDemo ? "button" : "submit"}
              type="submit"
              style={{
                backgroundColor: isDisabled ? "gray" : config.ctaColor,
              }}
            >
              {isDisabled ? <Spinner /> : "Enviar"}
            </button>
          </AnimatePresence>
        </fetcher.Form>
        {!config.watermark && (
          <a
            key={"anchor"}
            rel="noreferrer"
            target="_blank"
            href="https://formmy.app"
            className="text-xs text-right text-gray-500 dark:text-gray-400 block mt-2 px-2"
          >
            Powered by <span className="underline">formmy.app</span>
          </a>
        )}
      </section>
    </article>
  );
}

export const CustomInputs = ({
  config,
  className,
  customInputs,
  errors,
}: {
  className?: string;
  config: ConfigSchema;
  errors?: Record<string, string>;
  customInputs: CustomInputType[];
}) => {
  return (
    <>
      {customInputs.filter(Boolean).map((input) => {
        // if (!config.inputs.includes(input.title)) return null;
        return (
          <div key={input.title} className="flex grow">
            {input.type !== "select" && (
              <TextField
                className={className}
                placeholder={input.placeholder}
                isRequired={input.isRequired}
                border={
                  config.border === "redondo" ? "rounded-full" : undefined
                }
                key={input.title}
                color={config.ctaColor}
                error={errors?.[input.name]}
                name={input.name} // use getLabel in other places
                label={input.title}
                type={input.type}
              />
            )}
            {input.type === "select" && (
              <SelectField
                className={className}
                color={config.ctaColor}
                border={
                  config.border === "redondo" ? "rounded-full" : undefined
                }
                isRequired={input.isRequired}
                error={errors?.[input.name]}
                name={input.name}
                label={input.title}
                placeholder={input.placeholder || "Selecciona una opción"}
                options={input.options}
              />
            )}
          </div>
        );
      })}
    </>
  );
};

const SelectField = ({
  isRequired,
  error,
  name,
  label,
  placeholder,
  options,
  className,
  border = "rounded-md",
  color = "#9A99EA",
}: {
  color?: string;
  border?: string;
  className?: string;
  isRequired: boolean;
  error?: ReactNode;
  name: string;
  label?: string;
  placeholder: string;
  options: string[];
}) => {
  const ring = `focus:ring-0`;
  return (
    <motion.div
      key={name}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={twMerge("flex flex-col gap-2 mb-8", className ?? "")}
    >
      <label
        className="block text-sm font-semibold dark:text-white"
        htmlFor={name}
      >
        {label}
      </label>
      <select
        onFocus={(event) => {
          event.currentTarget.style.borderColor = color;
        }}
        onBlur={(event) => {
          event.currentTarget.style.borderColor = "rgb(227 225 225)";
        }}
        name={name}
        defaultValue=""
        required={isRequired}
        className={twMerge(
          "bg-clear border-gray-300 py-2 px-4 border focus:rin focus:ring-brand-500 text-gray-500",
          "dark:text-gray-400 dark:bg-[#1D2027] dark:border-[0px] dark:focus:border-[1px]",
          border,
          ring,
          error && "border border-red-500"
        )}
      >
        <option disabled={true} value="">
          {placeholder}
        </option>
        {options.map((option: string) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </motion.div>
  );
};

export const TextField = ({
  onChange,
  className,
  isRequired,
  placeholder,
  color = "#9A99EA",
  name,
  error,
  defaultValue,
  label,
  id,
  border = "rounded-md", // @TODO remove custom?
  type,
  ...props
}: {
  onChange?: (arg0: string) => void;
  isRequired?: boolean;
  className?: string;
  placeholder?: string;
  color?: string;
  error?: string;
  defaultValue?: string | number;
  type?: "text" | "textarea";
  border?: string;
  id?: string;
  label?: ReactNode;
  name: string;
  [x: string]: any;
}) => {
  const ring = `focus:ring-0`;
  return (
    <motion.div
      key={name}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={twMerge("flex w-full flex-col gap-2 mb-8", className ?? "")}
    >
      {typeof label === "string" ? (
        <label
          className="text-sm font-medium dark:text-white"
          htmlFor={id || name}
        >
          {label}
        </label>
      ) : (
        label
      )}
      {type === "textarea" ? (
        <textarea
          {...props}
          onChange={(e) => onChange?.(e.target.value)}
          required={isRequired}
          placeholder={placeholder}
          defaultValue={defaultValue}
          rows={4}
          className={twMerge(
            "bg-clear border-gray-300 py-2 px-4 border focus:ring focus:ring-brand-500",
            "dark:text-gray-400 dark:bg-[#1D2027] dark:border-[0px] dark:focus:border-[1px]",
            border === "rounded-full" ? "rounded-lg" : border,
            ring,
            error && "ring ring-red-500"
          )}
          id={id || name}
          name={name}
          onFocus={(event) => {
            event.currentTarget.style.borderColor = color;
          }}
          onBlur={(event) => {
            event.currentTarget.style.borderColor = "rgb(227 225 225)";
          }}
        />
      ) : (
        <input
          {...props}
          onChange={(e) => onChange?.(e.target.value)}
          required={isRequired}
          placeholder={placeholder}
          onFocus={(event) => {
            event.currentTarget.style.borderColor = color;
          }}
          onBlur={(event) => {
            event.currentTarget.style.borderColor = "rgb(227 225 225)";
          }}
          defaultValue={defaultValue}
          className={twMerge(
            "bg-clear border-gray-300 py-2 px-4 border",
            "dark:text-gray-400 dark:bg-[#1D2027] dark:border-[0px] dark:focus:border-[1px]",
            border,
            ring,
            error && "ring ring-red-500"
          )}
          id={id || name}
          name={name}
          type="text"
        />
      )}
      <p className="text-red-500 px-4 text-xs h-[1px]">{error}</p>
    </motion.div>
  );
};
