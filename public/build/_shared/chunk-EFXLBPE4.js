import {
  C,
  D,
  G,
  I,
  I2,
  M,
  O2 as O,
  T,
  U,
  _,
  d,
  f,
  h,
  l,
  l2,
  n,
  o,
  o2,
  o3,
  o4,
  p,
  r,
  s2 as s,
  s4 as s2,
  s5 as s3,
  t3 as t,
  u,
  u2,
  u3,
  v,
  w,
  x,
  y2 as y,
  y3 as y2
} from "/build/_shared/chunk-7ZNLIBJB.js";
import {
  Spinner
} from "/build/_shared/chunk-QKNDBCR7.js";
import {
  twMerge
} from "/build/_shared/chunk-B3ATQ6F7.js";
import {
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
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// node_modules/@headlessui/react/dist/components/transitions/transition.js
var import_react2 = __toESM(require_react(), 1);

// node_modules/@headlessui/react/dist/hooks/use-flags.js
var import_react = __toESM(require_react(), 1);
function c(a2 = 0) {
  let [l6, r2] = (0, import_react.useState)(a2), t3 = f(), o9 = (0, import_react.useCallback)((e) => {
    t3.current && r2((u7) => u7 | e);
  }, [l6, t3]), m4 = (0, import_react.useCallback)((e) => Boolean(l6 & e), [l6]), s5 = (0, import_react.useCallback)((e) => {
    t3.current && r2((u7) => u7 & ~e);
  }, [r2, t3]), g3 = (0, import_react.useCallback)((e) => {
    t3.current && r2((u7) => u7 ^ e);
  }, [r2]);
  return { flags: l6, addFlag: o9, hasFlag: m4, removeFlag: s5, toggleFlag: g3 };
}

// node_modules/@headlessui/react/dist/utils/once.js
function l3(r2) {
  let e = { called: false };
  return (...t3) => {
    if (!e.called)
      return e.called = true, r2(...t3);
  };
}

// node_modules/@headlessui/react/dist/components/transitions/utils/transition.js
function g(t3, ...e) {
  t3 && e.length > 0 && t3.classList.add(...e);
}
function v2(t3, ...e) {
  t3 && e.length > 0 && t3.classList.remove(...e);
}
function b(t3, e) {
  let n3 = o2();
  if (!t3)
    return n3.dispose;
  let { transitionDuration: m4, transitionDelay: a2 } = getComputedStyle(t3), [u7, p3] = [m4, a2].map((l6) => {
    let [r2 = 0] = l6.split(",").filter(Boolean).map((i2) => i2.includes("ms") ? parseFloat(i2) : parseFloat(i2) * 1e3).sort((i2, T4) => T4 - i2);
    return r2;
  }), o9 = u7 + p3;
  if (o9 !== 0) {
    n3.group((r2) => {
      r2.setTimeout(() => {
        e(), r2.dispose();
      }, o9), r2.addEventListener(t3, "transitionrun", (i2) => {
        i2.target === i2.currentTarget && r2.dispose();
      });
    });
    let l6 = n3.addEventListener(t3, "transitionend", (r2) => {
      r2.target === r2.currentTarget && (e(), l6());
    });
  } else
    e();
  return n3.add(() => e()), n3.dispose;
}
function M2(t3, e, n3, m4) {
  let a2 = n3 ? "enter" : "leave", u7 = o2(), p3 = m4 !== void 0 ? l3(m4) : () => {
  };
  a2 === "enter" && (t3.removeAttribute("hidden"), t3.style.display = "");
  let o9 = u(a2, { enter: () => e.enter, leave: () => e.leave }), l6 = u(a2, { enter: () => e.enterTo, leave: () => e.leaveTo }), r2 = u(a2, { enter: () => e.enterFrom, leave: () => e.leaveFrom });
  return v2(t3, ...e.base, ...e.enter, ...e.enterTo, ...e.enterFrom, ...e.leave, ...e.leaveFrom, ...e.leaveTo, ...e.entered), g(t3, ...e.base, ...o9, ...r2), u7.nextFrame(() => {
    v2(t3, ...e.base, ...o9, ...r2), g(t3, ...e.base, ...o9, ...l6), b(t3, () => (v2(t3, ...e.base, ...o9), g(t3, ...e.base, ...e.entered), p3()));
  }), u7.dispose;
}

// node_modules/@headlessui/react/dist/hooks/use-transition.js
function D2({ immediate: t3, container: s5, direction: n3, classes: u7, onStart: a2, onStop: c5 }) {
  let l6 = f(), d3 = p(), e = s(n3);
  l(() => {
    t3 && (e.current = "enter");
  }, [t3]), l(() => {
    let r2 = o2();
    d3.add(r2.dispose);
    let i2 = s5.current;
    if (i2 && e.current !== "idle" && l6.current)
      return r2.dispose(), a2.current(e.current), r2.add(M2(i2, u7.current, e.current === "enter", () => {
        r2.dispose(), c5.current(e.current);
      })), r2.dispose;
  }, [n3]);
}

// node_modules/@headlessui/react/dist/components/transitions/transition.js
function S(t3 = "") {
  return t3.split(/\s+/).filter((n3) => n3.length > 1);
}
var I3 = (0, import_react2.createContext)(null);
I3.displayName = "TransitionContext";
var Se = ((r2) => (r2.Visible = "visible", r2.Hidden = "hidden", r2))(Se || {});
function ye() {
  let t3 = (0, import_react2.useContext)(I3);
  if (t3 === null)
    throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return t3;
}
function xe() {
  let t3 = (0, import_react2.useContext)(M3);
  if (t3 === null)
    throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return t3;
}
var M3 = (0, import_react2.createContext)(null);
M3.displayName = "NestingContext";
function U2(t3) {
  return "children" in t3 ? U2(t3.children) : t3.current.filter(({ el: n3 }) => n3.current !== null).filter(({ state: n3 }) => n3 === "visible").length > 0;
}
function se(t3, n3) {
  let r2 = s(t3), s5 = (0, import_react2.useRef)([]), R = f(), D3 = p(), p3 = o((i2, e = v.Hidden) => {
    let a2 = s5.current.findIndex(({ el: o9 }) => o9 === i2);
    a2 !== -1 && (u(e, { [v.Unmount]() {
      s5.current.splice(a2, 1);
    }, [v.Hidden]() {
      s5.current[a2].state = "hidden";
    } }), D3.microTask(() => {
      var o9;
      !U2(s5) && R.current && ((o9 = r2.current) == null || o9.call(r2));
    }));
  }), x2 = o((i2) => {
    let e = s5.current.find(({ el: a2 }) => a2 === i2);
    return e ? e.state !== "visible" && (e.state = "visible") : s5.current.push({ el: i2, state: "visible" }), () => p3(i2, v.Unmount);
  }), h3 = (0, import_react2.useRef)([]), v5 = (0, import_react2.useRef)(Promise.resolve()), u7 = (0, import_react2.useRef)({ enter: [], leave: [], idle: [] }), g3 = o((i2, e, a2) => {
    h3.current.splice(0), n3 && (n3.chains.current[e] = n3.chains.current[e].filter(([o9]) => o9 !== i2)), n3 == null || n3.chains.current[e].push([i2, new Promise((o9) => {
      h3.current.push(o9);
    })]), n3 == null || n3.chains.current[e].push([i2, new Promise((o9) => {
      Promise.all(u7.current[e].map(([f6, N2]) => N2)).then(() => o9());
    })]), e === "enter" ? v5.current = v5.current.then(() => n3 == null ? void 0 : n3.wait.current).then(() => a2(e)) : a2(e);
  }), d3 = o((i2, e, a2) => {
    Promise.all(u7.current[e].splice(0).map(([o9, f6]) => f6)).then(() => {
      var o9;
      (o9 = h3.current.shift()) == null || o9();
    }).then(() => a2(e));
  });
  return (0, import_react2.useMemo)(() => ({ children: s5, register: x2, unregister: p3, onStart: g3, onStop: d3, wait: v5, chains: u7 }), [x2, p3, s5, g3, d3, u7, v5]);
}
function Ne() {
}
var Pe = ["beforeEnter", "afterEnter", "beforeLeave", "afterLeave"];
function ae(t3) {
  var r2;
  let n3 = {};
  for (let s5 of Pe)
    n3[s5] = (r2 = t3[s5]) != null ? r2 : Ne;
  return n3;
}
function Re(t3) {
  let n3 = (0, import_react2.useRef)(ae(t3));
  return (0, import_react2.useEffect)(() => {
    n3.current = ae(t3);
  }, [t3]), n3;
}
var De = "div";
var le = O.RenderStrategy;
function He(t3, n3) {
  var Q, Y;
  let { beforeEnter: r2, afterEnter: s5, beforeLeave: R, afterLeave: D3, enter: p3, enterFrom: x2, enterTo: h3, entered: v5, leave: u7, leaveFrom: g3, leaveTo: d3, ...i2 } = t3, e = (0, import_react2.useRef)(null), a2 = y2(e, n3), o9 = (Q = i2.unmount) == null || Q ? v.Unmount : v.Hidden, { show: f6, appear: N2, initial: T4 } = ye(), [l6, j] = (0, import_react2.useState)(f6 ? "visible" : "hidden"), z2 = xe(), { register: L2, unregister: O2 } = z2;
  (0, import_react2.useEffect)(() => L2(e), [L2, e]), (0, import_react2.useEffect)(() => {
    if (o9 === v.Hidden && e.current) {
      if (f6 && l6 !== "visible") {
        j("visible");
        return;
      }
      return u(l6, { ["hidden"]: () => O2(e), ["visible"]: () => L2(e) });
    }
  }, [l6, e, L2, O2, f6, o9]);
  let k = s({ base: S(i2.className), enter: S(p3), enterFrom: S(x2), enterTo: S(h3), entered: S(v5), leave: S(u7), leaveFrom: S(g3), leaveTo: S(d3) }), V = Re({ beforeEnter: r2, afterEnter: s5, beforeLeave: R, afterLeave: D3 }), G3 = l2();
  (0, import_react2.useEffect)(() => {
    if (G3 && l6 === "visible" && e.current === null)
      throw new Error("Did you forget to passthrough the `ref` to the actual DOM node?");
  }, [e, l6, G3]);
  let Te2 = T4 && !N2, K2 = N2 && f6 && T4, de2 = (() => !G3 || Te2 ? "idle" : f6 ? "enter" : "leave")(), H3 = c(0), fe2 = o((C3) => u(C3, { enter: () => {
    H3.addFlag(d.Opening), V.current.beforeEnter();
  }, leave: () => {
    H3.addFlag(d.Closing), V.current.beforeLeave();
  }, idle: () => {
  } })), me2 = o((C3) => u(C3, { enter: () => {
    H3.removeFlag(d.Opening), V.current.afterEnter();
  }, leave: () => {
    H3.removeFlag(d.Closing), V.current.afterLeave();
  }, idle: () => {
  } })), w3 = se(() => {
    j("hidden"), O2(e);
  }, z2), B2 = (0, import_react2.useRef)(false);
  D2({ immediate: K2, container: e, classes: k, direction: de2, onStart: s((C3) => {
    B2.current = true, w3.onStart(e, C3, fe2);
  }), onStop: s((C3) => {
    B2.current = false, w3.onStop(e, C3, me2), C3 === "leave" && !U2(w3) && (j("hidden"), O2(e));
  }) });
  let P2 = i2, ce = { ref: a2 };
  return K2 ? P2 = { ...P2, className: t(i2.className, ...k.current.enter, ...k.current.enterFrom) } : B2.current && (P2.className = t(i2.className, (Y = e.current) == null ? void 0 : Y.className), P2.className === "" && delete P2.className), import_react2.default.createElement(M3.Provider, { value: w3 }, import_react2.default.createElement(s3, { value: u(l6, { ["visible"]: d.Open, ["hidden"]: d.Closed }) | H3.flags }, C({ ourProps: ce, theirProps: P2, defaultTag: De, features: le, visible: l6 === "visible", name: "Transition.Child" })));
}
function Fe(t3, n3) {
  let { show: r2, appear: s5 = false, unmount: R = true, ...D3 } = t3, p3 = (0, import_react2.useRef)(null), x2 = y2(p3, n3);
  l2();
  let h3 = u3();
  if (r2 === void 0 && h3 !== null && (r2 = (h3 & d.Open) === d.Open), ![true, false].includes(r2))
    throw new Error("A <Transition /> is used but it is missing a `show={true | false}` prop.");
  let [v5, u7] = (0, import_react2.useState)(r2 ? "visible" : "hidden"), g3 = se(() => {
    u7("hidden");
  }), [d3, i2] = (0, import_react2.useState)(true), e = (0, import_react2.useRef)([r2]);
  l(() => {
    d3 !== false && e.current[e.current.length - 1] !== r2 && (e.current.push(r2), i2(false));
  }, [e, r2]);
  let a2 = (0, import_react2.useMemo)(() => ({ show: r2, appear: s5, initial: d3 }), [r2, s5, d3]);
  (0, import_react2.useEffect)(() => {
    if (r2)
      u7("visible");
    else if (!U2(g3))
      u7("hidden");
    else {
      let T4 = p3.current;
      if (!T4)
        return;
      let l6 = T4.getBoundingClientRect();
      l6.x === 0 && l6.y === 0 && l6.width === 0 && l6.height === 0 && u7("hidden");
    }
  }, [r2, g3]);
  let o9 = { unmount: R }, f6 = o(() => {
    var T4;
    d3 && i2(false), (T4 = t3.beforeEnter) == null || T4.call(t3);
  }), N2 = o(() => {
    var T4;
    d3 && i2(false), (T4 = t3.beforeLeave) == null || T4.call(t3);
  });
  return import_react2.default.createElement(M3.Provider, { value: g3 }, import_react2.default.createElement(I3.Provider, { value: a2 }, C({ ourProps: { ...o9, as: import_react2.Fragment, children: import_react2.default.createElement(ue, { ref: x2, ...o9, ...D3, beforeEnter: f6, beforeLeave: N2 }) }, theirProps: {}, defaultTag: import_react2.Fragment, features: le, visible: v5 === "visible", name: "Transition" })));
}
function _e(t3, n3) {
  let r2 = (0, import_react2.useContext)(I3) !== null, s5 = u3() !== null;
  return import_react2.default.createElement(import_react2.default.Fragment, null, !r2 && s5 ? import_react2.default.createElement(q, { ref: n3, ...t3 }) : import_react2.default.createElement(ue, { ref: n3, ...t3 }));
}
var q = U(Fe);
var ue = U(He);
var Le = U(_e);
var qe = Object.assign(q, { Child: Le, Root: q });

// app/components/Switch.tsx
var import_react11 = __toESM(require_react());

// node_modules/@headlessui/react/dist/hooks/use-controllable.js
var import_react3 = __toESM(require_react(), 1);
function T2(l6, r2, c5) {
  let [i2, s5] = (0, import_react3.useState)(c5), e = l6 !== void 0, t3 = (0, import_react3.useRef)(e), u7 = (0, import_react3.useRef)(false), d3 = (0, import_react3.useRef)(false);
  return e && !t3.current && !u7.current ? (u7.current = true, t3.current = e, console.error("A component is changing from uncontrolled to controlled. This may be caused by the value changing from undefined to a defined value, which should not happen.")) : !e && t3.current && !d3.current && (d3.current = true, t3.current = e, console.error("A component is changing from controlled to uncontrolled. This may be caused by the value changing from a defined value to undefined, which should not happen.")), [e ? l6 : i2, o((n3) => (e || s5(n3), r2 == null ? void 0 : r2(n3)))];
}

// node_modules/@headlessui/react/dist/hooks/use-resolve-button-type.js
var import_react4 = __toESM(require_react(), 1);
function i(t3) {
  var n3;
  if (t3.type)
    return t3.type;
  let e = (n3 = t3.as) != null ? n3 : "button";
  if (typeof e == "string" && e.toLowerCase() === "button")
    return "button";
}
function T3(t3, e) {
  let [n3, u7] = (0, import_react4.useState)(() => i(t3));
  return l(() => {
    u7(i(t3));
  }, [t3.type, t3.as]), l(() => {
    n3 || e.current && e.current instanceof HTMLButtonElement && !e.current.hasAttribute("type") && u7("button");
  }, [n3, e]), n3;
}

// node_modules/@headlessui/react/dist/hooks/use-tracked-pointer.js
var import_react5 = __toESM(require_react(), 1);
function t2(e) {
  return [e.screenX, e.screenY];
}
function u4() {
  let e = (0, import_react5.useRef)([-1, -1]);
  return { wasMoved(r2) {
    let n3 = t2(r2);
    return e.current[0] === n3[0] && e.current[1] === n3[1] ? false : (e.current = n3, true);
  }, update(r2) {
    e.current = t2(r2);
  } };
}

// node_modules/@headlessui/react/dist/hooks/use-tree-walker.js
var import_react6 = __toESM(require_react(), 1);
function F2({ container: e, accept: t3, walk: r2, enabled: c5 = true }) {
  let o9 = (0, import_react6.useRef)(t3), l6 = (0, import_react6.useRef)(r2);
  (0, import_react6.useEffect)(() => {
    o9.current = t3, l6.current = r2;
  }, [t3, r2]), l(() => {
    if (!e || !c5)
      return;
    let n3 = o3(e);
    if (!n3)
      return;
    let f6 = o9.current, p3 = l6.current, d3 = Object.assign((i2) => f6(i2), { acceptNode: f6 }), u7 = n3.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, d3, false);
    for (; u7.nextNode(); )
      p3(u7.currentNode);
  }, [e, c5, o9, l6]);
}

