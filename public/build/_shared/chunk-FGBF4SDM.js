import {
  EmojiConfetti
} from "/build/_shared/chunk-MVVQ5N7D.js";
import {
  cn
} from "/build/_shared/chunk-GAAUEO2B.js";
import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-XU7DNSPJ.js";
import {
  createHotContext
} from "/build/_shared/chunk-2F64VKTU.js";
import {
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// app/components/formmys/MessageV1.tsx
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/formmys/MessageV1.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/formmys/MessageV1.tsx"
  );
  import.meta.hot.lastModified = "1737642690789.342";
}
function Message({
  className,
  showConfetti = false,
  size = "sm",
  config,
  type
}) {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("article", { className: cn("mx-auto w-full px-4 h-screen flex items-center justify-center flex-col gap-4", size === "sm" ? "max-w-sm" : null, config.theme, {
    "flex-row": type === "subscription"
  }, className), children: [
    config.icon && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", { className: "w-24", src: config.icon, alt: "icon" }, void 0, false, {
      fileName: "app/components/formmys/MessageV1.tsx",
      lineNumber: 35,
      columnNumber: 23
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "text-center text-sm dark:text-white whitespace-pre-line", children: config.message }, void 0, false, {
      fileName: "app/components/formmys/MessageV1.tsx",
      lineNumber: 36,
      columnNumber: 7
    }, this),
    config.confetti === "emoji" && showConfetti && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(EmojiConfetti, { mode: "emojis" }, void 0, false, {
      fileName: "app/components/formmys/MessageV1.tsx",
      lineNumber: 39,
      columnNumber: 55
    }, this),
    config.confetti === "paper" && showConfetti && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(EmojiConfetti, {}, void 0, false, {
      fileName: "app/components/formmys/MessageV1.tsx",
      lineNumber: 40,
      columnNumber: 55
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/formmys/MessageV1.tsx",
    lineNumber: 32,
    columnNumber: 10
  }, this);
}
_c = Message;
var _c;
$RefreshReg$(_c, "Message");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

export {
  Message
};
//# sourceMappingURL=/build/_shared/chunk-FGBF4SDM.js.map
