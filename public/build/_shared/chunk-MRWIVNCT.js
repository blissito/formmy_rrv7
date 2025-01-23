import {
  Message
} from "/build/_shared/chunk-FGBF4SDM.js";
import {
  Formmy
} from "/build/_shared/chunk-GAAUEO2B.js";
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
  useFetcher2 as useFetcher,
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

// app/routes/preview.$projectId.tsx
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
    window.$RefreshRuntime$.register(type, '"app/routes/preview.$projectId.tsx"' + id);
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
    "app/routes/preview.$projectId.tsx"
  );
  import.meta.hot.lastModified = "1737642690830.2825";
}
function preview_projectId_default() {
  const {
    project,
    isPro
  } = useLoaderData();
  (0, import_react2.useEffect)(() => {
    var _a;
    document.body.classList.add((_a = project.config.theme) != null ? _a : "");
  }, []);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AllFormmy, { type: project.type, isPro, config: project.config, projectId: project.id }, void 0, false, {
    fileName: "app/routes/preview.$projectId.tsx",
    lineNumber: 66,
    columnNumber: 10
  }, this);
}
var AllFormmy = ({
  isPro,
  config,
  projectId,
  type
}) => {
  var _a;
  _s();
  const fetcher = useFetcher();
  const ok = (_a = fetcher.data) == null ? void 0 : _a.ok;
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("main", { className: twMerge("bg-clear dark:bg-space-900 min-h-screen flex items-center py-20", config.theme), children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(
      Message,
      {
        type,
        showConfetti: ok,
        config,
        className: twMerge(ok ? "flex" : "hidden")
      },
      void 0,
      false,
      {
        fileName: "app/routes/preview.$projectId.tsx",
        lineNumber: 78,
        columnNumber: 7
      },
      this
    ),
    !ok && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "max-w-lg mx-auto w-full", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { className: "text-space-800 dark:text-white font-semibold text-3xl text-center mb-10", children: "Completa el formulario" }, void 0, false, {
        fileName: "app/routes/preview.$projectId.tsx",
        lineNumber: 82,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Formmy, { type, isPro, fetcher, config, projectId }, void 0, false, {
        fileName: "app/routes/preview.$projectId.tsx",
        lineNumber: 85,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/preview.$projectId.tsx",
      lineNumber: 81,
      columnNumber: 15
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/preview.$projectId.tsx",
    lineNumber: 77,
    columnNumber: 10
  }, this);
};
_s(AllFormmy, "2WHaGQTcUOgkXDaibwUgjUp1MBY=", false, function() {
  return [useFetcher];
});
_c = AllFormmy;
var NakedFormmy = ({
  isPro,
  config,
  projectId,
  type
}) => {
  var _a;
  _s2();
  const fetcher = useFetcher();
  const ok = (_a = fetcher.data) == null ? void 0 : _a.ok;
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Message, { type, showConfetti: ok, config, className: ok ? void 0 : "hidden" }, void 0, false, {
      fileName: "app/routes/preview.$projectId.tsx",
      lineNumber: 103,
      columnNumber: 7
    }, this),
    !ok && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Formmy, { fetcher, isPro, config, projectId, type }, void 0, false, {
      fileName: "app/routes/preview.$projectId.tsx",
      lineNumber: 104,
      columnNumber: 15
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/preview.$projectId.tsx",
    lineNumber: 102,
    columnNumber: 10
  }, this);
};
_s2(NakedFormmy, "2WHaGQTcUOgkXDaibwUgjUp1MBY=", false, function() {
  return [useFetcher];
});
_c2 = NakedFormmy;
var _c;
var _c2;
$RefreshReg$(_c, "AllFormmy");
$RefreshReg$(_c2, "NakedFormmy");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

export {
  preview_projectId_default,
  NakedFormmy
};
//# sourceMappingURL=/build/_shared/chunk-MRWIVNCT.js.map
