import {
  BackGround,
  IoReturnUpBackOutline
} from "/build/_shared/chunk-N7VDZ2JV.js";
import "/build/_shared/chunk-IYD4CINF.js";
import {
  ProTag
} from "/build/_shared/chunk-OMYSDXL4.js";
import "/build/_shared/chunk-SGWSEZXL.js";
import "/build/_shared/chunk-2E2SUJIS.js";
import {
  NavBar_default
} from "/build/_shared/chunk-EFXLBPE4.js";
import "/build/_shared/chunk-3UHNKOCO.js";
import "/build/_shared/chunk-RGBYWDPK.js";
import "/build/_shared/chunk-QZYI3ZKT.js";
import "/build/_shared/chunk-7ZNLIBJB.js";
import "/build/_shared/chunk-XGABADQ5.js";
import "/build/_shared/chunk-ZOHFZ5HT.js";
import "/build/_shared/chunk-NMZL6IDN.js";
import "/build/_shared/chunk-QKNDBCR7.js";
import {
  twMerge
} from "/build/_shared/chunk-B3ATQ6F7.js";
import "/build/_shared/chunk-KONDUBG3.js";
import "/build/_shared/chunk-G7CHZRZX.js";
import "/build/_shared/chunk-GIAAE3CH.js";
import {
  Link,
  Outlet,
  useLoaderData2 as useLoaderData,
  useLocation,
  useNavigate,
  useParams
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

// app/routes/dash_.$projectId_.settings.tsx
var import_react2 = __toESM(require_react());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/dash_.$projectId_.settings.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/dash_.$projectId_.settings.tsx"
  );
  import.meta.hot.lastModified = "1711326193203.421";
}
function Route() {
  _s();
  const {
    user
  } = useLoaderData();
  const [show, setShow] = (0, import_react2.useState)(false);
  const navigate = useNavigate();
  const params = useParams();
  const {
    pathname
  } = useLocation();
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("article", { className: "min-h-screen pb-8 relative  ", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BackGround, { className: "bg-clear " }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.tsx",
      lineNumber: 49,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(NavBar_default, { user }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.tsx",
      lineNumber: 50,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("main", { className: "flex md:flex-row flex-col pt-28 px-4 max-w-6xl mx-auto text-space-800 dark:text-white relative", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "absolute top-24 left-12  py-2 border rounded-md px-2 hover:scale-105 active:scale-100 border-brand-500 text-brand-500 cursor-pointer", onClick: () => navigate("/dash/" + params.projectId), children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(IoReturnUpBackOutline, {}, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.tsx",
        lineNumber: 53,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.tsx",
        lineNumber: 52,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("nav", { className: "bg-gray-50 m-8 flex flex-col gap-4 py-8 dark:bg-gray-900 rounded-lg", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "pl-8 font-bold", children: "General" }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.settings.tsx",
          lineNumber: 56,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(MenuItem, { isActive: pathname.includes("notifications"), to: "notifications", className: twMerge(pathname.includes("notifications") && "border-l-4 border-brand-500", "px-12 py-2 font-normal text-gray-600 dark:text-gray-400"), text: "Notificaciones" }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.settings.tsx",
          lineNumber: 57,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(MenuItem, { isActive: pathname.includes("danger"), to: "danger", className: twMerge(pathname.includes("danger") && "border-l-4 border-brand-500", "px-12 py-2 font-normal text-gray-600 dark:text-gray-400"), text: "Danger Zone" }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.settings.tsx",
          lineNumber: 58,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "pl-8 font-bold", children: "Equipo" }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.settings.tsx",
          lineNumber: 60,
          columnNumber: 11
        }, this),
        user.plan === "FREE" && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick: () => setShow(true), className: twMerge(pathname.includes("users") && "border-brand-500", "px-12 py-2 text-left text-sm  font-normal border-l-4 border-transparent disabled:text-gray-100 disabled:cursor-not-allowed relative  text-gray-600 dark:text-gray-400 cursor-not-allowed"), children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ProTag, { isOpen: show, onChange: (val) => setShow(val) }, void 0, false, {
            fileName: "app/routes/dash_.$projectId_.settings.tsx",
            lineNumber: 62,
            columnNumber: 15
          }, this),
          "Usuarios"
        ] }, void 0, true, {
          fileName: "app/routes/dash_.$projectId_.settings.tsx",
          lineNumber: 61,
          columnNumber: 36
        }, this),
        user.plan === "PRO" && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(MenuItem, { isActive: pathname.includes("access"), to: "access", className: twMerge(pathname.includes("access") && "border-l-4 border-brand-500", "px-12 py-2 font-normal text-gray-600 dark:text-gray-400"), text: "Usuarios" }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.settings.tsx",
          lineNumber: 65,
          columnNumber: 35
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/dash_.$projectId_.settings.tsx",
        lineNumber: 55,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "py-8 px-1 md:px-8 w-full", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Outlet, {}, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.tsx",
        lineNumber: 68,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.tsx",
        lineNumber: 67,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash_.$projectId_.settings.tsx",
      lineNumber: 51,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dash_.$projectId_.settings.tsx",
    lineNumber: 48,
    columnNumber: 10
  }, this);
}
_s(Route, "XsjaPli39KrhV7uV1ddTqk3ndvA=", false, function() {
  return [useLoaderData, useNavigate, useParams, useLocation];
});
_c = Route;
var MenuItem = ({
  text,
  prefetch = "intent",
  isActive,
  to,
  proTag = false,
  isDisabled,
  className
}) => {
  const cn = twMerge(isDisabled && "cursor-not-allowed", "px-12 py-2 font-light border-l-4 border-transparent disabled:text-gray-500 disabled:cursor-not-allowed relative text-sm", isActive && "border-brand-500 font-medium", isDisabled && "dark:text-gray-600 text-gray-400", className);
  return isDisabled || !to ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: cn, children: [
    proTag && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ProTag, {}, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.tsx",
      lineNumber: 88,
      columnNumber: 18
    }, this),
    text
  ] }, void 0, true, {
    fileName: "app/routes/dash_.$projectId_.settings.tsx",
    lineNumber: 87,
    columnNumber: 30
  }, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, { className: cn, to, prefetch, children: [
    " ",
    proTag && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ProTag, {}, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.tsx",
      lineNumber: 92,
      columnNumber: 18
    }, this),
    text
  ] }, void 0, true, {
    fileName: "app/routes/dash_.$projectId_.settings.tsx",
    lineNumber: 90,
    columnNumber: 14
  }, this);
};
_c2 = MenuItem;
var _c;
var _c2;
$RefreshReg$(_c, "Route");
$RefreshReg$(_c2, "MenuItem");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Route as default
};
//# sourceMappingURL=/build/routes/dash_.$projectId_.settings-W5O4J27R.js.map
