import {
  $e,
  BigCTA,
  PricingCard
} from "/build/_shared/chunk-SGWSEZXL.js";
import {
  qe2 as qe
} from "/build/_shared/chunk-EFXLBPE4.js";
import {
  _t
} from "/build/_shared/chunk-RGBYWDPK.js";
import {
  Button
} from "/build/_shared/chunk-QZYI3ZKT.js";
import {
  Form,
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

// app/components/ProTag.tsx
var import_react2 = __toESM(require_react());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/ProTag.tsx"' + id);
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
    "app/components/ProTag.tsx"
  );
  import.meta.hot.lastModified = "1737642690784.2412";
}
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
var ProTag = ({
  isOpen = false,
  onChange
}) => {
  var _a;
  _s();
  const [localOpen, setLocalOpen] = (0, import_react2.useState)(isOpen);
  const fetcher = useFetcher();
  function closeModal() {
    onChange == null ? void 0 : onChange(false);
    setLocalOpen(false);
  }
  (0, import_react2.useEffect)(() => {
    fetcher.load("/api/self");
  }, []);
  (0, import_react2.useEffect)(() => {
    setLocalOpen(isOpen);
  }, [isOpen]);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { type: "button", onClick: () => {
      setLocalOpen(true);
      onChange == null ? void 0 : onChange(true);
    }, className: "cursor-pointer flex gap-1 items-center z-10 absolute -top-1 -right-4 border-[1px] border-none bg-[#FFEEBC] text-[#DAAC1F] rounded  text-sm py-[2px] px-2", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", { className: "w-[12px]", src: "/assets/thunder.svg", alt: "thunder" }, void 0, false, {
        fileName: "app/components/ProTag.tsx",
        lineNumber: 65,
        columnNumber: 9
      }, this),
      "Pro"
    ] }, void 0, true, {
      fileName: "app/components/ProTag.tsx",
      lineNumber: 61,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(qe, { appear: true, show: localOpen, as: import_react2.Fragment, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(_t, { as: "div", className: "relative z-10", onClose: closeModal, open: localOpen, children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(qe.Child, { as: import_react2.Fragment, enter: "ease-out duration-300", enterFrom: "opacity-0", enterTo: "opacity-100", leave: "ease-in duration-200", leaveFrom: "opacity-100", leaveTo: "opacity-0", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" }, void 0, false, {
        fileName: "app/components/ProTag.tsx",
        lineNumber: 71,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "app/components/ProTag.tsx",
        lineNumber: 70,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "fixed inset-0 overflow-y-auto", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex min-h-full items-center justify-center  text-center", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(qe.Child, { as: import_react2.Fragment, enter: "ease-out duration-300", enterFrom: "opacity-0 scale-95", enterTo: "opacity-100 scale-100", leave: "ease-in duration-200", leaveFrom: "opacity-100 scale-100", leaveTo: "opacity-0 scale-95", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(_t.Panel, { className: "w-full relative max-w-7xl transform overflow-hidden rounded-2xl bg-clear dark:bg-space-900 pt-6 pb-10 px-10 text-left align-middle shadow-xl transition-all", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick: closeModal, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", { className: "absolute top-6 right-6 dark:opacity-40 z-20", src: "/assets/close.svg", alt: "close" }, void 0, false, {
          fileName: "app/components/ProTag.tsx",
          lineNumber: 79,
          columnNumber: 21
        }, this) }, void 0, false, {
          fileName: "app/components/ProTag.tsx",
          lineNumber: 78,
          columnNumber: 19
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex flex-wrap lg:flex-nowrap gap-16 ", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "w-[540px]", children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "w-[64px] h-[64px] rounded-lg flex items-center justify-center border-[1px] border-[#DFDFE9] dark:border-[rgba(255,255,255,.1)] mb-8", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", { className: "w-[32px]", src: "/assets/thunder.svg", alt: "thunder" }, void 0, false, {
              fileName: "app/components/ProTag.tsx",
              lineNumber: 84,
              columnNumber: 25
            }, this) }, void 0, false, {
              fileName: "app/components/ProTag.tsx",
              lineNumber: 83,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h3", { className: "text-2xl text-space-800 dark:text-white font-semibold mb-2", children: "Mejora tu plan para tener acceso a funcionalidades PRO." }, void 0, false, {
              fileName: "app/components/ProTag.tsx",
              lineNumber: 86,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "text-xl	text-gray-600 dark:text-space-300 font-light", children: "Ten acceso a m\xE1s funcionalidades dentro de Formmy, como m\xE1s opciones de personalizaci\xF3n (bordes, animaciones, colores, campos), mensajes ilimitados y sin marca de agua." }, void 0, false, {
              fileName: "app/components/ProTag.tsx",
              lineNumber: 89,
              columnNumber: 23
            }, this)
          ] }, void 0, true, {
            fileName: "app/components/ProTag.tsx",
            lineNumber: 82,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(PriceCards, { plan: (_a = fetcher.data) == null ? void 0 : _a.plan }, void 0, false, {
            fileName: "app/components/ProTag.tsx",
            lineNumber: 96,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "app/components/ProTag.tsx",
          lineNumber: 81,
          columnNumber: 19
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/ProTag.tsx",
        lineNumber: 77,
        columnNumber: 17
      }, this) }, void 0, false, {
        fileName: "app/components/ProTag.tsx",
        lineNumber: 76,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "app/components/ProTag.tsx",
        lineNumber: 75,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "app/components/ProTag.tsx",
        lineNumber: 74,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/ProTag.tsx",
      lineNumber: 69,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/components/ProTag.tsx",
      lineNumber: 68,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/ProTag.tsx",
    lineNumber: 60,
    columnNumber: 10
  }, this);
};
_s(ProTag, "bchk8qZoezZQORNpzAvxMRw6lng=", false, function() {
  return [useFetcher];
});
_c = ProTag;
var PriceCards = ({
  plan
}) => {
  _s2();
  const [activeTab, set] = (0, import_react2.useState)(1);
  const fetcher = useFetcher();
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "w-full grow-2 ", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex-col flex-wrap flex justify-between relative", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)($e.Group, { defaultIndex: activeTab, onChange: set, children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "m-auto mb-12", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)($e.List, { className: "tabs bg-[#EDEDF1] dark:bg-[#121317] w-[240px] h-[56px] rounded-full mt-16 flex items-center justify-center", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)($e, { type: "button", className: ({
        selected
      }) => classNames("w-[120px]  h-[56px] border-none rounded-full  text-md font-medium  ", "ring-0 ring-offset-0 focus:outline-none focus:ring-0 ", selected ? " bg-brand-500 text-clear" : "text-space-800  dark:text-white "), children: "Mensual" }, void 0, false, {
        fileName: "app/components/ProTag.tsx",
        lineNumber: 121,
        columnNumber: 15
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)($e, { type: "button", className: ({
        selected
      }) => classNames("w-[120px]  h-[56px] border-none rounded-full  text-md font-medium  ", "ring-0 ring-offset-0 focus:outline-none focus:ring-0 ", selected ? " bg-brand-500 text-clear" : "text-space-800 dark:text-white  "), children: "Anual" }, void 0, false, {
        fileName: "app/components/ProTag.tsx",
        lineNumber: 126,
        columnNumber: 15
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/ProTag.tsx",
      lineNumber: 120,
      columnNumber: 13
    }, this) }, void 0, false, {
      fileName: "app/components/ProTag.tsx",
      lineNumber: 119,
      columnNumber: 11
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)($e.Panels, { children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)($e.Panel, { className: "flex gap-8 lg:gap-16 justify-center flex-wrap md:flex-nowrap", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(
          PricingCard,
          {
            plan,
            button: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Form, { method: "post", className: "min-w-full", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BigCTA, { disabled: true, type: "submit", name: "intent", value: "google-login", className: "min-w-full", children: "Este es tu plan" }, void 0, false, {
              fileName: "app/components/ProTag.tsx",
              lineNumber: 137,
              columnNumber: 21
            }, this) }, void 0, false, {
              fileName: "app/components/ProTag.tsx",
              lineNumber: 136,
              columnNumber: 48
            }, this),
            name: "Free",
            cta: "Noviembre",
            isDisable: true,
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
            fileName: "app/components/ProTag.tsx",
            lineNumber: 136,
            columnNumber: 15
          },
          this
        ),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(PricingCard, { button: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, { type: "button", isLoading: fetcher.state !== "idle", onClick: () => {
          fetcher.submit({
            intent: "monthly-suscription-checkout"
          }, {
            method: "post",
            action: "/api/stripe"
          });
        }, className: "w-full  text-clear mt-0", children: "\xA1Quiero ser pro!" }, void 0, false, {
          fileName: "app/components/ProTag.tsx",
          lineNumber: 158,
          columnNumber: 36
        }, this), name: "PRO \u2728", description: "Ideal si eres freelancer", price: 8, image: "/assets/thunder-back.svg", benefits: [{
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
          fileName: "app/components/ProTag.tsx",
          lineNumber: 158,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/ProTag.tsx",
        lineNumber: 135,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)($e.Panel, { className: "flex gap-16 justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(
          PricingCard,
          {
            button: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Form, { method: "post", className: "min-w-full", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BigCTA, { disabled: true, type: "button", className: "min-w-full", children: "Este es tu plan" }, void 0, false, {
              fileName: "app/components/ProTag.tsx",
              lineNumber: 189,
              columnNumber: 21
            }, this) }, void 0, false, {
              fileName: "app/components/ProTag.tsx",
              lineNumber: 188,
              columnNumber: 36
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
            fileName: "app/components/ProTag.tsx",
            lineNumber: 188,
            columnNumber: 15
          },
          this
        ),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(PricingCard, { button: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, { isLoading: fetcher.state !== "idle", type: "button", onClick: () => {
          fetcher.submit({
            intent: "anual-suscription-checkout"
          }, {
            method: "post",
            action: "/api/stripe"
          });
        }, className: "w-full text-clear mt-0", children: "\xA1Quiero ser pro!" }, void 0, false, {
          fileName: "app/components/ProTag.tsx",
          lineNumber: 210,
          columnNumber: 36
        }, this), cta: "\xA1Quiero ser PRO!", name: "PRO \u2728", description: "Ideal si eres freelancer", price: 6, image: "/assets/thunder-back.svg", benefits: [{
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
          fileName: "app/components/ProTag.tsx",
          lineNumber: 210,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "app/components/ProTag.tsx",
        lineNumber: 187,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/ProTag.tsx",
      lineNumber: 134,
      columnNumber: 11
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/ProTag.tsx",
    lineNumber: 118,
    columnNumber: 9
  }, this) }, void 0, false, {
    fileName: "app/components/ProTag.tsx",
    lineNumber: 117,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/ProTag.tsx",
    lineNumber: 116,
    columnNumber: 10
  }, this);
};
_s2(PriceCards, "Gu712lxERi7QAHgLMKoXrhL9ZFc=", false, function() {
  return [useFetcher];
});
_c2 = PriceCards;
var _c;
var _c2;
$RefreshReg$(_c, "ProTag");
$RefreshReg$(_c2, "PriceCards");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

export {
  ProTag
};
//# sourceMappingURL=/build/_shared/chunk-OMYSDXL4.js.map
