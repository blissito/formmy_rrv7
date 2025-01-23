import {
  BsThreeDotsVertical,
  BsTwitter
} from "/build/_shared/chunk-2E2SUJIS.js";
import {
  AiFillInstagram,
  GenIcon,
  NavBar_default,
  T
} from "/build/_shared/chunk-EFXLBPE4.js";
import {
  Button
} from "/build/_shared/chunk-QZYI3ZKT.js";
import {
  C,
  I,
  I2,
  M,
  N,
  O,
  O2,
  U,
  f,
  l,
  o,
  o3 as o2,
  o4 as o3,
  s2 as s,
  s4 as s2,
  t,
  u,
  u2,
  y3 as y
} from "/build/_shared/chunk-7ZNLIBJB.js";
import {
  clsx
} from "/build/_shared/chunk-XGABADQ5.js";
import {
  AnimatePresence,
  easeInOut,
  motion,
  useAnimationFrame,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform
} from "/build/_shared/chunk-ZOHFZ5HT.js";
import {
  twMerge
} from "/build/_shared/chunk-B3ATQ6F7.js";
import {
  require_node
} from "/build/_shared/chunk-G7CHZRZX.js";
import {
  Form,
  Link,
  useFetcher2 as useFetcher
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
  __commonJS,
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// empty-module:~/lib/google.server
var require_google = __commonJS({
  "empty-module:~/lib/google.server"(exports, module) {
    module.exports = {};
  }
});

// app/routes/_index.tsx
var import_node = __toESM(require_node());
var import_react18 = __toESM(require_react());

// node_modules/@headlessui/react/dist/components/tabs/tabs.js
var import_react2 = __toESM(require_react(), 1);

// node_modules/@headlessui/react/dist/internal/focus-sentinel.js
var import_react = __toESM(require_react(), 1);
function b({ onFocus: n }) {
  let [r2, o4] = (0, import_react.useState)(true), u3 = f();
  return r2 ? import_react.default.createElement(u2, { as: "button", type: "button", features: s2.Focusable, onFocus: (a2) => {
    a2.preventDefault();
    let e, i = 50;
    function t2() {
      if (i-- <= 0) {
        e && cancelAnimationFrame(e);
        return;
      }
      if (n()) {
        if (cancelAnimationFrame(e), !u3.current)
          return;
        o4(false);
        return;
      }
      e = requestAnimationFrame(t2);
    }
    e = requestAnimationFrame(t2);
  } }) : null;
}

// node_modules/@headlessui/react/dist/utils/stable-collection.js
var r = __toESM(require_react(), 1);
var s4 = r.createContext(null);
function a() {
  return { groups: /* @__PURE__ */ new Map(), get(n, t2) {
    var c2;
    let e = this.groups.get(n);
    e || (e = /* @__PURE__ */ new Map(), this.groups.set(n, e));
    let l2 = (c2 = e.get(t2)) != null ? c2 : 0;
    e.set(t2, l2 + 1);
    let o4 = Array.from(e.keys()).indexOf(t2);
    function i() {
      let u3 = e.get(t2);
      u3 > 1 ? e.set(t2, u3 - 1) : e.delete(t2);
    }
    return [o4, i];
  } };
}
function C2({ children: n }) {
  let t2 = r.useRef(a());
  return r.createElement(s4.Provider, { value: t2 }, n);
}
function d(n) {
  let t2 = r.useContext(s4);
  if (!t2)
    throw new Error("You must wrap your component in a <StableCollection>");
  let e = f2(), [l2, o4] = t2.current.get(n, e);
  return r.useEffect(() => o4, []), l2;
}
function f2() {
  var l2, o4, i;
  let n = (i = (o4 = (l2 = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) == null ? void 0 : l2.ReactCurrentOwner) == null ? void 0 : o4.current) != null ? i : null;
  if (!n)
    return Symbol();
  let t2 = [], e = n;
  for (; e; )
    t2.push(e.index), e = e.return;
  return "$." + t2.join(".");
}

// node_modules/@headlessui/react/dist/components/tabs/tabs.js
var ue = ((t2) => (t2[t2.Forwards = 0] = "Forwards", t2[t2.Backwards = 1] = "Backwards", t2))(ue || {});
var Te = ((l2) => (l2[l2.Less = -1] = "Less", l2[l2.Equal = 0] = "Equal", l2[l2.Greater = 1] = "Greater", l2))(Te || {});
var de = ((a2) => (a2[a2.SetSelectedIndex = 0] = "SetSelectedIndex", a2[a2.RegisterTab = 1] = "RegisterTab", a2[a2.UnregisterTab = 2] = "UnregisterTab", a2[a2.RegisterPanel = 3] = "RegisterPanel", a2[a2.UnregisterPanel = 4] = "UnregisterPanel", a2))(de || {});
var ce = { [0](e, n) {
  var i;
  let t2 = I2(e.tabs, (c2) => c2.current), l2 = I2(e.panels, (c2) => c2.current), o4 = t2.filter((c2) => {
    var p;
    return !((p = c2.current) != null && p.hasAttribute("disabled"));
  }), a2 = { ...e, tabs: t2, panels: l2 };
  if (n.index < 0 || n.index > t2.length - 1) {
    let c2 = u(Math.sign(n.index - e.selectedIndex), { [-1]: () => 1, [0]: () => u(Math.sign(n.index), { [-1]: () => 0, [0]: () => 0, [1]: () => 1 }), [1]: () => 0 });
    if (o4.length === 0)
      return a2;
    let p = u(c2, { [0]: () => t2.indexOf(o4[0]), [1]: () => t2.indexOf(o4[o4.length - 1]) });
    return { ...a2, selectedIndex: p === -1 ? e.selectedIndex : p };
  }
  let T2 = t2.slice(0, n.index), m = [...t2.slice(n.index), ...T2].find((c2) => o4.includes(c2));
  if (!m)
    return a2;
  let b2 = (i = t2.indexOf(m)) != null ? i : e.selectedIndex;
  return b2 === -1 && (b2 = e.selectedIndex), { ...a2, selectedIndex: b2 };
}, [1](e, n) {
  if (e.tabs.includes(n.tab))
    return e;
  let t2 = e.tabs[e.selectedIndex], l2 = I2([...e.tabs, n.tab], (a2) => a2.current), o4 = e.selectedIndex;
  return e.info.current.isControlled || (o4 = l2.indexOf(t2), o4 === -1 && (o4 = e.selectedIndex)), { ...e, tabs: l2, selectedIndex: o4 };
}, [2](e, n) {
  return { ...e, tabs: e.tabs.filter((t2) => t2 !== n.tab) };
}, [3](e, n) {
  return e.panels.includes(n.panel) ? e : { ...e, panels: I2([...e.panels, n.panel], (t2) => t2.current) };
}, [4](e, n) {
  return { ...e, panels: e.panels.filter((t2) => t2 !== n.panel) };
} };
var X = (0, import_react2.createContext)(null);
X.displayName = "TabsDataContext";
function F(e) {
  let n = (0, import_react2.useContext)(X);
  if (n === null) {
    let t2 = new Error(`<${e} /> is missing a parent <Tab.Group /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(t2, F), t2;
  }
  return n;
}
var $ = (0, import_react2.createContext)(null);
$.displayName = "TabsActionsContext";
function q(e) {
  let n = (0, import_react2.useContext)($);
  if (n === null) {
    let t2 = new Error(`<${e} /> is missing a parent <Tab.Group /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(t2, q), t2;
  }
  return n;
}
function fe(e, n) {
  return u(n.type, ce, e, n);
}
var be = import_react2.Fragment;
function me(e, n) {
  let { defaultIndex: t2 = 0, vertical: l2 = false, manual: o4 = false, onChange: a2, selectedIndex: T2 = null, ...R } = e;
  const m = l2 ? "vertical" : "horizontal", b2 = o4 ? "manual" : "auto";
  let i = T2 !== null, c2 = s({ isControlled: i }), p = y(n), [u3, f3] = (0, import_react2.useReducer)(fe, { info: c2, selectedIndex: T2 != null ? T2 : t2, tabs: [], panels: [] }), P = (0, import_react2.useMemo)(() => ({ selectedIndex: u3.selectedIndex }), [u3.selectedIndex]), g = s(a2 || (() => {
  })), E = s(u3.tabs), L = (0, import_react2.useMemo)(() => ({ orientation: m, activation: b2, ...u3 }), [m, b2, u3]), A = o((s5) => (f3({ type: 1, tab: s5 }), () => f3({ type: 2, tab: s5 }))), S = o((s5) => (f3({ type: 3, panel: s5 }), () => f3({ type: 4, panel: s5 }))), k = o((s5) => {
    h.current !== s5 && g.current(s5), i || f3({ type: 0, index: s5 });
  }), h = s(i ? e.selectedIndex : u3.selectedIndex), W = (0, import_react2.useMemo)(() => ({ registerTab: A, registerPanel: S, change: k }), []);
  l(() => {
    f3({ type: 0, index: T2 != null ? T2 : t2 });
  }, [T2]), l(() => {
    if (h.current === void 0 || u3.tabs.length <= 0)
      return;
    let s5 = I2(u3.tabs, (d2) => d2.current);
    s5.some((d2, M2) => u3.tabs[M2] !== d2) && k(s5.indexOf(u3.tabs[h.current]));
  });
  let O3 = { ref: p };
  return import_react2.default.createElement(C2, null, import_react2.default.createElement($.Provider, { value: W }, import_react2.default.createElement(X.Provider, { value: L }, L.tabs.length <= 0 && import_react2.default.createElement(b, { onFocus: () => {
    var s5, r2;
    for (let d2 of E.current)
      if (((s5 = d2.current) == null ? void 0 : s5.tabIndex) === 0)
        return (r2 = d2.current) == null || r2.focus(), true;
    return false;
  } }), C({ ourProps: O3, theirProps: R, slot: P, defaultTag: be, name: "Tabs" }))));
}
var Pe = "div";
function ye(e, n) {
  let { orientation: t2, selectedIndex: l2 } = F("Tab.List"), o4 = y(n);
  return C({ ourProps: { ref: o4, role: "tablist", "aria-orientation": t2 }, theirProps: e, slot: { selectedIndex: l2 }, defaultTag: Pe, name: "Tabs.List" });
}
var xe = "button";
function ge(e, n) {
  var O3, s5;
  let t2 = I(), { id: l2 = `headlessui-tabs-tab-${t2}`, ...o4 } = e, { orientation: a2, activation: T2, selectedIndex: R, tabs: m, panels: b2 } = F("Tab"), i = q("Tab"), c2 = F("Tab"), p = (0, import_react2.useRef)(null), u3 = y(p, n);
  l(() => i.registerTab(p), [i, p]);
  let f3 = d("tabs"), P = m.indexOf(p);
  P === -1 && (P = f3);
  let g = P === R, E = o((r2) => {
    var M2;
    let d2 = r2();
    if (d2 === N.Success && T2 === "auto") {
      let K = (M2 = o2(p)) == null ? void 0 : M2.activeElement, z = c2.tabs.findIndex((te) => te.current === K);
      z !== -1 && i.change(z);
    }
    return d2;
  }), L = o((r2) => {
    let d2 = m.map((K) => K.current).filter(Boolean);
    if (r2.key === o3.Space || r2.key === o3.Enter) {
      r2.preventDefault(), r2.stopPropagation(), i.change(P);
      return;
    }
    switch (r2.key) {
      case o3.Home:
      case o3.PageUp:
        return r2.preventDefault(), r2.stopPropagation(), E(() => O(d2, M.First));
      case o3.End:
      case o3.PageDown:
        return r2.preventDefault(), r2.stopPropagation(), E(() => O(d2, M.Last));
    }
    if (E(() => u(a2, { vertical() {
      return r2.key === o3.ArrowUp ? O(d2, M.Previous | M.WrapAround) : r2.key === o3.ArrowDown ? O(d2, M.Next | M.WrapAround) : N.Error;
    }, horizontal() {
      return r2.key === o3.ArrowLeft ? O(d2, M.Previous | M.WrapAround) : r2.key === o3.ArrowRight ? O(d2, M.Next | M.WrapAround) : N.Error;
    } })) === N.Success)
      return r2.preventDefault();
  }), A = (0, import_react2.useRef)(false), S = o(() => {
    var r2;
    A.current || (A.current = true, (r2 = p.current) == null || r2.focus({ preventScroll: true }), i.change(P), t(() => {
      A.current = false;
    }));
  }), k = o((r2) => {
    r2.preventDefault();
  }), h = (0, import_react2.useMemo)(() => {
    var r2;
    return { selected: g, disabled: (r2 = e.disabled) != null ? r2 : false };
  }, [g, e.disabled]), W = { ref: u3, onKeyDown: L, onMouseDown: k, onClick: S, id: l2, role: "tab", type: T(e, p), "aria-controls": (s5 = (O3 = b2[P]) == null ? void 0 : O3.current) == null ? void 0 : s5.id, "aria-selected": g, tabIndex: g ? 0 : -1 };
  return C({ ourProps: W, theirProps: o4, slot: h, defaultTag: xe, name: "Tabs.Tab" });
}
var Ee = "div";
function Ae(e, n) {
  let { selectedIndex: t2 } = F("Tab.Panels"), l2 = y(n), o4 = (0, import_react2.useMemo)(() => ({ selectedIndex: t2 }), [t2]);
  return C({ ourProps: { ref: l2 }, theirProps: e, slot: o4, defaultTag: Ee, name: "Tabs.Panels" });
}
var Re = "div";
var Le = O2.RenderStrategy | O2.Static;
function _e(e, n) {
  var E, L, A, S;
  let t2 = I(), { id: l2 = `headlessui-tabs-panel-${t2}`, tabIndex: o4 = 0, ...a2 } = e, { selectedIndex: T2, tabs: R, panels: m } = F("Tab.Panel"), b2 = q("Tab.Panel"), i = (0, import_react2.useRef)(null), c2 = y(i, n);
  l(() => b2.registerPanel(i), [b2, i, l2]);
  let p = d("panels"), u3 = m.indexOf(i);
  u3 === -1 && (u3 = p);
  let f3 = u3 === T2, P = (0, import_react2.useMemo)(() => ({ selected: f3 }), [f3]), g = { ref: c2, id: l2, role: "tabpanel", "aria-labelledby": (L = (E = R[u3]) == null ? void 0 : E.current) == null ? void 0 : L.id, tabIndex: f3 ? o4 : -1 };
  return !f3 && ((A = a2.unmount) == null || A) && !((S = a2.static) != null && S) ? import_react2.default.createElement(u2, { as: "span", "aria-hidden": "true", ...g }) : C({ ourProps: g, theirProps: a2, slot: P, defaultTag: Re, features: Le, visible: f3, name: "Tabs.Panel" });
}
var Se = U(ge);
var Ie = U(me);
var De = U(ye);
var Fe = U(Ae);
var he = U(_e);
var $e = Object.assign(Se, { Group: Ie, List: De, Panels: Fe, Panel: he });

// app/routes/_index.tsx
var import_google = __toESM(require_google());

// app/utils/getBasicMetaTags.tsx
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/utils/getBasicMetaTags.tsx"
  );
  import.meta.hot.lastModified = "1701300427070.158";
}
function getBasicMetaTags({
  title,
  description = "Agrega formularios de contacto a tu sitio web f\xE1cilmente",
  // description should be at least 100 chars
  image = "https://i.imgur.com/6kgOsufh.png",
  twitterCard = "summary"
}) {
  if (!title) {
    return [
      {
        title: "Formmy"
      },
      {
        name: "description",
        content: "Agrega formularios de contacto a tu sitio web f\xE1cilmente"
      }
    ];
  }
  return [
    { title },
    {
      property: "og:title",
      content: title
    },
    {
      name: "description",
      content: description
    },
    {
      property: "og:image",
      content: image
    },
    {
      property: "og:type",
      content: "website"
    },
    {
      property: "og:url",
      content: "formy.app"
    },
    {
      name: "twitter:card",
      content: twitterCard
    },
    {
      name: "twitter:image",
      content: image
    }
  ];
}

