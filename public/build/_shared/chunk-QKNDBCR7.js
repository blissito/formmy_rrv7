import {
  twMerge
} from "/build/_shared/chunk-B3ATQ6F7.js";
import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-XU7DNSPJ.js";
import {
  createHotContext
} from "/build/_shared/chunk-2F64VKTU.js";
import {
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// app/components/Spinner.tsx
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/Spinner.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/Spinner.tsx"
  );
  import.meta.hot.lastModified = "1708441241609.3054";
}
function Spinner({
  color,
  className,
  ...props
}) {
  const borderColor = color === "brand" ? "border-t-brand-500" : "border-t-slate-400";
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { ...props, className: twMerge("border-4  border-r-white rounded-2xl w-6 h-6 animate-spin", borderColor, className) }, void 0, false, {
    fileName: "app/components/Spinner.tsx",
    lineNumber: 28,
    columnNumber: 10
  }, this);
}
_c = Spinner;
function SVGSpinner() {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("svg", { className: "-ml-1 mr-3 h-8 w-8 animate-spin", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", width: "1em", height: "1em", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("circle", { className: "opacity-25", cx: 12, cy: 12, r: 10, stroke: "currentColor", strokeWidth: 4 }, void 0, false, {
      fileName: "app/components/Spinner.tsx",
      lineNumber: 33,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
      fileName: "app/components/Spinner.tsx",
      lineNumber: 35,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/Spinner.tsx",
    lineNumber: 32,
    columnNumber: 10
  }, this);
}
_c2 = SVGSpinner;
var _c;
var _c2;
$RefreshReg$(_c, "Spinner");
$RefreshReg$(_c2, "SVGSpinner");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

export {
  Spinner
};
//# sourceMappingURL=/build/_shared/chunk-QKNDBCR7.js.map
