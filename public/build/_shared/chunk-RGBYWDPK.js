import {
  C,
  G,
  I,
  M,
  N,
  O,
  O2,
  T2 as T,
  U,
  d,
  f,
  l,
  l2,
  n,
  o,
  o2,
  o4 as o3,
  p,
  r,
  s,
  s2,
  s3,
  s4,
  t,
  t2,
  u,
  u2,
  u3,
  w,
  y,
  y2,
  y3
} from "/build/_shared/chunk-7ZNLIBJB.js";
import {
  require_react_dom
} from "/build/_shared/chunk-GIAAE3CH.js";
import {
  require_react
} from "/build/_shared/chunk-BOXFZXVX.js";
import {
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// node_modules/@headlessui/react/dist/components/dialog/dialog.js
var import_react10 = __toESM(require_react(), 1);

// node_modules/@headlessui/react/dist/components/focus-trap/focus-trap.js
var import_react5 = __toESM(require_react(), 1);

// node_modules/@headlessui/react/dist/hooks/use-event-listener.js
var import_react = __toESM(require_react(), 1);
function E(n4, e3, a6, t9) {
  let i2 = s2(a6);
  (0, import_react.useEffect)(() => {
    n4 = n4 != null ? n4 : window;
    function r5(o4) {
      i2.current(o4);
    }
    return n4.addEventListener(e3, r5, t9), () => n4.removeEventListener(e3, r5, t9);
  }, [n4, e3, t9]);
}

// node_modules/@headlessui/react/dist/hooks/use-on-unmount.js
var import_react2 = __toESM(require_react(), 1);
function c(t9) {
  let r5 = o(t9), e3 = (0, import_react2.useRef)(false);
  (0, import_react2.useEffect)(() => (e3.current = false, () => {
    e3.current = true, t(() => {
      e3.current && r5();
    });
  }), [r5]);
}

// node_modules/@headlessui/react/dist/hooks/use-tab-direction.js
var import_react3 = __toESM(require_react(), 1);
var s5 = ((r5) => (r5[r5.Forwards = 0] = "Forwards", r5[r5.Backwards = 1] = "Backwards", r5))(s5 || {});
function n3() {
  let e3 = (0, import_react3.useRef)(0);
  return s3("keydown", (o4) => {
    o4.key === "Tab" && (e3.current = o4.shiftKey ? 1 : 0);
  }, true), e3;
}

// node_modules/@headlessui/react/dist/hooks/use-watch.js
var import_react4 = __toESM(require_react(), 1);
function m(u8, t9) {
  let e3 = (0, import_react4.useRef)([]), r5 = o(u8);
  (0, import_react4.useEffect)(() => {
    let o4 = [...e3.current];
    for (let [n4, a6] of t9.entries())
      if (e3.current[n4] !== a6) {
        let l6 = r5(t9, o4);
        return e3.current = t9, l6;
      }
  }, [r5, ...t9]);
}

// node_modules/@headlessui/react/dist/utils/document-ready.js
function t4(n4) {
  function e3() {
    document.readyState !== "loading" && (n4(), document.removeEventListener("DOMContentLoaded", e3));
  }
  typeof window != "undefined" && typeof document != "undefined" && (document.addEventListener("DOMContentLoaded", e3), e3());
}

// node_modules/@headlessui/react/dist/utils/active-element-history.js
var t5 = [];
t4(() => {
  function e3(n4) {
    n4.target instanceof HTMLElement && n4.target !== document.body && t5[0] !== n4.target && (t5.unshift(n4.target), t5 = t5.filter((r5) => r5 != null && r5.isConnected), t5.splice(10));
  }
  window.addEventListener("click", e3, { capture: true }), window.addEventListener("mousedown", e3, { capture: true }), window.addEventListener("focus", e3, { capture: true }), document.body.addEventListener("click", e3, { capture: true }), document.body.addEventListener("mousedown", e3, { capture: true }), document.body.addEventListener("focus", e3, { capture: true });
});

// node_modules/@headlessui/react/dist/components/focus-trap/focus-trap.js
function P(t9) {
  if (!t9)
    return /* @__PURE__ */ new Set();
  if (typeof t9 == "function")
    return new Set(t9());
  let n4 = /* @__PURE__ */ new Set();
  for (let e3 of t9.current)
    e3.current instanceof HTMLElement && n4.add(e3.current);
  return n4;
}
var X = "div";
var _ = ((r5) => (r5[r5.None = 1] = "None", r5[r5.InitialFocus = 2] = "InitialFocus", r5[r5.TabLock = 4] = "TabLock", r5[r5.FocusLock = 8] = "FocusLock", r5[r5.RestoreFocus = 16] = "RestoreFocus", r5[r5.All = 30] = "All", r5))(_ || {});
function z(t9, n4) {
  let e3 = (0, import_react5.useRef)(null), o4 = y3(e3, n4), { initialFocus: l6, containers: c6, features: r5 = 30, ...s10 } = t9;
  l2() || (r5 = 1);
  let i2 = n(e3);
  Y({ ownerDocument: i2 }, Boolean(r5 & 16));
  let u8 = Z({ ownerDocument: i2, container: e3, initialFocus: l6 }, Boolean(r5 & 2));
  $({ ownerDocument: i2, container: e3, containers: c6, previousActiveElement: u8 }, Boolean(r5 & 8));
  let y6 = n3(), R2 = o((a6) => {
    let m6 = e3.current;
    if (!m6)
      return;
    ((B) => B())(() => {
      u(y6.current, { [s5.Forwards]: () => {
        O(m6, M.First, { skipElements: [a6.relatedTarget] });
      }, [s5.Backwards]: () => {
        O(m6, M.Last, { skipElements: [a6.relatedTarget] });
      } });
    });
  }), h2 = p(), H2 = (0, import_react5.useRef)(false), j2 = { ref: o4, onKeyDown(a6) {
    a6.key == "Tab" && (H2.current = true, h2.requestAnimationFrame(() => {
      H2.current = false;
    }));
  }, onBlur(a6) {
    let m6 = P(c6);
    e3.current instanceof HTMLElement && m6.add(e3.current);
    let T3 = a6.relatedTarget;
    T3 instanceof HTMLElement && T3.dataset.headlessuiFocusGuard !== "true" && (S(m6, T3) || (H2.current ? O(e3.current, u(y6.current, { [s5.Forwards]: () => M.Next, [s5.Backwards]: () => M.Previous }) | M.WrapAround, { relativeTo: a6.target }) : a6.target instanceof HTMLElement && y(a6.target)));
  } };
  return import_react5.default.createElement(import_react5.default.Fragment, null, Boolean(r5 & 4) && import_react5.default.createElement(u2, { as: "button", type: "button", "data-headlessui-focus-guard": true, onFocus: R2, features: s4.Focusable }), C({ ourProps: j2, theirProps: s10, defaultTag: X, name: "FocusTrap" }), Boolean(r5 & 4) && import_react5.default.createElement(u2, { as: "button", type: "button", "data-headlessui-focus-guard": true, onFocus: R2, features: s4.Focusable }));
}
var D = U(z);
var de = Object.assign(D, { features: _ });
function Q(t9 = true) {
  let n4 = (0, import_react5.useRef)(t5.slice());
  return m(([e3], [o4]) => {
    o4 === true && e3 === false && t(() => {
      n4.current.splice(0);
    }), o4 === false && e3 === true && (n4.current = t5.slice());
  }, [t9, t5, n4]), o(() => {
    var e3;
    return (e3 = n4.current.find((o4) => o4 != null && o4.isConnected)) != null ? e3 : null;
  });
}
function Y({ ownerDocument: t9 }, n4) {
  let e3 = Q(n4);
  m(() => {
    n4 || (t9 == null ? void 0 : t9.activeElement) === (t9 == null ? void 0 : t9.body) && y(e3());
  }, [n4]), c(() => {
    n4 && y(e3());
  });
}
function Z({ ownerDocument: t9, container: n4, initialFocus: e3 }, o4) {
  let l6 = (0, import_react5.useRef)(null), c6 = f();
  return m(() => {
    if (!o4)
      return;
    let r5 = n4.current;
    r5 && t(() => {
      if (!c6.current)
        return;
      let s10 = t9 == null ? void 0 : t9.activeElement;
      if (e3 != null && e3.current) {
        if ((e3 == null ? void 0 : e3.current) === s10) {
          l6.current = s10;
          return;
        }
      } else if (r5.contains(s10)) {
        l6.current = s10;
        return;
      }
      e3 != null && e3.current ? y(e3.current) : O(r5, M.First) === N.Error && console.warn("There are no focusable elements inside the <FocusTrap />"), l6.current = t9 == null ? void 0 : t9.activeElement;
    });
  }, [o4]), l6;
}
function $({ ownerDocument: t9, container: n4, containers: e3, previousActiveElement: o4 }, l6) {
  let c6 = f();
  E(t9 == null ? void 0 : t9.defaultView, "focus", (r5) => {
    if (!l6 || !c6.current)
      return;
    let s10 = P(e3);
    n4.current instanceof HTMLElement && s10.add(n4.current);
    let i2 = o4.current;
    if (!i2)
      return;
    let u8 = r5.target;
    u8 && u8 instanceof HTMLElement ? S(s10, u8) ? (o4.current = u8, y(u8)) : (r5.preventDefault(), r5.stopPropagation(), y(i2)) : y(o4.current);
  }, true);
}
function S(t9, n4) {
  for (let e3 of t9)
    if (e3.contains(n4))
      return true;
  return false;
}

// node_modules/@headlessui/react/dist/components/portal/portal.js
var import_react7 = __toESM(require_react(), 1);
var import_react_dom = __toESM(require_react_dom(), 1);

// node_modules/@headlessui/react/dist/internal/portal-force-root.js
var import_react6 = __toESM(require_react(), 1);
var e = (0, import_react6.createContext)(false);
function a() {
  return (0, import_react6.useContext)(e);
}
function l3(o4) {
  return import_react6.default.createElement(e.Provider, { value: o4.force }, o4.children);
}

// node_modules/@headlessui/react/dist/components/portal/portal.js
function F(p4) {
  let n4 = a(), l6 = (0, import_react7.useContext)(_2), e3 = n(p4), [a6, o4] = (0, import_react7.useState)(() => {
    if (!n4 && l6 !== null || s.isServer)
      return null;
    let t9 = e3 == null ? void 0 : e3.getElementById("headlessui-portal-root");
    if (t9)
      return t9;
    if (e3 === null)
      return null;
    let r5 = e3.createElement("div");
    return r5.setAttribute("id", "headlessui-portal-root"), e3.body.appendChild(r5);
  });
  return (0, import_react7.useEffect)(() => {
    a6 !== null && (e3 != null && e3.body.contains(a6) || e3 == null || e3.body.appendChild(a6));
  }, [a6, e3]), (0, import_react7.useEffect)(() => {
    n4 || l6 !== null && o4(l6.current);
  }, [l6, o4, n4]), a6;
}
var U2 = import_react7.Fragment;
function N2(p4, n4) {
  let l6 = p4, e3 = (0, import_react7.useRef)(null), a6 = y3(T((u8) => {
    e3.current = u8;
  }), n4), o4 = n(e3), t9 = F(e3), [r5] = (0, import_react7.useState)(() => {
    var u8;
    return s.isServer ? null : (u8 = o4 == null ? void 0 : o4.createElement("div")) != null ? u8 : null;
  }), i2 = (0, import_react7.useContext)(f3), v = l2();
  return l(() => {
    !t9 || !r5 || t9.contains(r5) || (r5.setAttribute("data-headlessui-portal", ""), t9.appendChild(r5));
  }, [t9, r5]), l(() => {
    if (r5 && i2)
      return i2.register(r5);
  }, [i2, r5]), c(() => {
    var u8;
    !t9 || !r5 || (r5 instanceof Node && t9.contains(r5) && t9.removeChild(r5), t9.childNodes.length <= 0 && ((u8 = t9.parentElement) == null || u8.removeChild(t9)));
  }), v ? !t9 || !r5 ? null : (0, import_react_dom.createPortal)(C({ ourProps: { ref: a6 }, theirProps: l6, defaultTag: U2, name: "Portal" }), r5) : null;
}
var S2 = import_react7.Fragment;
var _2 = (0, import_react7.createContext)(null);
function j(p4, n4) {
  let { target: l6, ...e3 } = p4, o4 = { ref: y3(n4) };
  return import_react7.default.createElement(_2.Provider, { value: l6 }, C({ ourProps: o4, theirProps: e3, defaultTag: S2, name: "Popover.Group" }));
}
var f3 = (0, import_react7.createContext)(null);
function ee() {
  let p4 = (0, import_react7.useContext)(f3), n4 = (0, import_react7.useRef)([]), l6 = o((o4) => (n4.current.push(o4), p4 && p4.register(o4), () => e3(o4))), e3 = o((o4) => {
    let t9 = n4.current.indexOf(o4);
    t9 !== -1 && n4.current.splice(t9, 1), p4 && p4.unregister(o4);
  }), a6 = (0, import_react7.useMemo)(() => ({ register: l6, unregister: e3, portals: n4 }), [l6, e3, n4]);
  return [n4, (0, import_react7.useMemo)(() => function({ children: t9 }) {
    return import_react7.default.createElement(f3.Provider, { value: a6 }, t9);
  }, [a6])];
}
var D2 = U(N2);
var I2 = U(j);
var te = Object.assign(D2, { Group: I2 });

// node_modules/@headlessui/react/dist/use-sync-external-store-shim/index.js
var e2 = __toESM(require_react(), 1);

// node_modules/@headlessui/react/dist/use-sync-external-store-shim/useSyncExternalStoreShimClient.js
var l4 = __toESM(require_react(), 1);
function i(e3, t9) {
  return e3 === t9 && (e3 !== 0 || 1 / e3 === 1 / t9) || e3 !== e3 && t9 !== t9;
}
var d5 = typeof Object.is == "function" ? Object.is : i;
var { useState: u5, useEffect: h, useLayoutEffect: f4, useDebugValue: p2 } = l4;
function y4(e3, t9, c6) {
  const a6 = t9(), [{ inst: n4 }, o4] = u5({ inst: { value: a6, getSnapshot: t9 } });
  return f4(() => {
    n4.value = a6, n4.getSnapshot = t9, r3(n4) && o4({ inst: n4 });
  }, [e3, a6, t9]), h(() => (r3(n4) && o4({ inst: n4 }), e3(() => {
    r3(n4) && o4({ inst: n4 });
  })), [e3]), p2(a6), a6;
}
function r3(e3) {
  const t9 = e3.getSnapshot, c6 = e3.value;
  try {
    const a6 = t9();
    return !d5(c6, a6);
  } catch {
    return true;
  }
}

// node_modules/@headlessui/react/dist/use-sync-external-store-shim/useSyncExternalStoreShimServer.js
function t7(r5, e3, n4) {
  return e3();
}

// node_modules/@headlessui/react/dist/use-sync-external-store-shim/index.js
var r4 = typeof window != "undefined" && typeof window.document != "undefined" && typeof window.document.createElement != "undefined";
var s8 = !r4;
var c3 = s8 ? t7 : y4;
var a2 = "useSyncExternalStore" in e2 ? ((n4) => n4.useSyncExternalStore)(e2) : c3;

// node_modules/@headlessui/react/dist/hooks/use-store.js
function S3(t9) {
  return a2(t9.subscribe, t9.getSnapshot, t9.getSnapshot);
}

// node_modules/@headlessui/react/dist/utils/store.js
function a3(o4, r5) {
  let t9 = o4(), n4 = /* @__PURE__ */ new Set();
  return { getSnapshot() {
    return t9;
  }, subscribe(e3) {
    return n4.add(e3), () => n4.delete(e3);
  }, dispatch(e3, ...s10) {
    let i2 = r5[e3].call(t9, ...s10);
    i2 && (t9 = i2, n4.forEach((c6) => c6()));
  } };
}

// node_modules/@headlessui/react/dist/hooks/document-overflow/adjust-scrollbar-padding.js
function c4() {
  let o4;
  return { before({ doc: e3 }) {
    var l6;
    let n4 = e3.documentElement;
    o4 = ((l6 = e3.defaultView) != null ? l6 : window).innerWidth - n4.clientWidth;
  }, after({ doc: e3, d: n4 }) {
    let t9 = e3.documentElement, l6 = t9.clientWidth - t9.offsetWidth, r5 = o4 - l6;
    n4.style(t9, "paddingRight", `${r5}px`);
  } };
}

// node_modules/@headlessui/react/dist/hooks/document-overflow/handle-ios-locking.js
function d6() {
  return t2() ? { before({ doc: r5, d: l6, meta: c6 }) {
    function o4(a6) {
      return c6.containers.flatMap((n4) => n4()).some((n4) => n4.contains(a6));
    }
    l6.microTask(() => {
      var s10;
      if (window.getComputedStyle(r5.documentElement).scrollBehavior !== "auto") {
        let t9 = o2();
        t9.style(r5.documentElement, "scrollBehavior", "auto"), l6.add(() => l6.microTask(() => t9.dispose()));
      }
      let a6 = (s10 = window.scrollY) != null ? s10 : window.pageYOffset, n4 = null;
      l6.addEventListener(r5, "click", (t9) => {
        if (t9.target instanceof HTMLElement)
          try {
            let e3 = t9.target.closest("a");
            if (!e3)
              return;
            let { hash: f5 } = new URL(e3.href), i2 = r5.querySelector(f5);
            i2 && !o4(i2) && (n4 = i2);
          } catch {
          }
      }, true), l6.addEventListener(r5, "touchstart", (t9) => {
        if (t9.target instanceof HTMLElement)
          if (o4(t9.target)) {
            let e3 = t9.target;
            for (; e3.parentElement && o4(e3.parentElement); )
              e3 = e3.parentElement;
            l6.style(e3, "overscrollBehavior", "contain");
          } else
            l6.style(t9.target, "touchAction", "none");
      }), l6.addEventListener(r5, "touchmove", (t9) => {
        if (t9.target instanceof HTMLElement)
          if (o4(t9.target)) {
            let e3 = t9.target;
            for (; e3.parentElement && e3.dataset.headlessuiPortal !== "" && !(e3.scrollHeight > e3.clientHeight || e3.scrollWidth > e3.clientWidth); )
              e3 = e3.parentElement;
            e3.dataset.headlessuiPortal === "" && t9.preventDefault();
          } else
            t9.preventDefault();
      }, { passive: false }), l6.add(() => {
        var e3;
        let t9 = (e3 = window.scrollY) != null ? e3 : window.pageYOffset;
        a6 !== t9 && window.scrollTo(0, a6), n4 && n4.isConnected && (n4.scrollIntoView({ block: "nearest" }), n4 = null);
      });
    });
  } } : {};
}

// node_modules/@headlessui/react/dist/hooks/document-overflow/prevent-scroll.js
function l5() {
  return { before({ doc: e3, d: o4 }) {
    o4.style(e3.documentElement, "overflow", "hidden");
  } };
}

// node_modules/@headlessui/react/dist/hooks/document-overflow/overflow-store.js
function m3(e3) {
  let n4 = {};
  for (let t9 of e3)
    Object.assign(n4, t9(n4));
  return n4;
}
var a4 = a3(() => /* @__PURE__ */ new Map(), { PUSH(e3, n4) {
  var o4;
  let t9 = (o4 = this.get(e3)) != null ? o4 : { doc: e3, count: 0, d: o2(), meta: /* @__PURE__ */ new Set() };
  return t9.count++, t9.meta.add(n4), this.set(e3, t9), this;
}, POP(e3, n4) {
  let t9 = this.get(e3);
  return t9 && (t9.count--, t9.meta.delete(n4)), this;
}, SCROLL_PREVENT({ doc: e3, d: n4, meta: t9 }) {
  let o4 = { doc: e3, d: n4, meta: m3(t9) }, c6 = [d6(), c4(), l5()];
  c6.forEach(({ before: r5 }) => r5 == null ? void 0 : r5(o4)), c6.forEach(({ after: r5 }) => r5 == null ? void 0 : r5(o4));
}, SCROLL_ALLOW({ d: e3 }) {
  e3.dispose();
}, TEARDOWN({ doc: e3 }) {
  this.delete(e3);
} });
a4.subscribe(() => {
  let e3 = a4.getSnapshot(), n4 = /* @__PURE__ */ new Map();
  for (let [t9] of e3)
    n4.set(t9, t9.documentElement.style.overflow);
  for (let t9 of e3.values()) {
    let o4 = n4.get(t9.doc) === "hidden", c6 = t9.count !== 0;
    (c6 && !o4 || !c6 && o4) && a4.dispatch(t9.count > 0 ? "SCROLL_PREVENT" : "SCROLL_ALLOW", t9), t9.count === 0 && a4.dispatch("TEARDOWN", t9);
  }
});

// node_modules/@headlessui/react/dist/hooks/document-overflow/use-document-overflow.js
function p3(e3, r5, n4) {
  let f5 = S3(a4), o4 = e3 ? f5.get(e3) : void 0, i2 = o4 ? o4.count > 0 : false;
  return l(() => {
    if (!(!e3 || !r5))
      return a4.dispatch("PUSH", e3, n4), () => a4.dispatch("POP", e3, n4);
  }, [r5, e3]), i2;
}

// node_modules/@headlessui/react/dist/hooks/use-inert.js
var u6 = /* @__PURE__ */ new Map();
var t8 = /* @__PURE__ */ new Map();
function b(r5, l6 = true) {
  l(() => {
    var o4;
    if (!l6)
      return;
    let e3 = typeof r5 == "function" ? r5() : r5.current;
    if (!e3)
      return;
    function a6() {
      var d9;
      if (!e3)
        return;
      let i2 = (d9 = t8.get(e3)) != null ? d9 : 1;
      if (i2 === 1 ? t8.delete(e3) : t8.set(e3, i2 - 1), i2 !== 1)
        return;
      let n4 = u6.get(e3);
      n4 && (n4["aria-hidden"] === null ? e3.removeAttribute("aria-hidden") : e3.setAttribute("aria-hidden", n4["aria-hidden"]), e3.inert = n4.inert, u6.delete(e3));
    }
    let f5 = (o4 = t8.get(e3)) != null ? o4 : 0;
    return t8.set(e3, f5 + 1), f5 !== 0 || (u6.set(e3, { "aria-hidden": e3.getAttribute("aria-hidden"), inert: e3.inert }), e3.setAttribute("aria-hidden", "true"), e3.inert = true), a6;
  }, [r5, l6]);
}

// node_modules/@headlessui/react/dist/hooks/use-root-containers.js
var import_react8 = __toESM(require_react(), 1);
function N3({ defaultContainers: o4 = [], portals: r5, mainTreeNodeRef: u8 } = {}) {
  var f5;
  let t9 = (0, import_react8.useRef)((f5 = u8 == null ? void 0 : u8.current) != null ? f5 : null), l6 = n(t9), c6 = o(() => {
    var i2, s10, a6;
    let n4 = [];
    for (let e3 of o4)
      e3 !== null && (e3 instanceof HTMLElement ? n4.push(e3) : "current" in e3 && e3.current instanceof HTMLElement && n4.push(e3.current));
    if (r5 != null && r5.current)
      for (let e3 of r5.current)
        n4.push(e3);
    for (let e3 of (i2 = l6 == null ? void 0 : l6.querySelectorAll("html > *, body > *")) != null ? i2 : [])
      e3 !== document.body && e3 !== document.head && e3 instanceof HTMLElement && e3.id !== "headlessui-portal-root" && (e3.contains(t9.current) || e3.contains((a6 = (s10 = t9.current) == null ? void 0 : s10.getRootNode()) == null ? void 0 : a6.host) || n4.some((L) => e3.contains(L)) || n4.push(e3));
    return n4;
  });
  return { resolveContainers: c6, contains: o((n4) => c6().some((i2) => i2.contains(n4))), mainTreeNodeRef: t9, MainTreeNode: (0, import_react8.useMemo)(() => function() {
    return u8 != null ? null : import_react8.default.createElement(u2, { features: s4.Hidden, ref: t9 });
  }, [t9, u8]) };
}

// node_modules/@headlessui/react/dist/internal/stack-context.js
var import_react9 = __toESM(require_react(), 1);
var a5 = (0, import_react9.createContext)(() => {
});
a5.displayName = "StackContext";
var s9 = ((e3) => (e3[e3.Add = 0] = "Add", e3[e3.Remove = 1] = "Remove", e3))(s9 || {});
function x() {
  return (0, import_react9.useContext)(a5);
}
function b2({ children: i2, onUpdate: r5, type: e3, element: n4, enabled: u8 }) {
  let l6 = x(), o4 = o((...t9) => {
    r5 == null || r5(...t9), l6(...t9);
  });
  return l(() => {
    let t9 = u8 === void 0 || u8 === true;
    return t9 && o4(0, e3, n4), () => {
      t9 && o4(1, e3, n4);
    };
  }, [o4, e3, n4, u8]), import_react9.default.createElement(a5.Provider, { value: o4 }, i2);
}

// node_modules/@headlessui/react/dist/components/dialog/dialog.js
var Me = ((r5) => (r5[r5.Open = 0] = "Open", r5[r5.Closed = 1] = "Closed", r5))(Me || {});
var we = ((e3) => (e3[e3.SetTitleId = 0] = "SetTitleId", e3))(we || {});
var He = { [0](o4, e3) {
  return o4.titleId === e3.id ? o4 : { ...o4, titleId: e3.id };
} };
var I3 = (0, import_react10.createContext)(null);
I3.displayName = "DialogContext";
function b3(o4) {
  let e3 = (0, import_react10.useContext)(I3);
  if (e3 === null) {
    let r5 = new Error(`<${o4} /> is missing a parent <Dialog /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(r5, b3), r5;
  }
  return e3;
}
function Be(o4, e3, r5 = () => [document.body]) {
  p3(o4, e3, (i2) => {
    var n4;
    return { containers: [...(n4 = i2.containers) != null ? n4 : [], r5] };
  });
}
function Ge(o4, e3) {
  return u(e3.type, He, o4, e3);
}
var Ne = "div";
var Ue = O2.RenderStrategy | O2.Static;
function We(o4, e3) {
  let r5 = I(), { id: i2 = `headlessui-dialog-${r5}`, open: n4, onClose: l6, initialFocus: s10, role: a6 = "dialog", __demoMode: T3 = false, ...m6 } = o4, [M3, f5] = (0, import_react10.useState)(0), U3 = (0, import_react10.useRef)(false);
  a6 = function() {
    return a6 === "dialog" || a6 === "alertdialog" ? a6 : (U3.current || (U3.current = true, console.warn(`Invalid role [${a6}] passed to <Dialog />. Only \`dialog\` and and \`alertdialog\` are supported. Using \`dialog\` instead.`)), "dialog");
  }();
  let E4 = u3();
  n4 === void 0 && E4 !== null && (n4 = (E4 & d.Open) === d.Open);
  let D3 = (0, import_react10.useRef)(null), ee2 = y3(D3, e3), g2 = n(D3), W = o4.hasOwnProperty("open") || E4 !== null, $2 = o4.hasOwnProperty("onClose");
  if (!W && !$2)
    throw new Error("You have to provide an `open` and an `onClose` prop to the `Dialog` component.");
  if (!W)
    throw new Error("You provided an `onClose` prop to the `Dialog`, but forgot an `open` prop.");
  if (!$2)
    throw new Error("You provided an `open` prop to the `Dialog`, but forgot an `onClose` prop.");
  if (typeof n4 != "boolean")
    throw new Error(`You provided an \`open\` prop to the \`Dialog\`, but the value is not a boolean. Received: ${n4}`);
  if (typeof l6 != "function")
    throw new Error(`You provided an \`onClose\` prop to the \`Dialog\`, but the value is not a function. Received: ${l6}`);
  let p4 = n4 ? 0 : 1, [h2, te2] = (0, import_react10.useReducer)(Ge, { titleId: null, descriptionId: null, panelRef: (0, import_react10.createRef)() }), P3 = o(() => l6(false)), Y2 = o((t9) => te2({ type: 0, id: t9 })), S4 = l2() ? T3 ? false : p4 === 0 : false, x2 = M3 > 1, j2 = (0, import_react10.useContext)(I3) !== null, [oe, re] = ee(), ne = { get current() {
    var t9;
    return (t9 = h2.panelRef.current) != null ? t9 : D3.current;
  } }, { resolveContainers: w2, mainTreeNodeRef: L, MainTreeNode: le } = N3({ portals: oe, defaultContainers: [ne] }), ae = x2 ? "parent" : "leaf", J = E4 !== null ? (E4 & d.Closing) === d.Closing : false, ie = (() => j2 || J ? false : S4)(), se = (0, import_react10.useCallback)(() => {
    var t9, c6;
    return (c6 = Array.from((t9 = g2 == null ? void 0 : g2.querySelectorAll("body > *")) != null ? t9 : []).find((d9) => d9.id === "headlessui-portal-root" ? false : d9.contains(L.current) && d9 instanceof HTMLElement)) != null ? c6 : null;
  }, [L]);
  b(se, ie);
  let pe = (() => x2 ? true : S4)(), de2 = (0, import_react10.useCallback)(() => {
    var t9, c6;
    return (c6 = Array.from((t9 = g2 == null ? void 0 : g2.querySelectorAll("[data-headlessui-portal]")) != null ? t9 : []).find((d9) => d9.contains(L.current) && d9 instanceof HTMLElement)) != null ? c6 : null;
  }, [L]);
  b(de2, pe);
  let ue = (() => !(!S4 || x2))();
  y2(w2, (t9) => {
    t9.preventDefault(), P3();
  }, ue);
  let fe = (() => !(x2 || p4 !== 0))();
  E(g2 == null ? void 0 : g2.defaultView, "keydown", (t9) => {
    fe && (t9.defaultPrevented || t9.key === o3.Escape && (t9.preventDefault(), t9.stopPropagation(), P3()));
  });
  let ge = (() => !(J || p4 !== 0 || j2))();
  Be(g2, ge, w2), (0, import_react10.useEffect)(() => {
    if (p4 !== 0 || !D3.current)
      return;
    let t9 = new ResizeObserver((c6) => {
      for (let d9 of c6) {
        let F2 = d9.target.getBoundingClientRect();
        F2.x === 0 && F2.y === 0 && F2.width === 0 && F2.height === 0 && P3();
      }
    });
    return t9.observe(D3.current), () => t9.disconnect();
  }, [p4, D3, P3]);
  let [Te, ce] = w(), De = (0, import_react10.useMemo)(() => [{ dialogState: p4, close: P3, setTitleId: Y2 }, h2], [p4, h2, P3, Y2]), X2 = (0, import_react10.useMemo)(() => ({ open: p4 === 0 }), [p4]), me = { ref: ee2, id: i2, role: a6, "aria-modal": p4 === 0 ? true : void 0, "aria-labelledby": h2.titleId, "aria-describedby": Te };
  return import_react10.default.createElement(b2, { type: "Dialog", enabled: p4 === 0, element: D3, onUpdate: o((t9, c6) => {
    c6 === "Dialog" && u(t9, { [s9.Add]: () => f5((d9) => d9 + 1), [s9.Remove]: () => f5((d9) => d9 - 1) });
  }) }, import_react10.default.createElement(l3, { force: true }, import_react10.default.createElement(te, null, import_react10.default.createElement(I3.Provider, { value: De }, import_react10.default.createElement(te.Group, { target: D3 }, import_react10.default.createElement(l3, { force: false }, import_react10.default.createElement(ce, { slot: X2, name: "Dialog.Description" }, import_react10.default.createElement(de, { initialFocus: s10, containers: w2, features: S4 ? u(ae, { parent: de.features.RestoreFocus, leaf: de.features.All & ~de.features.FocusLock }) : de.features.None }, import_react10.default.createElement(re, null, C({ ourProps: me, theirProps: m6, slot: X2, defaultTag: Ne, features: Ue, visible: p4 === 0, name: "Dialog" }))))))))), import_react10.default.createElement(le, null));
}
var $e = "div";
function Ye(o4, e3) {
  let r5 = I(), { id: i2 = `headlessui-dialog-overlay-${r5}`, ...n4 } = o4, [{ dialogState: l6, close: s10 }] = b3("Dialog.Overlay"), a6 = y3(e3), T3 = o((f5) => {
    if (f5.target === f5.currentTarget) {
      if (r(f5.currentTarget))
        return f5.preventDefault();
      f5.preventDefault(), f5.stopPropagation(), s10();
    }
  }), m6 = (0, import_react10.useMemo)(() => ({ open: l6 === 0 }), [l6]);
  return C({ ourProps: { ref: a6, id: i2, "aria-hidden": true, onClick: T3 }, theirProps: n4, slot: m6, defaultTag: $e, name: "Dialog.Overlay" });
}
var je = "div";
function Je(o4, e3) {
  let r5 = I(), { id: i2 = `headlessui-dialog-backdrop-${r5}`, ...n4 } = o4, [{ dialogState: l6 }, s10] = b3("Dialog.Backdrop"), a6 = y3(e3);
  (0, import_react10.useEffect)(() => {
    if (s10.panelRef.current === null)
      throw new Error("A <Dialog.Backdrop /> component is being used, but a <Dialog.Panel /> component is missing.");
  }, [s10.panelRef]);
  let T3 = (0, import_react10.useMemo)(() => ({ open: l6 === 0 }), [l6]);
  return import_react10.default.createElement(l3, { force: true }, import_react10.default.createElement(te, null, C({ ourProps: { ref: a6, id: i2, "aria-hidden": true }, theirProps: n4, slot: T3, defaultTag: je, name: "Dialog.Backdrop" })));
}
var Xe = "div";
function Ke(o4, e3) {
  let r5 = I(), { id: i2 = `headlessui-dialog-panel-${r5}`, ...n4 } = o4, [{ dialogState: l6 }, s10] = b3("Dialog.Panel"), a6 = y3(e3, s10.panelRef), T3 = (0, import_react10.useMemo)(() => ({ open: l6 === 0 }), [l6]), m6 = o((f5) => {
    f5.stopPropagation();
  });
  return C({ ourProps: { ref: a6, id: i2, onClick: m6 }, theirProps: n4, slot: T3, defaultTag: Xe, name: "Dialog.Panel" });
}
var Ve = "h2";
function qe(o4, e3) {
  let r5 = I(), { id: i2 = `headlessui-dialog-title-${r5}`, ...n4 } = o4, [{ dialogState: l6, setTitleId: s10 }] = b3("Dialog.Title"), a6 = y3(e3);
  (0, import_react10.useEffect)(() => (s10(i2), () => s10(null)), [i2, s10]);
  let T3 = (0, import_react10.useMemo)(() => ({ open: l6 === 0 }), [l6]);
  return C({ ourProps: { ref: a6, id: i2 }, theirProps: n4, slot: T3, defaultTag: Ve, name: "Dialog.Title" });
}
var ze = U(We);
var Qe = U(Je);
var Ze = U(Ke);
var et = U(Ye);
var tt = U(qe);
var _t = Object.assign(ze, { Backdrop: Qe, Panel: Ze, Overlay: et, Title: tt, Description: G });

export {
  _t
};
//# sourceMappingURL=/build/_shared/chunk-RGBYWDPK.js.map
