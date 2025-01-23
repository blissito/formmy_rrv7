import {
  Palomita
} from "/build/_shared/chunk-XZ7VDIAU.js";
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

// node_modules/uuid/dist/esm-browser/native.js
var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var native_default = {
  randomUUID
};

// node_modules/uuid/dist/esm-browser/rng.js
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  if (!getRandomValues) {
    getRandomValues = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);
    if (!getRandomValues) {
      throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    }
  }
  return getRandomValues(rnds8);
}

// node_modules/uuid/dist/esm-browser/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
}

// node_modules/uuid/dist/esm-browser/v4.js
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  options = options || {};
  const rnds = options.random || (options.rng || rng)();
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default = v4;

// app/components/IconCube.tsx
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/IconCube.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/IconCube.tsx"
  );
  import.meta.hot.lastModified = "1737642690783.3037";
}
var IconCube = ({
  src,
  isSelected,
  onClick,
  children,
  className,
  action
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick, type: "button", className: twMerge("group relative w-[200px]  bg-space-200", "w-12 h-12  rounded-md flex items-center justify-center", isSelected && "ring-2 ring-brand-500 relative", className), children: [
    isSelected && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Palomita, { className: "top-1 right-1" }, void 0, false, {
      fileName: "app/components/IconCube.tsx",
      lineNumber: 32,
      columnNumber: 22
    }, this),
    src && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", { onDragStart: (e) => e.preventDefault(), src, alt: "icon" }, void 0, false, {
      fileName: "app/components/IconCube.tsx",
      lineNumber: 33,
      columnNumber: 15
    }, this),
    children && children,
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "group-hover:visible invisible", children: action }, void 0, false, {
      fileName: "app/components/IconCube.tsx",
      lineNumber: 35,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/IconCube.tsx",
    lineNumber: 31,
    columnNumber: 10
  }, this);
};
_c = IconCube;
var _c;
$RefreshReg$(_c, "IconCube");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

export {
  v4_default,
  IconCube
};
//# sourceMappingURL=/build/_shared/chunk-SU6Z44HG.js.map
