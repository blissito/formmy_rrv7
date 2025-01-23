import {
  Row
} from "/build/_shared/chunk-XOLFPFZK.js";
import {
  require_db
} from "/build/_shared/chunk-KONDUBG3.js";
import {
  require_node
} from "/build/_shared/chunk-G7CHZRZX.js";
import {
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

// app/routes/admin.users.tsx
var import_node = __toESM(require_node());
var import_db = __toESM(require_db());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/admin.users.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/admin.users.tsx"
  );
  import.meta.hot.lastModified = "1713710121960.1829";
}
function Page() {
  _s();
  const {
    users,
    totals
  } = useLoaderData();
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("article", { className: "mx-auto max-w-5xl px-6 py-20", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { className: "font-bold text-3xl", children: "Recent users" }, void 0, false, {
      fileName: "app/routes/admin.users.tsx",
      lineNumber: 71,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "flex py-2 px-4 rounded gap-4", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Usuarios en total: " }, void 0, false, {
          fileName: "app/routes/admin.users.tsx",
          lineNumber: 74,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", { children: totals.all }, void 0, false, {
          fileName: "app/routes/admin.users.tsx",
          lineNumber: 75,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/admin.users.tsx",
        lineNumber: 73,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Usuarios agregados esta semana:" }, void 0, false, {
          fileName: "app/routes/admin.users.tsx",
          lineNumber: 78,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", { className: "text-brand-500", children: totals.thisWeek }, void 0, false, {
          fileName: "app/routes/admin.users.tsx",
          lineNumber: 79,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/admin.users.tsx",
        lineNumber: 77,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/admin.users.tsx",
      lineNumber: 72,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { id: "table", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Row, { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Usuario" }, void 0, false, {
          fileName: "app/routes/admin.users.tsx",
          lineNumber: 84,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Nombre" }, void 0, false, {
          fileName: "app/routes/admin.users.tsx",
          lineNumber: 85,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Fecha" }, void 0, false, {
          fileName: "app/routes/admin.users.tsx",
          lineNumber: 86,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/admin.users.tsx",
        lineNumber: 83,
        columnNumber: 9
      }, this),
      users.map((p) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Row, { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: p.email }, void 0, false, {
          fileName: "app/routes/admin.users.tsx",
          lineNumber: 89,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: p.name }, void 0, false, {
          fileName: "app/routes/admin.users.tsx",
          lineNumber: 90,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: new Date(p.createdAt).toLocaleString() }, void 0, false, {
          fileName: "app/routes/admin.users.tsx",
          lineNumber: 91,
          columnNumber: 13
        }, this)
      ] }, p.id, true, {
        fileName: "app/routes/admin.users.tsx",
        lineNumber: 88,
        columnNumber: 25
      }, this))
    ] }, void 0, true, {
      fileName: "app/routes/admin.users.tsx",
      lineNumber: 82,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/admin.users.tsx",
    lineNumber: 70,
    columnNumber: 10
  }, this);
}
_s(Page, "O+XbAhDRAm9pMJySCDCSssFpgFc=", false, function() {
  return [useLoaderData];
});
_c = Page;
var _c;
$RefreshReg$(_c, "Page");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Page as default
};
//# sourceMappingURL=/build/routes/admin.users-XWIO6POA.js.map
