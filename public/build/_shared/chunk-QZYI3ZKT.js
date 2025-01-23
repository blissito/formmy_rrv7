import {
  Spinner
} from "/build/_shared/chunk-QKNDBCR7.js";
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

// app/components/Button.tsx
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/Button.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/Button.tsx"
  );
  import.meta.hot.lastModified = "1711326151740.8525";
}
var Button = ({
  type = "button",
  children,
  className,
  isLoading,
  isDisabled,
  ...props
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { ...props, disabled: isDisabled || isLoading, type, className: twMerge("bg-brand-500 text-clear mt-6 block mx-auto cursor-pointer rounded-full py-3 px-6", className, "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:border-none"), children: [
    !isLoading && (children || "Agregar"),
    isLoading && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex justify-center", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Spinner, {}, void 0, false, {
      fileName: "app/components/Button.tsx",
      lineNumber: 34,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/components/Button.tsx",
      lineNumber: 33,
      columnNumber: 21
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/Button.tsx",
    lineNumber: 31,
    columnNumber: 10
  }, this);
};
_c = Button;
var _c;
$RefreshReg$(_c, "Button");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

export {
  Button
};
//# sourceMappingURL=/build/_shared/chunk-QZYI3ZKT.js.map