// node_modules/@headlessui/react/dist/utils/calculate-active-index.js
function u5(l6) {
  throw new Error("Unexpected object: " + l6);
}
var c3 = ((i2) => (i2[i2.First = 0] = "First", i2[i2.Previous = 1] = "Previous", i2[i2.Next = 2] = "Next", i2[i2.Last = 3] = "Last", i2[i2.Specific = 4] = "Specific", i2[i2.Nothing = 5] = "Nothing", i2))(c3 || {});
function f4(l6, n3) {
  let t3 = n3.resolveItems();
  if (t3.length <= 0)
    return null;
  let r2 = n3.resolveActiveIndex(), s5 = r2 != null ? r2 : -1;
  switch (l6.focus) {
    case 0: {
      for (let e = 0; e < t3.length; ++e)
        if (!n3.resolveDisabled(t3[e], e, t3))
          return e;
      return r2;
    }
    case 1: {
      for (let e = s5 - 1; e >= 0; --e)
        if (!n3.resolveDisabled(t3[e], e, t3))
          return e;
      return r2;
    }
    case 2: {
      for (let e = s5 + 1; e < t3.length; ++e)
        if (!n3.resolveDisabled(t3[e], e, t3))
          return e;
      return r2;
    }
    case 3: {
      for (let e = t3.length - 1; e >= 0; --e)
        if (!n3.resolveDisabled(t3[e], e, t3))
          return e;
      return r2;
    }
    case 4: {
      for (let e = 0; e < t3.length; ++e)
        if (n3.resolveId(t3[e], e, t3) === l6.id)
          return e;
      return r2;
    }
    case 5:
      return null;
    default:
      u5(l6);
  }
}

