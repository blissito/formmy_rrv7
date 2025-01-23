import {
  IconCube
} from "/build/_shared/chunk-SU6Z44HG.js";
import "/build/_shared/chunk-XZ7VDIAU.js";
import "/build/_shared/chunk-GAAUEO2B.js";
import "/build/_shared/chunk-WAI7GNH5.js";
import "/build/_shared/chunk-YSJMGTXM.js";
import "/build/_shared/chunk-N7VDZ2JV.js";
import "/build/_shared/chunk-IYD4CINF.js";
import "/build/_shared/chunk-OMYSDXL4.js";
import "/build/_shared/chunk-SGWSEZXL.js";
import "/build/_shared/chunk-2E2SUJIS.js";
import "/build/_shared/chunk-EFXLBPE4.js";
import {
  Modal
} from "/build/_shared/chunk-3UHNKOCO.js";
import "/build/_shared/chunk-RGBYWDPK.js";
import "/build/_shared/chunk-QZYI3ZKT.js";
import "/build/_shared/chunk-7ZNLIBJB.js";
import "/build/_shared/chunk-XGABADQ5.js";
import "/build/_shared/chunk-ZOHFZ5HT.js";
import "/build/_shared/chunk-NMZL6IDN.js";
import {
  Spinner
} from "/build/_shared/chunk-QKNDBCR7.js";
import "/build/_shared/chunk-B3ATQ6F7.js";
import {
  require_db
} from "/build/_shared/chunk-KONDUBG3.js";
import {
  require_node
} from "/build/_shared/chunk-G7CHZRZX.js";
import "/build/_shared/chunk-GIAAE3CH.js";
import {
  Form,
  useActionData,
  useNavigation
} from "/build/_shared/chunk-MUQCVLXB.js";
import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-XU7DNSPJ.js";
import {
  createHotContext
} from "/build/_shared/chunk-2F64VKTU.js";
import "/build/_shared/chunk-UWV35TSL.js";
import {
  require_react
} from "/build/_shared/chunk-BOXFZXVX.js";
import {
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// app/routes/dash.new.tsx
var import_node = __toESM(require_node());
var import_db = __toESM(require_db());
var import_react2 = __toESM(require_react());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/dash.new.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
var _s2 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/dash.new.tsx"
  );
  import.meta.hot.lastModified = "1737642690814.8064";
}
function New() {
  _s();
  const navigation = useNavigation();
  const actionData = useActionData();
  const handleFormmyTypeChange = (type) => {
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Modal, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Form, { method: "post", className: "px-6 py-8 md:pb-10 md:pt-0 gap-2 bg-clear dark:bg-space-900 rounded-3xl dark:text-white text-space-900 ", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { className: "font-bold mb-10 text-2xl text-left mt-6 md:mt-0", children: "Ponle nombre a tu Formmy" }, void 0, false, {
      fileName: "app/routes/dash.new.tsx",
      lineNumber: 90,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex w-full", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", { name: "name", required: true, placeholder: "Nombre de tu proyecto ", className: "h-10  input font-normal w-full md:w-80 border-[1px] border-gray-100 dark:border-clear/30 dark:bg-transparent focus:outline-none focus:ring-0 bg-transparent focus:border-brand-500 rounded-bl-lg rounded-tl-lg placeholder:text-space-300" }, void 0, false, {
        fileName: "app/routes/dash.new.tsx",
        lineNumber: 94,
        columnNumber: 15
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { name: "intent", value: "create", type: "submit", className: "bg-brand-500 h-10 text-clear py-2 px-4 md:px-8 rounded-br-lg rounded-tr-lg", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "w-10 h-6", children: navigation.state !== "idle" ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Spinner, {}, void 0, false, {
        fileName: "app/routes/dash.new.tsx",
        lineNumber: 98,
        columnNumber: 50
      }, this) : "Crear" }, void 0, false, {
        fileName: "app/routes/dash.new.tsx",
        lineNumber: 97,
        columnNumber: 17
      }, this) }, void 0, false, {
        fileName: "app/routes/dash.new.tsx",
        lineNumber: 96,
        columnNumber: 15
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash.new.tsx",
      lineNumber: 93,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "mt-6 text-gray-600 dark:text-space-300", children: "Escoge el tipo de Formmy" }, void 0, false, {
      fileName: "app/routes/dash.new.tsx",
      lineNumber: 102,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FormmyTypeSelect, {}, void 0, false, {
      fileName: "app/routes/dash.new.tsx",
      lineNumber: 105,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "h-6", children: !(actionData == null ? void 0 : actionData.ok) && (actionData == null ? void 0 : actionData.error.issues.map((issue) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "text-red-500 ", children: issue.message }, issue.code, false, {
      fileName: "app/routes/dash.new.tsx",
      lineNumber: 108,
      columnNumber: 73
    }, this))) }, void 0, false, {
      fileName: "app/routes/dash.new.tsx",
      lineNumber: 107,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dash.new.tsx",
    lineNumber: 89,
    columnNumber: 11
  }, this) }, void 0, false, {
    fileName: "app/routes/dash.new.tsx",
    lineNumber: 88,
    columnNumber: 9
  }, this) }, void 0, false, {
    fileName: "app/routes/dash.new.tsx",
    lineNumber: 87,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/routes/dash.new.tsx",
    lineNumber: 86,
    columnNumber: 10
  }, this);
}
_s(New, "1AETIiPCWpdcL3+sPGUbmCFrInE=", false, function() {
  return [useNavigation, useActionData];
});
_c = New;
var FormmyTypeSelect = ({
  onChange,
  defaultValue = "contact"
}) => {
  _s2();
  const [selected, setSelected] = (0, import_react2.useState)(defaultValue);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "mt-4 flex gap-4 items-center", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", { type: "hidden", name: "type", value: selected }, void 0, false, {
      fileName: "app/routes/dash.new.tsx",
      lineNumber: 128,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(IconCube, { isSelected: selected === "subscription", className: " h-full w-[200px] dark:hidden block ", src: "/assets/hero/add-suscription-w.png ", onClick: () => setSelected("subscription") }, void 0, false, {
        fileName: "app/routes/dash.new.tsx",
        lineNumber: 130,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(IconCube, { isSelected: selected === "subscription", className: " h-auto w-[200px] hidden dark:block  bg-transparent", onClick: () => setSelected("subscription"), src: "/assets/hero/add-suscription-d.png " }, void 0, false, {
        fileName: "app/routes/dash.new.tsx",
        lineNumber: 131,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "text-gray-600 dark:text-space-300 font-light text-center text-xs pt-3", children: "Formulario de suscripci\xF3n" }, void 0, false, {
        fileName: "app/routes/dash.new.tsx",
        lineNumber: 132,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash.new.tsx",
      lineNumber: 129,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [
      " ",
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(IconCube, { isSelected: selected === "contact", className: " h-auto w-[200px] dark:hidden block", onClick: () => setSelected("contact"), src: "/assets/hero/add-form-w.png" }, void 0, false, {
        fileName: "app/routes/dash.new.tsx",
        lineNumber: 138,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(IconCube, { isSelected: selected === "contact", className: " h-auto w-[200px] hidden dark:block bg-transparent", onClick: () => setSelected("contact"), src: "/assets/hero/add-form-d.png" }, void 0, false, {
        fileName: "app/routes/dash.new.tsx",
        lineNumber: 139,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "text-gray-600 dark:text-space-300 font-light text-center text-xs pt-3", children: "Formulario de contacto" }, void 0, false, {
        fileName: "app/routes/dash.new.tsx",
        lineNumber: 140,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash.new.tsx",
      lineNumber: 136,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dash.new.tsx",
    lineNumber: 127,
    columnNumber: 10
  }, this);
};
_s2(FormmyTypeSelect, "+je1LhJiKYRwlU9jgDfC/VH7l5o=");
_c2 = FormmyTypeSelect;
var _c;
var _c2;
$RefreshReg$(_c, "New");
$RefreshReg$(_c2, "FormmyTypeSelect");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  New as default
};
//# sourceMappingURL=/build/routes/dash.new-L47HXHF7.js.map
