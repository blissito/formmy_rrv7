import {
  invariant
} from "/build/_shared/chunk-IYD4CINF.js";
import {
  motion
} from "/build/_shared/chunk-ZOHFZ5HT.js";
import "/build/_shared/chunk-NMZL6IDN.js";
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
import {
  require_react
} from "/build/_shared/chunk-BOXFZXVX.js";
import {
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// app/routes/blissmo.tsx
var import_react2 = __toESM(require_react());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/blissmo.tsx"' + id);
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
    "app/routes/blissmo.tsx"
  );
  import.meta.hot.lastModified = "1733871811529.259";
}
var shuffle = (a) => {
  const array = [...a];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
var arrayMove = (a, oldIndex, newIndex) => {
  const array = [...a];
  if (newIndex >= array.length)
    return array;
  const old = array.splice(oldIndex, 1)[0];
  array.splice(newIndex, 0, old);
  return array;
};
function isColliding(source, sample, threshold = 0.5) {
  return source.x < sample.x + sample.width - threshold * sample.width && source.x + source.width > sample.x + threshold * sample.width && source.y < sample.y + sample.height - threshold * sample.height && source.y + source.height > sample.y + threshold * sample.height;
}
function Page() {
  _s();
  const {
    initialColors
  } = useLoaderData();
  const [colors, setColors] = (0, import_react2.useState)(initialColors);
  const [showInts, setShowInts] = (0, import_react2.useState)(true);
  const positions = (0, import_react2.useRef)([]);
  const saveItemPosition = (index, position) => {
    positions.current[index] = position;
  };
  const swapColors = (fromIndex, toIndex) => setColors(arrayMove(colors, fromIndex, toIndex));
  const moveItem = (fromIndex, point) => {
    for (let i = 0; i < positions.current.length; i++) {
      const targetPosition = positions.current[i];
      if (!isColliding({
        ...positions.current[fromIndex],
        ...point
      }, targetPosition)) {
        continue;
      }
      if (fromIndex === i)
        return;
      swapColors(fromIndex, i);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("article", { className: "flex flex-col items-center gap-4 justify-center h-screen bg-neutral-900", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { className: "text-white text-4xl font-bold", children: "Color grid by blissmo" }, void 0, false, {
      fileName: "app/routes/blissmo.tsx",
      lineNumber: 84,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex gap-4", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick: () => setColors(initialColors), className: "px-6 py-3 rounded-xl text-black active:scale-95", style: {
        background: "#fff"
      }, children: "Reset" }, void 0, false, {
        fileName: "app/routes/blissmo.tsx",
        lineNumber: 86,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick: () => setColors(shuffle(initialColors)), className: "px-6 py-3 rounded-xl text-white active:scale-95", style: {
        background: "#000"
      }, children: "Shuffle" }, void 0, false, {
        fileName: "app/routes/blissmo.tsx",
        lineNumber: 91,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick: () => setShowInts((i) => !i), className: "px-6 py-3 rounded-xl text-white active:scale-95 bg-blue-600", children: [
        showInts ? "Clear" : "Show",
        " numbers"
      ] }, void 0, true, {
        fileName: "app/routes/blissmo.tsx",
        lineNumber: 96,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/blissmo.tsx",
      lineNumber: 85,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "grid grid-cols-12 gap-2", children: colors.map((i, index) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Item, { id: showInts ? i.id : void 0, savePosition: saveItemPosition, moveItem, index, color: i.color }, i.color, false, {
      fileName: "app/routes/blissmo.tsx",
      lineNumber: 102,
      columnNumber: 35
    }, this)) }, void 0, false, {
      fileName: "app/routes/blissmo.tsx",
      lineNumber: 100,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/blissmo.tsx",
    lineNumber: 83,
    columnNumber: 10
  }, this);
}
_s(Page, "TwUMfbvGcJNnHvF5qIWGHdDtjaw=", false, function() {
  return [useLoaderData];
});
_c = Page;
var Item = ({
  moveItem,
  index,
  color,
  savePosition,
  id
}) => {
  _s2();
  const ref = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
    invariant(ref.current);
    const bounds = ref.current.getBoundingClientRect();
    savePosition(index, {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y
    });
  }, []);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(motion.button, { children: id, className: "bg-indigo-200 rounded h-12 w-12 cursor-grab active:cursor-grabbing hover:border-2 relative", layout: true, ref, drag: true, dragSnapToOrigin: true, style: {
    backgroundColor: color
  }, transition: {
    type: "spring"
  }, onDrag: (_, {
    point
  }) => {
    moveItem(index, point);
  }, tabIndex: 0, whileHover: {
    zIndex: 10,
    scale: 1.1,
    boxShadow: "0px 3px 3px rgba(0,0,0,0.15)"
  } }, void 0, false, {
    fileName: "app/routes/blissmo.tsx",
    lineNumber: 130,
    columnNumber: 10
  }, this);
};
_s2(Item, "8uVE59eA/r6b92xF80p7sH8rXLk=");
_c2 = Item;
var _c;
var _c2;
$RefreshReg$(_c, "Page");
$RefreshReg$(_c2, "Item");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Page as default
};
//# sourceMappingURL=/build/routes/blissmo-LMHM7LEX.js.map
