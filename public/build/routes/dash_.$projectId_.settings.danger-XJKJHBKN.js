import {
  TextField
} from "/build/_shared/chunk-GAAUEO2B.js";
import "/build/_shared/chunk-WAI7GNH5.js";
import "/build/_shared/chunk-YSJMGTXM.js";
import {
  ConfirmModal
} from "/build/_shared/chunk-3UHNKOCO.js";
import "/build/_shared/chunk-RGBYWDPK.js";
import {
  Button
} from "/build/_shared/chunk-QZYI3ZKT.js";
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
  init_dist,
  useFetcher,
  useLoaderData
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

// app/routes/dash_.$projectId_.settings.danger.tsx
var import_node = __toESM(require_node());
var import_react = __toESM(require_react());
init_dist();
var import_db = __toESM(require_db());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/dash_.$projectId_.settings.danger.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/dash_.$projectId_.settings.danger.tsx"
  );
  import.meta.hot.lastModified = "1737595661959.4724";
}
function Page() {
  _s();
  const {
    project
  } = useLoaderData();
  const fetcher = useFetcher();
  const [match, set] = (0, import_react.useState)("");
  const [showConfirm, setShowConfirm] = (0, import_react.useState)(false);
  const handleDelete = () => {
    fetcher.submit({
      intent: "delete"
    }, {
      method: "post"
    });
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "flex flex-col", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { className: "text-xl font-bold truncate", children: [
          "Configuraci\xF3n ",
          project.name
        ] }, void 0, true, {
          fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
          lineNumber: 90,
          columnNumber: 11
        }, this),
        fetcher.state !== "idle" && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Spinner, {}, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
          lineNumber: 93,
          columnNumber: 40
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
        lineNumber: 89,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("hr", { className: "mt-2 mb-6 dark:border-t-white/10" }, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
        lineNumber: 95,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex flex-col gap-14 p-4 border-2 border-[#FB5252] rounded-xl dark:bg-red-100\n         bg-red-100/50", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "font-bold text-md text-red-500", children: "Esto eliminar\xE1 tu Formmy y todos sus mensajes" }, void 0, false, {
            fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
            lineNumber: 100,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "font-light text-sm text-red-700", children: [
            "Si tienes alguna duda, recuerda que siempre podemos platicar:",
            " ",
            /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", { href: "mailto:hola@formmy.app", children: "hola@formmy.app" }, void 0, false, {
              fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
              lineNumber: 105,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
            lineNumber: 103,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
          lineNumber: 99,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, { isLoading: fetcher.state !== "idle", onClick: () => setShowConfirm(true), className: "bg-[#FB5252] hover:scale-95 transition-all text-xs m-0", type: "submit", children: "Eliminar Formmy" }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
          lineNumber: 108,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
        lineNumber: 98,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
        lineNumber: 96,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
      lineNumber: 88,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ConfirmModal, { onClose: () => setShowConfirm(false), isOpen: showConfirm, title: "\xBFEst\xE1s segur@ de eliminar este Formmy?", message: "Si lo eliminas, dejar\xE1s de recibir mensajes y todos los mensajes que\n            ten\xEDas se eliminar\xE1n autom\xE1ticamente.", footer: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex mb-8", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, { autoFocus: true, onClick: () => setShowConfirm(false), className: "bg-gray-300 text-space-700", children: "Cancelar" }, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
        lineNumber: 117,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, { isLoading: fetcher.state !== "idle", onClick: match === project.name ? handleDelete : void 0, isDisabled: match !== project.name, className: "bg-red-400 text-red-100 not:disabled:hover:scale-105 transition-all disabled:bg-gray-500 disabled:text-gray-800", children: "S\xED, eliminar" }, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
        lineNumber: 120,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
      lineNumber: 116,
      columnNumber: 60
    }, this), children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("form", { onSubmit: (e) => {
      e.preventDefault();
      if (match === project.name) {
        handleDelete();
      }
    }, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(TextField, { onChange: (value) => set(value), name: "name", label: `Escribe el nombre del Formmy: ${project.name}`, type: "text", placeholder: project.name, className: "mb-0", autocomplete: "off", onPaste: (e) => e.preventDefault() }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
      lineNumber: 130,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
      lineNumber: 124,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
      lineNumber: 115,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dash_.$projectId_.settings.danger.tsx",
    lineNumber: 87,
    columnNumber: 10
  }, this);
}
_s(Page, "T/Z+DG4YwVYdMG+bpRXNkJlnMQo=", false, function() {
  return [useLoaderData, useFetcher];
});
_c = Page;
var _c;
$RefreshReg$(_c, "Page");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Page as default
};
//# sourceMappingURL=/build/routes/dash_.$projectId_.settings.danger-XJKJHBKN.js.map
