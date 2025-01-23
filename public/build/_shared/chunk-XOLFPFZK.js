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
import {
  require_react
} from "/build/_shared/chunk-BOXFZXVX.js";
import {
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// app/routes/admin.projects.tsx
var import_node = __toESM(require_node());
var import_react2 = __toESM(require_react());
var import_db = __toESM(require_db());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/admin.projects.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/admin.projects.tsx"
  );
  import.meta.hot.lastModified = "1713710088333.876";
}
function Page() {
  _s();
  const {
    projects,
    totals
  } = useLoaderData();
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("article", { className: "mx-auto max-w-5xl px-6 py-20", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { className: "font-bold text-3xl", children: "Recent Projects" }, void 0, false, {
      fileName: "app/routes/admin.projects.tsx",
      lineNumber: 71,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "flex py-2 px-4 rounded gap-4", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Projectos en total: " }, void 0, false, {
          fileName: "app/routes/admin.projects.tsx",
          lineNumber: 74,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", { children: totals.all }, void 0, false, {
          fileName: "app/routes/admin.projects.tsx",
          lineNumber: 75,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/admin.projects.tsx",
        lineNumber: 73,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Projectos agregados esta semana:" }, void 0, false, {
          fileName: "app/routes/admin.projects.tsx",
          lineNumber: 78,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", { className: "text-brand-500", children: totals.thisWeek }, void 0, false, {
          fileName: "app/routes/admin.projects.tsx",
          lineNumber: 79,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/admin.projects.tsx",
        lineNumber: 77,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/admin.projects.tsx",
      lineNumber: 72,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { id: "table", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Row, { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Usuario" }, void 0, false, {
          fileName: "app/routes/admin.projects.tsx",
          lineNumber: 84,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Nombre" }, void 0, false, {
          fileName: "app/routes/admin.projects.tsx",
          lineNumber: 85,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Fecha" }, void 0, false, {
          fileName: "app/routes/admin.projects.tsx",
          lineNumber: 86,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/admin.projects.tsx",
        lineNumber: 83,
        columnNumber: 9
      }, this),
      projects.map((p) => {
        var _a;
        return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Row, { children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: (_a = p.User) == null ? void 0 : _a.email }, void 0, false, {
            fileName: "app/routes/admin.projects.tsx",
            lineNumber: 89,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: p.name }, void 0, false, {
            fileName: "app/routes/admin.projects.tsx",
            lineNumber: 90,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: new Date(p.createdAt).toLocaleString() }, void 0, false, {
            fileName: "app/routes/admin.projects.tsx",
            lineNumber: 91,
            columnNumber: 13
          }, this)
        ] }, p.id, true, {
          fileName: "app/routes/admin.projects.tsx",
          lineNumber: 88,
          columnNumber: 28
        }, this);
      })
    ] }, void 0, true, {
      fileName: "app/routes/admin.projects.tsx",
      lineNumber: 82,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/admin.projects.tsx",
    lineNumber: 70,
    columnNumber: 10
  }, this);
}
_s(Page, "yRyXRnOxorZkK1XZ0UEyBMBCvDE=", false, function() {
  return [useLoaderData];
});
_c = Page;
var Row = ({
  children
}) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "hover:scale-105 transition-all my-2 grid grid-cols-6 shadow p-4 rounded", children: import_react2.Children.map(children, (child, index) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "col-span-2", children: child }, index, false, {
    fileName: "app/routes/admin.projects.tsx",
    lineNumber: 104,
    columnNumber: 12
  }, this);
}) }, void 0, false, {
  fileName: "app/routes/admin.projects.tsx",
  lineNumber: 102,
  columnNumber: 7
}, this);
_c2 = Row;
var _c;
var _c2;
$RefreshReg$(_c, "Page");
$RefreshReg$(_c2, "Row");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

export {
  Page,
  Row
};
//# sourceMappingURL=/build/_shared/chunk-XOLFPFZK.js.map
