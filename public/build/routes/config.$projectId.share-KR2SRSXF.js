import {
  De,
  kt
} from "/build/_shared/chunk-CUGGDEPG.js";
import {
  FiEdit3
} from "/build/_shared/chunk-2V2ZBDA5.js";
import {
  Message
} from "/build/_shared/chunk-FGBF4SDM.js";
import "/build/_shared/chunk-MVVQ5N7D.js";
import {
  Visualizer
} from "/build/_shared/chunk-XZ7VDIAU.js";
import "/build/_shared/chunk-GAAUEO2B.js";
import "/build/_shared/chunk-WAI7GNH5.js";
import "/build/_shared/chunk-YSJMGTXM.js";
import "/build/_shared/chunk-N7VDZ2JV.js";
import "/build/_shared/chunk-IYD4CINF.js";
import "/build/_shared/chunk-OMYSDXL4.js";
import {
  FaCheck,
  FaRegCopy
} from "/build/_shared/chunk-SGWSEZXL.js";
import "/build/_shared/chunk-2E2SUJIS.js";
import "/build/_shared/chunk-EFXLBPE4.js";
import "/build/_shared/chunk-3UHNKOCO.js";
import "/build/_shared/chunk-RGBYWDPK.js";
import "/build/_shared/chunk-QZYI3ZKT.js";
import "/build/_shared/chunk-7ZNLIBJB.js";
import "/build/_shared/chunk-XGABADQ5.js";
import {
  AnimatePresence,
  motion
} from "/build/_shared/chunk-ZOHFZ5HT.js";
import "/build/_shared/chunk-NMZL6IDN.js";
import "/build/_shared/chunk-QKNDBCR7.js";
import {
  twMerge
} from "/build/_shared/chunk-B3ATQ6F7.js";
import {
  require_db
} from "/build/_shared/chunk-KONDUBG3.js";
import {
  require_node
} from "/build/_shared/chunk-G7CHZRZX.js";
import "/build/_shared/chunk-GIAAE3CH.js";
import {
  Link,
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

// app/routes/config.$projectId.share.tsx
var import_node = __toESM(require_node());
var import_db = __toESM(require_db());
var import_react2 = __toESM(require_react());

// app/components/CopyOrCheckButton.tsx
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/CopyOrCheckButton.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/CopyOrCheckButton.tsx"
  );
  import.meta.hot.lastModified = "1737642690783.1387";
}
var CopyOrCheckButton = ({
  showCheck
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AnimatePresence, { mode: "popLayout", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(motion.div, { initial: {
    opacity: 0,
    filter: "blur(9px)",
    scale: 1.5
  }, animate: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1
  }, exit: {
    opacity: 0,
    filter: "blur(9px)",
    scale: 1.5
  }, className: "grid place-content-center", children: showCheck ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FaCheck, {}, void 0, false, {
    fileName: "app/components/CopyOrCheckButton.tsx",
    lineNumber: 40,
    columnNumber: 22
  }, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FaRegCopy, {}, void 0, false, {
    fileName: "app/components/CopyOrCheckButton.tsx",
    lineNumber: 40,
    columnNumber: 36
  }, this) }, showCheck ? "1" : "2", false, {
    fileName: "app/components/CopyOrCheckButton.tsx",
    lineNumber: 27,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/CopyOrCheckButton.tsx",
    lineNumber: 26,
    columnNumber: 10
  }, this);
};
_c = CopyOrCheckButton;
var _c;
$RefreshReg$(_c, "CopyOrCheckButton");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/routes/config.$projectId.share.tsx
var import_jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/config.$projectId.share.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/config.$projectId.share.tsx"
  );
  import.meta.hot.lastModified = "1737642690811.3896";
}
function ShareConfig() {
  _s();
  const {
    height,
    config,
    NODE_ENV,
    projectId,
    isPro,
    type
  } = useLoaderData();
  const [ok, setOk] = (0, import_react2.useState)(false);
  const [showCheck, setShowCheck] = (0, import_react2.useState)(null);
  const preview = NODE_ENV === "development" ? `http://localhost:3000/preview/${projectId}` : `https://formmy.app/preview/${projectId}`;
  const iframe = NODE_ENV === "development" ? `<iframe frameborder="0" id="formmy-iframe" title="formmy" width="560" height="${height}" src="http://localhost:3000/embed/${projectId}" style="margin: 0 auto; display: block"
    ></iframe>` : `<iframe frameborder="0" id="formmy-iframe" title="formmy" width="560" height="760" src="https://formmy.app/embed/${projectId}" style="margin: 0 auto; display: block"
      ></iframe>`;
  const handleCopy = (link) => () => {
    navigator.clipboard.writeText(link);
    kt("Link copiado", {
      position: "bottom-right",
      icon: "\u{1F47B}"
    });
    kt.success("Link copiado", {
      position: "top-right"
    });
    setShowCheck(link);
    setTimeout(() => setShowCheck(false), 1e3);
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(import_jsx_dev_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(De, {}, void 0, false, {
      fileName: "app/routes/config.$projectId.share.tsx",
      lineNumber: 93,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("article", { className: "flex flex-wrap h-screen text-slate-700 dark:text-white dark:bg-space-900 ", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("section", { className: " pt-12 md:px-12 px-4  w-full lg:min-w-[520px] h-full lg:max-w-[520px] overflow-y-scroll noscroll ", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "w-full h-full min-h-[740px]  flex flex-col relative", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Link, { to: "/config/" + projectId + "/basic", className: "float-left top-0	", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "border-[1px] border-[#DFDFE9] text-[32px] flex justify-center items-center text-space-600 dark:text-gray-400 rounded-lg h-12 w-12", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(FiEdit3, {}, void 0, false, {
          fileName: "app/routes/config.$projectId.share.tsx",
          lineNumber: 99,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "app/routes/config.$projectId.share.tsx",
          lineNumber: 98,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "app/routes/config.$projectId.share.tsx",
          lineNumber: 97,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("img", { className: "flex dark:hidden w-[70%] ml-[15%] mb-10", src: "/assets/fantasma-globo.svg", alt: " felicidades brand" }, void 0, false, {
          fileName: "app/routes/config.$projectId.share.tsx",
          lineNumber: 102,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("img", { className: "hidden dark:flex w-[70%] ml-[15%] mb-10", src: "/assets/congrats.svg", alt: " felicidades brand" }, void 0, false, {
          fileName: "app/routes/config.$projectId.share.tsx",
          lineNumber: 103,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h2", { className: "text-3xl font-bold text-space-800 dark:text-white text-center", children: "\xA1Tu Formmy est\xE1 listo!" }, void 0, false, {
            fileName: "app/routes/config.$projectId.share.tsx",
            lineNumber: 105,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "pt-6 py-2 text-md font-normal text-gray-600 dark:text-space-300", children: "Solo copia y pega esta etiqueta en tu HTML o JSX." }, void 0, false, {
            fileName: "app/routes/config.$projectId.share.tsx",
            lineNumber: 108,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "relative", children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("input", { placeholder: iframe, type: "text", className: "bg-brand-100 border-[1px] dark:bg-gray-900 dark:border-none w-full border-[#DFDFE9] focus:border-brand-500 focus:ring-brand-500 rounded-md py-2 px-4" }, void 0, false, {
              fileName: "app/routes/config.$projectId.share.tsx",
              lineNumber: 112,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { type: "button", className: "absolute right-4 top-3 text-gray-400 bg-brand-100 dark:bg-gray-900 pl-2 active:text-brand-500", onClick: handleCopy(iframe), children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(CopyOrCheckButton, { showCheck: showCheck === iframe }, void 0, false, {
              fileName: "app/routes/config.$projectId.share.tsx",
              lineNumber: 114,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "app/routes/config.$projectId.share.tsx",
              lineNumber: 113,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "app/routes/config.$projectId.share.tsx",
            lineNumber: 111,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "pt-4 mt-4 py-2 text-md font-normal text-gray-600 dark:text-space-300", children: "O comparte tu link directamente" }, void 0, false, {
            fileName: "app/routes/config.$projectId.share.tsx",
            lineNumber: 117,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "relative", children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("input", { placeholder: preview, type: "text", className: "bg-brand-100 dark:border-none dark:bg-gray-900 border-[1px] w-full border-[#DFDFE9] focus:border-brand-500 focus:ring-brand-500 rounded-md py-2 px-4" }, void 0, false, {
              fileName: "app/routes/config.$projectId.share.tsx",
              lineNumber: 121,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { type: "button", className: "absolute right-4 top-3 text-gray-400 bg-brand-100 dark:bg-gray-900 pl-2 active:text-brand-500", onClick: handleCopy(preview), children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(CopyOrCheckButton, { showCheck: showCheck === preview }, void 0, false, {
              fileName: "app/routes/config.$projectId.share.tsx",
              lineNumber: 123,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "app/routes/config.$projectId.share.tsx",
              lineNumber: 122,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "app/routes/config.$projectId.share.tsx",
            lineNumber: 120,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/config.$projectId.share.tsx",
          lineNumber: 104,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "flex gap-4 absolute w-full mt-auto bottom-0 z-10 bg-gradient-to-b from-transparent to-clear dark:to-space-900 pb-8", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("a", { target: "_blank", rel: "noreferrer", href: preview, className: " bg-clear dark:bg-space-900 flex items-center justify-center grow h-12 rounded-full text-base mt-10 disabled:bg-gray-100 border-[1px] border-brand-500 text-brand-500 disabled:text-gray-400 ", children: "Ir al preview" }, void 0, false, {
            fileName: "app/routes/config.$projectId.share.tsx",
            lineNumber: 128,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Link, { to: `/dash/${projectId}`, className: "hover:bg-brand-300 flex items-center justify-center grow-[2] h-12 rounded-full text-base mt-10 disabled:bg-gray-100 bg-brand-500 text-clear disabled:text-gray-400", children: "Ir al Dashboard" }, void 0, false, {
            fileName: "app/routes/config.$projectId.share.tsx",
            lineNumber: 131,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/config.$projectId.share.tsx",
          lineNumber: 127,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/config.$projectId.share.tsx",
        lineNumber: 96,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/routes/config.$projectId.share.tsx",
        lineNumber: 95,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("section", { className: twMerge("grow h-full", config.theme), children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "w-full h-full bg-slate-100 dark:bg-[#0D0E13] py-10 lg:py-0  relative", children: ok ? /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Message, { config, showConfetti: ok }, void 0, false, {
        fileName: "app/routes/config.$projectId.share.tsx",
        lineNumber: 140,
        columnNumber: 19
      }, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Visualizer, { type, onSubmit: () => setOk(true), projectId, config, isPro, message: " \xA1Prueba aqu\xED tu formmy! Y no te preocupes, no se agaregar\xE1n las\n            respuestas a tu dashboard." }, void 0, false, {
        fileName: "app/routes/config.$projectId.share.tsx",
        lineNumber: 140,
        columnNumber: 67
      }, this) }, void 0, false, {
        fileName: "app/routes/config.$projectId.share.tsx",
        lineNumber: 139,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/routes/config.$projectId.share.tsx",
        lineNumber: 138,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/config.$projectId.share.tsx",
      lineNumber: 94,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/config.$projectId.share.tsx",
    lineNumber: 92,
    columnNumber: 10
  }, this);
}
_s(ShareConfig, "Vim6iR78yS3g2OdL/XQ/aem+wmI=", false, function() {
  return [useLoaderData];
});
_c2 = ShareConfig;
var _c2;
$RefreshReg$(_c2, "ShareConfig");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  ShareConfig as default
};
//# sourceMappingURL=/build/routes/config.$projectId.share-KR2SRSXF.js.map
