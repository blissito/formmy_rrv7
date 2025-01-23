import "/build/_shared/chunk-WAI7GNH5.js";
import "/build/_shared/chunk-YSJMGTXM.js";
import {
  ProTag
} from "/build/_shared/chunk-OMYSDXL4.js";
import "/build/_shared/chunk-SGWSEZXL.js";
import "/build/_shared/chunk-2E2SUJIS.js";
import {
  Toggle
} from "/build/_shared/chunk-EFXLBPE4.js";
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
  useFetcher2 as useFetcher,
  useLoaderData2 as useLoaderData
} from "/build/_shared/chunk-MUQCVLXB.js";
import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-XU7DNSPJ.js";
import {
  createHotContext
} from "/build/_shared/chunk-2F64VKTU.js";
import "/build/_shared/chunk-UWV35TSL.js";
import "/build/_shared/chunk-BOXFZXVX.js";
import {
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// app/routes/dash_.$projectId_.settings.notifications.tsx
var import_node = __toESM(require_node());
var import_db = __toESM(require_db());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/dash_.$projectId_.settings.notifications.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/dash_.$projectId_.settings.notifications.tsx"
  );
  import.meta.hot.lastModified = "1707709500260.7522";
}
function Route() {
  _s();
  const {
    notifications = {
      new: true,
      members: false,
      warning: false
    },
    // true defaults ;)
    isPro
  } = useLoaderData();
  const fetcher = useFetcher();
  const updateSettingsWarning = (bool) => fetcher.submit({
    ...notifications,
    warning: bool
  }, {
    method: "post"
  });
  const updateSettingsMembers = (bool) => fetcher.submit({
    ...notifications,
    members: bool
  }, {
    method: "post"
  });
  const updateSettingsNew = (bool) => {
    if (!isPro) {
      fetcher.submit({
        new: bool,
        members: false,
        warning: false
      }, {
        method: "post"
      });
      return;
    }
    fetcher.submit({
      ...notifications,
      new: bool
    }, {
      method: "post"
    });
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "flex flex-col", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { className: "text-xl font-bold", children: "Notificaciones por email" }, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
        lineNumber: 116,
        columnNumber: 9
      }, this),
      fetcher.state !== "idle" && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Spinner, {}, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
        lineNumber: 117,
        columnNumber: 38
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
      lineNumber: 115,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("hr", { className: "mt-2 mb-6 dark:border-t-white/10" }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
      lineNumber: 119,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex flex-col gap-14", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "font-bold text-md", children: "Nuevos mensajes" }, void 0, false, {
            fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
            lineNumber: 123,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "font-light text-sm text-gray-500", children: "Recibe un correo cada que tu Formmy recibe un nuevo mensaje." }, void 0, false, {
            fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
            lineNumber: 124,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
          lineNumber: 122,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Toggle, { onChange: updateSettingsNew, name: "new", defaultValue: notifications.new }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
          lineNumber: 128,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
        lineNumber: 121,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "font-bold text-md", children: "Cambio en los miembros" }, void 0, false, {
            fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
            lineNumber: 133,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "font-light text-sm text-gray-500", children: "Recibe un correo cuando un nuevo usuario acepte tu invitaci\xF3n" }, void 0, false, {
            fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
            lineNumber: 134,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
          lineNumber: 132,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "relative", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Toggle, { onChange: updateSettingsMembers, isDisabled: !isPro, defaultValue: notifications.members }, void 0, false, {
            fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
            lineNumber: 139,
            columnNumber: 13
          }, this),
          !isPro && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ProTag, {}, void 0, false, {
            fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
            lineNumber: 140,
            columnNumber: 24
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
          lineNumber: 138,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
        lineNumber: 131,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "font-bold text-md", children: "Actividad en tu formmy" }, void 0, false, {
            fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
            lineNumber: 146,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "font-light text-sm text-gray-500", children: "Recibe un correo cuando se apliquen cambios importantes en tu Formmy (como al eliminar mensajes)" }, void 0, false, {
            fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
            lineNumber: 147,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
          lineNumber: 145,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "relative", children: [
          !isPro && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ProTag, {}, void 0, false, {
            fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
            lineNumber: 153,
            columnNumber: 24
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Toggle, { onChange: updateSettingsWarning, isDisabled: !isPro, defaultValue: notifications.warning }, void 0, false, {
            fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
            lineNumber: 154,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
          lineNumber: 152,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
        lineNumber: 144,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
      lineNumber: 120,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dash_.$projectId_.settings.notifications.tsx",
    lineNumber: 114,
    columnNumber: 10
  }, this);
}
_s(Route, "SsZl5GUz9E3/hafwU4ixIBHpxJM=", false, function() {
  return [useLoaderData, useFetcher];
});
_c = Route;
var _c;
$RefreshReg$(_c, "Route");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Route as default
};
//# sourceMappingURL=/build/routes/dash_.$projectId_.settings.notifications-H3FGOI5H.js.map
