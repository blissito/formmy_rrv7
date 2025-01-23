import {
  NavBar_default
} from "/build/_shared/chunk-EFXLBPE4.js";
import "/build/_shared/chunk-7ZNLIBJB.js";
import "/build/_shared/chunk-QKNDBCR7.js";
import "/build/_shared/chunk-B3ATQ6F7.js";
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

// app/routes/feedback.tsx
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/feedback.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/feedback.tsx"
  );
  import.meta.hot.lastModified = "1733871814500.6287";
}
function Academy() {
  _s();
  const {
    user,
    NODE_ENV
  } = useLoaderData();
  const lightFormmy = NODE_ENV === "development" ? "http://localhost:3000/embed/6522f8237031b1e66b7dc117" : "https://formmy.app/embed/6522f8237031b1e66b7dc117";
  const darkFormmy = NODE_ENV === "development" ? "http://localhost:3000/embed/65230f96c040cf4c55a90b00" : "https://formmy.app/embed/65230f96c040cf4c55a90b00";
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(NavBar_default, { user }, void 0, false, {
      fileName: "app/routes/feedback.tsx",
      lineNumber: 45,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "dark:bg-space-900 min-h-screen ", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(NavBar_default, { user }, void 0, false, {
        fileName: "app/routes/feedback.tsx",
        lineNumber: 47,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "pt-40 pb-20 px-4 md:px-0 lg:max-w-6xl max-w-3xl mx-auto text-space-500 dark:text-space-300 ", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { className: "text-4xl md:text-5xl text-space-800 dark:text-white font-semibold", children: "Danos tu opini\xF3n" }, void 0, false, {
          fileName: "app/routes/feedback.tsx",
          lineNumber: 49,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "text-xl md:text-2xl text-gray-600 dark:text-space-400 font-light w-full md:w-[700px] mt-4 mb-10", children: "Cu\xE9ntanos \xBFc\xF3mo te va usando Formmy? \xBFAlguna duda con la configuraci\xF3n? \xBFHay alg\xFAn feature que te gustar\xEDa ver?" }, void 0, false, {
          fileName: "app/routes/feedback.tsx",
          lineNumber: 52,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: " block dark:hidden", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("iframe", { id: "formmy-iframe", title: "formmy", width: "100%", height: "560", src: lightFormmy, style: {
          margin: "0 auto",
          display: "block"
        } }, void 0, false, {
          fileName: "app/routes/feedback.tsx",
          lineNumber: 57,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "app/routes/feedback.tsx",
          lineNumber: 56,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "hidden dark:block", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("iframe", { id: "formmy-iframe", title: "formmy", width: "100%", height: "560", src: darkFormmy, style: {
          margin: "0 auto",
          display: "block"
        } }, void 0, false, {
          fileName: "app/routes/feedback.tsx",
          lineNumber: 63,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "app/routes/feedback.tsx",
          lineNumber: 62,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/feedback.tsx",
        lineNumber: 48,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/feedback.tsx",
      lineNumber: 46,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/feedback.tsx",
    lineNumber: 44,
    columnNumber: 10
  }, this);
}
_s(Academy, "wZSOSitB7UNjQY09uuXGtCxnQtY=", false, function() {
  return [useLoaderData];
});
_c = Academy;
var _c;
$RefreshReg$(_c, "Academy");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Academy as default
};
//# sourceMappingURL=/build/routes/feedback-XTW7RTPE.js.map
