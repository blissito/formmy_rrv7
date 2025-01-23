import {
  GenIcon
} from "/build/_shared/chunk-EFXLBPE4.js";
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

// node_modules/react-icons/bi/index.esm.js
function BiCopy(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 24 24" }, "child": [{ "tag": "path", "attr": { "d": "M20 2H10c-1.103 0-2 .897-2 2v4H4c-1.103 0-2 .897-2 2v10c0 1.103.897 2 2 2h10c1.103 0 2-.897 2-2v-4h4c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zM4 20V10h10l.002 10H4zm16-6h-4v-4c0-1.103-.897-2-2-2h-4V4h10v10z" } }] })(props);
}
function BiSave(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 24 24" }, "child": [{ "tag": "path", "attr": { "d": "M5 21h14a2 2 0 0 0 2-2V8a1 1 0 0 0-.29-.71l-4-4A1 1 0 0 0 16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2zm10-2H9v-5h6zM13 7h-2V5h2zM5 5h2v4h8V5h.59L19 8.41V19h-2v-5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v5H5z" } }] })(props);
}

// app/components/Code.tsx
var import_react = __toESM(require_react());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/Code.tsx"' + id);
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
    "app/components/Code.tsx"
  );
  import.meta.hot.lastModified = "1690758644951.728";
}
var LINK = "https://formy.blissmo.workers.dev";
var iconBtnClass = "flex items-center py-2 border rounded-md px-2 hover:scale-105 active:scale-100 border-brand-500 text-brand-500";
function Code({
  project
}) {
  _s();
  const url = LINK + "/" + project.slug + "/form";
  const [copied, setCopied] = (0, import_react.useState)(false);
  const timeout = (0, import_react.useRef)();
  const copyToClipboard = () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    setCopied(true);
    navigator.clipboard.writeText(`<iframe src="${url}" />`);
    timeout.current = setTimeout(() => {
      setCopied(false);
    }, 3e3);
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("main", { className: "pt-12 px-4 max-w-4xl mx-auto text-black dark:text-slate-400", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { className: "text-2xl font-bold px-4", children: "Solo copia y pega esta etiqueta en tu HTML o JSX." }, void 0, false, {
      fileName: "app/components/Code.tsx",
      lineNumber: 46,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/components/Code.tsx",
      lineNumber: 45,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "text-center border border-indigo-500/60 rounded-md text-xl font-thin h-[8vh] flex items-center justify-center my-4 gap-4 text-slate-800 dark:text-slate-400 max-w-4xl mx-auto px-4", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { className: "", children: `
      <iframe width="100%" height="100%" title="formy" src="${url}" />
      ` }, void 0, false, {
        fileName: "app/components/Code.tsx",
        lineNumber: 51,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "tooltip", "data-tip": copied ? "Copiado \u2705" : "Copiar", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick: copyToClipboard, className: iconBtnClass, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BiCopy, {}, void 0, false, {
        fileName: "app/components/Code.tsx",
        lineNumber: 59,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "app/components/Code.tsx",
        lineNumber: 58,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/components/Code.tsx",
        lineNumber: 57,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/Code.tsx",
      lineNumber: 50,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/Code.tsx",
    lineNumber: 44,
    columnNumber: 10
  }, this);
}
_s(Code, "2NFliloOKyykfELRQlybYSe8wJg=");
_c = Code;
var Block = ({
  children
}) => {
  _s2();
  const timeout = (0, import_react.useRef)();
  const [copied, setCopied] = (0, import_react.useState)(false);
  const copyToClipboard = () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    setCopied(true);
    navigator.clipboard.writeText(children);
    timeout.current = setTimeout(() => {
      setCopied(false);
    }, 3e3);
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("main", { className: "pt-12 px-4 max-w-4xl mx-auto text-black dark:text-slate-400", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { className: "text-2xl font-bold px-4", children: "Solo copia y pega esta etiqueta en tu HTML o JSX." }, void 0, false, {
      fileName: "app/components/Code.tsx",
      lineNumber: 85,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/components/Code.tsx",
      lineNumber: 84,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "text-center p-12 border border-indigo-500/60 rounded-md text-xl font-thin h-[10vh] flex items-center justify-center my-4 gap-4 text-slate-800 dark:text-slate-400 max-w-4xl mx-auto px-4", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { className: "", children }, void 0, false, {
        fileName: "app/components/Code.tsx",
        lineNumber: 90,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "tooltip", "data-tip": copied ? "Copiado \u2705" : "Copiar", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick: copyToClipboard, className: iconBtnClass, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BiCopy, {}, void 0, false, {
        fileName: "app/components/Code.tsx",
        lineNumber: 94,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "app/components/Code.tsx",
        lineNumber: 93,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/components/Code.tsx",
        lineNumber: 92,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/Code.tsx",
      lineNumber: 89,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/Code.tsx",
    lineNumber: 83,
    columnNumber: 10
  }, this);
};
_s2(Block, "GMA8nvS/aw+HMhk2uzpKPqFk2OU=");
_c2 = Block;
var _c;
var _c2;
$RefreshReg$(_c, "Code");
$RefreshReg$(_c2, "Block");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

export {
  BiSave,
  iconBtnClass,
  Code
};
//# sourceMappingURL=/build/_shared/chunk-FTLGS3GR.js.map
