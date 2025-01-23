import {
  useRotation
} from "/build/_shared/chunk-7BZWNRXH.js";
import {
  motion
} from "/build/_shared/chunk-ZOHFZ5HT.js";
import "/build/_shared/chunk-NMZL6IDN.js";
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

// app/components/MovingCard.tsx
var import_react = __toESM(require_react());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/MovingCard.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/MovingCard.tsx"
  );
  import.meta.hot.lastModified = "1702097325089.772";
}
function MovingCard() {
  _s();
  const ref = (0, import_react.createRef)();
  const {
    rotateX,
    rotateY,
    sheenGradient
  } = useRotation(ref);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Container, { style: {
    rotateX,
    rotateY
  }, children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DotGrid, {}, void 0, false, {
      fileName: "app/components/MovingCard.tsx",
      lineNumber: 37,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Card, { ref, sheenGradient }, void 0, false, {
      fileName: "app/components/MovingCard.tsx",
      lineNumber: 38,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/MovingCard.tsx",
    lineNumber: 33,
    columnNumber: 10
  }, this);
}
_s(MovingCard, "mZ7WK3XwXGubKLZkhlN1bXKuBmk=", false, function() {
  return [useRotation];
});
_c = MovingCard;
var Card = (0, import_react.forwardRef)(_c2 = function Card2({
  sheenGradient
}, ref) {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { ref, className: "rounded-md border border-gray-600", style: {
    backdropFilter: "blur(3px) brightness(120%)",
    // glass effect
    backgroundImage: sheenGradient
    // reflection
  }, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "w-40 h-20 rounded-md py-4 px-8 flex justify-center items-center text-center text-gray-50 shadow-md z-10", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Blissmo" }, void 0, false, {
    fileName: "app/components/MovingCard.tsx",
    lineNumber: 54,
    columnNumber: 9
  }, this) }, void 0, false, {
    fileName: "app/components/MovingCard.tsx",
    lineNumber: 53,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/MovingCard.tsx",
    lineNumber: 48,
    columnNumber: 10
  }, this);
});
_c3 = Card;
var Container = ({
  style,
  children
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { style: {
    perspective: "800px",
    transformStyle: "preserve-3d"
  }, className: "overflow-hidden h-full", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(motion.div, { className: "relative w-full h-full  flex items-center justify-center ", style: {
    perspective: "800px",
    transformStyle: "preserve-3d",
    ...style
  }, children }, void 0, false, {
    fileName: "app/components/MovingCard.tsx",
    lineNumber: 67,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/MovingCard.tsx",
    lineNumber: 63,
    columnNumber: 10
  }, this);
};
_c4 = Container;
var DotGrid = () => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "absolute w-full h-full", style: {
    transform: "translateZ(-500px)",
    backgroundSize: "60px 60px",
    backgroundPosition: "center",
    backgroundImage: `radial-gradient(
      circle at 1px 1px,
      white 2px,
      transparent 0
    )`
  } }, void 0, false, {
    fileName: "app/components/MovingCard.tsx",
    lineNumber: 78,
    columnNumber: 10
  }, this);
};
_c5 = DotGrid;
var _c;
var _c2;
var _c3;
var _c4;
var _c5;
$RefreshReg$(_c, "MovingCard");
$RefreshReg$(_c2, "Card$forwardRef");
$RefreshReg$(_c3, "Card");
$RefreshReg$(_c4, "Container");
$RefreshReg$(_c5, "DotGrid");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/routes/full.tsx
var import_jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/full.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/full.tsx"
  );
  import.meta.hot.lastModified = "1702097325096.1233";
}
function Full() {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("main", { className: "h-screen", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(MovingCard, {}, void 0, false, {
    fileName: "app/routes/full.tsx",
    lineNumber: 24,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/routes/full.tsx",
    lineNumber: 23,
    columnNumber: 10
  }, this);
}
_c6 = Full;
var _c6;
$RefreshReg$(_c6, "Full");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Full as default
};
//# sourceMappingURL=/build/routes/full-4PSY2TTR.js.map