// app/components/ui/GradientButton.tsx
var import_react3 = __toESM(require_react());

// @/lib/utils.ts
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// app/components/ui/GradientButton.tsx
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/ui/GradientButton.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/ui/GradientButton.tsx"
  );
  import.meta.hot.lastModified = "1737640034124.2803";
}
function GradientButton({
  borderRadius = "1.75rem",
  children,
  as: Component = "button",
  containerClassName,
  borderClassName,
  duration,
  className,
  ...otherProps
}) {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Component, { className: twMerge("bg-transparent relative text-xl  h-14 w-full p-[1px] overflow-hidden ", containerClassName), style: {
    borderRadius
  }, ...otherProps, children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "absolute inset-0", style: {
      borderRadius: `calc(${borderRadius} * 0.96)`
    }, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(MovingBorder, { duration, rx: "30%", ry: "30%", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: cn("h-20 w-20 opacity-[0.8] bg-[radial-gradient(var(--brand-500)_40%,transparent_60%)]", borderClassName) }, void 0, false, {
      fileName: "app/components/ui/GradientButton.tsx",
      lineNumber: 45,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/components/ui/GradientButton.tsx",
      lineNumber: 44,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/components/ui/GradientButton.tsx",
      lineNumber: 41,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: cn("relative px-5  bg-slate-900/[0.8] border border-slate-800 backdrop-blur-xl text-white flex items-center justify-center w-full h-full  antialiased", className), style: {
      borderRadius: `calc(${borderRadius} * 0.96)`
    }, children }, void 0, false, {
      fileName: "app/components/ui/GradientButton.tsx",
      lineNumber: 49,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/ui/GradientButton.tsx",
    lineNumber: 38,
    columnNumber: 10
  }, this);
}
_c = GradientButton;
var MovingBorder = ({
  children,
  duration = 2e3,
  rx,
  ry,
  ...otherProps
}) => {
  _s();
  const pathRef = (0, import_react3.useRef)();
  const progress = useMotionValue(0);
  useAnimationFrame((time) => {
    var _a;
    const length = (_a = pathRef.current) == null ? void 0 : _a.getTotalLength();
    if (length) {
      const pxPerMillisecond = length / duration;
      progress.set(time * pxPerMillisecond % length);
    }
  });
  const x = useTransform(progress, (val) => {
    var _a;
    return (_a = pathRef.current) == null ? void 0 : _a.getPointAtLength(val).x;
  });
  const y2 = useTransform(progress, (val) => {
    var _a;
    return (_a = pathRef.current) == null ? void 0 : _a.getPointAtLength(val).y;
  });
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y2}px) translateX(-50%) translateY(-50%)`;
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("svg", { xmlns: "http://www.w3.org/2000/svg", preserveAspectRatio: "none", className: "absolute h-full w-full", width: "100%", height: "100%", ...otherProps, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("rect", { fill: "none", width: "100%", height: "100%", rx, ry, ref: pathRef }, void 0, false, {
      fileName: "app/components/ui/GradientButton.tsx",
      lineNumber: 79,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/components/ui/GradientButton.tsx",
      lineNumber: 78,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(motion.div, { style: {
      position: "absolute",
      top: 0,
      left: 0,
      display: "inline-block",
      transform
    }, children }, void 0, false, {
      fileName: "app/components/ui/GradientButton.tsx",
      lineNumber: 81,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/ui/GradientButton.tsx",
    lineNumber: 77,
    columnNumber: 10
  }, this);
};
_s(MovingBorder, "ZmUNqPLnKCLn2xVabL09z78+6/I=", false, function() {
  return [useMotionValue, useAnimationFrame, useTransform, useTransform];
});
_c2 = MovingBorder;
var _c;
var _c2;
$RefreshReg$(_c, "GradientButton");
$RefreshReg$(_c2, "MovingBorder");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/components/ui/Flipwords.tsx
var import_react4 = __toESM(require_react());
var import_jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/ui/Flipwords.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s2 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/ui/Flipwords.tsx"
  );
  import.meta.hot.lastModified = "1737640034123.7375";
}
var FlipWords = ({
  words,
  duration = 3e3,
  className
}) => {
  _s2();
  const [currentWord, setCurrentWord] = (0, import_react4.useState)(words[0]);
  const [isAnimating, setIsAnimating] = (0, import_react4.useState)(false);
  const startAnimation = (0, import_react4.useCallback)(() => {
    const word = words[words.indexOf(currentWord) + 1] || words[0];
    setCurrentWord(word);
    setIsAnimating(true);
  }, [currentWord, words]);
  (0, import_react4.useEffect)(() => {
    if (!isAnimating)
      setTimeout(() => {
        startAnimation();
      }, duration);
  }, [isAnimating, duration, startAnimation]);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(AnimatePresence, { onExitComplete: () => {
    setIsAnimating(false);
  }, children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(motion.div, { initial: {
    opacity: 0,
    y: 10
  }, animate: {
    opacity: 1,
    y: 0
  }, transition: {
    type: "spring",
    stiffness: 100,
    damping: 10
  }, exit: {
    opacity: 0,
    y: -40,
    x: 40,
    filter: "blur(8px)",
    scale: 2,
    position: "absolute"
  }, className: cn("z-10 inline-block relative text-left text-brand-500 dark:text-brand-500 px-2", className), children: currentWord.split(" ").map((word, wordIndex) => /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(motion.span, { initial: {
    opacity: 0,
    y: 10,
    filter: "blur(8px)"
  }, animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)"
  }, transition: {
    delay: wordIndex * 0.3,
    duration: 0.3
  }, className: "inline-block whitespace-nowrap", children: [
    word.split("").map((letter, letterIndex) => /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(motion.span, { initial: {
      opacity: 0,
      y: 10,
      filter: "blur(8px)"
    }, animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)"
    }, transition: {
      delay: wordIndex * 0.3 + letterIndex * 0.05,
      duration: 0.2
    }, className: "inline-block", children: letter }, word + letterIndex, false, {
      fileName: "app/components/ui/Flipwords.tsx",
      lineNumber: 79,
      columnNumber: 58
    }, this)),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("span", { className: "inline-block", children: "\xA0" }, void 0, false, {
      fileName: "app/components/ui/Flipwords.tsx",
      lineNumber: 93,
      columnNumber: 13
    }, this)
  ] }, word + wordIndex, true, {
    fileName: "app/components/ui/Flipwords.tsx",
    lineNumber: 67,
    columnNumber: 58
  }, this)) }, currentWord, false, {
    fileName: "app/components/ui/Flipwords.tsx",
    lineNumber: 48,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/ui/Flipwords.tsx",
    lineNumber: 45,
    columnNumber: 10
  }, this);
};
_s2(FlipWords, "D2GhFuLuZkWSimyhwNT5ptDyAJ0=");
_c3 = FlipWords;
var _c3;
$RefreshReg$(_c3, "FlipWords");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/components/home/hero.tsx
var import_jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/home/hero.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s3 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/home/hero.tsx"
  );
  import.meta.hot.lastModified = "1737642690791.2908";
}
var Hero = () => {
  const words = ["contacto", "registro", "suscripci\xF3n"];
  return /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)("section", { className: "min-h-screen w-full flex md:items-center justify-center  relative overflow-hidden", children: /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)("div", { className: "w-full pt-0 lg:pt-32", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)("div", { style: {
      transformStyle: "preserve-3d"
    }, className: "dark:block hidden", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)(FloatingItem, { className: "-top-[80px]  lg:-top-[160px]  w-44 lg:w-[280px]  absolute object-cover ", src: "/assets/hero/img2-d.svg", rotation: 6, delay: 0.9 }, void 0, false, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 34,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)(FloatingItem, { className: "w-40  xl:w-[280px] top-40 md:top-[148px] lg:top-20 left-8 md:-left-6  lg:w-[180px] absolute object-cover ", src: "/assets/hero/img1-d.svg", rotation: -8, delay: 0.6 }, void 0, false, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 35,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)(FloatingItem, { className: "top-[280px] lg:top-[320px] left-10 xl:left-10 w-40 lg:w-[200px] xl:w-[280px]  absolute object-cover ", src: "/assets/hero/img3-d.svg", rotation: 8, delay: 0.3 }, void 0, false, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 37,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)(FloatingItem, { className: "w-32  lg:w-[180px]  lg:-top-32 -top-20 right-10 lg:right-16  absolute object-cover ", src: "/assets/hero/img4-d.svg", rotation: -6, direction: -1, delay: 1.8 }, void 0, false, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 38,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)(FloatingItem, { className: " w-40 top-20 right-16 md:-right-10  lg:w-[280px]  absolute object-cover ", src: "/assets/hero/img6-d.svg", rotation: 8, direction: -1, delay: 1.5 }, void 0, false, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 39,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)(FloatingItem, { className: "w-44  lg:w-[280px] right-6  lg:right-16 top-[240px] lg:top-[280px] absolute object-cover ", src: "/assets/hero/img5-d.svg", rotation: -8, direction: -1, delay: 1.2 }, void 0, false, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 40,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/hero.tsx",
      lineNumber: 31,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)("div", { style: {
      transformStyle: "preserve-3d"
    }, className: "block dark:hidden", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)(FloatingItem, { className: "-top-[80px]  lg:-top-[160px]  w-44 lg:w-[280px]  absolute object-cover ", src: "/assets/hero/img1.svg", rotation: 6, delay: 0.9 }, void 0, false, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 45,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)(FloatingItem, { className: "w-40  xl:w-[280px] top-40 md:top-[148px] lg:top-20 left-8 md:-left-6  lg:w-[180px] absolute object-cover ", src: "/assets/hero/img2.svg", rotation: -8, delay: 0.6 }, void 0, false, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 46,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)(FloatingItem, { className: "top-[280px] lg:top-[320px] left-10 xl:left-10 w-40 lg:w-[200px] xl:w-[280px]  absolute object-cover ", src: "/assets/hero/img3.svg", rotation: 8, delay: 0.3 }, void 0, false, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 48,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)(FloatingItem, { className: "w-32  lg:w-[180px] lg:-top-32 -top-20 right-10 lg:right-16  absolute object-cover ", src: "/assets/hero/img4.svg", rotation: -6, direction: -1, delay: 1.8 }, void 0, false, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 49,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)(FloatingItem, { className: " w-40 top-20 right-16 md:-right-10  lg:w-[280px]  absolute object-cover ", src: "/assets/hero/img5.svg", rotation: 8, direction: -1, delay: 1.5 }, void 0, false, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 50,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)(FloatingItem, { className: "w-44  lg:w-[280px] right-6  lg:right-16 top-[240px] lg:top-[280px] absolute object-cover ", src: "/assets/hero/img6.svg", rotation: -8, direction: -1, delay: 1.2 }, void 0, false, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 51,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/hero.tsx",
      lineNumber: 42,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)("div", { className: "flex flex-col items-center pt-[40vh] md:pt-0 px-4 md:px-0 ", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)("h1", { className: "text-4xl lg:text-7xl !z-[80] text-dark dark:text-white font-bold text-center  mt-16 ", children: [
        "Agrega formularios de ",
        /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)(FlipWords, { className: "", words }, void 0, false, {
          fileName: "app/components/home/hero.tsx",
          lineNumber: 55,
          columnNumber: 35
        }, this),
        " ",
        /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)("br", {}, void 0, false, {
          fileName: "app/components/home/hero.tsx",
          lineNumber: 56,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 54,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)("h1", { className: "text-4xl lg:text-7xl !z-[80] text-dark dark:text-white font-bold text-center -mt-1 md:mt-6 ", children: "a tu sitio web f\xE1cilmente" }, void 0, false, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 58,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)("span", { className: "text-xl lg:text-2xl  text-gray-600 dark:text-irongray font-sans font-extralight mt-4 mb-16", children: "Sin c\xF3digo. Copia, pega y listo." }, void 0, false, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 61,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)(Form, { method: "post", children: /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)(BigCTA, { type: "submit", name: "intent", value: "google-login" }, void 0, false, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 65,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "app/components/home/hero.tsx",
        lineNumber: 64,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/hero.tsx",
      lineNumber: 53,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/home/hero.tsx",
    lineNumber: 30,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/home/hero.tsx",
    lineNumber: 29,
    columnNumber: 10
  }, this);
};
_c4 = Hero;
var FloatingItem = ({
  src,
  className,
  rotation = -6,
  direction = 1,
  delay = 0
}) => {
  _s3();
  const {
    scrollY
  } = useScroll();
  const springScrollY = useSpring(scrollY, {
    bounce: 0
  });
  const opacity = useTransform(springScrollY, [0, 400], [1, 0]);
  const x = useTransform(springScrollY, [0, 400], [0, -200 * direction]);
  const rotationZ = useTransform(springScrollY, [0, 400], [rotation, -rotation], {
    ease: easeInOut
  });
  useMotionValueEvent(scrollY, "change", (value) => {
  });
  const scale = useSpring(0.5);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)(motion.img, { onHoverStart: () => {
    scale.set(1.1);
    console.log("panfilo");
  }, onHoverEnd: () => {
    scale.set(1);
  }, custom: 2, style: {
    opacity,
    x,
    rotateZ: rotationZ,
    scale
  }, initial: {
    opacity: 0,
    filter: "blur(4px)",
    scale: 0.5
  }, animate: {
    opacity: 1,
    filter: "blur(0)",
    scale: 1
  }, transition: {
    duration: 1,
    type: "spring",
    delay
  }, src, className: twMerge(" cursor-pointer ", className) }, void 0, false, {
    fileName: "app/components/home/hero.tsx",
    lineNumber: 93,
    columnNumber: 10
  }, this);
};
_s3(FloatingItem, "Ev+tX4I+N5uUIDmcdv7Rw4vt+zM=", false, function() {
  return [useScroll, useSpring, useTransform, useTransform, useTransform, useMotionValueEvent, useSpring];
});
_c22 = FloatingItem;
var _c4;
var _c22;
$RefreshReg$(_c4, "Hero");
$RefreshReg$(_c22, "FloatingItem");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/components/ui/infinite-scroll.tsx
var import_react6 = __toESM(require_react());
var import_jsx_dev_runtime4 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/ui/infinite-scroll.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s4 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/ui/infinite-scroll.tsx"
  );
  import.meta.hot.lastModified = "1737640034127.367";
}
var InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className
}) => {
  _s4();
  const containerRef = import_react6.default.useRef(null);
  const scrollerRef = import_react6.default.useRef(null);
  (0, import_react6.useEffect)(() => {
    addAnimation();
  }, []);
  const [start, setStart] = (0, import_react6.useState)(false);
  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);
      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });
      getDirection();
      getSpeed();
      setStart(true);
    }
  }
  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty("--animation-direction", "forwards");
      } else {
        containerRef.current.style.setProperty("--animation-direction", "reverse");
      }
    }
  };
  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("div", { ref: containerRef, className: cn("scroller relative z-20 mx-auto max-w-7xl overflow-hidden  [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]", className), children: /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("ul", { ref: scrollerRef, className: cn(" flex min-w-full items-center shrink-0 gap-4 py-4 w-max flex-nowrap", start && "animate-scroll ", pauseOnHover && "hover:[animation-play-state:paused]"), children: items.map((item, idx) => /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("li", { className: "w-auto max-w-full relative rounded-2xl  flex-shrink-0 px-3 lg:px-8 py-3 lg:py-6 ", children: /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("blockquote", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("img", { className: "w-[88px] lg:w-[120px] grayscale", src: item.img }, void 0, false, {
    fileName: "app/components/ui/infinite-scroll.tsx",
    lineNumber: 77,
    columnNumber: 15
  }, this) }, void 0, false, {
    fileName: "app/components/ui/infinite-scroll.tsx",
    lineNumber: 76,
    columnNumber: 13
  }, this) }, item.name, false, {
    fileName: "app/components/ui/infinite-scroll.tsx",
    lineNumber: 75,
    columnNumber: 35
  }, this)) }, void 0, false, {
    fileName: "app/components/ui/infinite-scroll.tsx",
    lineNumber: 74,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/ui/infinite-scroll.tsx",
    lineNumber: 73,
    columnNumber: 10
  }, this);
};
_s4(InfiniteMovingCards, "jB/MF5m62Rqy7sONWbLCmM0Tkmk=");
_c5 = InfiniteMovingCards;
var _c5;
$RefreshReg$(_c5, "InfiniteMovingCards");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/components/home/CompaniesScroll.tsx
var import_jsx_dev_runtime5 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/home/CompaniesScroll.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/home/CompaniesScroll.tsx"
  );
  import.meta.hot.lastModified = "1733871814487.3865";
}
var companies = [
  {
    img: "https://i.imgur.com/AjBTHty.png",
    name: "fixterorg"
  },
  {
    img: "https://i.imgur.com/iqoX66G.png",
    name: "fixtergeek"
  },
  {
    img: "https://i.imgur.com/e4hOdkV.png",
    name: "surveyup"
  },
  {
    img: "https://i.imgur.com/MIB8mYa.png",
    name: "potentia"
  },
  {
    img: "https://i.imgur.com/9S7Jamw.png",
    name: "collectum"
  }
  // {
  //   img: "https://i.imgur.com/tVnMwtP.png",
  //   name: "english4pros",
  // },
];
var CompaniesScroll = () => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime5.jsxDEV)(InfiniteMovingCards, { items: companies, direction: "left", speed: "normal" }, void 0, false, {
    fileName: "app/components/home/CompaniesScroll.tsx",
    lineNumber: 44,
    columnNumber: 10
  }, this);
};
_c6 = CompaniesScroll;
var _c6;
$RefreshReg$(_c6, "CompaniesScroll");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/components/home/Pricing.tsx
var import_react9 = __toESM(require_react());

// app/lib/hooks/useLocalStorage.tsx
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/lib/hooks/useLocalStorage.tsx"
  );
  import.meta.hot.lastModified = "1707709500249.5315";
}
function useLocalStorage() {
  const save = (name, value) => {
    localStorage.setItem(name, JSON.stringify(value));
  };
  const get = (name) => {
    const value = localStorage.getItem(name);
    return value ? JSON.parse(value) : value;
  };
  return {
    save,
    get
  };
}

// app/components/home/Pricing.tsx
var import_jsx_dev_runtime6 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/home/Pricing.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s5 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/home/Pricing.tsx"
  );
  import.meta.hot.lastModified = "1737642690790.378";
}
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
var Pricing = () => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("section", { className: "px-[5%] lg:px-0 lg:max-w-6xl max-w-3xl mx-auto text-center py-20 lg:py-[160px]", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("h2", { className: " text-dark dark:text-white text-3xl lg:text-5xl font-bold text-center", children: "Escoge tu plan" }, void 0, false, {
      fileName: "app/components/home/Pricing.tsx",
      lineNumber: 34,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("p", { className: " text-lg md:text-xl lg:text-2xl font-extralight mt-6  text-gray-600 dark:text-space-400", children: [
      "Empieza a usar Formmy sin pagar nada. Cambia al Plan",
      " ",
      /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("strong", { children: "PRO" }, void 0, false, {
        fileName: "app/components/home/Pricing.tsx",
        lineNumber: 39,
        columnNumber: 9
      }, this),
      " cuando lo necesites."
    ] }, void 0, true, {
      fileName: "app/components/home/Pricing.tsx",
      lineNumber: 37,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)(ScrollReveal, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)(PriceTabs, {}, void 0, false, {
      fileName: "app/components/home/Pricing.tsx",
      lineNumber: 42,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/components/home/Pricing.tsx",
      lineNumber: 41,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/home/Pricing.tsx",
    lineNumber: 33,
    columnNumber: 10
  }, this);
};
_c7 = Pricing;
var PriceTabs = () => {
  _s5();
  const [activeTab, setActiveTab] = (0, import_react9.useState)(1);
  const fetcher = useFetcher();
  const {
    save
  } = useLocalStorage();
  const handleOnClickAnualSuscription = () => {
    save("from_landing", true);
    fetcher.submit({
      intent: "anual-suscription-checkout"
    }, {
      method: "post",
      action: "/api/stripe"
    });
  };
  const handleOnClickMonthlySuscription = () => {
    save("from_landing", true);
    fetcher.submit({
      intent: "monthly-suscription-checkout"
    }, {
      method: "post",
      action: "/api/stripe"
    });
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("div", { className: "flex-col flex-wrap flex justify-center relative", children: /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)($e.Group, { selectedIndex: activeTab, onChange: setActiveTab, children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("div", { className: "m-auto mb-12 ", children: /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)($e.List, { className: "tabs bg-[#EDEDF1] dark:bg-[#1D1C20] w-[240px] h-[56px] rounded-full mt-10 lg:mt-16 flex items-center justify-center", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)($e, { className: ({
        selected
      }) => classNames("w-[120px]  h-[56px] border-none rounded-full  text-md font-medium  ", "ring-0 ring-offset-0 focus:outline-none focus:ring-0 ", selected ? " bg-brand-500 text-clear" : "text-space-800  dark:text-white  "), children: "Mensual" }, void 0, false, {
        fileName: "app/components/home/Pricing.tsx",
        lineNumber: 78,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)($e, { className: ({
        selected
      }) => classNames("w-[120px]  h-[56px] border-none rounded-full  text-md font-medium  relative ", "ring-0 ring-offset-0 focus:outline-none focus:ring-0 ", selected ? " bg-brand-500 text-clear" : "text-space-800 dark:text-white   "), children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("span", { style: {
          fontFamily: "Licorice"
        }, className: "absolute text-brand-500 scale-75 licorice-regular flex -right-12 md:-right-28 -top-10 ", children: [
          " ",
          /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("img", { className: " w-12 rotate-[18deg] ", src: "/assets/doodle-arrow.svg", alt: "arrow" }, void 0, false, {
            fileName: "app/components/home/Pricing.tsx",
            lineNumber: 90,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("img", { className: "w-24 -mt-6 ml-2", src: "/assets/25.svg" }, void 0, false, {
            fileName: "app/components/home/Pricing.tsx",
            lineNumber: 91,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "app/components/home/Pricing.tsx",
          lineNumber: 86,
          columnNumber: 15
        }, this),
        "Anual"
      ] }, void 0, true, {
        fileName: "app/components/home/Pricing.tsx",
        lineNumber: 83,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/Pricing.tsx",
      lineNumber: 77,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/components/home/Pricing.tsx",
      lineNumber: 76,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)($e.Panels, { children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)($e.Panel, { className: "flex gap-8 lg:gap-16 justify-center flex-wrap md:flex-nowrap", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)(
          PricingCard,
          {
            button: /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)(Form, { method: "post", className: "min-w-full", children: /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)(BigCTA, { type: "submit", name: "intent", value: "google-login", className: "min-w-full" }, void 0, false, {
              fileName: "app/components/home/Pricing.tsx",
              lineNumber: 100,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "app/components/home/Pricing.tsx",
              lineNumber: 99,
              columnNumber: 34
            }, this),
            name: "Free",
            description: "Perfecto para ti y tu sitio web",
            price: "0",
            benefits: [{
              emoji: "\u{1F4CB}",
              title: "3 proyectos"
            }, {
              emoji: "\u{1F4AC}",
              title: "Mensajes ilimitados"
            }, {
              emoji: "\u{1F4EA}",
              title: "Notificaciones v\xEDa email"
            }, {
              emoji: "\u{1F3A8}",
              title: "Personalizaci\xF3n de formularios"
            }, {
              emoji: "\u{1F3AF}",
              title: "Dashboard para administrar tus mensajes"
            }]
          },
          void 0,
          false,
          {
            fileName: "app/components/home/Pricing.tsx",
            lineNumber: 99,
            columnNumber: 13
          },
          this
        ),
        /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)(PricingCard, { isLoading: fetcher.state !== "idle", onClickButton: handleOnClickMonthlySuscription, cta: "\xA1Quiero ser PRO!", name: "PRO \u2728", description: "Ideal si eres freelancer", price: 8, image: "/assets/thunder-back.svg", benefits: [{
          emoji: "\u{1F4CB}",
          title: "Proyectos ilimitados"
        }, {
          emoji: "\u{1F4AC}",
          title: "Mensajes ilimitados"
        }, {
          emoji: "\u{1F4EA}",
          title: "Notificaciones v\xEDa email"
        }, {
          emoji: "\u{1F3A8}",
          title: "M\xE1s opciones para personalizar tus formularios"
        }, {
          emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F466}\u200D\u{1F466}",
          title: "Administraci\xF3n de usuarios"
        }, {
          emoji: "\u{1F3AF}",
          title: "Dashboard para administrar tus mensajes"
        }] }, void 0, false, {
          fileName: "app/components/home/Pricing.tsx",
          lineNumber: 119,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/home/Pricing.tsx",
        lineNumber: 98,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)($e.Panel, { className: "flex gap-8 lg:gap-16 justify-center flex-wrap md:flex-nowrap", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)(
          PricingCard,
          {
            button: /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)(Form, { method: "post", className: "min-w-full", children: /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)(BigCTA, { type: "submit", name: "intent", value: "google-login", className: "min-w-full", containerClassName: "w-full" }, void 0, false, {
              fileName: "app/components/home/Pricing.tsx",
              lineNumber: 141,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "app/components/home/Pricing.tsx",
              lineNumber: 140,
              columnNumber: 34
            }, this),
            name: "Free",
            description: "Perfecto para ti y tu sitio web",
            price: "0",
            benefits: [{
              emoji: "\u{1F4CB}",
              title: "3 proyectos"
            }, {
              emoji: "\u{1F4AC}",
              title: "Mensajes ilimitados"
            }, {
              emoji: "\u{1F4EA}",
              title: "Notificaciones v\xEDa email"
            }, {
              emoji: "\u{1F3A8}",
              title: "Personalizaci\xF3n de formularios"
            }, {
              emoji: "\u{1F3AF}",
              title: "Dashboard para administrar tus mensajes"
            }]
          },
          void 0,
          false,
          {
            fileName: "app/components/home/Pricing.tsx",
            lineNumber: 140,
            columnNumber: 13
          },
          this
        ),
        /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)(PricingCard, { isLoading: fetcher.state !== "idle", onClickButton: handleOnClickAnualSuscription, cta: "\xA1Quiero ser PRO!", name: "PRO \u2728", description: "Ideal si eres freelancer", price: 6, image: "/assets/thunder-back.svg", benefits: [{
          emoji: "\u{1F4CB}",
          title: "Proyectos ilimitados"
        }, {
          emoji: "\u{1F4AC}",
          title: "Mensajes ilimitados"
        }, {
          emoji: "\u{1F4EA}",
          title: "Notificaciones v\xEDa email"
        }, {
          emoji: "\u{1F3A8}",
          title: "M\xE1s opciones para personalizar tus formularios"
        }, {
          emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F466}\u200D\u{1F466}",
          title: "Administraci\xF3n de usuarios"
        }, {
          emoji: "\u{1F3AF}",
          title: "Dashboard para administrar tus mensajes"
        }] }, void 0, false, {
          fileName: "app/components/home/Pricing.tsx",
          lineNumber: 160,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/home/Pricing.tsx",
        lineNumber: 139,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/Pricing.tsx",
      lineNumber: 97,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/home/Pricing.tsx",
    lineNumber: 75,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/home/Pricing.tsx",
    lineNumber: 72,
    columnNumber: 10
  }, this);
};
_s5(PriceTabs, "2MPbHETCXl6tpAUviufiN3lNfFc=", false, function() {
  return [useFetcher, useLocalStorage];
});
_c23 = PriceTabs;
var PricingCard = ({
  plan,
  isDisable,
  name,
  button,
  cta,
  isLoading,
  description,
  benefits,
  price,
  image,
  onClickButton
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)(motion.div, { className: "box max-w-[360px] w-full grow", initial: {
    opacity: 0,
    scale: 0.5
  }, animate: {
    opacity: 1,
    scale: 1
  }, transition: {
    duration: 0.3,
    delay: 0.2,
    ease: [0, 0.71, 0.2, 1.01]
  }, children: /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("div", { style: {
    backgroundImage: `url(${image})`,
    backgroundPosition: "bottom",
    backgroundRepeat: "no-repeat"
  }, className: "bg-[#fff] dark:bg-dark  border-solid border-[1px] dark:border-lightgray rounded-xl w-full border-iman   py-[32px] px-6 text-left ", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("h3", { className: "text-2xl font-bold dark:text-[#e5e7eb] text-[#0F1017]", children: name }, void 0, false, {
      fileName: "app/components/home/Pricing.tsx",
      lineNumber: 217,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("p", { className: "text-space-500 dark:text-space-400 mb-4 font-light", children: description }, void 0, false, {
      fileName: "app/components/home/Pricing.tsx",
      lineNumber: 220,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("p", { children: [
      " ",
      /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("span", { className: "text-4xl font-bold dark:text-white text-space-800", children: [
        "$ ",
        price,
        " "
      ] }, void 0, true, {
        fileName: "app/components/home/Pricing.tsx",
        lineNumber: 225,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("span", { className: "text-lg text-space-500 dark:text-space-400", children: [
        " ",
        "USD / mes"
      ] }, void 0, true, {
        fileName: "app/components/home/Pricing.tsx",
        lineNumber: 228,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/Pricing.tsx",
      lineNumber: 223,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("hr", { className: "my-6 bg-[#EDEDF1] dark:bg-lightgray h-[1px] border-none" }, void 0, false, {
      fileName: "app/components/home/Pricing.tsx",
      lineNumber: 233,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("div", { className: "h-[300px]", children: benefits.map(({
      emoji,
      title
    }) => {
      return /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("div", { className: "flex items-center gap-2 mb-4", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("span", { className: "text-2xl", children: emoji }, void 0, false, {
          fileName: "app/components/home/Pricing.tsx",
          lineNumber: 240,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("h4", { className: "text-space-500 font-light dark:text-space-400", children: title }, void 0, false, {
          fileName: "app/components/home/Pricing.tsx",
          lineNumber: 241,
          columnNumber: 17
        }, this)
      ] }, title, true, {
        fileName: "app/components/home/Pricing.tsx",
        lineNumber: 239,
        columnNumber: 18
      }, this);
    }) }, void 0, false, {
      fileName: "app/components/home/Pricing.tsx",
      lineNumber: 234,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("hr", { className: "my-6 bg-[#EDEDF1] dark:bg-lightgray h-[1px] border-none" }, void 0, false, {
      fileName: "app/components/home/Pricing.tsx",
      lineNumber: 248,
      columnNumber: 9
    }, this),
    !button && /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("div", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)(GradientButton, { disabled: isLoading || isDisable, onClick: onClickButton, className: "bg-brand-500 text-base dark:bg-dark dark:hover:bg-[#1D1E27] transition-all dark:text-white border-neutral-200 dark:border-white/10", children: cta }, void 0, false, {
      fileName: "app/components/home/Pricing.tsx",
      lineNumber: 251,
      columnNumber: 13
    }, this) }, void 0, false, {
      fileName: "app/components/home/Pricing.tsx",
      lineNumber: 250,
      columnNumber: 21
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime6.jsxDEV)("div", { className: "flex w-full flex-col  transition-all ", children: button && button }, void 0, false, {
      fileName: "app/components/home/Pricing.tsx",
      lineNumber: 255,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/home/Pricing.tsx",
    lineNumber: 212,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/home/Pricing.tsx",
    lineNumber: 201,
    columnNumber: 10
  }, this);
};
_c32 = PricingCard;
var _c7;
var _c23;
var _c32;
$RefreshReg$(_c7, "Pricing");
$RefreshReg$(_c23, "PriceTabs");
$RefreshReg$(_c32, "PricingCard");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// node_modules/react-icons/tb/index.esm.js
function TbChartDots3(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 24 24", "strokeWidth": "2", "stroke": "currentColor", "fill": "none", "strokeLinecap": "round", "strokeLinejoin": "round" }, "child": [{ "tag": "path", "attr": { "stroke": "none", "d": "M0 0h24v24H0z", "fill": "none" } }, { "tag": "path", "attr": { "d": "M5 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" } }, { "tag": "path", "attr": { "d": "M16 15m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" } }, { "tag": "path", "attr": { "d": "M18 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" } }, { "tag": "path", "attr": { "d": "M6 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" } }, { "tag": "path", "attr": { "d": "M9 17l5 -1.5" } }, { "tag": "path", "attr": { "d": "M6.5 8.5l7.81 5.37" } }, { "tag": "path", "attr": { "d": "M7 7l8 -1" } }] })(props);
}

// app/components/ui/compare.tsx
var import_react10 = __toESM(require_react());
var import_jsx_dev_runtime7 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/ui/compare.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s6 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/ui/compare.tsx"
  );
  import.meta.hot.lastModified = "1737640034125.249";
}
var Compare = ({
  firstImage = "",
  secondImage = "",
  className,
  firstImageClassName,
  secondImageClassname,
  initialSliderPercentage = 50,
  slideMode = "hover",
  showHandlebar = true,
  autoplay = false,
  autoplayDuration = 5e3
}) => {
  _s6();
  const [sliderXPercent, setSliderXPercent] = (0, import_react10.useState)(initialSliderPercentage);
  const [isDragging, setIsDragging] = (0, import_react10.useState)(false);
  const sliderRef = (0, import_react10.useRef)(null);
  const [isMouseOver, setIsMouseOver] = (0, import_react10.useState)(false);
  const autoplayRef = (0, import_react10.useRef)(null);
  const startAutoplay = (0, import_react10.useCallback)(() => {
    if (!autoplay)
      return;
    const startTime = Date.now();
    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = elapsedTime % (autoplayDuration * 2) / autoplayDuration;
      const percentage = progress <= 1 ? progress * 100 : (2 - progress) * 100;
      setSliderXPercent(percentage);
      autoplayRef.current = setTimeout(animate, 16);
    };
    animate();
  }, [autoplay, autoplayDuration]);
  const stopAutoplay = (0, import_react10.useCallback)(() => {
    if (autoplayRef.current) {
      clearTimeout(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);
  (0, import_react10.useEffect)(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, [startAutoplay, stopAutoplay]);
  function mouseEnterHandler() {
    setIsMouseOver(true);
    stopAutoplay();
  }
  function mouseLeaveHandler() {
    setIsMouseOver(false);
    if (slideMode === "hover") {
      setSliderXPercent(initialSliderPercentage);
    }
    if (slideMode === "drag") {
      setIsDragging(false);
    }
    startAutoplay();
  }
  const handleStart = (0, import_react10.useCallback)((clientX) => {
    if (slideMode === "drag") {
      setIsDragging(true);
    }
  }, [slideMode]);
  const handleEnd = (0, import_react10.useCallback)(() => {
    if (slideMode === "drag") {
      setIsDragging(false);
    }
  }, [slideMode]);
  const handleMove = (0, import_react10.useCallback)((clientX) => {
    if (!sliderRef.current)
      return;
    if (slideMode === "hover" || slideMode === "drag" && isDragging) {
      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = x / rect.width * 100;
      requestAnimationFrame(() => {
        setSliderXPercent(Math.max(0, Math.min(100, percent)));
      });
    }
  }, [slideMode, isDragging]);
  const handleMouseDown = (0, import_react10.useCallback)((e) => handleStart(e.clientX), [handleStart]);
  const handleMouseUp = (0, import_react10.useCallback)(() => handleEnd(), [handleEnd]);
  const handleMouseMove = (0, import_react10.useCallback)((e) => handleMove(e.clientX), [handleMove]);
  const handleTouchStart = (0, import_react10.useCallback)((e) => {
    if (!autoplay) {
      handleStart(e.touches[0].clientX);
    }
  }, [handleStart, autoplay]);
  const handleTouchEnd = (0, import_react10.useCallback)(() => {
    if (!autoplay) {
      handleEnd();
    }
  }, [handleEnd, autoplay]);
  const handleTouchMove = (0, import_react10.useCallback)((e) => {
    if (!autoplay) {
      handleMove(e.touches[0].clientX);
    }
  }, [handleMove, autoplay]);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime7.jsxDEV)("div", { ref: sliderRef, className: cn("w-[400px] h-[400px] overflow-hidden", className), style: {
    position: "relative",
    cursor: slideMode === "drag" ? "grab" : "col-resize"
  }, onMouseMove: handleMouseMove, onMouseLeave: mouseLeaveHandler, onMouseEnter: mouseEnterHandler, onMouseDown: handleMouseDown, onMouseUp: handleMouseUp, onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd, onTouchMove: handleTouchMove, children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime7.jsxDEV)(AnimatePresence, { initial: false, children: /* @__PURE__ */ (0, import_jsx_dev_runtime7.jsxDEV)(motion.div, { className: "h-full w-px absolute top-0 m-auto z-30 bg-gradient-to-b from-transparent from-[5%] to-[95%] via-indigo-500 to-transparent", style: {
      left: `${sliderXPercent}%`,
      top: "0",
      zIndex: 40
    }, transition: {
      duration: 0
    }, children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime7.jsxDEV)("div", { className: "w-36 h-full [mask-image:radial-gradient(100px_at_left,white,transparent)] absolute top-1/2 -translate-y-1/2 left-0 bg-gradient-to-r from-indigo-400 via-transparent to-transparent z-20 opacity-50" }, void 0, false, {
        fileName: "app/components/ui/compare.tsx",
        lineNumber: 133,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime7.jsxDEV)("div", { className: "w-10 h-1/2 [mask-image:radial-gradient(50px_at_left,white,transparent)] absolute top-1/2 -translate-y-1/2 left-0 bg-gradient-to-r from-cyan-400 via-transparent to-transparent z-10 opacity-100" }, void 0, false, {
        fileName: "app/components/ui/compare.tsx",
        lineNumber: 134,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime7.jsxDEV)("div", { className: "w-10 h-3/4 top-1/2 -translate-y-1/2 absolute -right-10 [mask-image:radial-gradient(100px_at_left,white,transparent)]" }, void 0, false, {
        fileName: "app/components/ui/compare.tsx",
        lineNumber: 135,
        columnNumber: 11
      }, this),
      showHandlebar && /* @__PURE__ */ (0, import_jsx_dev_runtime7.jsxDEV)("div", { className: "h-5 w-5 rounded-md top-1/2 -translate-y-1/2 bg-white z-30 -right-2.5 absolute   flex items-center justify-center shadow-[0px_-1px_0px_0px_#FFFFFF40]", children: /* @__PURE__ */ (0, import_jsx_dev_runtime7.jsxDEV)(BsThreeDotsVertical, { className: "h-4 w-4 text-black" }, void 0, false, {
        fileName: "app/components/ui/compare.tsx",
        lineNumber: 146,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "app/components/ui/compare.tsx",
        lineNumber: 145,
        columnNumber: 29
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/ui/compare.tsx",
      lineNumber: 126,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/components/ui/compare.tsx",
      lineNumber: 125,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime7.jsxDEV)("div", { className: "overflow-hidden w-full h-full relative z-20 pointer-events-none", children: /* @__PURE__ */ (0, import_jsx_dev_runtime7.jsxDEV)(AnimatePresence, { initial: false, children: firstImage ? /* @__PURE__ */ (0, import_jsx_dev_runtime7.jsxDEV)(motion.div, { className: cn("absolute inset-0 z-20 rounded-2xl flex-shrink-0 w-full h-full select-none overflow-hidden", firstImageClassName), style: {
      clipPath: `inset(0 ${100 - sliderXPercent}% 0 0)`
    }, transition: {
      duration: 0
    }, children: /* @__PURE__ */ (0, import_jsx_dev_runtime7.jsxDEV)("img", { alt: "first image", src: firstImage, className: cn("absolute inset-0  z-20 rounded-2xl flex-shrink-0 w-full h-full select-none", firstImageClassName), draggable: false }, void 0, false, {
      fileName: "app/components/ui/compare.tsx",
      lineNumber: 157,
      columnNumber: 15
    }, this) }, void 0, false, {
      fileName: "app/components/ui/compare.tsx",
      lineNumber: 152,
      columnNumber: 25
    }, this) : null }, void 0, false, {
      fileName: "app/components/ui/compare.tsx",
      lineNumber: 151,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/components/ui/compare.tsx",
      lineNumber: 150,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime7.jsxDEV)(AnimatePresence, { initial: false, children: secondImage ? /* @__PURE__ */ (0, import_jsx_dev_runtime7.jsxDEV)(motion.img, { className: cn("absolute top-0 left-0 z-[19]  rounded-2xl w-full h-full select-none", secondImageClassname), alt: "second image", src: secondImage, draggable: false }, void 0, false, {
      fileName: "app/components/ui/compare.tsx",
      lineNumber: 163,
      columnNumber: 24
    }, this) : null }, void 0, false, {
      fileName: "app/components/ui/compare.tsx",
      lineNumber: 162,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/ui/compare.tsx",
    lineNumber: 121,
    columnNumber: 10
  }, this);
};
_s6(Compare, "AYWpjX0MNpsp6GMssAtsdYn4kcA=");
_c8 = Compare;
var _c8;
$RefreshReg$(_c8, "Compare");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/components/home/WithoutFormmy.tsx
var import_jsx_dev_runtime8 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/home/WithoutFormmy.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/home/WithoutFormmy.tsx"
  );
  import.meta.hot.lastModified = "1737642690791.004";
}
var WitoutFormmy = () => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("div", { className: "bg-[#F8F8F7] dark:bg-dark py-10", children: /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("section", { className: "h-auto w-[90%] xl:w-full  max-w-7xl mx-auto my-20 lg:mt-[80px] lg:mb-[80px] ", children: /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)(ScrollReveal, { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("h2", { className: " text-dark dark:text-white text-3xl lg:text-5xl font-bold text-center", children: "No m\xE1s l\xEDneas y l\xEDneas de inputs y validaciones" }, void 0, false, {
      fileName: "app/components/home/WithoutFormmy.tsx",
      lineNumber: 28,
      columnNumber: 11
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("div", { className: "flex justify-between flex-wrap lg:flex-nowrap items-center mt-12 lg:mt-20", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("div", { className: "w-full lg:w-[40%] mb-8 lg:mb-0", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("p", { className: " text-lg md:text-xl xl:text-2xl text- font-extralight  text-gray-600 dark:text-irongray", children: "No te preocupes m\xE1s por maquetar, estilizar y agregar validaciones a cada uno de tus campos, ahorra l\xEDneas y l\xEDneas de c\xF3digo al usar Formmy." }, void 0, false, {
          fileName: "app/components/home/WithoutFormmy.tsx",
          lineNumber: 33,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("div", { className: "text-gray-600 dark:text-irongray text-xl font-extralight flex flex-col gap-3 mt-6 lg:mt-12", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("div", { className: "flex items-center gap-2 text-lg md:text-xl xl:text-2xl ", children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("div", { className: "min-w-10 ", children: [
              " ",
              /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)(TbChartDots3, { className: "text-brand-500 " }, void 0, false, {
                fileName: "app/components/home/WithoutFormmy.tsx",
                lineNumber: 42,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "app/components/home/WithoutFormmy.tsx",
              lineNumber: 40,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("p", { children: "Agrega menos c\xF3digo" }, void 0, false, {
              fileName: "app/components/home/WithoutFormmy.tsx",
              lineNumber: 44,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "app/components/home/WithoutFormmy.tsx",
            lineNumber: 39,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("div", { className: "flex items-center gap-2 text-lg md:text-xl xl:text-2xl ", children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("div", { className: "min-w-10 ", children: [
              " ",
              /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)(TbChartDots3, { className: "text-brand-500 " }, void 0, false, {
                fileName: "app/components/home/WithoutFormmy.tsx",
                lineNumber: 49,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "app/components/home/WithoutFormmy.tsx",
              lineNumber: 47,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("p", { children: "Activa los campos con un clic o agrega tus propios campos" }, void 0, false, {
              fileName: "app/components/home/WithoutFormmy.tsx",
              lineNumber: 51,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "app/components/home/WithoutFormmy.tsx",
            lineNumber: 46,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("div", { className: "flex items-center gap-2 text-lg md:text-xl xl:text-2xl ", children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("div", { className: "min-w-10 ", children: [
              " ",
              /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)(TbChartDots3, { className: "text-brand-500 " }, void 0, false, {
                fileName: "app/components/home/WithoutFormmy.tsx",
                lineNumber: 58,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "app/components/home/WithoutFormmy.tsx",
              lineNumber: 56,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("p", { children: " Olv\xEDdate de las validaciones" }, void 0, false, {
              fileName: "app/components/home/WithoutFormmy.tsx",
              lineNumber: 60,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "app/components/home/WithoutFormmy.tsx",
            lineNumber: 55,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("div", { className: "flex items-center gap-2 text-lg md:text-xl xl:text-2xl ", children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("div", { className: "min-w-10 ", children: [
              " ",
              /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)(TbChartDots3, { className: "text-brand-500 " }, void 0, false, {
                fileName: "app/components/home/WithoutFormmy.tsx",
                lineNumber: 65,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "app/components/home/WithoutFormmy.tsx",
              lineNumber: 63,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)("p", { children: "Recibe notificaciones cada vez que recibes un mensaje o hay un nuevo registro" }, void 0, false, {
              fileName: "app/components/home/WithoutFormmy.tsx",
              lineNumber: 67,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "app/components/home/WithoutFormmy.tsx",
            lineNumber: 62,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "app/components/home/WithoutFormmy.tsx",
          lineNumber: 38,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/home/WithoutFormmy.tsx",
        lineNumber: 32,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime8.jsxDEV)(Compare, { firstImage: "/assets/without-formmy.svg", secondImage: "/assets/with-formmy.svg", firstImageClassName: "object-cover object-left-top", secondImageClassname: "object-cover object-left-top", className: "h-[320px]  w-full md:h-[500px] lg:w-[50%] mt-12 lg:mt-0 ", slideMode: "hover" }, void 0, false, {
        fileName: "app/components/home/WithoutFormmy.tsx",
        lineNumber: 75,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/WithoutFormmy.tsx",
      lineNumber: 31,
      columnNumber: 11
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/home/WithoutFormmy.tsx",
    lineNumber: 27,
    columnNumber: 9
  }, this) }, void 0, false, {
    fileName: "app/components/home/WithoutFormmy.tsx",
    lineNumber: 26,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/home/WithoutFormmy.tsx",
    lineNumber: 25,
    columnNumber: 10
  }, this);
};
_c9 = WitoutFormmy;
var _c9;
$RefreshReg$(_c9, "WitoutFormmy");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/components/ui/animated-tooltip.tsx
var import_react11 = __toESM(require_react());
var import_jsx_dev_runtime9 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/ui/animated-tooltip.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s7 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/ui/animated-tooltip.tsx"
  );
  import.meta.hot.lastModified = "1733871814489.4438";
}
var AnimatedTooltip = ({
  items
}) => {
  _s7();
  const [hoveredIndex, setHoveredIndex] = (0, import_react11.useState)(null);
  const springConfig = {
    stiffness: 100,
    damping: 5
  };
  const x = useMotionValue(0);
  const rotate = useSpring(useTransform(x, [-100, 100], [-45, 45]), springConfig);
  const translateX = useSpring(useTransform(x, [-100, 100], [-50, 50]), springConfig);
  const handleMouseMove = (event) => {
    const halfWidth = event.target.offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth);
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime9.jsxDEV)(import_jsx_dev_runtime9.Fragment, { children: items.map((item, idx) => /* @__PURE__ */ (0, import_jsx_dev_runtime9.jsxDEV)("div", { className: "-mr-4  relative group", onMouseEnter: () => setHoveredIndex(item.id), onMouseLeave: () => setHoveredIndex(null), children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime9.jsxDEV)(AnimatePresence, { mode: "popLayout", children: hoveredIndex === item.id && /* @__PURE__ */ (0, import_jsx_dev_runtime9.jsxDEV)(motion.div, { initial: {
      opacity: 0,
      y: 20,
      scale: 0.6
    }, animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 10
      }
    }, exit: {
      opacity: 0,
      y: 20,
      scale: 0.6
    }, style: {
      translateX,
      rotate,
      whiteSpace: "nowrap"
    }, className: "absolute -top-16 -left-1/2 translate-x-1/2 flex text-xs  flex-col items-center justify-center rounded-md bg-clear dark:bg-dark z-50 shadow-xl px-4 py-2", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime9.jsxDEV)("div", { className: "absolute inset-x-10 z-30 w-[20%] -bottom-px bg-gradient-to-r from-transparent via-[#FF906A] to-transparent h-px " }, void 0, false, {
        fileName: "app/components/ui/animated-tooltip.tsx",
        lineNumber: 68,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime9.jsxDEV)("div", { className: "absolute left-10 w-[40%] z-30 -bottom-px bg-gradient-to-r from-transparent via-[#9346ED] to-transparent h-px " }, void 0, false, {
        fileName: "app/components/ui/animated-tooltip.tsx",
        lineNumber: 69,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime9.jsxDEV)("div", { className: "font-bold text-dark dark:text-white relative z-30 text-base", children: item.name }, void 0, false, {
        fileName: "app/components/ui/animated-tooltip.tsx",
        lineNumber: 70,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime9.jsxDEV)("div", { className: "text-gray-600 dark:text-white/70 text-xs", children: item.designation }, void 0, false, {
        fileName: "app/components/ui/animated-tooltip.tsx",
        lineNumber: 73,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/ui/animated-tooltip.tsx",
      lineNumber: 46,
      columnNumber: 42
    }, this) }, void 0, false, {
      fileName: "app/components/ui/animated-tooltip.tsx",
      lineNumber: 45,
      columnNumber: 11
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime9.jsxDEV)("img", { onMouseMove: handleMouseMove, src: item.image, alt: item.name, className: "object-cover !m-0 !p-0 object-top rounded-full h-14 w-14 border-2 group-hover:scale-105 group-hover:z-30 border-white  relative transition duration-500" }, void 0, false, {
      fileName: "app/components/ui/animated-tooltip.tsx",
      lineNumber: 78,
      columnNumber: 11
    }, this)
  ] }, item.name, true, {
    fileName: "app/components/ui/animated-tooltip.tsx",
    lineNumber: 44,
    columnNumber: 33
  }, this)) }, void 0, false, {
    fileName: "app/components/ui/animated-tooltip.tsx",
    lineNumber: 43,
    columnNumber: 10
  }, this);
};
_s7(AnimatedTooltip, "A3IlFNFOx3dO30KiUdJggV5T1DA=", false, function() {
  return [useMotionValue, useSpring, useTransform, useSpring, useTransform];
});
_c10 = AnimatedTooltip;
var _c10;
$RefreshReg$(_c10, "AnimatedTooltip");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/components/home/Join.tsx
var import_jsx_dev_runtime10 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/home/Join.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/home/Join.tsx"
  );
  import.meta.hot.lastModified = "1733871814488.069";
}
var people = [{
  id: 1,
  name: "Mariana L\xF3pez",
  designation: "Software Engineer",
  image: "https://i.imgur.com/FwjZ8X2.jpg"
}, {
  id: 2,
  name: "Rosalba Flores",
  designation: "Marketing Agent",
  image: "https://i.imgur.com/RAiyJBc.jpg"
}, {
  id: 3,
  name: "Brenda Ortega",
  designation: "Product Designer",
  image: "https://i.imgur.com/TFQxcIu.jpg"
}, {
  id: 4,
  name: "Luis Robles",
  designation: "Contador",
  image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80"
}, {
  id: 5,
  name: "Gina Gonz\xE1lez",
  designation: "Maestra de Ingl\xE9s",
  image: "https://i.imgur.com/0yXHsGx.png0"
}];
var Join = () => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime10.jsxDEV)("section", { className: "bg-patternwhite dark:bg-pattern bg-no-repeat bg-contain bg-center max-w-7xl min-h-[70vh]  mx-auto py-20 flex flex-col justify-center items-center", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime10.jsxDEV)(ScrollReveal, { children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime10.jsxDEV)("h2", { className: " text-dark dark:text-white text-3xl lg:text-5xl font-bold text-center", children: [
        "Usa Formmy. Ahorra tiempo.",
        /* @__PURE__ */ (0, import_jsx_dev_runtime10.jsxDEV)("span", { className: "block lg:hidden", children: " Y reduce costos." }, void 0, false, {
          fileName: "app/components/home/Join.tsx",
          lineNumber: 55,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/home/Join.tsx",
        lineNumber: 53,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime10.jsxDEV)("div", { className: "flex flex-wrap justify-center mx-auto gap-8 mt-6", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime10.jsxDEV)("div", { className: "flex  mb-10 ", children: /* @__PURE__ */ (0, import_jsx_dev_runtime10.jsxDEV)(AnimatedTooltip, { items: people }, void 0, false, {
          fileName: "app/components/home/Join.tsx",
          lineNumber: 59,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "app/components/home/Join.tsx",
          lineNumber: 58,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime10.jsxDEV)("h2", { className: "hidden lg:block text-dark dark:text-white text-3xl lg:text-5xl font-bold text-center", children: "Y reduce costos." }, void 0, false, {
          fileName: "app/components/home/Join.tsx",
          lineNumber: 61,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/home/Join.tsx",
        lineNumber: 57,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/Join.tsx",
      lineNumber: 52,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime10.jsxDEV)(ScrollReveal, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime10.jsxDEV)(Form, { method: "post", children: /* @__PURE__ */ (0, import_jsx_dev_runtime10.jsxDEV)(BigCTA, { className: "mx-auto w-[180px]", type: "submit", name: "intent", value: "google-login" }, void 0, false, {
      fileName: "app/components/home/Join.tsx",
      lineNumber: 68,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/components/home/Join.tsx",
      lineNumber: 67,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/components/home/Join.tsx",
      lineNumber: 66,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/home/Join.tsx",
    lineNumber: 51,
    columnNumber: 10
  }, this);
};
_c11 = Join;
var _c11;
$RefreshReg$(_c11, "Join");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/components/home/FormmysTypes.tsx
var import_react13 = __toESM(require_react());
var import_jsx_dev_runtime11 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/home/FormmysTypes.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s8 = $RefreshSig$();
var _s22 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/home/FormmysTypes.tsx"
  );
  import.meta.hot.lastModified = "1737642690789.87";
}
var FormmysTypes = () => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("section", { className: "min-h-screen w-[90%] xl:w-full  max-w-7xl mx-auto mt-[120px] pb-[120px] overflow-hidden", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("h2", { className: " text-dark dark:text-white text-3xl lg:text-5xl font-bold text-center", children: "Personaliza tu formmy" }, void 0, false, {
      fileName: "app/components/home/FormmysTypes.tsx",
      lineNumber: 29,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("div", { className: "flex justify-between items-center flex-wrap lg:flex-nowrap w-full gap-12 lg:gap-0 mt-20 ", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("div", { className: "w-full lg:w-[50%] xl:w-[40%]", children: /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(ScrollRevealLeft, { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("h2", { className: " text-dark dark:text-white text-2xl lg:text-3xl xl:text-4xl font-bold", children: "Para formularios de contacto o registro" }, void 0, false, {
          fileName: "app/components/home/FormmysTypes.tsx",
          lineNumber: 36,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("p", { className: "text-lg lg:text-xl xl:text-2xl text-gray-600 dark:text-irongray font-extralight mt-6", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("strong", { children: "Activa o agrega los campos para tu Formmy, " }, void 0, false, {
            fileName: "app/components/home/FormmysTypes.tsx",
            lineNumber: 40,
            columnNumber: 15
          }, this),
          " ",
          "personaliza el tema, el color y hasta el mensaje que ver\xE1n tus usuarios al completar el formulario."
        ] }, void 0, true, {
          fileName: "app/components/home/FormmysTypes.tsx",
          lineNumber: 39,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("p", { className: "text-lg lg:text-xl xl:text-2xl text-gray-600 dark:text-irongray font-extralight mt-6", children: [
          " ",
          "\xA1Y lo mejor! Agr\xE9galo a tu sitio web pegando",
          " ",
          /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("strong", { children: "una sola l\xEDnea de c\xF3digo " }, void 0, false, {
            fileName: "app/components/home/FormmysTypes.tsx",
            lineNumber: 47,
            columnNumber: 15
          }, this),
          "o compart\xE9lo directamente con tus clientes."
        ] }, void 0, true, {
          fileName: "app/components/home/FormmysTypes.tsx",
          lineNumber: 44,
          columnNumber: 13
        }, this),
        " "
      ] }, void 0, true, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 35,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 34,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(Registration, {}, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 52,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/FormmysTypes.tsx",
      lineNumber: 33,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("div", { className: "flex flex-wrap-reverse lg:flex-nowrap justify-between items-center mt-20 xl:mt-40 gap-12 lg:gap-0", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(Suscription, {}, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 55,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("div", { className: "w-full lg:w-[50%] xl:w-[40%]", children: /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(ScrollRevealRight, { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("h2", { className: " text-dark dark:text-white text-2xl lg:text-3xl xl:text-4xl font-bold", children: "Para formularios de suscripci\xF3n" }, void 0, false, {
          fileName: "app/components/home/FormmysTypes.tsx",
          lineNumber: 58,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("p", { className: "text-lg lg:text-xl xl:text-2xl text-gray-600 dark:text-irongray font-extralight mt-6", children: [
          "Formmy es tan flexible que puedes crear formularios de suscripci\xF3n en un minuto, ya sean",
          " ",
          /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("strong", { children: [
            " ",
            "listas de espera o registros para tu newsletter.",
            " "
          ] }, void 0, true, {
            fileName: "app/components/home/FormmysTypes.tsx",
            lineNumber: 64,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "app/components/home/FormmysTypes.tsx",
          lineNumber: 61,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("p", { className: "text-lg lg:text-xl xl:text-2xl text-gray-600 dark:text-irongray font-extralight mt-6", children: [
          "Personaliza el tema y el color de tu formmy, agr\xE9galo a tu sitio web y ",
          /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("strong", { children: "descarga tu lista de usuarios." }, void 0, false, {
            fileName: "app/components/home/FormmysTypes.tsx",
            lineNumber: 71,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "app/components/home/FormmysTypes.tsx",
          lineNumber: 69,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 57,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 56,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/FormmysTypes.tsx",
      lineNumber: 54,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/home/FormmysTypes.tsx",
    lineNumber: 28,
    columnNumber: 10
  }, this);
};
_c12 = FormmysTypes;
var Registration = () => {
  _s8();
  const [switcher, setSwitcher] = (0, import_react13.useState)({
    name: false,
    tel: false,
    message: false
  });
  const update = (key, value) => {
    setSwitcher((obj) => {
      return {
        ...obj,
        [key]: value
      };
    });
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(ScrollRevealRight, { className: "w-full lg:w-[50%] ", children: /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("section", { className: "group w-full lg:w-fullpy-8 px-0 lg:py-8 lg:pl-8 grid grid-cols-1 md:grid-cols-5 gap-6 relative", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("span", { style: {
      fontFamily: "Licorice"
    }, className: "absolute text-brand-500 scale-75 licorice-regular flex right-16 lg:right-0 xl:right-10 -top-3 md:top-10 opacity-100 md:opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all", children: [
      " ",
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("img", { className: " w-12 rotate-[18deg] ", src: "/assets/doodle-arrow.svg", alt: "arrow" }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 100,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("img", { className: "w-32 -mt-10 ml-2", src: "/assets/text.svg" }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 101,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/FormmysTypes.tsx",
      lineNumber: 96,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("div", { className: "border-[#F1F1F1] shadow-[0px_2px_8px_#F8F7F7] dark:shadow-none order-2	md:order-1 dark:border-white/10  rounded-[40px] border h-auto lg:h-[520px] overflow-hidden col-span-1 md:col-span-3 p-6 lg:p-4 xl:p-6", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("h3", { className: "text-dark dark:text-[#D5D5D5] text-xl text-center", children: "Completa el formulario" }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 105,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("p", { className: "text-gray-600 dark:text-irongray font-extralight mt-4 mb-4 text-center", children: "Nos pondremos en contacto contigo lo antes posible" }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 108,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("div", { className: "flex flex-col items-stretch gap-3 h-full ", children: /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(AnimatePresence, { mode: "popLayout", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(motion.input, { layout: true, initial: {
          opacity: 0,
          filter: "blur(4px)"
        }, animate: {
          opacity: 1,
          filter: "blur(0px)"
        }, exit: {
          opacity: 0,
          filter: "blur(4px)"
        }, placeholder: "Email", className: "text-gray-600 dark:text-white dark:active:border-brand-500 dark:focus:border-brand-500 bg-transparent border-iman dark:border-white/10 rounded-full border font-extralight mt-2 w-full focus:outline-none focus:ring-transparent  focus:border-brand-500 active:border-brand-500 active:outline-transparent" }, void 0, false, {
          fileName: "app/components/home/FormmysTypes.tsx",
          lineNumber: 113,
          columnNumber: 15
        }, this),
        switcher.name && /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(motion.input, { layout: true, initial: {
          opacity: 0,
          filter: "blur(4px)",
          x: 20
        }, animate: {
          opacity: 1,
          filter: "blur(0px)",
          x: 0
        }, exit: {
          opacity: 0,
          filter: "blur(4px)",
          x: 20
        }, transition: {
          type: "spring",
          duration: 1,
          bounce: 0.6
        }, placeholder: "Nombre completo", className: "text-gray-600 dark:text-white dark:active:border-brand-500 dark:focus:border-brand-500 bg-transparent border-iman dark:border-white/10 rounded-full border font-extralight mt-2 w-full focus:outline-none focus:ring-transparent  focus:border-brand-500 active:border-brand-500 active:outline-transparent" }, "name", false, {
          fileName: "app/components/home/FormmysTypes.tsx",
          lineNumber: 123,
          columnNumber: 33
        }, this),
        switcher.tel && /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(motion.input, { layout: true, initial: {
          opacity: 0,
          filter: "blur(4px)",
          x: 20
        }, animate: {
          opacity: 1,
          filter: "blur(0px)",
          x: 0
        }, exit: {
          opacity: 0,
          filter: "blur(4px)",
          x: 20
        }, transition: {
          type: "spring",
          duration: 1,
          bounce: 0.6
        }, placeholder: "Tel\xE9fono", className: "text-gray-600 dark:text-white dark:active:border-brand-500 dark:focus:border-brand-500 bg-transparent border-iman dark:border-white/10 rounded-full border font-extralight mt-2 w-full focus:outline-none focus:ring-transparent  focus:border-brand-500 active:border-brand-500 active:outline-transparent" }, "tel", false, {
          fileName: "app/components/home/FormmysTypes.tsx",
          lineNumber: 140,
          columnNumber: 32
        }, this),
        switcher.message && /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(motion.textarea, { layout: true, initial: {
          opacity: 0,
          filter: "blur(4px)",
          x: 20
        }, animate: {
          opacity: 1,
          filter: "blur(0px)",
          x: 0
        }, exit: {
          opacity: 0,
          filter: "blur(4px)",
          x: 20
        }, transition: {
          type: "spring",
          duration: 1,
          bounce: 0.6
        }, placeholder: "Mensaje", className: "text-gray-600 dark:text-white dark:active:border-brand-500 bg-transparent border-iman dark:border-white/10 rounded-2xl border font-extralight mt-2 w-full focus:outline-none focus:ring-transparent  focus:border-brand-500 active:border-brand-500 active:outline-transparent" }, "message", false, {
          fileName: "app/components/home/FormmysTypes.tsx",
          lineNumber: 157,
          columnNumber: 36
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(motion.button, { layout: true, initial: {
          opacity: 0
        }, animate: {
          opacity: 1
        }, transition: {
          type: "spring"
        }, className: "bg-brand-500 rounded-full h-10 w-full mt-10 text-clear", children: "Enviar" }, "btn", false, {
          fileName: "app/components/home/FormmysTypes.tsx",
          lineNumber: 174,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 112,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 111,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/FormmysTypes.tsx",
      lineNumber: 104,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("div", { className: "border-[#F1F1F1] shadow-[0px_2px_8px_#F8F7F7] dark:shadow-none order-1	md:order-2 dark:border-white/10 rounded-[40px] border gap-6 p-6  justify-center h-[240px] mt-0 md:mt-20  overflow-hidden col-span-1 md:col-span-2 flex flex-col", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(Check, { defaultValue: true, isDisabled: true, label: "Email" }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 188,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(Check, { onChange: ({
        target: {
          checked
        }
      }) => {
        update("name", checked);
      }, label: "Nombre completo" }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 189,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(Check, { onChange: ({
        target: {
          checked
        }
      }) => {
        update("tel", checked);
      }, label: "Tel\xE9fono" }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 196,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(Check, { onChange: ({
        target: {
          checked
        }
      }) => {
        update("message", checked);
      }, label: "Mensaje" }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 203,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/FormmysTypes.tsx",
      lineNumber: 187,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/home/FormmysTypes.tsx",
    lineNumber: 95,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/home/FormmysTypes.tsx",
    lineNumber: 94,
    columnNumber: 10
  }, this);
};
_s8(Registration, "uO4UxtliTpqTLCtgw+/S/oiLnqo=");
_c24 = Registration;
var Check = ({
  label,
  onChange,
  defaultValue = false,
  isDisabled = false
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("label", { htmlFor: label, className: "text-dark dark:text-irongray font-extralight flex justify-between cursor-pointer", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("span", { children: [
      " ",
      label
    ] }, void 0, true, {
      fileName: "app/components/home/FormmysTypes.tsx",
      lineNumber: 223,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("input", { defaultChecked: defaultValue, disabled: isDisabled, onChange, className: "bg-transparent border-gray-300 dark:border-white/20 w-6 h-6 md:w-5 md:h-5 rounded checked:bg-[#EFC168] !focus:bg-[#EFC168] checked:focus:bg-[#EFC168] focus:ring-0 checked:hover:bg-[#EFC168]", type: "checkbox", id: label, value: "first_checkbox" }, void 0, false, {
      fileName: "app/components/home/FormmysTypes.tsx",
      lineNumber: 224,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/home/FormmysTypes.tsx",
    lineNumber: 222,
    columnNumber: 10
  }, this);
};
_c33 = Check;
var Suscription = () => {
  _s22();
  const [color, setColor] = (0, import_react13.useState)("#377CE2");
  return /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(ScrollRevealLeft, { className: "w-full lg:w-[50%]", children: /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("section", { className: "group w-full py-8 px-0 lg:py-8 lg:pr-8 flex flex-col md:flex-row lg:flex-col gap-6 relative", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("span", { style: {
      fontFamily: "Licorice"
    }, className: "absolute text-brand-500 scale-75 licorice-regular flex flex-col right-16 lg:right-0 xl:right-10 -bottom-10 opacity-100 md:opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all", children: [
      " ",
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("img", { className: " w-12 rotate-[90deg] ", src: "/assets/doodle-arrow.svg", alt: "arrow" }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 237,
        columnNumber: 11
      }, this),
      " ",
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("img", { className: "w-24  ml-2", src: "/assets/color-check.svg" }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 238,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/FormmysTypes.tsx",
      lineNumber: 233,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("div", { className: "border-[#F1F1F1] shadow-[0px_2px_8px_#F8F7F7] dark:shadow-none dark:border-white/10 rounded-[40px] border flex h-[320px] lg:h-[400px] overflow-hidden ", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("img", { className: "w-[30%] lg:w-[50%] h-full object-cover object-center lg:object-right", src: "https://images.pexels.com/photos/5386754/pexels-photo-5386754.jpeg?auto=compress&cs=tinysrgb&w=800" }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 241,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("div", { className: "w-full lg:w-[50%] px-4 py-4 xl:px-8 xl:py-10", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("h3", { className: "text-dark dark:text-[#D5D5D5] text-lg lg:text-xl", children: "\xDAnete a la lista de espera" }, void 0, false, {
          fileName: "app/components/home/FormmysTypes.tsx",
          lineNumber: 243,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("p", { className: "text-gray-600 dark:text-irongray font-extralight mt-0 lg:mt-4 mb-3 md:mb-6 lg:mb-10 text-sm md:text-base ", children: "S\xE9 de los primeros en enterarte del lanzamiento del curso, y recibe un descuento especial." }, void 0, false, {
          fileName: "app/components/home/FormmysTypes.tsx",
          lineNumber: 246,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("label", { className: "text-gray-600 font-normal dark:text-[#D5D5D5]  ", children: "Email" }, void 0, false, {
          fileName: "app/components/home/FormmysTypes.tsx",
          lineNumber: 250,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("input", { placeholder: "ejemplo@formmy.app", className: "text-gray-600 dark:text-white dark:active:border-brand-500 dark:focus:border-brand-500 bg-transparent border-iman dark:border-white/10 rounded-full border font-extralight mt-2 w-full focus:outline-none focus:ring-transparent  focus:border-brand-500 active:border-brand-500 active:outline-transparent" }, void 0, false, {
          fileName: "app/components/home/FormmysTypes.tsx",
          lineNumber: 253,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(motion.button, { initial: {
          backgroundColor: "blue"
        }, animate: {
          backgroundColor: color
        }, className: "rounded-full h-10 w-full mt-4 text-white ", children: "Enviar" }, void 0, false, {
          fileName: "app/components/home/FormmysTypes.tsx",
          lineNumber: 254,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 242,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/FormmysTypes.tsx",
      lineNumber: 240,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("div", { className: "border-[#F1F1F1] shadow-[0px_2px_8px_#F8F7F7] dark:shadow-none dark:border-white/10 rounded-[40px] border flex flex-row md:flex-col lg:flex-row items-center px-4 lg:px-6 gap-3 lg:gap-6 h-14 md:h-fit md:py-6 lg:py-0 py-0 lg:h-20   ", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(Color, { onClick: () => {
        setColor("#EB9F3A");
      }, className: "bg-[#EB9F3A] " }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 264,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(Color, { onClick: () => {
        setColor("#EFC168");
      }, className: "bg-[#EFC168] " }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 267,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(Color, { onClick: () => {
        setColor("#78A55D");
      }, className: "bg-[#78A55D]" }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 270,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(Color, { onClick: () => {
        setColor("#A57496");
      }, className: "bg-[#A57496]" }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 273,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(Color, { onClick: () => {
        setColor("#377CE2");
      }, className: "bg-[#377CE2]" }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 276,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(AnimatePresence, { mode: "popLayout", children: /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)(motion.span, { initial: {
        filter: "blur(8px)"
      }, animate: {
        filter: "blur(0px)"
      }, exit: {
        filter: "blur(8px)"
      }, className: "text-gray-600 dark:text-white/50", children: color }, color, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 280,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "app/components/home/FormmysTypes.tsx",
        lineNumber: 279,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/FormmysTypes.tsx",
      lineNumber: 263,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/home/FormmysTypes.tsx",
    lineNumber: 232,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/home/FormmysTypes.tsx",
    lineNumber: 231,
    columnNumber: 10
  }, this);
};
_s22(Suscription, "Vgtp5j5ptS2kiSDBDe5jWYp1teU=");
_c42 = Suscription;
var Color = ({
  className,
  onClick
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime11.jsxDEV)("button", { onClick, className: twMerge("h-7 lg:h-8 xl:h-12 w-16 bg-red-400 rounded-2xl md:rounded-3xl cursor-pointer hover:scale-90 transition-all", className) }, void 0, false, {
    fileName: "app/components/home/FormmysTypes.tsx",
    lineNumber: 300,
    columnNumber: 10
  }, this);
};
_c52 = Color;
var _c12;
var _c24;
var _c33;
var _c42;
var _c52;
$RefreshReg$(_c12, "FormmysTypes");
$RefreshReg$(_c24, "Registration");
$RefreshReg$(_c33, "Check");
$RefreshReg$(_c42, "Suscription");
$RefreshReg$(_c52, "Color");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/components/home/Faq.tsx
var import_react14 = __toESM(require_react());

// node_modules/react-icons/io/index.esm.js
function IoIosArrowDown(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M256 294.1L383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0l127.1 127z" } }] })(props);
}

// app/components/home/Faq.tsx
var import_jsx_dev_runtime12 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/home/Faq.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s9 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/home/Faq.tsx"
  );
  import.meta.hot.lastModified = "1733871814487.577";
}
var Faq = () => /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)("section", { className: "max-w-[90%] xl:max-w-7xl mx-auto pt-[80px]", children: [
  /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)("h2", { className: " text-dark dark:text-white text-3xl lg:text-5xl font-bold text-center", children: [
    " ",
    "Preguntas frecuentes"
  ] }, void 0, true, {
    fileName: "app/components/home/Faq.tsx",
    lineNumber: 28,
    columnNumber: 5
  }, this),
  /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)(ScrollReveal, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)("div", { className: "mt-12 lg:mt-20 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 ", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)("div", { className: "flex flex-col gap-8", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)(Question, { question: "\xBFQu\xE9 tipo de formularios puedo crear con Formmy?", answer: "Puedes usar Formmy para formularios de contacto, formularios para eventos, o formularios de suscriptores. \xA1T\xFA decides como usarlo!  " }, void 0, false, {
        fileName: "app/components/home/Faq.tsx",
        lineNumber: 35,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)(Question, { question: "\xBFCon qu\xE9 frameworks es compatible Formmy?", answer: /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)("p", { children: [
        "Es",
        " ",
        /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)("span", { className: "text-white/80", children: "compatible con cualquier framework web" }, void 0, false, {
          fileName: "app/components/home/Faq.tsx",
          lineNumber: 38,
          columnNumber: 17
        }, this),
        ". Para agregar Formmy a tu sitio web, solo debes hacer el copy/paste de un iframe. \u{1F973} \u{1F929}"
      ] }, void 0, true, {
        fileName: "app/components/home/Faq.tsx",
        lineNumber: 36,
        columnNumber: 82
      }, this) }, void 0, false, {
        fileName: "app/components/home/Faq.tsx",
        lineNumber: 36,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)(Question, { question: "\xBFCu\xE1nto tiempo puedo permanecer en el Plan FREE?", answer: "Si no piensas tener m\xE1s de 3 proyectos y no necesitas acceder a las funcionalidades PRO, puedes quedarte en FREE toda la vida sin pagar nada. \u{1F4B8}\u{1F474}\u{1F3FC}" }, void 0, false, {
        fileName: "app/components/home/Faq.tsx",
        lineNumber: 44,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/Faq.tsx",
      lineNumber: 34,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)("div", { className: "flex flex-col gap-8", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)(Question, { question: "\xBFC\xFAal es la diferencia entre el Plan FREE y PRO?", answer: "\xA1El Plan PRO desbloquea m\xE1s funcionalidades de Formmy! Como m\xE1s opciones de personalizaci\xF3n, imagenes extra para el mensaje final, campos personalizados, notificaciones espec\xEDficas, la opci\xF3n de agregar colaboradores al proyecto, mensajes ilimitados y remosi\xF3n de la marca de agua." }, void 0, false, {
        fileName: "app/components/home/Faq.tsx",
        lineNumber: 47,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)(Question, { question: "\xBFEmiten factura fiscal?", answer: "S\xED, despues de suscribirte al Plan PRO completa tus datos fiscales desde tu perfil>Administrar plan y te haremos llegar tu fatura v\xEDa email, si tienes alguna duda escr\xEDbenos a hola@formmy.app" }, void 0, false, {
        fileName: "app/components/home/Faq.tsx",
        lineNumber: 48,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)(Question, { question: "\xBFQu\xE9 pasa si no puedo acceder a mi cuenta?", answer: "Si por alg\xFAn motivo ya no tienes acceso al correo/cuenta con el que te registraste, escr\xEDbenos directamente a hola@formmy.app " }, void 0, false, {
        fileName: "app/components/home/Faq.tsx",
        lineNumber: 49,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/Faq.tsx",
      lineNumber: 46,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/home/Faq.tsx",
    lineNumber: 33,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/home/Faq.tsx",
    lineNumber: 32,
    columnNumber: 5
  }, this)
] }, void 0, true, {
  fileName: "app/components/home/Faq.tsx",
  lineNumber: 27,
  columnNumber: 26
}, this);
_c13 = Faq;
var Question = ({
  question,
  answer
}) => {
  _s9();
  const [open, setOpen] = (0, import_react14.useState)(false);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)("div", { className: "border-iman dark:border-lightgray   border-[1px] rounded-2xl", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)("button", { className: "w-full px-6 py-6 text-lg md:text-xl font-medium text-left flex justify-between items-center", onClick: () => {
      setOpen((o4) => !o4);
    }, children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)("p", { className: "w-[90%]  text-dark dark:text-[#D5D5D5] ", children: question }, void 0, false, {
        fileName: "app/components/home/Faq.tsx",
        lineNumber: 65,
        columnNumber: 9
      }, this),
      open ? /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)(IoIosArrowDown, { className: "rotate-180 transition-all text-dark dark:text-[#D5D5D5]" }, void 0, false, {
        fileName: "app/components/home/Faq.tsx",
        lineNumber: 66,
        columnNumber: 17
      }, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)(IoIosArrowDown, { className: "transition-all text-dark dark:text-[#D5D5D5]" }, void 0, false, {
        fileName: "app/components/home/Faq.tsx",
        lineNumber: 66,
        columnNumber: 106
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/Faq.tsx",
      lineNumber: 62,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)(AnimatePresence, { initial: false, children: open && /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)(motion.div, { initial: {
      opacity: 0,
      height: 0
    }, animate: {
      opacity: 1,
      height: "auto"
    }, exit: {
      opacity: 0,
      height: 0
    }, transition: {
      type: "spring",
      duration: 0.4,
      bounce: 0
    }, children: /* @__PURE__ */ (0, import_jsx_dev_runtime12.jsxDEV)("p", { className: "text-lg text-gray-600 dark:text-irongray font-extralight px-6 pb-8", children: answer }, void 0, false, {
      fileName: "app/components/home/Faq.tsx",
      lineNumber: 83,
      columnNumber: 13
    }, this) }, void 0, false, {
      fileName: "app/components/home/Faq.tsx",
      lineNumber: 69,
      columnNumber: 18
    }, this) }, void 0, false, {
      fileName: "app/components/home/Faq.tsx",
      lineNumber: 68,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/home/Faq.tsx",
    lineNumber: 61,
    columnNumber: 10
  }, this);
};
_s9(Question, "xG1TONbKtDWtdOTrXaTAsNhPg/Q=");
_c25 = Question;
var _c13;
var _c25;
$RefreshReg$(_c13, "Faq");
$RefreshReg$(_c25, "Question");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// node_modules/react-icons/fa/index.esm.js
function FaFacebook(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z" } }] })(props);
}
function FaYoutube(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 576 512" }, "child": [{ "tag": "path", "attr": { "d": "M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" } }] })(props);
}
function FaCheck(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z" } }] })(props);
}
function FaDownload(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z" } }] })(props);
}
function FaUsers(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 640 512" }, "child": [{ "tag": "path", "attr": { "d": "M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z" } }] })(props);
}
function FaRegCopy(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 448 512" }, "child": [{ "tag": "path", "attr": { "d": "M433.941 65.941l-51.882-51.882A48 48 0 0 0 348.118 0H176c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h224c26.51 0 48-21.49 48-48v-48h80c26.51 0 48-21.49 48-48V99.882a48 48 0 0 0-14.059-33.941zM266 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h74v224c0 26.51 21.49 48 48 48h96v42a6 6 0 0 1-6 6zm128-96H182a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h106v88c0 13.255 10.745 24 24 24h88v202a6 6 0 0 1-6 6zm6-256h-64V48h9.632c1.591 0 3.117.632 4.243 1.757l48.368 48.368a6 6 0 0 1 1.757 4.243V112z" } }] })(props);
}
function FaRegTrashAlt(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 448 512" }, "child": [{ "tag": "path", "attr": { "d": "M268 416h24a12 12 0 0 0 12-12V188a12 12 0 0 0-12-12h-24a12 12 0 0 0-12 12v216a12 12 0 0 0 12 12zM432 80h-82.41l-34-56.7A48 48 0 0 0 274.41 0H173.59a48 48 0 0 0-41.16 23.3L98.41 80H16A16 16 0 0 0 0 96v16a16 16 0 0 0 16 16h16v336a48 48 0 0 0 48 48h288a48 48 0 0 0 48-48V128h16a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16zM171.84 50.91A6 6 0 0 1 177 48h94a6 6 0 0 1 5.15 2.91L293.61 80H154.39zM368 464H80V128h288zm-212-48h24a12 12 0 0 0 12-12V188a12 12 0 0 0-12-12h-24a12 12 0 0 0-12 12v216a12 12 0 0 0 12 12z" } }] })(props);
}

// app/components/ui/sticky-scroll-reveal.tsx
var import_react15 = __toESM(require_react());
var import_jsx_dev_runtime13 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/ui/sticky-scroll-reveal.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s10 = $RefreshSig$();
var _s23 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/ui/sticky-scroll-reveal.tsx"
  );
  import.meta.hot.lastModified = "1737642690791.5679";
}
var StickyScroll = ({
  items
}) => {
  _s10();
  const [currentIndex, setCurrentIndex] = (0, import_react15.useState)(0);
  const [currentImage, setCurrentImage] = (0, import_react15.useState)(items[currentIndex].img);
  const [currentBgColor, setCurrentBgColor] = (0, import_react15.useState)(items[0].twColor);
  const targetRef = (0, import_react15.useRef)(null);
  const {
    scrollYProgress
  } = useScroll({
    target: targetRef
  });
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
  });
  const handleEnterIntoView = (index) => {
    setCurrentImage(items[index].img);
    setCurrentBgColor(items[index].twColor);
    setCurrentIndex(index);
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime13.jsxDEV)("article", { className: cn(currentBgColor, "transition-all"), children: /* @__PURE__ */ (0, import_jsx_dev_runtime13.jsxDEV)(ScrollReveal, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime13.jsxDEV)(
    "section",
    {
      className: "flex gap-20 justify-center flex-wrap-reverse lg:flex-nowrap items-start relative py-20 w-full lg:w-[90%] h-max max-w-7xl mx-auto",
      ref: targetRef,
      children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime13.jsxDEV)("div", { className: "flex flex-col flex-none lg:flex-1 pb-0 md:py-40 gap-40 lg:gap-80 w-[90%] mx-auto lg:w-[50%] ", children: items.map(({
          text,
          title,
          img
        }, index) => /* @__PURE__ */ (0, import_jsx_dev_runtime13.jsxDEV)(InViewDetector, { onInView: handleEnterIntoView, index, className: "h-full", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime13.jsxDEV)("h3", { className: cn("text-gray-400/50 font-sans font-bold text-2xl lg:text-4xl xl:text-5xl mb-4 md:mb-12 transition-all !leading-snug", {
            "text-dark dark:text-white": currentImage === img
          }), children: title }, void 0, false, {
            fileName: "app/components/ui/sticky-scroll-reveal.tsx",
            lineNumber: 63,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime13.jsxDEV)("div", { className: cn("text-xl lg:text-xl xl:text-2xl font-extralight  text-gray-600/50 dark:text-irongray transition-all", {
            "text-gray-600 dark:text-irongray": currentImage === img
          }), children: text }, void 0, false, {
            fileName: "app/components/ui/sticky-scroll-reveal.tsx",
            lineNumber: 68,
            columnNumber: 17
          }, this)
        ] }, String(index) + title, true, {
          fileName: "app/components/ui/sticky-scroll-reveal.tsx",
          lineNumber: 62,
          columnNumber: 24
        }, this)) }, void 0, false, {
          fileName: "app/components/ui/sticky-scroll-reveal.tsx",
          lineNumber: 57,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime13.jsxDEV)("div", { className: "sticky top-10 md:top-14 lg:mt-10 h-[320px] md:h-[380px] px-[5%] lg:px-0 lg:top-40 w-full  lg:max-w-[50%] flex-none lg:flex-1 bg-[#ffffff] dark:bg-hole	  overflow-hidden flex items-center justify-center   aspect-square", children: /* @__PURE__ */ (0, import_jsx_dev_runtime13.jsxDEV)("div", { className: "md:w-[80%] lg:w-full mx-auto", children: currentImage }, void 0, false, {
          fileName: "app/components/ui/sticky-scroll-reveal.tsx",
          lineNumber: 76,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "app/components/ui/sticky-scroll-reveal.tsx",
          lineNumber: 75,
          columnNumber: 11
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "app/components/ui/sticky-scroll-reveal.tsx",
      lineNumber: 54,
      columnNumber: 9
    },
    this
  ) }, void 0, false, {
    fileName: "app/components/ui/sticky-scroll-reveal.tsx",
    lineNumber: 53,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/ui/sticky-scroll-reveal.tsx",
    lineNumber: 52,
    columnNumber: 10
  }, this);
};
_s10(StickyScroll, "pM1au5eiiLBeNQhOEidMTkOm9y0=", false, function() {
  return [useScroll, useMotionValueEvent];
});
_c14 = StickyScroll;
var InViewDetector = ({
  children,
  index,
  className,
  onInView
}) => {
  _s23();
  const ref = (0, import_react15.useRef)(null);
  const isInView = useInView(ref, {
    // margin: "center",
    amount: 1
  });
  (0, import_react15.useEffect)(() => {
    if (isInView) {
      onInView == null ? void 0 : onInView(index);
    }
  }, [isInView, index]);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime13.jsxDEV)("div", { className, ref, children }, void 0, false, {
    fileName: "app/components/ui/sticky-scroll-reveal.tsx",
    lineNumber: 106,
    columnNumber: 10
  }, this);
};
_s23(InViewDetector, "aIj2rGFwktnr9pBb+biOnOSDeRU=", false, function() {
  return [useInView];
});
_c26 = InViewDetector;
var _c14;
var _c26;
$RefreshReg$(_c14, "StickyScroll");
$RefreshReg$(_c26, "InViewDetector");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/components/home/StickySection.tsx
var import_jsx_dev_runtime14 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/home/StickySection.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/home/StickySection.tsx"
  );
  import.meta.hot.lastModified = "1737642690790.748";
}
var StickySection = () => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)("article", { className: " ", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)("div", { className: "h-[60%]  " }, void 0, false, {
      fileName: "app/components/home/StickySection.tsx",
      lineNumber: 26,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)(StickyScroll, { items: [{
      twColor: "dark:bg-[#0A0A0C] bg-[#ffffff]",
      img: /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)("img", { className: "object-cover h-full w-full rounded-3xl border border-white/10", src: "/assets/formmy-1.gif", alt: "dashboard" }, void 0, false, {
        fileName: "app/components/home/StickySection.tsx",
        lineNumber: 29,
        columnNumber: 12
      }, this),
      text: /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)("p", { className: "font-sans ", children: [
          "Crear un Formmy es muy f\xE1cil desde el dashboard, solo da clic en \xAB+ Formmy\xBB y bautiza tu primer Formmy \u{1F47B}.",
          " "
        ] }, void 0, true, {
          fileName: "app/components/home/StickySection.tsx",
          lineNumber: 31,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)("p", { className: "font-sans mt-4", children: "Puedes usar Formmy para crear formularios de contacto, de registro para tus eventos, de suscripci\xF3n y m\xE1s." }, void 0, false, {
          fileName: "app/components/home/StickySection.tsx",
          lineNumber: 35,
          columnNumber: 17
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/home/StickySection.tsx",
        lineNumber: 30,
        columnNumber: 13
      }, this),
      title: "Crea tu proyecto"
    }, {
      twColor: "dark:bg-[#0A0A0C] bg-[#ffffff]",
      img: /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)("img", { className: "object-cover h-full w-full rounded-3xl border border-white/10", src: "/assets/formmy-2.gif", alt: "personalizacion" }, void 0, false, {
        fileName: "app/components/home/StickySection.tsx",
        lineNumber: 43,
        columnNumber: 12
      }, this),
      text: /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)("p", { className: "font-sans", children: "Activa los campos que quieres agregar a tu Formmy, selecciona el tema ligth o dark, el estilo de los campos, el color del bot\xF3n principal e incluso personaliza la imagen, la animaci\xF3n y el mensaje que ver\xE1n tus clientes al completar el formulario." }, void 0, false, {
          fileName: "app/components/home/StickySection.tsx",
          lineNumber: 45,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)("div", { className: "max-w-[180px] mt-12", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)(Form, { method: "post", children: /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)(BigCTA, { type: "submit", name: "intent", value: "google-login" }, void 0, false, {
            fileName: "app/components/home/StickySection.tsx",
            lineNumber: 54,
            columnNumber: 21
          }, this) }, void 0, false, {
            fileName: "app/components/home/StickySection.tsx",
            lineNumber: 53,
            columnNumber: 19
          }, this),
          " "
        ] }, void 0, true, {
          fileName: "app/components/home/StickySection.tsx",
          lineNumber: 52,
          columnNumber: 17
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/home/StickySection.tsx",
        lineNumber: 44,
        columnNumber: 13
      }, this),
      title: "Personaliza tu Formmy"
    }, {
      twColor: "dark:bg-[#0A0A0C] bg-[#ffffff]",
      img: /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)("img", { className: "object-cover h-full w-full rounded-3xl border border-white/10", src: "/assets/formmy-3.gif", alt: "perro" }, void 0, false, {
        fileName: "app/components/home/StickySection.tsx",
        lineNumber: 61,
        columnNumber: 12
      }, this),
      text: /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)("p", { className: "font-sans", children: "Formmy es compatible con cualquier lenguaje, as\xED que solo tienes que copiar una l\xEDnea de c\xF3digo y p\xE9garla en el tu proyecto." }, void 0, false, {
          fileName: "app/components/home/StickySection.tsx",
          lineNumber: 63,
          columnNumber: 17
        }, this),
        " ",
        /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)("p", { className: "font-sans mt-4", children: "Espera un poco y \xA1Empieza a recibir mensajes de tus clientes!" }, void 0, false, {
          fileName: "app/components/home/StickySection.tsx",
          lineNumber: 68,
          columnNumber: 17
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/home/StickySection.tsx",
        lineNumber: 62,
        columnNumber: 13
      }, this),
      title: "Copia y pega en tu HTML o JSX"
    }] }, void 0, false, {
      fileName: "app/components/home/StickySection.tsx",
      lineNumber: 27,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime14.jsxDEV)("div", { className: "h-[60%] bg-gray-900" }, void 0, false, {
      fileName: "app/components/home/StickySection.tsx",
      lineNumber: 74,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/home/StickySection.tsx",
    lineNumber: 25,
    columnNumber: 10
  }, this);
};
_c15 = StickySection;
var _c15;
$RefreshReg$(_c15, "StickySection");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/components/home/Meteors.tsx
var import_jsx_dev_runtime15 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/home/Meteors.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/home/Meteors.tsx"
  );
  import.meta.hot.lastModified = "1737642690790.0283";
}
var Meteors = ({
  number = 40,
  className
}) => {
  const meteors = new Array(number).fill(true);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime15.jsxDEV)("div", { children: meteors.map((_, idx) => /* @__PURE__ */ (0, import_jsx_dev_runtime15.jsxDEV)("span", { className: cn("animate-meteor-effect absolute top-0 left-00 h-0.5 w-0.5 rounded-[9999px] bg-white/80 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]", "before:content-[''] before:absolute before:top-0 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-white/60 before:to-transparent", className), style: {
    top: 0,
    left: Math.floor(Math.random() * (800 - -800) + -100) + "px",
    animationDelay: Math.random() * (0.8 - 0.2) + 0.2 + "s",
    animationDuration: Math.floor(Math.random() * (10 - 2) + 2) + "s"
  } }, "meteor" + idx, false, {
    fileName: "app/components/home/Meteors.tsx",
    lineNumber: 28,
    columnNumber: 32
  }, this)) }, void 0, false, {
    fileName: "app/components/home/Meteors.tsx",
    lineNumber: 27,
    columnNumber: 10
  }, this);
};
_c16 = Meteors;
var _c16;
$RefreshReg$(_c16, "Meteors");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/components/home/Banner.tsx
var import_jsx_dev_runtime16 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/home/Banner.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/home/Banner.tsx"
  );
  import.meta.hot.lastModified = "1737642690789.526";
}
var Banner = () => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime16.jsxDEV)("section", { className: "max-w-[90%] border-white/10 border-[1px]  xl:max-w-7xl w-full mx-auto rounded-[40px] bg-dark my-0 p-8 md:py-16 md:px-[10%] xl:px-[5%] relative overflow-hidden text-center", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime16.jsxDEV)("h2", { className: "text-2xl lg:text-4xl text-clear font-bold", children: "\xA1Prueba Formmy! No te vas a arrepentir." }, void 0, false, {
      fileName: "app/components/home/Banner.tsx",
      lineNumber: 29,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime16.jsxDEV)("p", { className: "text-xl lg:text-2xl text-white mt-6 max-w-4xl mx-auto  font-light", children: "Si tienes alguna duda, agenda un demo en l\xEDnea para que nuestro equipo te muestre todo lo que puedes hacer con Formmy." }, void 0, false, {
      fileName: "app/components/home/Banner.tsx",
      lineNumber: 32,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime16.jsxDEV)("div", { className: "flex flex-col md:flex-row gap-6 md:gap-8 mt-12 justify-center items-center dark", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime16.jsxDEV)(Form, { method: "post", children: /* @__PURE__ */ (0, import_jsx_dev_runtime16.jsxDEV)(BigCTA, { type: "submit", name: "intent", value: "google-login", className: "" }, void 0, false, {
        fileName: "app/components/home/Banner.tsx",
        lineNumber: 38,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/components/home/Banner.tsx",
        lineNumber: 37,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime16.jsxDEV)("a", { href: "https://wa.me/527757609276?text=\xA1Hola!%20Quiero%agendar%20un%demo.", children: /* @__PURE__ */ (0, import_jsx_dev_runtime16.jsxDEV)(Button, { className: "w-full md:w-[180px] bg-clear text-dark mt-0", children: "Agendar demo" }, void 0, false, {
        fileName: "app/components/home/Banner.tsx",
        lineNumber: 41,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/components/home/Banner.tsx",
        lineNumber: 40,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/home/Banner.tsx",
      lineNumber: 36,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime16.jsxDEV)(Meteors, {}, void 0, false, {
      fileName: "app/components/home/Banner.tsx",
      lineNumber: 46,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime16.jsxDEV)("img", { alt: "purple ghost", className: "absolute bottom-0", src: "/assets/ghost-glasses.svg" }, void 0, false, {
      fileName: "app/components/home/Banner.tsx",
      lineNumber: 47,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/home/Banner.tsx",
    lineNumber: 28,
    columnNumber: 10
  }, this);
};
_c17 = Banner;
var _c17;
$RefreshReg$(_c17, "Banner");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/routes/_index.tsx
var import_jsx_dev_runtime17 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/_index.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s11 = $RefreshSig$();
var _s24 = $RefreshSig$();
var _s32 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/_index.tsx"
  );
  import.meta.hot.lastModified = "1737642690791.9492";
}
var meta = () => getBasicMetaTags({
  title: "Formularios de contacto para tu sitio web",
  description: "Formularios en tu sitio web f\xE1cilmente y sin necesidad de un backend "
});
function Index() {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("article", { id: "theme-trick", className: " ", children: /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("div", { className: "dark:bg-dark ", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(NavBar_default, { showcta: true }, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 120,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(Hero, {}, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 121,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(CompaniesScroll, {}, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 122,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(FormmysTypes, {}, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 123,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(Banner, {}, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 124,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(StickySection, {}, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 125,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(Pricing, {}, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 126,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(WitoutFormmy, {}, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 127,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(Faq, {}, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 128,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(Join, {}, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 129,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(Footer, {}, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 130,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/_index.tsx",
    lineNumber: 119,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/routes/_index.tsx",
    lineNumber: 118,
    columnNumber: 10
  }, this);
}
_c18 = Index;
var ScrollReveal = ({
  children
}) => {
  _s11();
  const ref = (0, import_react18.useRef)(null);
  const isInView = useInView(ref, {
    once: true
  });
  return /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(motion.div, { style: {
    opacity: isInView ? 1 : 0,
    transition: "all 0.3s cubic-bezier(0.17, 0.55, 0.55, 1) 0.2s",
    transform: isInView ? "translateY(0)" : "translateY(100px)"
  }, ref, children }, void 0, false, {
    fileName: "app/routes/_index.tsx",
    lineNumber: 143,
    columnNumber: 10
  }, this);
};
_s11(ScrollReveal, "DljcBprJKYjULUac3YKdUV9OwZQ=", false, function() {
  return [useInView];
});
_c27 = ScrollReveal;
var ScrollRevealRight = ({
  children,
  className
}) => {
  _s24();
  const ref = (0, import_react18.useRef)(null);
  const isInView = useInView(ref, {
    once: true
  });
  return /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(motion.div, { style: {
    opacity: isInView ? 1 : 0,
    transition: "all 0.3s cubic-bezier(0.17, 0.55, 0.55, 1) .8s",
    transform: isInView ? "translateX(0)" : "translateX(100px)"
  }, className, ref, children }, void 0, false, {
    fileName: "app/routes/_index.tsx",
    lineNumber: 164,
    columnNumber: 10
  }, this);
};
_s24(ScrollRevealRight, "DljcBprJKYjULUac3YKdUV9OwZQ=", false, function() {
  return [useInView];
});
_c34 = ScrollRevealRight;
var ScrollRevealLeft = ({
  children,
  className
}) => {
  _s32();
  const ref = (0, import_react18.useRef)(null);
  const isInView = useInView(ref, {
    once: true
  });
  return /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(motion.div, { style: {
    opacity: isInView ? 1 : 0,
    transition: "all 0.3s cubic-bezier(0.17, 0.55, 0.55, 1) .8s",
    transform: isInView ? "translateX(0)" : "translateX(-100px)"
  }, className, ref, children }, void 0, false, {
    fileName: "app/routes/_index.tsx",
    lineNumber: 185,
    columnNumber: 10
  }, this);
};
_s32(ScrollRevealLeft, "DljcBprJKYjULUac3YKdUV9OwZQ=", false, function() {
  return [useInView];
});
_c43 = ScrollRevealLeft;
var Footer = () => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("section", { className: "relative border-t-[1px] border-iman dark:border-white/10  w-[90%] xl:w-full max-w-7xl mx-auto pt-12", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(ScrollReveal, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("span", { className: "absolute -top-28 lg:-top-[160px] right-10", children: /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("img", { className: "w-20 lg:w-[100px] ", src: "/assets/ghost-support.png" }, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 201,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 200,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 199,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("div", { className: "grid grid-cols-1 lg:grid-cols-4", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("div", { className: " pr-8 col-span-1 lg:col-span-2", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("h3", { className: "text-lg lg:text-xl font-bold text-dark mb-2 dark:text-white", children: "\xDAnete a Formmy \u{1F913}" }, void 0, false, {
          fileName: "app/routes/_index.tsx",
          lineNumber: 206,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("p", { className: "text-gray-600 dark:text-irongray text-base lg:text-lg font-extralight mt-2", children: "La mejor forma de agregar formularios a tu sitio web." }, void 0, false, {
          fileName: "app/routes/_index.tsx",
          lineNumber: 209,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/_index.tsx",
        lineNumber: 205,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("h3", { className: "text-base lg:text-lg text-gray-600  dark:text-white font-medium mb-2 mt-6 lg:mt-0 tex-xl", children: "Formmy" }, void 0, false, {
          fileName: "app/routes/_index.tsx",
          lineNumber: 214,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(Link, { to: "/feedback", className: "", children: /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("p", { className: "text-gray-600 dark:text-irongray mb-2 font-extralight hover:opacity-60", children: "Contacto" }, void 0, false, {
          fileName: "app/routes/_index.tsx",
          lineNumber: 218,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "app/routes/_index.tsx",
          lineNumber: 217,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(Link, { to: "/terms", className: "", children: /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("p", { className: "text-gray-600 dark:text-irongray mb-2  font-extralight hover:opacity-60", children: "T\xE9rminos y condiciones" }, void 0, false, {
          fileName: "app/routes/_index.tsx",
          lineNumber: 223,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "app/routes/_index.tsx",
          lineNumber: 222,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/_index.tsx",
        lineNumber: 213,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("h3", { className: "text-base lg:text-lg font-medium text-gray-600 dark:text-white tex-xl mb-2 mt-6 lg:mt-0", children: "Centro de ayuda" }, void 0, false, {
          fileName: "app/routes/_index.tsx",
          lineNumber: 232,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("a", { href: "mailto:hola@formmy.app", target: "_blank", rel: "noreferrer", children: /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("p", { className: "text-gray-600 dark:text-irongray mb-2  font-extralight hover:opacity-60", children: "hola@formmy.app" }, void 0, false, {
          fileName: "app/routes/_index.tsx",
          lineNumber: 236,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "app/routes/_index.tsx",
          lineNumber: 235,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("a", { href: "https://calendly.com/brenda-formmy/30min", target: "_blank", rel: "noreferrer", children: /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("p", { className: "text-gray-600 dark:text-irongray  font-extralight hover:opacity-60", children: "Calendly" }, void 0, false, {
          fileName: "app/routes/_index.tsx",
          lineNumber: 242,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "app/routes/_index.tsx",
          lineNumber: 241,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("div", { className: "flex gap-6", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("a", { href: "https://www.youtube.com/@_FormmyApp", target: "_blank", rel: "noreferrer", children: /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(FaYoutube, { className: "dark:text-irongray text-gray-400 mt-6 text-2xl hover:opacity-60" }, void 0, false, {
            fileName: "app/routes/_index.tsx",
            lineNumber: 248,
            columnNumber: 15
          }, this) }, void 0, false, {
            fileName: "app/routes/_index.tsx",
            lineNumber: 247,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("a", { href: "https://twitter.com/FormmyApp1", target: "_blank", rel: "noreferrer", children: /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(BsTwitter, { className: "dark:text-irongray text-gray-400 mt-6 text-2xl hover:opacity-60" }, void 0, false, {
            fileName: "app/routes/_index.tsx",
            lineNumber: 251,
            columnNumber: 15
          }, this) }, void 0, false, {
            fileName: "app/routes/_index.tsx",
            lineNumber: 250,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("a", { href: "https://www.facebook.com/profile.php?id=61554028371141", target: "_blank", rel: "noreferrer", children: /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(FaFacebook, { className: "dark:text-irongray text-gray-400 mt-6 text-2xl hover:opacity-60" }, void 0, false, {
            fileName: "app/routes/_index.tsx",
            lineNumber: 254,
            columnNumber: 15
          }, this) }, void 0, false, {
            fileName: "app/routes/_index.tsx",
            lineNumber: 253,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("a", { href: "https://www.instagram.com/_formmyapp/", target: "_blank", rel: "noreferrer", children: /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(AiFillInstagram, { className: "dark:text-irongray text-gray-400 mt-6 text-2xl hover:opacity-60" }, void 0, false, {
            fileName: "app/routes/_index.tsx",
            lineNumber: 257,
            columnNumber: 15
          }, this) }, void 0, false, {
            fileName: "app/routes/_index.tsx",
            lineNumber: 256,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/_index.tsx",
          lineNumber: 246,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/_index.tsx",
        lineNumber: 231,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 204,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("div", { className: " border-t-[1px] border-iman dark:border-white/10 mt-12 text-gray-500 font-extralight text-sm text-center py-4 dark:text-white/20", children: /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("p", { children: "Todos los derechos reservados\xA0Formmy\xAE 2024" }, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 263,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 262,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/_index.tsx",
    lineNumber: 198,
    columnNumber: 10
  }, this);
};
_c53 = Footer;
var BigCTA = ({
  onClick,
  className,
  containerClassName,
  children,
  ...props
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)(GradientButton, { className: twMerge(className = "group bg-brand-500 dark:bg-dark dark:hover:bg-[#1D1E27] transition-all text-clear  dark:text-white border-neutral-200 dark:border-white/10", containerClassName), ...props, onClick, children: children != null ? children : /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("p", { className: "text-base", children: [
    "Comenzar gratis ",
    /* @__PURE__ */ (0, import_jsx_dev_runtime17.jsxDEV)("span", { className: "group-hover:rotate-45", children: " \u2192" }, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 277,
      columnNumber: 27
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/_index.tsx",
    lineNumber: 276,
    columnNumber: 20
  }, this) }, void 0, false, {
    fileName: "app/routes/_index.tsx",
    lineNumber: 275,
    columnNumber: 10
  }, this);
};
_c62 = BigCTA;
var _c18;
var _c27;
var _c34;
var _c43;
var _c53;
var _c62;
$RefreshReg$(_c18, "Index");
$RefreshReg$(_c27, "ScrollReveal");
$RefreshReg$(_c34, "ScrollRevealRight");
$RefreshReg$(_c43, "ScrollRevealLeft");
$RefreshReg$(_c53, "Footer");
$RefreshReg$(_c62, "BigCTA");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

export {
  $e,
  cn,
  useLocalStorage,
  PricingCard,
  FaCheck,
  FaDownload,
  FaUsers,
  FaRegCopy,
  FaRegTrashAlt,
  meta,
  Index,
  BigCTA
};
//# sourceMappingURL=/build/_shared/chunk-SGWSEZXL.js.map
