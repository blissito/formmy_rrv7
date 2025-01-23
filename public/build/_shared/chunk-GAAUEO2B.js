import {
  clsx
} from "/build/_shared/chunk-XGABADQ5.js";
import {
  AnimatePresence,
  motion
} from "/build/_shared/chunk-ZOHFZ5HT.js";
import {
  Spinner
} from "/build/_shared/chunk-QKNDBCR7.js";
import {
  twMerge
} from "/build/_shared/chunk-B3ATQ6F7.js";
import {
  useFetcher2 as useFetcher
} from "/build/_shared/chunk-MUQCVLXB.js";
import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-XU7DNSPJ.js";
import {
  createHotContext
} from "/build/_shared/chunk-2F64VKTU.js";
import {
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// app/lib/utils.ts
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/lib/utils.ts"
  );
  import.meta.hot.lastModified = "1737640034130.992";
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// app/components/formmys/FormyV1.tsx
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/formmys/FormyV1.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/formmys/FormyV1.tsx"
  );
  import.meta.hot.lastModified = "1737642690789.0728";
}
var BASIC_INPUTS = ["name", "email", "message", "phone", "company"];
var getLabel = (name) => {
  switch (name) {
    case "company":
      return "Empresa";
    case "phone":
      return "Tel\xE9fono";
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
var getPlaceholder = (name) => {
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
function Formmy({
  onSubmit,
  type,
  isDemo = false,
  size,
  config,
  isPro,
  fetcher,
  projectId
}) {
  var _a;
  _s();
  const localFetcher = useFetcher();
  fetcher != null ? fetcher : fetcher = localFetcher;
  const maxWidth = size === "sm" ? "max-w-[420px]" : null;
  const rounded = config.border === "redondo" ? "rounded-full" : void 0;
  const containerRounded = config.border === "redondo" ? "rounded-3xl" : "rounded-lg";
  const sortedObjects = config.inputs.map((name) => {
    if (BASIC_INPUTS.includes(name)) {
      return {
        name,
        title: getLabel(name),
        type: name === "message" ? "textarea" : "text",
        placeholder: getPlaceholder(name),
        isRequired: name === "email",
        options: []
      };
    } else {
      return config.customInputs.find((inp) => inp.title === name);
    }
  });
  const errors = (_a = fetcher.data) == null ? void 0 : _a.errors;
  const isDisabled = fetcher.state !== "idle";
  const handleSubmit = isDemo && !onSubmit ? () => false : isDemo && onSubmit ? onSubmit : void 0;
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("article", { className: twMerge("mx-auto w-full h-full flex items-center justify-center bg-transparent", maxWidth, config.theme), children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: twMerge("bg-transparent px-4 py-8 w-full", "dark:bg-transparent dark:text-white", containerRounded), children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(fetcher.Form, { method: "post", action: "/api/formmy", onSubmit: handleSubmit, className: cn({
      "flex items-end": type === "subscription"
    }), children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", { type: "hidden", name: "projectId", value: projectId }, void 0, false, {
        fileName: "app/components/formmys/FormyV1.tsx",
        lineNumber: 100,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AnimatePresence, { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(CustomInputs, { className: cn({
          "m-0": type === "subscription"
        }), errors, config, customInputs: isPro ? sortedObjects : sortedObjects.filter((it) => BASIC_INPUTS.includes(it.name || it.title)) }, void 0, false, {
          fileName: "app/components/formmys/FormyV1.tsx",
          lineNumber: 102,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(
          "button",
          {
            name: "intent",
            value: "submit_formmy",
            disabled: isDisabled,
            className: cn("bg-[#323232] text-clear w-full py-3 px-4 rounded-lg font-semibold text-sm", "hover:scale-[1.01] hover:disabled:scale-100 active:scale-100 transition-all flex justify-center items-center", rounded, {
              "h-10 mb-[10px] w-fit": type === "subscription"
            }),
            type: "submit",
            style: {
              backgroundColor: isDisabled ? "gray" : config.ctaColor
            },
            children: isDisabled ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Spinner, {}, void 0, false, {
              fileName: "app/components/formmys/FormyV1.tsx",
              lineNumber: 112,
              columnNumber: 29
            }, this) : "Enviar"
          },
          "button",
          false,
          {
            fileName: "app/components/formmys/FormyV1.tsx",
            lineNumber: 105,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "app/components/formmys/FormyV1.tsx",
        lineNumber: 101,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/formmys/FormyV1.tsx",
      lineNumber: 97,
      columnNumber: 9
    }, this),
    !config.watermark && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", { rel: "noreferrer", target: "_blank", href: "https://formmy.app", className: "text-xs text-right text-gray-500 dark:text-gray-400 block mt-2 px-2", children: [
      "Powered by ",
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "underline", children: "formmy.app" }, void 0, false, {
        fileName: "app/components/formmys/FormyV1.tsx",
        lineNumber: 117,
        columnNumber: 24
      }, this)
    ] }, "anchor", true, {
      fileName: "app/components/formmys/FormyV1.tsx",
      lineNumber: 116,
      columnNumber: 31
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/formmys/FormyV1.tsx",
    lineNumber: 96,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/formmys/FormyV1.tsx",
    lineNumber: 95,
    columnNumber: 10
  }, this);
}
_s(Formmy, "uOGwv9X/qGRreM68aZ87DVDggzY=", false, function() {
  return [useFetcher];
});
_c = Formmy;
var CustomInputs = ({
  config,
  className,
  customInputs,
  errors
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: customInputs.filter(Boolean).map((input) => {
    return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex grow", children: [
      input.type !== "select" && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(
        TextField,
        {
          className,
          placeholder: input.placeholder,
          isRequired: input.isRequired,
          border: config.border === "redondo" ? "rounded-full" : void 0,
          color: config.ctaColor,
          error: errors == null ? void 0 : errors[input.name],
          name: input.name,
          label: input.title,
          type: input.type
        },
        input.title,
        false,
        {
          fileName: "app/components/formmys/FormyV1.tsx",
          lineNumber: 136,
          columnNumber: 41
        },
        this
      ),
      input.type === "select" && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(SelectField, { className, color: config.ctaColor, border: config.border === "redondo" ? "rounded-full" : void 0, isRequired: input.isRequired, error: errors == null ? void 0 : errors[input.name], name: input.name, label: input.title, placeholder: input.placeholder || "Selecciona una opci\xF3n", options: input.options }, void 0, false, {
        fileName: "app/components/formmys/FormyV1.tsx",
        lineNumber: 138,
        columnNumber: 41
      }, this)
    ] }, input.title, true, {
      fileName: "app/components/formmys/FormyV1.tsx",
      lineNumber: 135,
      columnNumber: 14
    }, this);
  }) }, void 0, false, {
    fileName: "app/components/formmys/FormyV1.tsx",
    lineNumber: 132,
    columnNumber: 10
  }, this);
};
_c2 = CustomInputs;
var SelectField = ({
  isRequired,
  error,
  name,
  label,
  placeholder,
  options,
  className,
  border = "rounded-md",
  color = "#9A99EA"
}) => {
  const ring = `focus:ring-0`;
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(motion.div, { initial: {
    opacity: 0
  }, animate: {
    opacity: 1
  }, exit: {
    opacity: 0
  }, className: twMerge("flex flex-col gap-2 mb-8", className != null ? className : ""), children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", { className: "block text-sm font-semibold dark:text-white", htmlFor: name, children: label }, void 0, false, {
      fileName: "app/components/formmys/FormyV1.tsx",
      lineNumber: 163,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("select", { onFocus: (event) => {
      event.currentTarget.style.borderColor = color;
    }, onBlur: (event) => {
      event.currentTarget.style.borderColor = "rgb(227 225 225)";
    }, name, defaultValue: "", required: isRequired, className: twMerge("bg-clear border-gray-300 py-2 px-4 border focus:rin focus:ring-brand-500 text-gray-500", "dark:text-gray-400 dark:bg-[#1D2027] dark:border-[0px] dark:focus:border-[1px]", border, ring, error && "border border-red-500"), children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("option", { disabled: true, value: "", children: placeholder }, void 0, false, {
        fileName: "app/components/formmys/FormyV1.tsx",
        lineNumber: 171,
        columnNumber: 9
      }, this),
      options.map((option) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("option", { value: option, children: option }, option, false, {
        fileName: "app/components/formmys/FormyV1.tsx",
        lineNumber: 174,
        columnNumber: 32
      }, this))
    ] }, void 0, true, {
      fileName: "app/components/formmys/FormyV1.tsx",
      lineNumber: 166,
      columnNumber: 7
    }, this)
  ] }, name, true, {
    fileName: "app/components/formmys/FormyV1.tsx",
    lineNumber: 156,
    columnNumber: 10
  }, this);
};
_c3 = SelectField;
var TextField = ({
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
  border = "rounded-md",
  // @TODO remove custom?
  type,
  ...props
}) => {
  const ring = `focus:ring-0`;
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(motion.div, { initial: {
    opacity: 0
  }, animate: {
    opacity: 1
  }, exit: {
    opacity: 0
  }, className: twMerge("flex w-full flex-col gap-2 mb-8", className != null ? className : ""), children: [
    typeof label === "string" ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", { className: "text-sm font-medium dark:text-white", htmlFor: id || name, children: label }, void 0, false, {
      fileName: "app/components/formmys/FormyV1.tsx",
      lineNumber: 205,
      columnNumber: 36
    }, this) : label,
    type === "textarea" ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("textarea", { ...props, onChange: (e) => onChange == null ? void 0 : onChange(e.target.value), required: isRequired, placeholder, defaultValue, rows: 4, className: twMerge("bg-clear border-gray-300 py-2 px-4 border focus:ring focus:ring-brand-500", "dark:text-gray-400 dark:bg-[#1D2027] dark:border-[0px] dark:focus:border-[1px]", border === "rounded-full" ? "rounded-lg" : border, ring, error && "ring ring-red-500"), id: id || name, name, onFocus: (event) => {
      event.currentTarget.style.borderColor = color;
    }, onBlur: (event) => {
      event.currentTarget.style.borderColor = "rgb(227 225 225)";
    } }, void 0, false, {
      fileName: "app/components/formmys/FormyV1.tsx",
      lineNumber: 208,
      columnNumber: 30
    }, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", { ...props, onChange: (e) => onChange == null ? void 0 : onChange(e.target.value), required: isRequired, placeholder, onFocus: (event) => {
      event.currentTarget.style.borderColor = color;
    }, onBlur: (event) => {
      event.currentTarget.style.borderColor = "rgb(227 225 225)";
    }, defaultValue, className: twMerge("bg-clear border-gray-300 py-2 px-4 border", "dark:text-gray-400 dark:bg-[#1D2027] dark:border-[0px] dark:focus:border-[1px]", border, ring, error && "ring ring-red-500"), id: id || name, name, type: "text" }, void 0, false, {
      fileName: "app/components/formmys/FormyV1.tsx",
      lineNumber: 212,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "text-red-500 px-4 text-xs h-[1px]", children: error }, void 0, false, {
      fileName: "app/components/formmys/FormyV1.tsx",
      lineNumber: 217,
      columnNumber: 7
    }, this)
  ] }, name, true, {
    fileName: "app/components/formmys/FormyV1.tsx",
    lineNumber: 198,
    columnNumber: 10
  }, this);
};
_c4 = TextField;
var _c;
var _c2;
var _c3;
var _c4;
$RefreshReg$(_c, "Formmy");
$RefreshReg$(_c2, "CustomInputs");
$RefreshReg$(_c3, "SelectField");
$RefreshReg$(_c4, "TextField");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

export {
  cn,
  BASIC_INPUTS,
  Formmy,
  TextField
};
//# sourceMappingURL=/build/_shared/chunk-GAAUEO2B.js.map
