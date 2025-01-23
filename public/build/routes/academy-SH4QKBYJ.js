import {
  BsPersonVideo2
} from "/build/_shared/chunk-2E2SUJIS.js";
import {
  NavBar_default,
  qe2 as qe
} from "/build/_shared/chunk-EFXLBPE4.js";
import {
  _t
} from "/build/_shared/chunk-RGBYWDPK.js";
import "/build/_shared/chunk-7ZNLIBJB.js";
import "/build/_shared/chunk-QKNDBCR7.js";
import "/build/_shared/chunk-B3ATQ6F7.js";
import "/build/_shared/chunk-GIAAE3CH.js";
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

// app/routes/academy.tsx
var import_react2 = __toESM(require_react());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/academy.tsx"' + id);
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
    "app/routes/academy.tsx"
  );
  import.meta.hot.lastModified = "1737642690792.2466";
}
function academy() {
  _s();
  const {
    user
  } = useLoaderData();
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(NavBar_default, { user }, void 0, false, {
      fileName: "app/routes/academy.tsx",
      lineNumber: 43,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "dark:bg-space-900", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "pt-40 pb-20 px-4 md:px-0 lg:max-w-6xl max-w-3xl mx-auto text-space-500 dark:text-space-300", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { className: "text-4xl md:text-5xl text-space-800 dark:text-white font-semibold", children: "Formmy Academy" }, void 0, false, {
        fileName: "app/routes/academy.tsx",
        lineNumber: 46,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "text-xl md:text-2xl text-gray-600 dark:text-space-400 font-light w-full md:w-[700px] mt-4", children: [
        "Empieza a utilizar Formmy en tu sitio web. Agregalo f\xE1cilmente a tu HTML o a tu proyecto de React, Wordpress, Angular, o m\xE1s.",
        " "
      ] }, void 0, true, {
        fileName: "app/routes/academy.tsx",
        lineNumber: 49,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex flex-col gap-10 md:gap-8 mt-16", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Card, { title: "Crea tu primer Formmy", description: "Empieza a usar Formmy y agrega formularios de contacto a tu sitio web f\xE1cilmente.", duration: "3 min", image: "https://i.imgur.com/mqHOOA0l.png", video: "https://www.youtube.com/embed/vdixQUHQ01A?si=vtqSg7pSIUH2JBj7" }, void 0, false, {
          fileName: "app/routes/academy.tsx",
          lineNumber: 61,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Card, { title: "Prueba Formmy PRO \u26A1\uFE0F", description: "\xBFNecesitas m\xE1s opciones de personalizaci\xF3n en tu Formmy? Prueba Formmy PRO y aprovecha todas las funcionalidades que tiene para ti.", duration: "3 min", image: "https://i.imgur.com/oNQy9Kbl.png", video: "https://www.youtube.com/embed/2V76NB9LLwQ?si=jLVVHM7zkicj3eAW" }, void 0, false, {
          fileName: "app/routes/academy.tsx",
          lineNumber: 62,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Card, { title: "Agrega Formmy a tu proyecto HTML", description: "Personaliza tu Formmy y agr\xE9galo directamente en tu HTML.", duration: "2:24 min", image: "https://i.imgur.com/N8cd2JWl.png", video: "https://www.youtube.com/embed/1ybL9LZgu_c?si=0t5n1Pmxux2B9Hj2" }, void 0, false, {
          fileName: "app/routes/academy.tsx",
          lineNumber: 63,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Card, { title: "Agrega Formmy a tu proyecto React", description: "Agrega Formmy a tu proyecto React paso a paso.", duration: "4:50 min", image: "https://i.imgur.com/8ixhB2vl.png", video: "https://www.youtube.com/embed/F9muTF0fg-8?si=q1LN-0KWkd4-LzxI" }, void 0, false, {
          fileName: "app/routes/academy.tsx",
          lineNumber: 64,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/academy.tsx",
        lineNumber: 60,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/academy.tsx",
      lineNumber: 45,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/routes/academy.tsx",
      lineNumber: 44,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/academy.tsx",
    lineNumber: 42,
    columnNumber: 10
  }, this);
}
_s(academy, "FpjQZylbefWQChk+MjGNfSb2jDo=", false, function() {
  return [useLoaderData];
});
var Card = ({
  image,
  title,
  description,
  duration,
  video
}) => {
  _s2();
  let [isOpen, setIsOpen] = (0, import_react2.useState)(false);
  function closeModal() {
    setIsOpen(false);
  }
  function openModal() {
    setIsOpen(true);
  }
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex flex-wrap lg:flex-nowrap gap-4 md:gap-10 items-center cursor-pointer", onClick: openModal, children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", { className: "w-full object-cover md:w-[300px] h-[180px] rounded-2xl shadow hover:opacity-80  ", src: image }, void 0, false, {
        fileName: "app/routes/academy.tsx",
        lineNumber: 90,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h3", { className: "text-2xl  text-space-800 dark:text-white font-medium mb-1", children: title }, void 0, false, {
          fileName: "app/routes/academy.tsx",
          lineNumber: 92,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "text-lg text-gray-600 dark:text-space-400 font-light", children: description }, void 0, false, {
          fileName: "app/routes/academy.tsx",
          lineNumber: 95,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "flex items-center gap-1 text-gray-500 font-light text-sm", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BsPersonVideo2, {}, void 0, false, {
            fileName: "app/routes/academy.tsx",
            lineNumber: 99,
            columnNumber: 13
          }, this),
          duration
        ] }, void 0, true, {
          fileName: "app/routes/academy.tsx",
          lineNumber: 98,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/academy.tsx",
        lineNumber: 91,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/academy.tsx",
      lineNumber: 89,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(qe, { appear: true, show: isOpen, as: import_react2.Fragment, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(_t, { as: "div", className: "relative z-20", onClose: closeModal, children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(qe.Child, { as: import_react2.Fragment, enter: "ease-out duration-300", enterFrom: "opacity-0", enterTo: "opacity-100", leave: "ease-in duration-200", leaveFrom: "opacity-100", leaveTo: "opacity-0", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "fixed inset-0 bg-black bg-opacity-50" }, void 0, false, {
        fileName: "app/routes/academy.tsx",
        lineNumber: 107,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "app/routes/academy.tsx",
        lineNumber: 106,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "fixed inset-0 overflow-y-auto ", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex min-h-full items-center justify-center p-4 text-center", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(qe.Child, { as: import_react2.Fragment, enter: "ease-out duration-300", enterFrom: "opacity-0 scale-95", enterTo: "opacity-100 scale-100", leave: "ease-in duration-200", leaveFrom: "opacity-100 scale-100", leaveTo: "opacity-0 scale-95", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(_t.Panel, { className: "w-full relative max-w-[640px] p-6 md:p-12 transform overflow-hidden rounded-2xl bg-clear dark:bg-[#23252D] text-left align-middle shadow-xl transition-all", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(_t.Title, { as: "h3", className: "text-lg font-medium leading-6 text-gray-800 dark:text-white", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "text-2xl", children: [
          " ",
          title
        ] }, void 0, true, {
          fileName: "app/routes/academy.tsx",
          lineNumber: 115,
          columnNumber: 21
        }, this) }, void 0, false, {
          fileName: "app/routes/academy.tsx",
          lineNumber: 114,
          columnNumber: 19
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: " mt-6", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("iframe", { className: "rounded-2xl", width: "100%", height: "315", src: video, title: "YouTube video player", frameborder: "0", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share", allowfullscreen: true }, void 0, false, {
            fileName: "app/routes/academy.tsx",
            lineNumber: 126,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "text-lg text-gray-600 dark:text-space-400 font-light mt-4", children: description }, void 0, false, {
            fileName: "app/routes/academy.tsx",
            lineNumber: 127,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/academy.tsx",
          lineNumber: 121,
          columnNumber: 19
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "mt-4", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { type: "button", className: "inline-flex justify-center border border-transparent bg-space-200 dark:bg-[#1D2027] dark:text-white px-4 py-2 text-sm font-medium text-space-800 rounded-full hover:bg-[#EEF0F8] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2", onClick: closeModal, children: "Entendido \xA1Gracias!" }, void 0, false, {
          fileName: "app/routes/academy.tsx",
          lineNumber: 133,
          columnNumber: 21
        }, this) }, void 0, false, {
          fileName: "app/routes/academy.tsx",
          lineNumber: 132,
          columnNumber: 19
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/academy.tsx",
        lineNumber: 113,
        columnNumber: 17
      }, this) }, void 0, false, {
        fileName: "app/routes/academy.tsx",
        lineNumber: 112,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "app/routes/academy.tsx",
        lineNumber: 111,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "app/routes/academy.tsx",
        lineNumber: 110,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/academy.tsx",
      lineNumber: 105,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/routes/academy.tsx",
      lineNumber: 104,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/academy.tsx",
    lineNumber: 88,
    columnNumber: 10
  }, this);
};
_s2(Card, "+sus0Lb0ewKHdwiUhiTAJFoFyQ0=");
_c = Card;
var _c;
$RefreshReg$(_c, "Card");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  academy as default
};
//# sourceMappingURL=/build/routes/academy-SH4QKBYJ.js.map
