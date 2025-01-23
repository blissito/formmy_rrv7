import {
  BASIC_INPUTS,
  Formmy
} from "/build/_shared/chunk-GAAUEO2B.js";
import {
  configSchema
} from "/build/_shared/chunk-WAI7GNH5.js";
import {
  ProTag
} from "/build/_shared/chunk-OMYSDXL4.js";
import {
  cn,
  useLocalStorage
} from "/build/_shared/chunk-SGWSEZXL.js";
import {
  Toggle
} from "/build/_shared/chunk-EFXLBPE4.js";
import {
  LayoutGroup,
  motion
} from "/build/_shared/chunk-ZOHFZ5HT.js";
import {
  twMerge
} from "/build/_shared/chunk-B3ATQ6F7.js";
import {
  require_db
} from "/build/_shared/chunk-KONDUBG3.js";
import {
  require_node
} from "/build/_shared/chunk-G7CHZRZX.js";
import {
  Outlet,
  useFetcher2 as useFetcher,
  useLoaderData2 as useLoaderData,
  useNavigate,
  useParams
} from "/build/_shared/chunk-MUQCVLXB.js";
import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-XU7DNSPJ.js";
import {
  createHotContext
} from "/build/_shared/chunk-2F64VKTU.js";
import {
  require_react
} from "/build/_shared/chunk-BOXFZXVX.js";
import {
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// app/routes/config.$projectId.basic.tsx
var import_node = __toESM(require_node());
var import_react3 = __toESM(require_react());
var import_db = __toESM(require_db());

// app/styles/app.css
var app_default = "/build/_assets/app-VQBE7VWB.css";

// app/components/dragNdrop/NewSorter.tsx
var import_react = __toESM(require_react());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/dragNdrop/NewSorter.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/dragNdrop/NewSorter.tsx"
  );
  import.meta.hot.lastModified = "1737642690788.6306";
}
var Sorter = ({
  names,
  onUpdate,
  defaultActive = ["email"]
}) => {
  _s();
  const [list, setList] = (0, import_react.useState)(names || []);
  const [active, setActive] = (0, import_react.useState)(defaultActive);
  const updateParent = () => {
    onUpdate == null ? void 0 : onUpdate(list.filter((name) => active.includes(name)));
  };
  const handleIndexUpdate = (prevIndex, newIndex) => {
    const l = [...list];
    const backup = l.splice(prevIndex, 1);
    l.splice(newIndex, 0, backup[0]);
    setList(l);
  };
  const handleChange = (name, checked) => {
    if (name === "email")
      return;
    if (checked) {
      const norepeat = [.../* @__PURE__ */ new Set([...active, name])];
      setActive(norepeat);
    } else {
      const norepeat = [.../* @__PURE__ */ new Set([...active.filter((n) => n !== name)])];
      setActive(norepeat);
    }
  };
  (0, import_react.useEffect)(() => {
    updateParent();
  }, [list, active]);
  const getLabel = (name) => {
    switch (name) {
      case "name":
        return "Nombre";
      case "email":
        return "Email";
      case "company":
        return "Empresa";
      case "message":
        return "Mensaje";
      case "phone":
        return "Tel\xE9fono";
      default:
        return name;
    }
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "grid grid-cols-3 gap-2", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(LayoutGroup, { children: list.map((name, i) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(
    CheckInput,
    {
      onUpdate: handleIndexUpdate,
      onChange: handleChange,
      index: i,
      label: getLabel(name),
      name,
      isChecked: name === "email" || active.includes(name)
    },
    i,
    false,
    {
      fileName: "app/components/dragNdrop/NewSorter.tsx",
      lineNumber: 81,
      columnNumber: 32
    },
    this
  )) }, void 0, false, {
    fileName: "app/components/dragNdrop/NewSorter.tsx",
    lineNumber: 80,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/dragNdrop/NewSorter.tsx",
    lineNumber: 79,
    columnNumber: 10
  }, this);
};
_s(Sorter, "09I6STqMAdXW98lO0zS4mGB+pRI=");
_c = Sorter;
var _c;
$RefreshReg$(_c, "Sorter");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/routes/config.$projectId.basic.tsx
var import_jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/config.$projectId.basic.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s2 = $RefreshSig$();
var _s22 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/config.$projectId.basic.tsx"
  );
}
var links = () => {
  return [{
    rel: "stylesheet",
    href: app_default
  }];
};
function BasicConfig() {
  _s2();
  const {
    configuration,
    isPro,
    projectId,
    type
  } = useLoaderData();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [config, setConfig] = (0, import_react3.useState)(configuration);
  const {
    save
  } = useLocalStorage();
  const renders = (0, import_react3.useRef)(0);
  const params = useParams();
  const [isProOpen2, setIsProOpen2] = (0, import_react3.useState)(false);
  (0, import_react3.useEffect)(() => {
    setConfig(configuration);
  }, [configuration]);
  (0, import_react3.useEffect)(() => {
    if (renders.current > 0) {
      save("config", config);
    }
    renders.current += 1;
  }, [save, config]);
  (0, import_react3.useEffect)(() => {
  }, [fetcher]);
  const isDisabled = (0, import_react3.useMemo)(() => {
    const result = configSchema.safeParse(config);
    return !result.success;
  }, [config]);
  const handleInputOrder = (inputs) => setConfig((c) => ({
    ...c,
    inputs
  }));
  const handleThemeChange = (theme) => setConfig((c) => ({
    ...c,
    theme
  }));
  const handleBorderChange = (border) => setConfig((c) => ({
    ...c,
    border
  }));
  const handleColorChange = (ctaColor) => setConfig((c) => ({
    ...c,
    ctaColor
  }));
  const handleWaterMark = (watermark) => setConfig((c) => ({
    ...c,
    watermark
  }));
  const handleSubmit = (e) => {
    e == null ? void 0 : e.preventDefault();
    fetcher.submit({
      intent: "next",
      data: JSON.stringify(config)
    }, {
      method: "post"
    });
  };
  const openCustomInputModal = () => {
    navigate("custom");
  };
  const getOrderFromConfig = () => {
    var _a;
    return config.inputs.concat(BASIC_INPUTS.filter((name) => !config.inputs.includes(name))).concat(isPro ? (_a = config.customInputs) == null ? void 0 : _a.map((obj) => obj.name).filter((name) => !config.inputs.includes(name)) : []);
  };
  const [order, setOrder] = (0, import_react3.useState)(getOrderFromConfig());
  (0, import_react3.useEffect)(() => {
    const used = order.filter((name) => config.inputs.includes(name));
    handleInputOrder(used);
  }, [order]);
  (0, import_react3.useEffect)(() => {
    setOrder(getOrderFromConfig());
  }, [config.customInputs]);
  const handleInputsUpdate = (inputs) => {
    setConfig((c) => ({
      ...c,
      inputs
    }));
  };
  const getSorterInfo = (info) => {
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
        return void 0;
      } else if (type !== "subscription") {
        return handleInputsUpdate;
      }
    }
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("article", { className: "flex flex-wrap h-[100vh] text-space-800 dark:text-white dark:bg-space-900  ", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("section", { className: " w-full lg:min-w-[520px] h-full lg:max-w-[520px] pt-12 md:px-12 px-4 overflow-y-scroll noscroll", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { style: {
      height: "calc(100vh - 160px)"
    }, className: "w-full h-full ", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "h-full ", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h2", { className: "text-3xl font-bold text-space-800 dark:text-white", children: "Configura tu formmy \u{1F3AF}" }, void 0, false, {
        fileName: "app/routes/config.$projectId.basic.tsx",
        lineNumber: 247,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "mb-4 pt-6 text-md font-normal text-gray-600 dark:text-space-300", children: type === "subscription" ? /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("span", { children: "Tu Formmy de suscripci\xF3n solo soporta email" }, void 0, false, {
        fileName: "app/routes/config.$projectId.basic.tsx",
        lineNumber: 251,
        columnNumber: 42
      }, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("span", { children: "\xBFQu\xE9 campos quieres agregar a tu formmy? Arrasta los campos para acomodarlos o eliminarlos." }, void 0, false, {
        fileName: "app/routes/config.$projectId.basic.tsx",
        lineNumber: 251,
        columnNumber: 101
      }, this) }, void 0, false, {
        fileName: "app/routes/config.$projectId.basic.tsx",
        lineNumber: 250,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(fetcher.Form, { onSubmit: handleSubmit, className: "flex flex-col items-start h-full", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Sorter, { names: getSorterInfo("names"), defaultActive: getSorterInfo("active"), onUpdate: getSorterInfo("onUpdate") }, void 0, false, {
          fileName: "app/routes/config.$projectId.basic.tsx",
          lineNumber: 259,
          columnNumber: 15
        }, this),
        type !== "subscription" && /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { onClick: isPro ? openCustomInputModal : () => setIsProOpen2(true), type: "button", className: twMerge("relative text-left text-gray-500 hover:text-gray-600 text-sm py-3", !isPro && "mt-2"), children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("span", { children: "+ Agregar otro" }, void 0, false, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 263,
            columnNumber: 19
          }, this),
          !isPro && /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(ProTag, {}, void 0, false, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 264,
            columnNumber: 30
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/config.$projectId.basic.tsx",
          lineNumber: 261,
          columnNumber: 43
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "pt-6 text-md font-normal text-gray-600 dark:text-space-300", children: "\xBFQu\xE9 tema combina m\xE1s con tu website?" }, void 0, false, {
          fileName: "app/routes/config.$projectId.basic.tsx",
          lineNumber: 267,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "flex pt-4 text-xs gap-4", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { type: "button", className: "text-center relative", onClick: () => handleThemeChange("light"), children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("img", { className: twMerge("w-full object-contain   transition-all", config.theme === "light" ? " ring-brand-500 rounded-md ring" : null), src: "/assets/light-theme.svg", alt: "" }, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 273,
              columnNumber: 19
            }, this),
            config.theme === "light" && /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Palomita, {}, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 275,
              columnNumber: 48
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "pt-2 fonr-light text-space-600 dark:text-space-300", children: "Light" }, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 276,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 271,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { type: "button", onClick: () => handleThemeChange("dark"), className: "text-center relative", children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("img", { className: twMerge("flex dark:hidden w-full object-contain  transition-all", config.theme === "dark" ? " ring-brand-500 rounded-md ring" : null), src: "/assets/dark-theme.svg", alt: "darkmode" }, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 282,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("img", { className: twMerge("hidden dark:flex w-full object-contain  transition-all", config.theme === "dark" ? " ring-brand-500 rounded-md ring" : null), src: "/assets/darkmode-dark.svg", alt: "darkmode" }, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 284,
              columnNumber: 19
            }, this),
            config.theme === "dark" && /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Palomita, {}, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 286,
              columnNumber: 47
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "pt-2 text-space-600 dark:text-space-300", children: "Dark" }, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 287,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 280,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/config.$projectId.basic.tsx",
          lineNumber: 270,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "pt-6 text-md font-normal text-gray-600 dark:text-space-300", children: "\xBFQu\xE9 estilo te gusta m\xE1s?" }, void 0, false, {
          fileName: "app/routes/config.$projectId.basic.tsx",
          lineNumber: 292,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "flex pt-4 text-xs gap-4", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { type: "button", onClick: () => handleBorderChange("redondo"), className: "text-center relative", children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("img", { className: twMerge("flex dark:hidden w-full object-contain", config.border === "redondo" ? " ring-brand-500 rounded-md ring" : null), src: "/assets/rounded.svg", alt: " rounded input" }, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 298,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("img", { className: twMerge("hidden dark:flex w-full object-contain", config.border === "redondo" ? " ring-brand-500 rounded-md ring" : null), src: "/assets/dark-rounded.svg", alt: " rounded input" }, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 300,
              columnNumber: 19
            }, this),
            config.border === "redondo" && /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Palomita, {}, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 302,
              columnNumber: 51
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "pt-2 text-space-600 dark:text-space-300", children: "Redondo" }, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 303,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 296,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { type: "button", onClick: () => handleBorderChange("cuadrado"), className: "text-center relative", children: [
            config.border === "cuadrado" && /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Palomita, {}, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 309,
              columnNumber: 52
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("img", { className: twMerge("flex dark:hidden w-full object-contain", config.border === "cuadrado" ? " ring-brand-500 rounded-md ring" : null), src: "/assets/not-rounded.svg", alt: "no rounded input" }, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 310,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("img", { className: twMerge("hidden dark:flex w-full object-contain", config.border === "cuadrado" ? " ring-brand-500 rounded-md ring" : null), src: "/assets/dark-norounded.svg", alt: "no rounded input" }, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 312,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "pt-2 text-space-600 dark:text-space-300", children: "Cuadrado" }, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 314,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 307,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/config.$projectId.basic.tsx",
          lineNumber: 295,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "pt-6 pb-4 text-md font-normal text-gray-600 dark:text-space-300", children: "Elige o escribe el color del bot\xF3n (hex)" }, void 0, false, {
          fileName: "app/routes/config.$projectId.basic.tsx",
          lineNumber: 320,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("label", { htmlFor: "color", className: " text-xs text-gray-400 flex items-center justify-between relative", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("input", { onClick: (e) => e.currentTarget.select(), onChange: (e) => {
            handleColorChange(e.currentTarget.value);
          }, className: " focus:border-brand-500 bg-transparent  focus:ring-brand-500 focus:outline-none ring-transparent  active:ring-transparent pl-8 w-28 py-2 pr-2 rounded border-gray-100 dark:border-clear/20", id: "color", type: "text", value: config.ctaColor }, void 0, false, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 325,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(ColorCube, { style: {
            backgroundColor: config.ctaColor
          }, className: "absolute top-3 left-2" }, void 0, false, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 329,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/config.$projectId.basic.tsx",
          lineNumber: 323,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "flex flex-wrap gap-1 mt-2 ", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(ColorCube, { hexColor: "#bb333c", onClick: () => handleColorChange("#bb333c") }, void 0, false, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 335,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(ColorCube, { hexColor: "#f79c08", onClick: () => handleColorChange("#f79c08") }, void 0, false, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 337,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(ColorCube, { hexColor: "#705fe0", onClick: () => handleColorChange("#705fe0") }, void 0, false, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 339,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(ColorCube, { hexColor: "#F6C056", onClick: () => handleColorChange("#F6C056") }, void 0, false, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 341,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(ColorCube, { onClick: () => handleColorChange("#69A753"), hexColor: "#69A753" }, void 0, false, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 343,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(ColorCube, { onClick: () => handleColorChange("#ae7098"), hexColor: "#ae7098" }, void 0, false, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 345,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(ColorCube, { onClick: () => handleColorChange("#1C7AE9"), hexColor: "#1C7AE9" }, void 0, false, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 347,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/config.$projectId.basic.tsx",
          lineNumber: 334,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "my-4", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "pt-6 pb-4 text-md font-normal text-gray-600 dark:text-space-300", children: "Eliminar marca de agua" }, void 0, false, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 351,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "relative inline-block", children: [
            !isPro && /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(ProTag, { isOpen: isProOpen2, onChange: (value) => setIsProOpen2(value) }, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 355,
              columnNumber: 32
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Toggle, { isDisabled: !isPro, onChange: handleWaterMark, defaultValue: config.watermark }, void 0, false, {
              fileName: "app/routes/config.$projectId.basic.tsx",
              lineNumber: 358,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 354,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/config.$projectId.basic.tsx",
          lineNumber: 350,
          columnNumber: 16
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "flex gap-4 mt-auto sticky w-full  bottom-0 z-10 bg-gradient-to-b from-transparent to-clear pb-8  dark:to-space-900 ", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { onClick: () => navigate("/dash/" + params.projectId), type: "button", className: twMerge(" grow h-12 rounded-full text-base mt-10 disabled:bg-gray-100 bg-gray-200 text-gray-600 disabled:text-gray-400"), children: "Atr\xE1s" }, void 0, false, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 365,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { disabled: isDisabled || fetcher.state !== "idle", type: "submit", className: twMerge("hover:bg-brand-300 grow-[2] h-12 rounded-full text-base mt-10 disabled:bg-gray-100 bg-brand-500 text-clear disabled:text-gray-400"), children: "Continuar" }, void 0, false, {
            fileName: "app/routes/config.$projectId.basic.tsx",
            lineNumber: 369,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/config.$projectId.basic.tsx",
          lineNumber: 364,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/config.$projectId.basic.tsx",
        lineNumber: 257,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/config.$projectId.basic.tsx",
      lineNumber: 246,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.tsx",
      lineNumber: 242,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.tsx",
      lineNumber: 241,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("section", { className: twMerge("grow h-full", config.theme), children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Visualizer, { projectId, config, isPro, type, message: "\xA1As\xED se ver\xE1 tu Formmy! Y se comportar\xE1 de forma responsiva y con fondo\n        transparente." }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.tsx",
      lineNumber: 380,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.tsx",
      lineNumber: 379,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Outlet, {}, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.tsx",
      lineNumber: 385,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/config.$projectId.basic.tsx",
    lineNumber: 240,
    columnNumber: 10
  }, this);
}
_s2(BasicConfig, "nyjQLamh8xLA0dIxEEBWW1y6E/o=", false, function() {
  return [useLoaderData, useNavigate, useFetcher, useLocalStorage, useParams];
});
_c2 = BasicConfig;
var Visualizer = ({
  projectId,
  message,
  config,
  isPro,
  onSubmit,
  type
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "w-full h-full bg-slate-100 dark:bg-hole py-10 lg:py-0 overflow-scroll", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "text-space-800/40 dark:text-gray-400 font-light text-center w-full py-6 ", children: message }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.tsx",
      lineNumber: 401,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "grid place-items-center h-[90%]", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Formmy, { type, onSubmit, projectId, isDemo: true, config, size: "sm", isPro }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.tsx",
      lineNumber: 405,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.tsx",
      lineNumber: 404,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/config.$projectId.basic.tsx",
    lineNumber: 400,
    columnNumber: 10
  }, this);
};
_c22 = Visualizer;
var CheckInput = (0, import_react3.forwardRef)(_c3 = ({
  onChange,
  name,
  isDisabled,
  label,
  isChecked,
  index,
  onUpdate
}, ref) => {
  const handleDrag = (event) => {
    const nodes = document.elementsFromPoint(event.clientX, event.clientY);
    nodes.forEach((node) => {
      var _a;
      const indx = Number((_a = node.dataset) == null ? void 0 : _a.index);
      if (!isNaN(indx) && index !== indx) {
        onUpdate == null ? void 0 : onUpdate(index, indx);
      }
    });
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(
    motion.label,
    {
      whileTap: {
        cursor: "grabbing"
      },
      layoutId: name,
      layout: true,
      onDragEnd: handleDrag,
      "data-index": index,
      whileDrag: {
        zIndex: 10
      },
      ref,
      drag: true,
      htmlFor: name,
      dragSnapToOrigin: true,
      className: cn("rounded-lg border font-light border-[#E3E1E1] dark:border-clear/20 py-1 px-2 text-sm text-gray-500 flex items-center justify-between w-32 h-[36px] bg-[white] dark:bg-transparent cursor-grab relative", {
        "": true
      }),
      children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("span", { className: "truncate pointer-events-none", children: [
          " ",
          label
        ] }, void 0, true, {
          fileName: "app/routes/config.$projectId.basic.tsx",
          lineNumber: 438,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("input", { disabled: isDisabled, name, onChange: (event) => onChange == null ? void 0 : onChange(name, event.target.checked), id: name, type: "checkbox", checked: isChecked, className: "rounded-full border-[1px] bg-transparent border-brand-500 ring-transparent focus:ring-1 focus:ring-brand-500 checked:bg-brand-500 	enabled:hover:none focus:bg-transparent bg-brand-500 checked:hover:bg-brand-500 checked:focus:bg-brand-500 " }, void 0, false, {
          fileName: "app/routes/config.$projectId.basic.tsx",
          lineNumber: 439,
          columnNumber: 9
        }, this)
      ]
    },
    name,
    true,
    {
      fileName: "app/routes/config.$projectId.basic.tsx",
      lineNumber: 429,
      columnNumber: 10
    },
    this
  );
});
_c4 = CheckInput;
var Palomita = ({
  className
}) => /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("span", { className: twMerge("absolute top-2 right-2 text-[8px] text-white w-3 h-3 flex justify-center items-center bg-brand-500 rounded-full ", className), children: "\u2713" }, void 0, false, {
  fileName: "app/routes/config.$projectId.basic.tsx",
  lineNumber: 446,
  columnNumber: 7
}, this);
_c5 = Palomita;
var ColorCube = ({
  className,
  onClick,
  style,
  hexColor = "#bb333c"
}) => /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { type: "button", onClick, className: twMerge("w-4 h-4 rounded cursor-pointer", `bg-[${hexColor}]`, className), style: {
  backgroundColor: hexColor,
  ...style
} }, void 0, false, {
  fileName: "app/routes/config.$projectId.basic.tsx",
  lineNumber: 456,
  columnNumber: 7
}, this);
_c6 = ColorCube;
var SelectableImage = ({
  onClick,
  src,
  text = null,
  name,
  defaultValue
}) => {
  _s22();
  const inputRef = (0, import_react3.useRef)(null);
  const id = (0, import_react3.useId)();
  (0, import_react3.useEffect)(() => {
  }, [inputRef.current]);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("label", { onClick, role: "button", htmlFor: id, className: "text-center relative w-full ", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("input", { ref: inputRef, id, className: "peer/radio hidden", name, type: "radio", value: defaultValue }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.tsx",
      lineNumber: 474,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("img", { className: twMerge("w-full object-contain   transition-all", "peer-checked/radio:ring-brand-500 peer-checked/radio:rounded-md peer-checked/radio:ring"), src: src || "/assets/light-theme.svg", alt: "" }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.tsx",
      lineNumber: 476,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Palomita, { className: "peer-checked/radio:block hidden" }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.tsx",
      lineNumber: 478,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "pt-2 text-xs text-space-600 dark:text-space-300 peer-checked/radio:text-gray-500", children: text }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.tsx",
      lineNumber: 479,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/config.$projectId.basic.tsx",
    lineNumber: 472,
    columnNumber: 10
  }, this);
};
_s22(SelectableImage, "ROlWJboTUqOUiwtEwD8oHibV22w=", false, function() {
  return [import_react3.useId];
});
_c7 = SelectableImage;
var _c2;
var _c22;
var _c3;
var _c4;
var _c5;
var _c6;
var _c7;
$RefreshReg$(_c2, "BasicConfig");
$RefreshReg$(_c22, "Visualizer");
$RefreshReg$(_c3, "CheckInput$forwardRef");
$RefreshReg$(_c4, "CheckInput");
$RefreshReg$(_c5, "Palomita");
$RefreshReg$(_c6, "ColorCube");
$RefreshReg$(_c7, "SelectableImage");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

export {
  app_default,
  links,
  BasicConfig,
  Visualizer,
  Palomita,
  SelectableImage
};
//# sourceMappingURL=/build/_shared/chunk-XZ7VDIAU.js.map
