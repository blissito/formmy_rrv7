import {
  useRotation
} from "/build/_shared/chunk-7BZWNRXH.js";
import {
  motion
} from "/build/_shared/chunk-ZOHFZ5HT.js";
import "/build/_shared/chunk-NMZL6IDN.js";
import {
  twMerge
} from "/build/_shared/chunk-B3ATQ6F7.js";
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

// app/routes/yutu.tsx
var import_react2 = __toESM(require_react());

// app/components/Fixed3DCard.tsx
var import_react = __toESM(require_react());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/Fixed3DCard.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/Fixed3DCard.tsx"
  );
  import.meta.hot.lastModified = "1702097325089.2546";
}
function Fixed3DCard({
  rx,
  ry,
  isActive,
  img,
  className,
  style,
  translateZ
}) {
  _s();
  const ref = (0, import_react.createRef)();
  const {
    sheenGradient
  } = useRotation(ref);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Container, { translateZ, style: {
    rotateX: rx,
    rotateY: ry
  }, isActive, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Card, { ref, sheenGradient, img, className }, void 0, false, {
    fileName: "app/components/Fixed3DCard.tsx",
    lineNumber: 45,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/Fixed3DCard.tsx",
    lineNumber: 40,
    columnNumber: 10
  }, this);
}
_s(Fixed3DCard, "qJZL0/TzRI9WBQ2Fmxx2Vxdy1FI=", false, function() {
  return [useRotation];
});
_c = Fixed3DCard;
var Card = (0, import_react.forwardRef)(_c2 = function Card2({
  sheenGradient,
  img,
  className
}, ref) {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "w-full", ref, style: {
    // backdropFilter: "blur(3px) brightness(120%)", // glass effect
    // backgroundImage: sheenGradient, // reflection
  }, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "", children: img && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", { src: img, alt: "cover", className: twMerge("object-cover", className) }, void 0, false, {
    fileName: "app/components/Fixed3DCard.tsx",
    lineNumber: 62,
    columnNumber: 17
  }, this) }, void 0, false, {
    fileName: "app/components/Fixed3DCard.tsx",
    lineNumber: 61,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/Fixed3DCard.tsx",
    lineNumber: 57,
    columnNumber: 10
  }, this);
});
_c3 = Card;
var Container = ({
  style,
  className,
  translateZ = "-100px",
  children,
  isActive
}) => {
  const styles = isActive ? {
    ...style,
    perspective: "5000px",
    transformStyle: "flat"
  } : (
    // {}
    {
      perspective: "5000px",
      transformStyle: "flat"
    }
  );
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { style: {
    perspective: "800px",
    transformStyle: "flat"
    // transform: "translateZ(-500px)",
  }, className: "", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(
    motion.div,
    {
      animate: {
        ...styles,
        // translateY: translateZ ? 60 : 0,
        // translateZ: translateZ ? 100 : 0,
        translateZ: translateZ && isActive ? translateZ : "-200px"
      },
      children
    },
    void 0,
    false,
    {
      fileName: "app/components/Fixed3DCard.tsx",
      lineNumber: 89,
      columnNumber: 7
    },
    this
  ) }, void 0, false, {
    fileName: "app/components/Fixed3DCard.tsx",
    lineNumber: 84,
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
    fileName: "app/components/Fixed3DCard.tsx",
    lineNumber: 103,
    columnNumber: 10
  }, this);
};
_c5 = DotGrid;
var _c;
var _c2;
var _c3;
var _c4;
var _c5;
$RefreshReg$(_c, "Fixed3DCard");
$RefreshReg$(_c2, "Card$forwardRef");
$RefreshReg$(_c3, "Card");
$RefreshReg$(_c4, "Container");
$RefreshReg$(_c5, "DotGrid");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/routes/yutu.tsx
var import_jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/yutu.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s2 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/yutu.tsx"
  );
  import.meta.hot.lastModified = "1707530227033.2805";
}
function Yutu() {
  _s2();
  const [hovering, setHovering] = (0, import_react2.useState)(false);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("main", { className: "flex flex-col-reverse sm:flex-row justify-center ", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("section", { onMouseEnter: () => {
    setHovering(true);
  }, onMouseLeave: () => {
    setHovering(false);
  }, className: "relative max-w-[600px]", style: {
    perspective: "5000px",
    transformStyle: "flat"
  }, children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "absolute left-4 top-[220px] z-30 max-w-[280px]", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Fixed3DCard, { translateZ: "50px", rx: 25, ry: -20, isActive: hovering, img: "https://i.imgur.com/oDET1Bk.png" }, void 0, false, {
      fileName: "app/routes/yutu.tsx",
      lineNumber: 39,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/routes/yutu.tsx",
      lineNumber: 38,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "absolute right-4 bottom-[340px] z-30 max-w-[320px] sm:block hidden", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Fixed3DCard, { translateZ: "80px", rx: 25, ry: -20, isActive: hovering, img: "https://i.imgur.com/ayJ3FAn.png" }, void 0, false, {
      fileName: "app/routes/yutu.tsx",
      lineNumber: 42,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/routes/yutu.tsx",
      lineNumber: 41,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "-z-10 p-4", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Fixed3DCard, { translateZ: "-100px", rx: 25, ry: -20, isActive: hovering, img: "https://i.imgur.com/tXvJgML.png" }, void 0, false, {
      fileName: "app/routes/yutu.tsx",
      lineNumber: 46,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/routes/yutu.tsx",
      lineNumber: 45,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "absolute left-12 bottom-[160px] z-10 max-w-[320px]", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Fixed3DCard, { translateZ: "80px", rx: 25, ry: -20, isActive: hovering, img: "https://i.imgur.com/Gau2Trp.png" }, void 0, false, {
      fileName: "app/routes/yutu.tsx",
      lineNumber: 49,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/routes/yutu.tsx",
      lineNumber: 48,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/yutu.tsx",
    lineNumber: 30,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/routes/yutu.tsx",
    lineNumber: 29,
    columnNumber: 10
  }, this);
}
_s2(Yutu, "DvhZWjKEALvSroE2UwRKAB+mXG8=");
_c6 = Yutu;
var _c6;
$RefreshReg$(_c6, "Yutu");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Yutu as default
};
//# sourceMappingURL=/build/routes/yutu-3IONCP4F.js.map
