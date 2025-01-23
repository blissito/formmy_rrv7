import {
  _t
} from "/build/_shared/chunk-RGBYWDPK.js";
import {
  Button
} from "/build/_shared/chunk-QZYI3ZKT.js";
import {
  AnimatePresence,
  motion
} from "/build/_shared/chunk-ZOHFZ5HT.js";
import {
  twMerge
} from "/build/_shared/chunk-B3ATQ6F7.js";
import {
  useNavigate
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

// app/components/Modal.tsx
var import_react = __toESM(require_react());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/Modal.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/Modal.tsx"
  );
  import.meta.hot.lastModified = "1737642690783.573";
}
function Modal({
  onClose,
  children,
  title,
  size = "md",
  className
}) {
  _s();
  const navigate = useNavigate();
  const [show, setShow] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    setShow(true);
  }, []);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AnimatePresence, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(_t, { open: show, onClose: onClose || (() => navigate(-1)), className: twMerge("relative z-[99] "), children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "fixed inset-0 bg-black/20 backdrop-blur", "aria-hidden": "true" }, void 0, false, {
      fileName: "app/components/Modal.tsx",
      lineNumber: 43,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "fixed inset-0 flex items-center justify-center p-4 ", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(motion.div, { initial: {
      y: 100,
      opacity: 0,
      scale: 0.5
    }, animate: {
      y: 0,
      opacity: 1,
      scale: 1
    }, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(_t.Panel, { className: twMerge(size === "xs" && "max-w-[400px]", size === "md" && "max-w-[600px]", size === "lg" && "max-w-[800px]", "flex flex-col"), children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(_t.Title, { className: "bg-clear dark:bg-space-900 flex justify-between items-center rounded-t-3xl ", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "text-2xl px-8 pt-8 pb-4 font-bold dark:text-white text-space-800", children: title }, void 0, false, {
          fileName: "app/components/Modal.tsx",
          lineNumber: 59,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick: onClose || (() => navigate(-1)), children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", { alt: "close", src: "/assets/close.svg", className: "dark:hidden block mr-4 mt-4" }, void 0, false, {
            fileName: "app/components/Modal.tsx",
            lineNumber: 63,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", { alt: "close", src: "/assets/close-dark.svg", className: "dark:block hidden mr-4 mt-4" }, void 0, false, {
            fileName: "app/components/Modal.tsx",
            lineNumber: 64,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "app/components/Modal.tsx",
          lineNumber: 62,
          columnNumber: 17
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/Modal.tsx",
        lineNumber: 58,
        columnNumber: 15
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: twMerge(
        "min-w-[320px] h-min bg-clear dark:bg-space-900 rounded-b-3xl md:pt-0 px-12 ",
        className
        // this is here just for semantics
      ), children }, void 0, false, {
        fileName: "app/components/Modal.tsx",
        lineNumber: 68,
        columnNumber: 15
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/Modal.tsx",
      lineNumber: 57,
      columnNumber: 13
    }, this) }, void 0, false, {
      fileName: "app/components/Modal.tsx",
      lineNumber: 48,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/components/Modal.tsx",
      lineNumber: 46,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/Modal.tsx",
    lineNumber: 41,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/Modal.tsx",
    lineNumber: 40,
    columnNumber: 10
  }, this);
}
_s(Modal, "fTs2LNTA1kYfQCIzbJei4Tv4E0U=", false, function() {
  return [useNavigate];
});
_c = Modal;
var _c;
$RefreshReg$(_c, "Modal");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/components/ConfirmModal.tsx
var import_jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/ConfirmModal.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/ConfirmModal.tsx"
  );
  import.meta.hot.lastModified = "1711326193197.0908";
}
function ConfirmModal({
  message,
  isOpen,
  title,
  onClose,
  children,
  onClick,
  footer,
  emojis = "\u270B\u{1F3FC}\u{1F913}\u{1F4A1}"
}) {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(import_jsx_dev_runtime2.Fragment, { children: isOpen ? /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Modal, { onClose, size: "md", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "text-4xl text-center mb-6", children: emojis }, void 0, false, {
      fileName: "app/components/ConfirmModal.tsx",
      lineNumber: 35,
      columnNumber: 11
    }, this),
    typeof title === "string" ? /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h2", { className: "dark:text-white text-space-800 font-semibold text-2xl text-center mb-4", children: title }, void 0, false, {
      fileName: "app/components/ConfirmModal.tsx",
      lineNumber: 36,
      columnNumber: 40
    }, this) : title,
    typeof message === "string" ? /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "dark:text-gray-400 mb-8 text-gray-600 text-center ", children: message }, void 0, false, {
      fileName: "app/components/ConfirmModal.tsx",
      lineNumber: 39,
      columnNumber: 42
    }, this) : message,
    children,
    footer ? footer : /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "flex gap-6 mb-6", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Button, { onClick: onClose, className: "bg-gray-100 text-gray-600", children: "Cancelar" }, void 0, false, {
        fileName: "app/components/ConfirmModal.tsx",
        lineNumber: 44,
        columnNumber: 15
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Button, { onClick, className: "bg-red-500 text-white", children: "Eliminar" }, void 0, false, {
        fileName: "app/components/ConfirmModal.tsx",
        lineNumber: 47,
        columnNumber: 15
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/ConfirmModal.tsx",
      lineNumber: 43,
      columnNumber: 30
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/ConfirmModal.tsx",
    lineNumber: 34,
    columnNumber: 17
  }, this) : null }, void 0, false, {
    fileName: "app/components/ConfirmModal.tsx",
    lineNumber: 33,
    columnNumber: 10
  }, this);
}
_c2 = ConfirmModal;
var _c2;
$RefreshReg$(_c2, "ConfirmModal");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

export {
  Modal,
  ConfirmModal
};
//# sourceMappingURL=/build/_shared/chunk-3UHNKOCO.js.map