// node_modules/@headlessui/react/dist/utils/form.js
function p2(i2) {
  var t3, r2;
  let s5 = (t3 = i2 == null ? void 0 : i2.form) != null ? t3 : i2.closest("form");
  if (s5) {
    for (let n3 of s5.elements)
      if (n3 !== i2 && (n3.tagName === "INPUT" && n3.type === "submit" || n3.tagName === "BUTTON" && n3.type === "submit" || n3.nodeName === "INPUT" && n3.type === "image")) {
        n3.click();
        return;
      }
    (r2 = s5.requestSubmit) == null || r2.call(s5);
  }
}

// node_modules/@headlessui/react/dist/hooks/use-text-value.js
var import_react7 = __toESM(require_react(), 1);

// node_modules/@headlessui/react/dist/utils/get-text-value.js
var a = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;
function o8(e) {
  var r2, i2;
  let n3 = (r2 = e.innerText) != null ? r2 : "", t3 = e.cloneNode(true);
  if (!(t3 instanceof HTMLElement))
    return n3;
  let u7 = false;
  for (let f6 of t3.querySelectorAll('[hidden],[aria-hidden],[role="img"]'))
    f6.remove(), u7 = true;
  let l6 = u7 ? (i2 = t3.innerText) != null ? i2 : "" : n3;
  return a.test(l6) && (l6 = l6.replace(a, "")), l6;
}
function g2(e) {
  let n3 = e.getAttribute("aria-label");
  if (typeof n3 == "string")
    return n3.trim();
  let t3 = e.getAttribute("aria-labelledby");
  if (t3) {
    let u7 = t3.split(" ").map((l6) => {
      let r2 = document.getElementById(l6);
      if (r2) {
        let i2 = r2.getAttribute("aria-label");
        return typeof i2 == "string" ? i2.trim() : o8(r2).trim();
      }
      return null;
    }).filter(Boolean);
    if (u7.length > 0)
      return u7.join(", ");
  }
  return o8(e).trim();
}

// node_modules/@headlessui/react/dist/hooks/use-text-value.js
function s4(c5) {
  let t3 = (0, import_react7.useRef)(""), r2 = (0, import_react7.useRef)("");
  return o(() => {
    let e = c5.current;
    if (!e)
      return "";
    let u7 = e.innerText;
    if (t3.current === u7)
      return r2.current;
    let n3 = g2(e).trim().toLowerCase();
    return t3.current = u7, r2.current = n3, n3;
  });
}

