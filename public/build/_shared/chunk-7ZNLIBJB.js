import {
  require_react
} from "/build/_shared/chunk-BOXFZXVX.js";
import {
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// node_modules/@headlessui/react/dist/hooks/use-iso-morphic-effect.js
var import_react = __toESM(require_react(), 1);

// node_modules/@headlessui/react/dist/utils/env.js
var i = Object.defineProperty;
var d = (t10, e, n4) => e in t10 ? i(t10, e, { enumerable: true, configurable: true, writable: true, value: n4 }) : t10[e] = n4;
var r = (t10, e, n4) => (d(t10, typeof e != "symbol" ? e + "" : e, n4), n4);
var o = class {
  constructor() {
    r(this, "current", this.detect());
    r(this, "handoffState", "pending");
    r(this, "currentId", 0);
  }
  set(e) {
    this.current !== e && (this.handoffState = "pending", this.currentId = 0, this.current = e);
  }
  reset() {
    this.set(this.detect());
  }
  nextId() {
    return ++this.currentId;
  }
  get isServer() {
    return this.current === "server";
  }
  get isClient() {
    return this.current === "client";
  }
  detect() {
    return typeof window == "undefined" || typeof document == "undefined" ? "server" : "client";
  }
  handoff() {
    this.handoffState === "pending" && (this.handoffState = "complete");
  }
  get isHandoffComplete() {
    return this.handoffState === "complete";
  }
};
var s = new o();

// node_modules/@headlessui/react/dist/hooks/use-iso-morphic-effect.js
var l = (e, f5) => {
  s.isServer ? (0, import_react.useEffect)(e, f5) : (0, import_react.useLayoutEffect)(e, f5);
};

// node_modules/@headlessui/react/dist/hooks/use-latest-value.js
var import_react2 = __toESM(require_react(), 1);
function s2(e) {
  let r4 = (0, import_react2.useRef)(e);
  return l(() => {
    r4.current = e;
  }, [e]), r4;
}

// node_modules/@headlessui/react/dist/hooks/use-event.js
var import_react3 = __toESM(require_react(), 1);
var o2 = function(t10) {
  let e = s2(t10);
  return import_react3.default.useCallback((...r4) => e.current(...r4), [e]);
};

// node_modules/@headlessui/react/dist/hooks/use-disposables.js
var import_react4 = __toESM(require_react(), 1);

// node_modules/@headlessui/react/dist/utils/micro-task.js
function t3(e) {
  typeof queueMicrotask == "function" ? queueMicrotask(e) : Promise.resolve().then(e).catch((o8) => setTimeout(() => {
    throw o8;
  }));
}

// node_modules/@headlessui/react/dist/utils/disposables.js
function o3() {
  let n4 = [], r4 = { addEventListener(e, t10, s8, a2) {
    return e.addEventListener(t10, s8, a2), r4.add(() => e.removeEventListener(t10, s8, a2));
  }, requestAnimationFrame(...e) {
    let t10 = requestAnimationFrame(...e);
    return r4.add(() => cancelAnimationFrame(t10));
  }, nextFrame(...e) {
    return r4.requestAnimationFrame(() => r4.requestAnimationFrame(...e));
  }, setTimeout(...e) {
    let t10 = setTimeout(...e);
    return r4.add(() => clearTimeout(t10));
  }, microTask(...e) {
    let t10 = { current: true };
    return t3(() => {
      t10.current && e[0]();
    }), r4.add(() => {
      t10.current = false;
    });
  }, style(e, t10, s8) {
    let a2 = e.style.getPropertyValue(t10);
    return Object.assign(e.style, { [t10]: s8 }), this.add(() => {
      Object.assign(e.style, { [t10]: a2 });
    });
  }, group(e) {
    let t10 = o3();
    return e(t10), this.add(() => t10.dispose());
  }, add(e) {
    return n4.push(e), () => {
      let t10 = n4.indexOf(e);
      if (t10 >= 0)
        for (let s8 of n4.splice(t10, 1))
          s8();
    };
  }, dispose() {
    for (let e of n4.splice(0))
      e();
  } };
  return r4;
}

// node_modules/@headlessui/react/dist/hooks/use-disposables.js
function p() {
  let [e] = (0, import_react4.useState)(o3);
  return (0, import_react4.useEffect)(() => () => e.dispose(), [e]), e;
}

// node_modules/@headlessui/react/dist/hooks/use-server-handoff-complete.js
var t4 = __toESM(require_react(), 1);
function s4() {
  let r4 = typeof document == "undefined";
  return "useSyncExternalStore" in t4 ? ((o8) => o8.useSyncExternalStore)(t4)(() => () => {
  }, () => false, () => !r4) : false;
}
function l2() {
  let r4 = s4(), [e, n4] = t4.useState(s.isHandoffComplete);
  return e && s.isHandoffComplete === false && n4(false), t4.useEffect(() => {
    e !== true && n4(true);
  }, [e]), t4.useEffect(() => s.handoff(), []), r4 ? false : e;
}

// node_modules/@headlessui/react/dist/hooks/use-id.js
var import_react5 = __toESM(require_react(), 1);
var o5;
var I = (o5 = import_react5.default.useId) != null ? o5 : function() {
  let n4 = l2(), [e, u6] = import_react5.default.useState(n4 ? () => s.nextId() : null);
  return l(() => {
    e === null && u6(s.nextId());
  }, [e]), e != null ? "" + e : void 0;
};

// node_modules/@headlessui/react/dist/utils/match.js
function u(r4, n4, ...a2) {
  if (r4 in n4) {
    let e = n4[r4];
    return typeof e == "function" ? e(...a2) : e;
  }
  let t10 = new Error(`Tried to handle "${r4}" but there is no handler defined. Only defined handlers are: ${Object.keys(n4).map((e) => `"${e}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(t10, u), t10;
}

// node_modules/@headlessui/react/dist/hooks/use-outside-click.js
var import_react8 = __toESM(require_react(), 1);

// node_modules/@headlessui/react/dist/utils/owner.js
function o6(r4) {
  return s.isServer ? null : r4 instanceof Node ? r4.ownerDocument : r4 != null && r4.hasOwnProperty("current") && r4.current instanceof Node ? r4.current.ownerDocument : document;
}

// node_modules/@headlessui/react/dist/utils/focus-management.js
var c2 = ["[contentEditable=true]", "[tabindex]", "a[href]", "area[href]", "button:not([disabled])", "iframe", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])"].map((e) => `${e}:not([tabindex='-1'])`).join(",");
var M = ((n4) => (n4[n4.First = 1] = "First", n4[n4.Previous = 2] = "Previous", n4[n4.Next = 4] = "Next", n4[n4.Last = 8] = "Last", n4[n4.WrapAround = 16] = "WrapAround", n4[n4.NoScroll = 32] = "NoScroll", n4))(M || {});
var N = ((o8) => (o8[o8.Error = 0] = "Error", o8[o8.Overflow = 1] = "Overflow", o8[o8.Success = 2] = "Success", o8[o8.Underflow = 3] = "Underflow", o8))(N || {});
var F = ((t10) => (t10[t10.Previous = -1] = "Previous", t10[t10.Next = 1] = "Next", t10))(F || {});
function f(e = document.body) {
  return e == null ? [] : Array.from(e.querySelectorAll(c2)).sort((r4, t10) => Math.sign((r4.tabIndex || Number.MAX_SAFE_INTEGER) - (t10.tabIndex || Number.MAX_SAFE_INTEGER)));
}
var T = ((t10) => (t10[t10.Strict = 0] = "Strict", t10[t10.Loose = 1] = "Loose", t10))(T || {});
function h(e, r4 = 0) {
  var t10;
  return e === ((t10 = o6(e)) == null ? void 0 : t10.body) ? false : u(r4, { [0]() {
    return e.matches(c2);
  }, [1]() {
    let l7 = e;
    for (; l7 !== null; ) {
      if (l7.matches(c2))
        return true;
      l7 = l7.parentElement;
    }
    return false;
  } });
}
function D(e) {
  let r4 = o6(e);
  o3().nextFrame(() => {
    r4 && !h(r4.activeElement, 0) && y(e);
  });
}
var w = ((t10) => (t10[t10.Keyboard = 0] = "Keyboard", t10[t10.Mouse = 1] = "Mouse", t10))(w || {});
typeof window != "undefined" && typeof document != "undefined" && (document.addEventListener("keydown", (e) => {
  e.metaKey || e.altKey || e.ctrlKey || (document.documentElement.dataset.headlessuiFocusVisible = "");
}, true), document.addEventListener("click", (e) => {
  e.detail === 1 ? delete document.documentElement.dataset.headlessuiFocusVisible : e.detail === 0 && (document.documentElement.dataset.headlessuiFocusVisible = "");
}, true));
function y(e) {
  e == null || e.focus({ preventScroll: true });
}
var S = ["textarea", "input"].join(",");
function H(e) {
  var r4, t10;
  return (t10 = (r4 = e == null ? void 0 : e.matches) == null ? void 0 : r4.call(e, S)) != null ? t10 : false;
}
function I2(e, r4 = (t10) => t10) {
  return e.slice().sort((t10, l7) => {
    let o8 = r4(t10), i5 = r4(l7);
    if (o8 === null || i5 === null)
      return 0;
    let n4 = o8.compareDocumentPosition(i5);
    return n4 & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n4 & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
  });
}
function _(e, r4) {
  return O(f(), r4, { relativeTo: e });
}
function O(e, r4, { sorted: t10 = true, relativeTo: l7 = null, skipElements: o8 = [] } = {}) {
  let i5 = Array.isArray(e) ? e.length > 0 ? e[0].ownerDocument : document : e.ownerDocument, n4 = Array.isArray(e) ? t10 ? I2(e) : e : f(e);
  o8.length > 0 && n4.length > 1 && (n4 = n4.filter((s8) => !o8.includes(s8))), l7 = l7 != null ? l7 : i5.activeElement;
  let E2 = (() => {
    if (r4 & 5)
      return 1;
    if (r4 & 10)
      return -1;
    throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last");
  })(), x2 = (() => {
    if (r4 & 1)
      return 0;
    if (r4 & 2)
      return Math.max(0, n4.indexOf(l7)) - 1;
    if (r4 & 4)
      return Math.max(0, n4.indexOf(l7)) + 1;
    if (r4 & 8)
      return n4.length - 1;
    throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last");
  })(), p4 = r4 & 32 ? { preventScroll: true } : {}, d7 = 0, a2 = n4.length, u6;
  do {
    if (d7 >= a2 || d7 + a2 <= 0)
      return 0;
    let s8 = x2 + d7;
    if (r4 & 16)
      s8 = (s8 + a2) % a2;
    else {
      if (s8 < 0)
        return 3;
      if (s8 >= a2)
        return 1;
    }
    u6 = n4[s8], u6 == null || u6.focus(p4), d7 += E2;
  } while (u6 !== i5.activeElement);
  return r4 & 6 && H(u6) && u6.select(), 2;
}

// node_modules/@headlessui/react/dist/utils/platform.js
function t6() {
  return /iPhone/gi.test(window.navigator.platform) || /Mac/gi.test(window.navigator.platform) && window.navigator.maxTouchPoints > 0;
}
function i2() {
  return /Android/gi.test(window.navigator.userAgent);
}
function n() {
  return t6() || i2();
}

// node_modules/@headlessui/react/dist/hooks/use-document-event.js
var import_react6 = __toESM(require_react(), 1);
function d2(e, r4, n4) {
  let o8 = s2(r4);
  (0, import_react6.useEffect)(() => {
    function t10(u6) {
      o8.current(u6);
    }
    return document.addEventListener(e, t10, n4), () => document.removeEventListener(e, t10, n4);
  }, [e, n4]);
}

// node_modules/@headlessui/react/dist/hooks/use-window-event.js
var import_react7 = __toESM(require_react(), 1);
function s5(e, r4, n4) {
  let o8 = s2(r4);
  (0, import_react7.useEffect)(() => {
    function t10(i5) {
      o8.current(i5);
    }
    return window.addEventListener(e, t10, n4), () => window.removeEventListener(e, t10, n4);
  }, [e, n4]);
}

// node_modules/@headlessui/react/dist/hooks/use-outside-click.js
function y2(s8, m4, a2 = true) {
  let i5 = (0, import_react8.useRef)(false);
  (0, import_react8.useEffect)(() => {
    requestAnimationFrame(() => {
      i5.current = a2;
    });
  }, [a2]);
  function c3(e, r4) {
    if (!i5.current || e.defaultPrevented)
      return;
    let t10 = r4(e);
    if (t10 === null || !t10.getRootNode().contains(t10) || !t10.isConnected)
      return;
    let E2 = function u6(n4) {
      return typeof n4 == "function" ? u6(n4()) : Array.isArray(n4) || n4 instanceof Set ? n4 : [n4];
    }(s8);
    for (let u6 of E2) {
      if (u6 === null)
        continue;
      let n4 = u6 instanceof HTMLElement ? u6 : u6.current;
      if (n4 != null && n4.contains(t10) || e.composed && e.composedPath().includes(n4))
        return;
    }
    return !h(t10, T.Loose) && t10.tabIndex !== -1 && e.preventDefault(), m4(e, t10);
  }
  let o8 = (0, import_react8.useRef)(null);
  d2("pointerdown", (e) => {
    var r4, t10;
    i5.current && (o8.current = ((t10 = (r4 = e.composedPath) == null ? void 0 : r4.call(e)) == null ? void 0 : t10[0]) || e.target);
  }, true), d2("mousedown", (e) => {
    var r4, t10;
    i5.current && (o8.current = ((t10 = (r4 = e.composedPath) == null ? void 0 : r4.call(e)) == null ? void 0 : t10[0]) || e.target);
  }, true), d2("click", (e) => {
    n() || o8.current && (c3(e, () => o8.current), o8.current = null);
  }, true), d2("touchend", (e) => c3(e, () => e.target instanceof HTMLElement ? e.target : null), true), s5("blur", (e) => c3(e, () => window.document.activeElement instanceof HTMLIFrameElement ? window.document.activeElement : null), true);
}

// node_modules/@headlessui/react/dist/hooks/use-owner.js
var import_react9 = __toESM(require_react(), 1);
function n2(...e) {
  return (0, import_react9.useMemo)(() => o6(...e), [...e]);
}

// node_modules/@headlessui/react/dist/hooks/use-sync-refs.js
var import_react10 = __toESM(require_react(), 1);
var u2 = Symbol();
function T2(t10, n4 = true) {
  return Object.assign(t10, { [u2]: n4 });
}
function y3(...t10) {
  let n4 = (0, import_react10.useRef)(t10);
  (0, import_react10.useEffect)(() => {
    n4.current = t10;
  }, [t10]);
  let c3 = o2((e) => {
    for (let o8 of n4.current)
      o8 != null && (typeof o8 == "function" ? o8(e) : o8.current = e);
  });
  return t10.every((e) => e == null || (e == null ? void 0 : e[u2])) ? void 0 : c3;
}

// node_modules/@headlessui/react/dist/utils/class-names.js
function t8(...r4) {
  return Array.from(new Set(r4.flatMap((n4) => typeof n4 == "string" ? n4.split(" ") : []))).filter(Boolean).join(" ");
}

// node_modules/@headlessui/react/dist/utils/render.js
var import_react11 = __toESM(require_react(), 1);
var O2 = ((n4) => (n4[n4.None = 0] = "None", n4[n4.RenderStrategy = 1] = "RenderStrategy", n4[n4.Static = 2] = "Static", n4))(O2 || {});
var v = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(v || {});
function C({ ourProps: r4, theirProps: t10, slot: e, defaultTag: n4, features: o8, visible: a2 = true, name: f5, mergeRefs: l7 }) {
  l7 = l7 != null ? l7 : k;
  let s8 = R(t10, r4);
  if (a2)
    return m2(s8, e, n4, f5, l7);
  let y4 = o8 != null ? o8 : 0;
  if (y4 & 2) {
    let { static: u6 = false, ...d7 } = s8;
    if (u6)
      return m2(d7, e, n4, f5, l7);
  }
  if (y4 & 1) {
    let { unmount: u6 = true, ...d7 } = s8;
    return u(u6 ? 0 : 1, { [0]() {
      return null;
    }, [1]() {
      return m2({ ...d7, hidden: true, style: { display: "none" } }, e, n4, f5, l7);
    } });
  }
  return m2(s8, e, n4, f5, l7);
}
function m2(r4, t10 = {}, e, n4, o8) {
  let { as: a2 = e, children: f5, refName: l7 = "ref", ...s8 } = F2(r4, ["unmount", "static"]), y4 = r4.ref !== void 0 ? { [l7]: r4.ref } : {}, u6 = typeof f5 == "function" ? f5(t10) : f5;
  "className" in s8 && s8.className && typeof s8.className == "function" && (s8.className = s8.className(t10));
  let d7 = {};
  if (t10) {
    let i5 = false, c3 = [];
    for (let [T4, p4] of Object.entries(t10))
      typeof p4 == "boolean" && (i5 = true), p4 === true && c3.push(T4);
    i5 && (d7["data-headlessui-state"] = c3.join(" "));
  }
  if (a2 === import_react11.Fragment && Object.keys(x(s8)).length > 0) {
    if (!(0, import_react11.isValidElement)(u6) || Array.isArray(u6) && u6.length > 1)
      throw new Error(['Passing props on "Fragment"!', "", `The current component <${n4} /> is rendering a "Fragment".`, "However we need to passthrough the following props:", Object.keys(s8).map((p4) => `  - ${p4}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".', "Render a single element as the child so that we can forward the props onto that element."].map((p4) => `  - ${p4}`).join(`
`)].join(`
`));
    let i5 = u6.props, c3 = typeof (i5 == null ? void 0 : i5.className) == "function" ? (...p4) => t8(i5 == null ? void 0 : i5.className(...p4), s8.className) : t8(i5 == null ? void 0 : i5.className, s8.className), T4 = c3 ? { className: c3 } : {};
    return (0, import_react11.cloneElement)(u6, Object.assign({}, R(u6.props, x(F2(s8, ["ref"]))), d7, y4, { ref: o8(u6.ref, y4.ref) }, T4));
  }
  return (0, import_react11.createElement)(a2, Object.assign({}, F2(s8, ["ref"]), a2 !== import_react11.Fragment && y4, a2 !== import_react11.Fragment && d7), u6);
}
function k(...r4) {
  return r4.every((t10) => t10 == null) ? void 0 : (t10) => {
    for (let e of r4)
      e != null && (typeof e == "function" ? e(t10) : e.current = t10);
  };
}
function R(...r4) {
  var n4;
  if (r4.length === 0)
    return {};
  if (r4.length === 1)
    return r4[0];
  let t10 = {}, e = {};
  for (let o8 of r4)
    for (let a2 in o8)
      a2.startsWith("on") && typeof o8[a2] == "function" ? ((n4 = e[a2]) != null || (e[a2] = []), e[a2].push(o8[a2])) : t10[a2] = o8[a2];
  if (t10.disabled || t10["aria-disabled"])
    return Object.assign(t10, Object.fromEntries(Object.keys(e).map((o8) => [o8, void 0])));
  for (let o8 in e)
    Object.assign(t10, { [o8](a2, ...f5) {
      let l7 = e[o8];
      for (let s8 of l7) {
        if ((a2 instanceof Event || (a2 == null ? void 0 : a2.nativeEvent) instanceof Event) && a2.defaultPrevented)
          return;
        s8(a2, ...f5);
      }
    } });
  return t10;
}
function U(r4) {
  var t10;
  return Object.assign((0, import_react11.forwardRef)(r4), { displayName: (t10 = r4.displayName) != null ? t10 : r4.name });
}
function x(r4) {
  let t10 = Object.assign({}, r4);
  for (let e in t10)
    t10[e] === void 0 && delete t10[e];
  return t10;
}
function F2(r4, t10 = []) {
  let e = Object.assign({}, r4);
  for (let n4 of t10)
    n4 in e && delete e[n4];
  return e;
}

// node_modules/@headlessui/react/dist/internal/open-closed.js
var import_react12 = __toESM(require_react(), 1);
var n3 = (0, import_react12.createContext)(null);
n3.displayName = "OpenClosedContext";
var d5 = ((e) => (e[e.Open = 1] = "Open", e[e.Closed = 2] = "Closed", e[e.Closing = 4] = "Closing", e[e.Opening = 8] = "Opening", e))(d5 || {});
function u3() {
  return (0, import_react12.useContext)(n3);
}
function s6({ value: o8, children: r4 }) {
  return import_react12.default.createElement(n3.Provider, { value: o8 }, r4);
}

// node_modules/@headlessui/react/dist/utils/bugs.js
function r2(n4) {
  let e = n4.parentElement, l7 = null;
  for (; e && !(e instanceof HTMLFieldSetElement); )
    e instanceof HTMLLegendElement && (l7 = e), e = e.parentElement;
  let t10 = (e == null ? void 0 : e.getAttribute("disabled")) === "";
  return t10 && i4(l7) ? false : t10;
}
function i4(n4) {
  if (!n4)
    return false;
  let e = n4.previousElementSibling;
  for (; e !== null; ) {
    if (e instanceof HTMLLegendElement)
      return false;
    e = e.previousElementSibling;
  }
  return true;
}

// node_modules/@headlessui/react/dist/components/keyboard.js
var o7 = ((r4) => (r4.Space = " ", r4.Enter = "Enter", r4.Escape = "Escape", r4.Backspace = "Backspace", r4.Delete = "Delete", r4.ArrowLeft = "ArrowLeft", r4.ArrowUp = "ArrowUp", r4.ArrowRight = "ArrowRight", r4.ArrowDown = "ArrowDown", r4.Home = "Home", r4.End = "End", r4.PageUp = "PageUp", r4.PageDown = "PageDown", r4.Tab = "Tab", r4))(o7 || {});

// node_modules/@headlessui/react/dist/hooks/use-is-mounted.js
var import_react13 = __toESM(require_react(), 1);
function f3() {
  let e = (0, import_react13.useRef)(false);
  return l(() => (e.current = true, () => {
    e.current = false;
  }), []), e;
}

// node_modules/@headlessui/react/dist/components/description/description.js
var import_react14 = __toESM(require_react(), 1);
var d6 = (0, import_react14.createContext)(null);
function f4() {
  let r4 = (0, import_react14.useContext)(d6);
  if (r4 === null) {
    let t10 = new Error("You used a <Description /> component, but it is not inside a relevant parent.");
    throw Error.captureStackTrace && Error.captureStackTrace(t10, f4), t10;
  }
  return r4;
}
function w2() {
  let [r4, t10] = (0, import_react14.useState)([]);
  return [r4.length > 0 ? r4.join(" ") : void 0, (0, import_react14.useMemo)(() => function(e) {
    let i5 = o2((s8) => (t10((o8) => [...o8, s8]), () => t10((o8) => {
      let p4 = o8.slice(), c3 = p4.indexOf(s8);
      return c3 !== -1 && p4.splice(c3, 1), p4;
    }))), n4 = (0, import_react14.useMemo)(() => ({ register: i5, slot: e.slot, name: e.name, props: e.props }), [i5, e.slot, e.name, e.props]);
    return import_react14.default.createElement(d6.Provider, { value: n4 }, e.children);
  }, [t10])];
}
var I3 = "p";
function S3(r4, t10) {
  let a2 = I(), { id: e = `headlessui-description-${a2}`, ...i5 } = r4, n4 = f4(), s8 = y3(t10);
  l(() => n4.register(e), [e, n4.register]);
  let o8 = { ref: s8, ...n4.props, id: e };
  return C({ ourProps: o8, theirProps: i5, slot: n4.slot || {}, defaultTag: I3, name: n4.name || "Description" });
}
var h3 = U(S3);
var G = Object.assign(h3, {});

// node_modules/@headlessui/react/dist/internal/hidden.js
var p3 = "div";
var s7 = ((e) => (e[e.None = 1] = "None", e[e.Focusable = 2] = "Focusable", e[e.Hidden = 4] = "Hidden", e))(s7 || {});
function l6(d7, o8) {
  var n4;
  let { features: t10 = 1, ...e } = d7, r4 = { ref: o8, "aria-hidden": (t10 & 2) === 2 ? true : (n4 = e["aria-hidden"]) != null ? n4 : void 0, hidden: (t10 & 4) === 4 ? true : void 0, style: { position: "fixed", top: 1, left: 1, width: 1, height: 0, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: "0", ...(t10 & 4) === 4 && (t10 & 2) !== 2 && { display: "none" } } };
  return C({ ourProps: r4, theirProps: e, slot: {}, defaultTag: p3, name: "Hidden" });
}
var u5 = U(l6);

export {
  s,
  l,
  s2,
  o2 as o,
  t3 as t,
  o3 as o2,
  p,
  l2,
  I,
  u,
  o6 as o3,
  M,
  N,
  T,
  h,
  D,
  y,
  I2,
  _,
  O,
  t6 as t2,
  s5 as s3,
  y2,
  n2 as n,
  T2,
  y3,
  t8 as t3,
  O2,
  v,
  C,
  U,
  x,
  s7 as s4,
  u5 as u2,
  d5 as d,
  u3,
  s6 as s5,
  r2 as r,
  o7 as o4,
  f3 as f,
  w2 as w,
  G
};
//# sourceMappingURL=/build/_shared/chunk-7ZNLIBJB.js.map