// node_modules/@headlessui/react/dist/components/menu/menu.js
var import_react8 = __toESM(require_react(), 1);
var me = ((r2) => (r2[r2.Open = 0] = "Open", r2[r2.Closed = 1] = "Closed", r2))(me || {});
var de = ((r2) => (r2[r2.Pointer = 0] = "Pointer", r2[r2.Other = 1] = "Other", r2))(de || {});
var fe = ((a2) => (a2[a2.OpenMenu = 0] = "OpenMenu", a2[a2.CloseMenu = 1] = "CloseMenu", a2[a2.GoToItem = 2] = "GoToItem", a2[a2.Search = 3] = "Search", a2[a2.ClearSearch = 4] = "ClearSearch", a2[a2.RegisterItem = 5] = "RegisterItem", a2[a2.UnregisterItem = 6] = "UnregisterItem", a2))(fe || {});
function w2(e, u7 = (r2) => r2) {
  let r2 = e.activeItemIndex !== null ? e.items[e.activeItemIndex] : null, s5 = I2(u7(e.items.slice()), (t3) => t3.dataRef.current.domRef.current), i2 = r2 ? s5.indexOf(r2) : null;
  return i2 === -1 && (i2 = null), { items: s5, activeItemIndex: i2 };
}
var Te = { [1](e) {
  return e.menuState === 1 ? e : { ...e, activeItemIndex: null, menuState: 1 };
}, [0](e) {
  return e.menuState === 0 ? e : { ...e, __demoMode: false, menuState: 0 };
}, [2]: (e, u7) => {
  var i2;
  let r2 = w2(e), s5 = f4(u7, { resolveItems: () => r2.items, resolveActiveIndex: () => r2.activeItemIndex, resolveId: (t3) => t3.id, resolveDisabled: (t3) => t3.dataRef.current.disabled });
  return { ...e, ...r2, searchQuery: "", activeItemIndex: s5, activationTrigger: (i2 = u7.trigger) != null ? i2 : 1 };
}, [3]: (e, u7) => {
  let s5 = e.searchQuery !== "" ? 0 : 1, i2 = e.searchQuery + u7.value.toLowerCase(), o9 = (e.activeItemIndex !== null ? e.items.slice(e.activeItemIndex + s5).concat(e.items.slice(0, e.activeItemIndex + s5)) : e.items).find((l6) => {
    var m4;
    return ((m4 = l6.dataRef.current.textValue) == null ? void 0 : m4.startsWith(i2)) && !l6.dataRef.current.disabled;
  }), a2 = o9 ? e.items.indexOf(o9) : -1;
  return a2 === -1 || a2 === e.activeItemIndex ? { ...e, searchQuery: i2 } : { ...e, searchQuery: i2, activeItemIndex: a2, activationTrigger: 1 };
}, [4](e) {
  return e.searchQuery === "" ? e : { ...e, searchQuery: "", searchActiveItemIndex: null };
}, [5]: (e, u7) => {
  let r2 = w2(e, (s5) => [...s5, { id: u7.id, dataRef: u7.dataRef }]);
  return { ...e, ...r2 };
}, [6]: (e, u7) => {
  let r2 = w2(e, (s5) => {
    let i2 = s5.findIndex((t3) => t3.id === u7.id);
    return i2 !== -1 && s5.splice(i2, 1), s5;
  });
  return { ...e, ...r2, activationTrigger: 1 };
} };
var U3 = (0, import_react8.createContext)(null);
U3.displayName = "MenuContext";
function C2(e) {
  let u7 = (0, import_react8.useContext)(U3);
  if (u7 === null) {
    let r2 = new Error(`<${e} /> is missing a parent <Menu /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(r2, C2), r2;
  }
  return u7;
}
function ye2(e, u7) {
  return u(u7.type, Te, e, u7);
}
var Ie = import_react8.Fragment;
function Me(e, u7) {
  let { __demoMode: r2 = false, ...s5 } = e, i2 = (0, import_react8.useReducer)(ye2, { __demoMode: r2, menuState: r2 ? 0 : 1, buttonRef: (0, import_react8.createRef)(), itemsRef: (0, import_react8.createRef)(), items: [], searchQuery: "", activeItemIndex: null, activationTrigger: 1 }), [{ menuState: t3, itemsRef: o9, buttonRef: a2 }, l6] = i2, m4 = y2(u7);
  y([a2, o9], (g3, R) => {
    var p3;
    l6({ type: 1 }), h(R, T.Loose) || (g3.preventDefault(), (p3 = a2.current) == null || p3.focus());
  }, t3 === 0);
  let I5 = o(() => {
    l6({ type: 1 });
  }), A3 = (0, import_react8.useMemo)(() => ({ open: t3 === 0, close: I5 }), [t3, I5]), f6 = { ref: m4 };
  return import_react8.default.createElement(U3.Provider, { value: i2 }, import_react8.default.createElement(s3, { value: u(t3, { [0]: d.Open, [1]: d.Closed }) }, C({ ourProps: f6, theirProps: s5, slot: A3, defaultTag: Ie, name: "Menu" })));
}
var ge = "button";
function Re2(e, u7) {
  var R;
  let r2 = I(), { id: s5 = `headlessui-menu-button-${r2}`, ...i2 } = e, [t3, o9] = C2("Menu.Button"), a2 = y2(t3.buttonRef, u7), l6 = p(), m4 = o((p3) => {
    switch (p3.key) {
      case o4.Space:
      case o4.Enter:
      case o4.ArrowDown:
        p3.preventDefault(), p3.stopPropagation(), o9({ type: 0 }), l6.nextFrame(() => o9({ type: 2, focus: c3.First }));
        break;
      case o4.ArrowUp:
        p3.preventDefault(), p3.stopPropagation(), o9({ type: 0 }), l6.nextFrame(() => o9({ type: 2, focus: c3.Last }));
        break;
    }
  }), I5 = o((p3) => {
    switch (p3.key) {
      case o4.Space:
        p3.preventDefault();
        break;
    }
  }), A3 = o((p3) => {
    if (r(p3.currentTarget))
      return p3.preventDefault();
    e.disabled || (t3.menuState === 0 ? (o9({ type: 1 }), l6.nextFrame(() => {
      var M5;
      return (M5 = t3.buttonRef.current) == null ? void 0 : M5.focus({ preventScroll: true });
    })) : (p3.preventDefault(), o9({ type: 0 })));
  }), f6 = (0, import_react8.useMemo)(() => ({ open: t3.menuState === 0 }), [t3]), g3 = { ref: a2, id: s5, type: T3(e, t3.buttonRef), "aria-haspopup": "menu", "aria-controls": (R = t3.itemsRef.current) == null ? void 0 : R.id, "aria-expanded": t3.menuState === 0, onKeyDown: m4, onKeyUp: I5, onClick: A3 };
  return C({ ourProps: g3, theirProps: i2, slot: f6, defaultTag: ge, name: "Menu.Button" });
}
var Ae = "div";
var be = O.RenderStrategy | O.Static;
function Ee(e, u7) {
  var M5, b3;
  let r2 = I(), { id: s5 = `headlessui-menu-items-${r2}`, ...i2 } = e, [t3, o9] = C2("Menu.Items"), a2 = y2(t3.itemsRef, u7), l6 = n(t3.itemsRef), m4 = p(), I5 = u3(), A3 = (() => I5 !== null ? (I5 & d.Open) === d.Open : t3.menuState === 0)();
  (0, import_react8.useEffect)(() => {
    let n3 = t3.itemsRef.current;
    n3 && t3.menuState === 0 && n3 !== (l6 == null ? void 0 : l6.activeElement) && n3.focus({ preventScroll: true });
  }, [t3.menuState, t3.itemsRef, l6]), F2({ container: t3.itemsRef.current, enabled: t3.menuState === 0, accept(n3) {
    return n3.getAttribute("role") === "menuitem" ? NodeFilter.FILTER_REJECT : n3.hasAttribute("role") ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
  }, walk(n3) {
    n3.setAttribute("role", "none");
  } });
  let f6 = o((n3) => {
    var E2, x2;
    switch (m4.dispose(), n3.key) {
      case o4.Space:
        if (t3.searchQuery !== "")
          return n3.preventDefault(), n3.stopPropagation(), o9({ type: 3, value: n3.key });
      case o4.Enter:
        if (n3.preventDefault(), n3.stopPropagation(), o9({ type: 1 }), t3.activeItemIndex !== null) {
          let { dataRef: S3 } = t3.items[t3.activeItemIndex];
          (x2 = (E2 = S3.current) == null ? void 0 : E2.domRef.current) == null || x2.click();
        }
        D(t3.buttonRef.current);
        break;
      case o4.ArrowDown:
        return n3.preventDefault(), n3.stopPropagation(), o9({ type: 2, focus: c3.Next });
      case o4.ArrowUp:
        return n3.preventDefault(), n3.stopPropagation(), o9({ type: 2, focus: c3.Previous });
      case o4.Home:
      case o4.PageUp:
        return n3.preventDefault(), n3.stopPropagation(), o9({ type: 2, focus: c3.First });
      case o4.End:
      case o4.PageDown:
        return n3.preventDefault(), n3.stopPropagation(), o9({ type: 2, focus: c3.Last });
      case o4.Escape:
        n3.preventDefault(), n3.stopPropagation(), o9({ type: 1 }), o2().nextFrame(() => {
          var S3;
          return (S3 = t3.buttonRef.current) == null ? void 0 : S3.focus({ preventScroll: true });
        });
        break;
      case o4.Tab:
        n3.preventDefault(), n3.stopPropagation(), o9({ type: 1 }), o2().nextFrame(() => {
          _(t3.buttonRef.current, n3.shiftKey ? M.Previous : M.Next);
        });
        break;
      default:
        n3.key.length === 1 && (o9({ type: 3, value: n3.key }), m4.setTimeout(() => o9({ type: 4 }), 350));
        break;
    }
  }), g3 = o((n3) => {
    switch (n3.key) {
      case o4.Space:
        n3.preventDefault();
        break;
    }
  }), R = (0, import_react8.useMemo)(() => ({ open: t3.menuState === 0 }), [t3]), p3 = { "aria-activedescendant": t3.activeItemIndex === null || (M5 = t3.items[t3.activeItemIndex]) == null ? void 0 : M5.id, "aria-labelledby": (b3 = t3.buttonRef.current) == null ? void 0 : b3.id, id: s5, onKeyDown: f6, onKeyUp: g3, role: "menu", tabIndex: 0, ref: a2 };
  return C({ ourProps: p3, theirProps: i2, slot: R, defaultTag: Ae, features: be, visible: A3, name: "Menu.Items" });
}
var Se2 = import_react8.Fragment;
function xe2(e, u7) {
  let r2 = I(), { id: s5 = `headlessui-menu-item-${r2}`, disabled: i2 = false, ...t3 } = e, [o9, a2] = C2("Menu.Item"), l6 = o9.activeItemIndex !== null ? o9.items[o9.activeItemIndex].id === s5 : false, m4 = (0, import_react8.useRef)(null), I5 = y2(u7, m4);
  l(() => {
    if (o9.__demoMode || o9.menuState !== 0 || !l6 || o9.activationTrigger === 0)
      return;
    let T4 = o2();
    return T4.requestAnimationFrame(() => {
      var P2, B2;
      (B2 = (P2 = m4.current) == null ? void 0 : P2.scrollIntoView) == null || B2.call(P2, { block: "nearest" });
    }), T4.dispose;
  }, [o9.__demoMode, m4, l6, o9.menuState, o9.activationTrigger, o9.activeItemIndex]);
  let A3 = s4(m4), f6 = (0, import_react8.useRef)({ disabled: i2, domRef: m4, get textValue() {
    return A3();
  } });
  l(() => {
    f6.current.disabled = i2;
  }, [f6, i2]), l(() => (a2({ type: 5, id: s5, dataRef: f6 }), () => a2({ type: 6, id: s5 })), [f6, s5]);
  let g3 = o(() => {
    a2({ type: 1 });
  }), R = o((T4) => {
    if (i2)
      return T4.preventDefault();
    a2({ type: 1 }), D(o9.buttonRef.current);
  }), p3 = o(() => {
    if (i2)
      return a2({ type: 2, focus: c3.Nothing });
    a2({ type: 2, focus: c3.Specific, id: s5 });
  }), M5 = u4(), b3 = o((T4) => M5.update(T4)), n3 = o((T4) => {
    M5.wasMoved(T4) && (i2 || l6 || a2({ type: 2, focus: c3.Specific, id: s5, trigger: 0 }));
  }), E2 = o((T4) => {
    M5.wasMoved(T4) && (i2 || l6 && a2({ type: 2, focus: c3.Nothing }));
  }), x2 = (0, import_react8.useMemo)(() => ({ active: l6, disabled: i2, close: g3 }), [l6, i2, g3]);
  return C({ ourProps: { id: s5, ref: I5, role: "menuitem", tabIndex: i2 === true ? void 0 : -1, "aria-disabled": i2 === true ? true : void 0, disabled: void 0, onClick: R, onFocus: p3, onPointerEnter: b3, onMouseEnter: b3, onPointerMove: n3, onMouseMove: n3, onPointerLeave: E2, onMouseLeave: E2 }, theirProps: t3, slot: x2, defaultTag: Se2, name: "Menu.Item" });
}
var Pe2 = U(Me);
var ve = U(Re2);
var he = U(Ee);
var De2 = U(xe2);
var qe2 = Object.assign(Pe2, { Button: ve, Items: he, Item: De2 });

// node_modules/@headlessui/react/dist/components/label/label.js
var import_react9 = __toESM(require_react(), 1);
var d2 = (0, import_react9.createContext)(null);
function u6() {
  let a2 = (0, import_react9.useContext)(d2);
  if (a2 === null) {
    let t3 = new Error("You used a <Label /> component, but it is not inside a relevant parent.");
    throw Error.captureStackTrace && Error.captureStackTrace(t3, u6), t3;
  }
  return a2;
}
function F3() {
  let [a2, t3] = (0, import_react9.useState)([]);
  return [a2.length > 0 ? a2.join(" ") : void 0, (0, import_react9.useMemo)(() => function(e) {
    let s5 = o((r2) => (t3((l6) => [...l6, r2]), () => t3((l6) => {
      let n3 = l6.slice(), p3 = n3.indexOf(r2);
      return p3 !== -1 && n3.splice(p3, 1), n3;
    }))), o9 = (0, import_react9.useMemo)(() => ({ register: s5, slot: e.slot, name: e.name, props: e.props }), [s5, e.slot, e.name, e.props]);
    return import_react9.default.createElement(d2.Provider, { value: o9 }, e.children);
  }, [t3])];
}
var A = "label";
function h2(a2, t3) {
  let i2 = I(), { id: e = `headlessui-label-${i2}`, passive: s5 = false, ...o9 } = a2, r2 = u6(), l6 = y2(t3);
  l(() => r2.register(e), [e, r2.register]);
  let n3 = { ref: l6, ...r2.props, id: e };
  return s5 && ("onClick" in n3 && (delete n3.htmlFor, delete n3.onClick), "onClick" in o9 && delete o9.onClick), C({ ourProps: n3, theirProps: o9, slot: r2.slot || {}, defaultTag: A, name: r2.name || "Label" });
}
var v4 = U(h2);
var B = Object.assign(v4, {});

// node_modules/@headlessui/react/dist/components/switch/switch.js
var import_react10 = __toESM(require_react(), 1);
var S2 = (0, import_react10.createContext)(null);
S2.displayName = "GroupContext";
var ee2 = import_react10.Fragment;
function te(r2) {
  var u7;
  let [n3, p3] = (0, import_react10.useState)(null), [c5, T4] = F3(), [o9, b3] = w(), a2 = (0, import_react10.useMemo)(() => ({ switch: n3, setSwitch: p3, labelledby: c5, describedby: o9 }), [n3, p3, c5, o9]), d3 = {}, y3 = r2;
  return import_react10.default.createElement(b3, { name: "Switch.Description" }, import_react10.default.createElement(T4, { name: "Switch.Label", props: { htmlFor: (u7 = a2.switch) == null ? void 0 : u7.id, onClick(m4) {
    n3 && (m4.currentTarget.tagName === "LABEL" && m4.preventDefault(), n3.click(), n3.focus({ preventScroll: true }));
  } } }, import_react10.default.createElement(S2.Provider, { value: a2 }, C({ ourProps: d3, theirProps: y3, defaultTag: ee2, name: "Switch.Group" }))));
}
var ne = "button";
function re(r2, n3) {
  var E2;
  let p3 = I(), { id: c5 = `headlessui-switch-${p3}`, checked: T4, defaultChecked: o9 = false, onChange: b3, disabled: a2 = false, name: d3, value: y3, form: u7, ...m4 } = r2, t3 = (0, import_react10.useContext)(S2), f6 = (0, import_react10.useRef)(null), C3 = y2(f6, n3, t3 === null ? null : t3.setSwitch), [i2, s5] = T2(T4, b3, o9), w3 = o(() => s5 == null ? void 0 : s5(!i2)), L2 = o((e) => {
    if (r(e.currentTarget))
      return e.preventDefault();
    e.preventDefault(), w3();
  }), x2 = o((e) => {
    e.key === o4.Space ? (e.preventDefault(), w3()) : e.key === o4.Enter && p2(e.currentTarget);
  }), v5 = o((e) => e.preventDefault()), G3 = (0, import_react10.useMemo)(() => ({ checked: i2 }), [i2]), R = { id: c5, ref: C3, role: "switch", type: T3(r2, f6), tabIndex: r2.tabIndex === -1 ? 0 : (E2 = r2.tabIndex) != null ? E2 : 0, "aria-checked": i2, "aria-labelledby": t3 == null ? void 0 : t3.labelledby, "aria-describedby": t3 == null ? void 0 : t3.describedby, disabled: a2, onClick: L2, onKeyUp: x2, onKeyPress: v5 }, k = p();
  return (0, import_react10.useEffect)(() => {
    var _2;
    let e = (_2 = f6.current) == null ? void 0 : _2.closest("form");
    e && o9 !== void 0 && k.addEventListener(e, "reset", () => {
      s5(o9);
    });
  }, [f6, s5]), import_react10.default.createElement(import_react10.default.Fragment, null, d3 != null && i2 && import_react10.default.createElement(u2, { features: s2.Hidden, ...x({ as: "input", type: "checkbox", hidden: true, readOnly: true, disabled: a2, form: u7, checked: i2, name: d3, value: y3 }) }), C({ ourProps: R, theirProps: m4, slot: G3, defaultTag: ne, name: "Switch" }));
}
var oe = U(re);
var ie = te;
var _e2 = Object.assign(oe, { Group: ie, Label: B, Description: G });

// app/components/Switch.tsx
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/Switch.tsx"' + id);
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
    "app/components/Switch.tsx"
  );
  import.meta.hot.lastModified = "1733871814487.1045";
}
var Toggle = ({
  className,
  isDisabled,
  onChange,
  defaultValue = false,
  name
}) => {
  _s();
  const [enabled, setEnabled] = (0, import_react11.useState)(defaultValue);
  const handleChange = (value) => {
    setEnabled(value);
    onChange == null ? void 0 : onChange(value);
  };
  const isActive = isDisabled ? false : enabled;
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(_e2, { checked: isActive, onChange: isDisabled ? void 0 : handleChange, className: twMerge(`${isActive ? "bg-brand-500" : " dark:bg-[#22232A] bg-[#EFEFF0]"} relative inline-flex h-6 w-11 items-center rounded-full ${isDisabled ? "bg-gray-400 cursor-not-allowed" : ""}`, "min-w-[44px]", className != null ? className : ""), children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "sr-only", children: "Enable notifications" }, void 0, false, {
      fileName: "app/components/Switch.tsx",
      lineNumber: 49,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: `${isActive ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-clear transition` }, void 0, false, {
      fileName: "app/components/Switch.tsx",
      lineNumber: 50,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", { className: "hidden", name: name || "unamed_switch", type: "checkbox", hidden: true, checked: isActive, readOnly: true }, void 0, false, {
      fileName: "app/components/Switch.tsx",
      lineNumber: 51,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/Switch.tsx",
    lineNumber: 48,
    columnNumber: 10
  }, this);
};
_s(Toggle, "u4W0cRSVw6f0HFBK6ylwIGOdQjc=");
_c = Toggle;
function SimpleSwitch({
  defaultValue = false,
  isDisabled
}) {
  _s2();
  const [enabled, setEnabled] = (0, import_react11.useState)(defaultValue);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(_e2, { disabled: isDisabled, checked: enabled, onChange: setEnabled, className: twMerge(`dark:bg-[#0D0E13] bg-space-200 relative inline-flex h-8 w-[52px] items-center rounded-full`, isDisabled && "bg-space-300 cursor-not-allowed", enabled && "bg-indigo-100"), children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: twMerge(enabled ? "translate-x-6" : "translate-x-1", isDisabled && "bg-space-200", `inline-block h-6 w-6 transform rounded-full transition dark:bg-gray-400 bg-brand-500 `) }, void 0, false, {
    fileName: "app/components/Switch.tsx",
    lineNumber: 65,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/Switch.tsx",
    lineNumber: 64,
    columnNumber: 10
  }, this);
}
_s2(SimpleSwitch, "u4W0cRSVw6f0HFBK6ylwIGOdQjc=");
_c2 = SimpleSwitch;
function ToggleButton({
  onChange,
  theme
}) {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(_e2, { checked: theme === "dark", onChange, className: `dark:bg-hole bg-space-200 relative inline-flex h-8 w-[52px] items-center rounded-full`, children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "sr-only", children: "Enable notifications" }, void 0, false, {
      fileName: "app/components/Switch.tsx",
      lineNumber: 75,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: `dark:bg-[url('/assets/moons.svg')] dark:translate-x-6 translate-x-1 bg-cover bg-[url('/assets/sun.svg')] inline-block h-6 w-6 transform rounded-full  transition dark:bg-hole bg-space-200` }, void 0, false, {
      fileName: "app/components/Switch.tsx",
      lineNumber: 77,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/Switch.tsx",
    lineNumber: 74,
    columnNumber: 10
  }, this);
}
_c3 = ToggleButton;
var _c;
var _c2;
var _c3;
$RefreshReg$(_c, "Toggle");
$RefreshReg$(_c2, "SimpleSwitch");
$RefreshReg$(_c3, "ToggleButton");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// node_modules/react-icons/lib/esm/iconBase.js
var import_react14 = __toESM(require_react());

// node_modules/react-icons/lib/esm/iconContext.js
var import_react13 = __toESM(require_react());
var DefaultContext = {
  color: void 0,
  size: void 0,
  className: void 0,
  style: void 0,
  attr: void 0
};
var IconContext = import_react13.default.createContext && import_react13.default.createContext(DefaultContext);

// node_modules/react-icons/lib/esm/iconBase.js
var __assign = function() {
  __assign = Object.assign || function(t3) {
    for (var s5, i2 = 1, n3 = arguments.length; i2 < n3; i2++) {
      s5 = arguments[i2];
      for (var p3 in s5)
        if (Object.prototype.hasOwnProperty.call(s5, p3))
          t3[p3] = s5[p3];
    }
    return t3;
  };
  return __assign.apply(this, arguments);
};
var __rest = function(s5, e) {
  var t3 = {};
  for (var p3 in s5)
    if (Object.prototype.hasOwnProperty.call(s5, p3) && e.indexOf(p3) < 0)
      t3[p3] = s5[p3];
  if (s5 != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i2 = 0, p3 = Object.getOwnPropertySymbols(s5); i2 < p3.length; i2++) {
      if (e.indexOf(p3[i2]) < 0 && Object.prototype.propertyIsEnumerable.call(s5, p3[i2]))
        t3[p3[i2]] = s5[p3[i2]];
    }
  return t3;
};
function Tree2Element(tree) {
  return tree && tree.map(function(node, i2) {
    return import_react14.default.createElement(node.tag, __assign({
      key: i2
    }, node.attr), Tree2Element(node.child));
  });
}
function GenIcon(data) {
  return function(props) {
    return import_react14.default.createElement(IconBase, __assign({
      attr: __assign({}, data.attr)
    }, props), Tree2Element(data.child));
  };
}
function IconBase(props) {
  var elem = function(conf) {
    var attr = props.attr, size = props.size, title = props.title, svgProps = __rest(props, ["attr", "size", "title"]);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className)
      className = conf.className;
    if (props.className)
      className = (className ? className + " " : "") + props.className;
    return import_react14.default.createElement("svg", __assign({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className,
      style: __assign(__assign({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && import_react14.default.createElement("title", null, title), props.children);
  };
  return IconContext !== void 0 ? import_react14.default.createElement(IconContext.Consumer, null, function(conf) {
    return elem(conf);
  }) : elem(DefaultContext);
}

// node_modules/react-icons/ai/index.esm.js
function AiFillInstagram(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 1024 1024" }, "child": [{ "tag": "path", "attr": { "d": "M512 378.7c-73.4 0-133.3 59.9-133.3 133.3S438.6 645.3 512 645.3 645.3 585.4 645.3 512 585.4 378.7 512 378.7zM911.8 512c0-55.2.5-109.9-2.6-165-3.1-64-17.7-120.8-64.5-167.6-46.9-46.9-103.6-61.4-167.6-64.5-55.2-3.1-109.9-2.6-165-2.6-55.2 0-109.9-.5-165 2.6-64 3.1-120.8 17.7-167.6 64.5C132.6 226.3 118.1 283 115 347c-3.1 55.2-2.6 109.9-2.6 165s-.5 109.9 2.6 165c3.1 64 17.7 120.8 64.5 167.6 46.9 46.9 103.6 61.4 167.6 64.5 55.2 3.1 109.9 2.6 165 2.6 55.2 0 109.9.5 165-2.6 64-3.1 120.8-17.7 167.6-64.5 46.9-46.9 61.4-103.6 64.5-167.6 3.2-55.1 2.6-109.8 2.6-165zM512 717.1c-113.5 0-205.1-91.6-205.1-205.1S398.5 306.9 512 306.9 717.1 398.5 717.1 512 625.5 717.1 512 717.1zm213.5-370.7c-26.5 0-47.9-21.4-47.9-47.9s21.4-47.9 47.9-47.9 47.9 21.4 47.9 47.9a47.84 47.84 0 0 1-47.9 47.9z" } }] })(props);
}
function AiFillStar(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 1024 1024" }, "child": [{ "tag": "path", "attr": { "d": "M908.1 353.1l-253.9-36.9L540.7 86.1c-3.1-6.3-8.2-11.4-14.5-14.5-15.8-7.8-35-1.3-42.9 14.5L369.8 316.2l-253.9 36.9c-7 1-13.4 4.3-18.3 9.3a32.05 32.05 0 0 0 .6 45.3l183.7 179.1-43.4 252.9a31.95 31.95 0 0 0 46.4 33.7L512 754l227.1 119.4c6.2 3.3 13.4 4.4 20.3 3.2 17.4-3 29.1-19.5 26.1-36.9l-43.4-252.9 183.7-179.1c5-4.9 8.3-11.3 9.3-18.3 2.7-17.5-9.5-33.7-27-36.3z" } }] })(props);
}
function AiOutlineLogout(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 1024 1024" }, "child": [{ "tag": "path", "attr": { "d": "M868 732h-70.3c-4.8 0-9.3 2.1-12.3 5.8-7 8.5-14.5 16.7-22.4 24.5a353.84 353.84 0 0 1-112.7 75.9A352.8 352.8 0 0 1 512.4 866c-47.9 0-94.3-9.4-137.9-27.8a353.84 353.84 0 0 1-112.7-75.9 353.28 353.28 0 0 1-76-112.5C167.3 606.2 158 559.9 158 512s9.4-94.2 27.8-137.8c17.8-42.1 43.4-80 76-112.5s70.5-58.1 112.7-75.9c43.6-18.4 90-27.8 137.9-27.8 47.9 0 94.3 9.3 137.9 27.8 42.2 17.8 80.1 43.4 112.7 75.9 7.9 7.9 15.3 16.1 22.4 24.5 3 3.7 7.6 5.8 12.3 5.8H868c6.3 0 10.2-7 6.7-12.3C798 160.5 663.8 81.6 511.3 82 271.7 82.6 79.6 277.1 82 516.4 84.4 751.9 276.2 942 512.4 942c152.1 0 285.7-78.8 362.3-197.7 3.4-5.3-.4-12.3-6.7-12.3zm88.9-226.3L815 393.7c-5.3-4.2-13-.4-13 6.3v76H488c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h314v76c0 6.7 7.8 10.5 13 6.3l141.9-112a8 8 0 0 0 0-12.6z" } }] })(props);
}

// app/components/NavBar.tsx
var import_react16 = __toESM(require_react());

// node_modules/react-icons/lia/index.esm.js
function LiaSchoolSolid(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 32 32" }, "child": [{ "tag": "path", "attr": { "d": "M 16 4 L 3 7 L 3 9 L 16 6 L 29 9 L 29 7 Z M 10 10 C 6.773438 10 3.625 11.3125 3.625 11.3125 L 3 11.59375 L 3 27 L 14.28125 27 C 14.628906 27.597656 15.261719 28 16 28 C 16.738281 28 17.371094 27.597656 17.71875 27 L 29 27 L 29 11.59375 L 28.375 11.3125 C 28.375 11.3125 25.226563 10 22 10 C 19.082031 10 16.519531 10.980469 16 11.1875 C 15.480469 10.980469 12.917969 10 10 10 Z M 10 12 C 11.933594 12 14 12.625 15 12.96875 L 15 24.09375 C 13.886719 23.726563 12.058594 23.21875 10 23.21875 C 7.898438 23.21875 6.1875 23.703125 5 24.09375 L 5 12.96875 C 5.769531 12.691406 7.800781 12 10 12 Z M 22 12 C 24.199219 12 26.230469 12.691406 27 12.96875 L 27 24.09375 C 25.8125 23.703125 24.101563 23.21875 22 23.21875 C 19.941406 23.21875 18.113281 23.726563 17 24.09375 L 17 12.96875 C 18 12.625 20.066406 12 22 12 Z" } }] })(props);
}

// node_modules/react-icons/ri/index.esm.js
function RiUserSettingsLine(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 24 24" }, "child": [{ "tag": "path", "attr": { "d": "M12 14V16C8.68629 16 6 18.6863 6 22H4C4 17.5817 7.58172 14 12 14ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13ZM12 11C14.21 11 16 9.21 16 7C16 4.79 14.21 3 12 3C9.79 3 8 4.79 8 7C8 9.21 9.79 11 12 11ZM14.5946 18.8115C14.5327 18.5511 14.5 18.2794 14.5 18C14.5 17.7207 14.5327 17.449 14.5945 17.1886L13.6029 16.6161L14.6029 14.884L15.5952 15.4569C15.9883 15.0851 16.4676 14.8034 17 14.6449V13.5H19V14.6449C19.5324 14.8034 20.0116 15.0851 20.4047 15.4569L21.3971 14.8839L22.3972 16.616L21.4055 17.1885C21.4673 17.449 21.5 17.7207 21.5 18C21.5 18.2793 21.4673 18.551 21.4055 18.8114L22.3972 19.3839L21.3972 21.116L20.4048 20.543C20.0117 20.9149 19.5325 21.1966 19.0001 21.355V22.5H17.0001V21.3551C16.4677 21.1967 15.9884 20.915 15.5953 20.5431L14.603 21.1161L13.6029 19.384L14.5946 18.8115ZM18 19.5C18.8284 19.5 19.5 18.8284 19.5 18C19.5 17.1716 18.8284 16.5 18 16.5C17.1716 16.5 16.5 17.1716 16.5 18C16.5 18.8284 17.1716 19.5 18 19.5Z" } }] })(props);
}

// node_modules/react-icons/md/index.esm.js
function MdOutlineDashboardCustomize(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 24 24" }, "child": [{ "tag": "path", "attr": { "fill": "none", "d": "M0 0h24v24H0V0z" } }, { "tag": "path", "attr": { "d": "M3 11h8V3H3v8zm2-6h4v4H5V5zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM18 13h-2v3h-3v2h3v3h2v-3h3v-2h-3z" } }] })(props);
}
function MdOutlineSpeakerNotes(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 24 24" }, "child": [{ "tag": "path", "attr": { "fill": "none", "d": "M0 0h24v24H0V0z" } }, { "tag": "path", "attr": { "d": "M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17l-.59.59-.58.58V4h16v12zM6 12h2v2H6zm0-3h2v2H6zm0-3h2v2H6zm4 6h5v2h-5zm0-3h8v2h-8zm0-3h8v2h-8z" } }] })(props);
}

// app/components/NavBar.tsx
var import_jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/NavBar.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s3 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/NavBar.tsx"
  );
  import.meta.hot.lastModified = "1737642690783.873";
}
var Nav = ({
  user,
  showcta
}) => {
  _s3();
  const [theme, setTheme] = (0, import_react16.useState)("dark");
  const fetcher = useFetcher();
  (0, import_react16.useEffect)(() => {
  }, [theme]);
  const updateTheme = (t3) => {
    var _a, _b;
    if (t3 === "dark") {
      document.documentElement.classList.add("dark");
      (_a = document.querySelector("#theme-trick")) == null ? void 0 : _a.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      (_b = document.querySelector("#theme-trick")) == null ? void 0 : _b.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };
  const onChangeTheme = async () => {
    updateTheme(theme === "dark" ? "light" : "dark");
  };
  (0, import_react16.useEffect)(() => {
    const current = localStorage.getItem("theme");
    if (current && (current === "dark" || current === "light")) {
      updateTheme(current);
    } else {
      localStorage.setItem("theme", "dark");
    }
  }, []);
  const handleLogout = () => {
    fetcher.submit({
      intent: "logout"
    }, {
      method: "post",
      action: "/api/login"
    });
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("nav", { className: " fixed flex items-center  top-0 z-[90]  bg-clear/60 dark:bg-dark/60 backdrop-blur w-full text-black/80 dark:text-slate-300 shadow-sm dark:shadow h-20", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("section", { className: "w-full flex items-center justify-between py-4 px-4 max-w-3xl mx-auto lg:max-w-6xl ", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Link, { to: "/", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("img", { className: "h-8 lg:h-10", src: "/assets/formmy-logo.png", alt: "logo formmy" }, void 0, false, {
      fileName: "app/components/NavBar.tsx",
      lineNumber: 79,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "app/components/NavBar.tsx",
      lineNumber: 78,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(fetcher.Form, { className: "flex items-center gap-2", method: "post", children: [
      user ? /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(qe2, { as: "div", className: "relative inline-block text-left", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(qe2.Button, { className: "inline-flex w-full justify-center py-2 rounded-md text-sm font-medium  hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("img", { className: "w-10 h-10 rounded-full", src: user.picture, alt: "avatar" }, void 0, false, {
          fileName: "app/components/NavBar.tsx",
          lineNumber: 84,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "app/components/NavBar.tsx",
          lineNumber: 83,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(qe, { as: import_react16.Fragment, enter: "transition ease-out duration-100", enterFrom: "transform opacity-0 scale-95", enterTo: "transform opacity-100 scale-100", leave: "transition ease-in duration-75", leaveFrom: "transform opacity-100 scale-100", leaveTo: "transform opacity-0 scale-95", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(qe2.Items, { className: "absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-clear dark:bg-[#1C1E23]  shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "px-1 py-1 ", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(qe2.Item, { children: ({
            active
          }) => /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Link, { to: "/dash", className: `${active ? "bg-[#F5F5FC] dark:bg-gray-900/40 text-space-800  dark:text-space-300" : "text-space-800  dark:text-clear"} group flex w-full gap-2 items-center rounded-md px-2 py-2 text-sm`, children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(MdOutlineDashboardCustomize, { size: "20px" }, void 0, false, {
              fileName: "app/components/NavBar.tsx",
              lineNumber: 93,
              columnNumber: 27
            }, this),
            "Dashboard"
          ] }, void 0, true, {
            fileName: "app/components/NavBar.tsx",
            lineNumber: 92,
            columnNumber: 25
          }, this) }, void 0, false, {
            fileName: "app/components/NavBar.tsx",
            lineNumber: 89,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(qe2.Item, { children: ({
            active
          }) => /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Link, { to: "/academy", className: `${active ? "bg-[#F5F5FC] dark:bg-gray-900/40 text-space-800  dark:text-space-300" : "text-space-800  dark:text-clear"} group flex w-full gap-2 items-center rounded-md px-2 py-2 text-sm`, children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(LiaSchoolSolid, { size: "20px" }, void 0, false, {
              fileName: "app/components/NavBar.tsx",
              lineNumber: 101,
              columnNumber: 27
            }, this),
            "Formmy Academy"
          ] }, void 0, true, {
            fileName: "app/components/NavBar.tsx",
            lineNumber: 100,
            columnNumber: 25
          }, this) }, void 0, false, {
            fileName: "app/components/NavBar.tsx",
            lineNumber: 97,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(qe2.Item, { children: ({
            active
          }) => /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Link, { to: "/feedback", className: `${active ? "bg-[#F5F5FC] dark:bg-gray-900/40 text-space-800  dark:text-space-300" : "text-space-800  dark:text-clear"} group flex w-full gap-2 items-center rounded-md px-2 py-2 text-sm`, children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(MdOutlineSpeakerNotes, { size: "18px" }, void 0, false, {
              fileName: "app/components/NavBar.tsx",
              lineNumber: 109,
              columnNumber: 27
            }, this),
            "Feedback"
          ] }, void 0, true, {
            fileName: "app/components/NavBar.tsx",
            lineNumber: 108,
            columnNumber: 25
          }, this) }, void 0, false, {
            fileName: "app/components/NavBar.tsx",
            lineNumber: 105,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(qe2.Item, { children: ({
            active
          }) => /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Link, { to: "/profile", className: `${active ? "bg-[#F5F5FC] dark:bg-gray-900/40 text-space-800  dark:text-space-300" : "text-space-800  dark:text-clear"} group flex w-full gap-2 items-center rounded-md px-2 py-2 text-sm`, children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(RiUserSettingsLine, { size: "18px" }, void 0, false, {
              fileName: "app/components/NavBar.tsx",
              lineNumber: 117,
              columnNumber: 27
            }, this),
            "Perfil"
          ] }, void 0, true, {
            fileName: "app/components/NavBar.tsx",
            lineNumber: 116,
            columnNumber: 25
          }, this) }, void 0, false, {
            fileName: "app/components/NavBar.tsx",
            lineNumber: 113,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(qe2.Item, { children: ({
            active
          }) => /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { onClick: handleLogout, type: "button", className: `${active ? "bg-[#F5F5FC] dark:bg-gray-900/40 text-space-800  dark:text-space-300" : "text-space-800  dark:text-clear"} group flex w-full gap-2 items-center rounded-md px-2 py-2 text-sm `, children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(AiOutlineLogout, { size: "18px" }, void 0, false, {
              fileName: "app/components/NavBar.tsx",
              lineNumber: 125,
              columnNumber: 27
            }, this),
            "Cerrar sesi\xF3n"
          ] }, void 0, true, {
            fileName: "app/components/NavBar.tsx",
            lineNumber: 124,
            columnNumber: 25
          }, this) }, void 0, false, {
            fileName: "app/components/NavBar.tsx",
            lineNumber: 121,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "app/components/NavBar.tsx",
          lineNumber: 88,
          columnNumber: 19
        }, this) }, void 0, false, {
          fileName: "app/components/NavBar.tsx",
          lineNumber: 87,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "app/components/NavBar.tsx",
          lineNumber: 86,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/NavBar.tsx",
        lineNumber: 82,
        columnNumber: 19
      }, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(import_jsx_dev_runtime2.Fragment, { children: showcta ? /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { type: "submit", name: "intent", value: "google-login", disabled: fetcher.state !== "idle", className: twMerge("font-normal", "bg-transparent rounded-full dark:bg-[#1D2027] text-space-800 dark:text-white p-3 px-4  hover:scale-105 transition-all"), children: fetcher.state !== "idle" ? /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Spinner, {}, void 0, false, {
        fileName: "app/components/NavBar.tsx",
        lineNumber: 134,
        columnNumber: 47
      }, this) : "Iniciar sesi\xF3n" }, void 0, false, {
        fileName: "app/components/NavBar.tsx",
        lineNumber: 133,
        columnNumber: 26
      }, this) : null }, void 0, false, {
        fileName: "app/components/NavBar.tsx",
        lineNumber: 132,
        columnNumber: 23
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("label", { htmlFor: "theme text-xs" }, void 0, false, {
        fileName: "app/components/NavBar.tsx",
        lineNumber: 138,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(ToggleButton, { theme, onChange: onChangeTheme }, void 0, false, {
        fileName: "app/components/NavBar.tsx",
        lineNumber: 139,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/NavBar.tsx",
      lineNumber: 81,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/NavBar.tsx",
    lineNumber: 77,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/NavBar.tsx",
    lineNumber: 76,
    columnNumber: 10
  }, this);
};
_s3(Nav, "bv0La0Vvy14y2sRtDxP/IRqD7Cw=", false, function() {
  return [useFetcher];
});
_c4 = Nav;
var NavBar_default = Nav;
var _c4;
$RefreshReg$(_c4, "Nav");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

export {
  T3 as T,
  qe2 as qe,
  qe as qe2,
  Toggle,
  GenIcon,
  AiFillInstagram,
  AiFillStar,
  NavBar_default
};
//# sourceMappingURL=/build/_shared/chunk-EFXLBPE4.js.map
