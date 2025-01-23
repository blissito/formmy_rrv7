import {
  EmojiConfetti
} from "/build/_shared/chunk-MVVQ5N7D.js";
import "/build/_shared/chunk-N7VDZ2JV.js";
import "/build/_shared/chunk-IYD4CINF.js";
import "/build/_shared/chunk-OMYSDXL4.js";
import {
  useLocalStorage
} from "/build/_shared/chunk-SGWSEZXL.js";
import "/build/_shared/chunk-2E2SUJIS.js";
import {
  NavBar_default
} from "/build/_shared/chunk-EFXLBPE4.js";
import {
  Modal
} from "/build/_shared/chunk-3UHNKOCO.js";
import "/build/_shared/chunk-RGBYWDPK.js";
import {
  Button
} from "/build/_shared/chunk-QZYI3ZKT.js";
import "/build/_shared/chunk-7ZNLIBJB.js";
import "/build/_shared/chunk-XGABADQ5.js";
import "/build/_shared/chunk-ZOHFZ5HT.js";
import "/build/_shared/chunk-NMZL6IDN.js";
import {
  Spinner
} from "/build/_shared/chunk-QKNDBCR7.js";
import {
  twMerge
} from "/build/_shared/chunk-B3ATQ6F7.js";
import "/build/_shared/chunk-KONDUBG3.js";
import {
  require_node
} from "/build/_shared/chunk-G7CHZRZX.js";
import "/build/_shared/chunk-GIAAE3CH.js";
import {
  Form,
  useFetcher2 as useFetcher,
  useLoaderData2 as useLoaderData,
  useNavigate,
  useNavigation
} from "/build/_shared/chunk-MUQCVLXB.js";
import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-XU7DNSPJ.js";
import {
  createHotContext
} from "/build/_shared/chunk-2F64VKTU.js";
import "/build/_shared/chunk-UWV35TSL.js";
import "/build/_shared/chunk-BOXFZXVX.js";
import {
  __commonJS,
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// empty-module:~/utils/stripe.server
var require_stripe = __commonJS({
  "empty-module:~/utils/stripe.server"(exports, module) {
    module.exports = {};
  }
});

// app/routes/profile.tsx
var import_node = __toESM(require_node());

// app/components/SuccessModal.tsx
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/SuccessModal.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/SuccessModal.tsx"
  );
  import.meta.hot.lastModified = "1711326193199.2974";
}
function SuccessModal() {
  _s();
  const navigate = useNavigate();
  const handleRedirection = () => {
    navigate("/profile");
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(EmojiConfetti, {}, void 0, false, {
      fileName: "app/components/SuccessModal.tsx",
      lineNumber: 38,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Modal, { onClose: handleRedirection, className: "flex flex-col items-center gap-6 pb-12", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", { className: "max-w-md dark:hidden block", src: "/assets/finally_pro.svg", alt: "formmy ghost" }, void 0, false, {
        fileName: "app/components/SuccessModal.tsx",
        lineNumber: 40,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", { className: "max-w-md hidden dark:block", src: "/assets/finally-pro-dark.svg", alt: "formmy ghost" }, void 0, false, {
        fileName: "app/components/SuccessModal.tsx",
        lineNumber: 41,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { className: "dark:text-white text-space-800 text-center text-3xl font-bold tracking-wide", children: "\xA1Felicidades! Ahora eres todo un PRO \u2728" }, void 0, false, {
        fileName: "app/components/SuccessModal.tsx",
        lineNumber: 42,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "dark:text-gray-400 text-gray-600 text-lg font-light  tracking-wide max-w-2xl text-center whitespace-pre-line", children: [
        "\xA1Acabas de desbloquear todas las funcionalidades! ",
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("br", {}, void 0, false, {
          fileName: "app/components/SuccessModal.tsx",
          lineNumber: 46,
          columnNumber: 61
        }, this),
        "Utilizalas en todos tus formmys y mejora la experiencia de tus clientes. \u{1F60D}"
      ] }, void 0, true, {
        fileName: "app/components/SuccessModal.tsx",
        lineNumber: 45,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, { type: "button", onClick: handleRedirection, children: "\xA1Ya quiero empezar!" }, void 0, false, {
        fileName: "app/components/SuccessModal.tsx",
        lineNumber: 50,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/SuccessModal.tsx",
      lineNumber: 39,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/SuccessModal.tsx",
    lineNumber: 37,
    columnNumber: 10
  }, this);
}
_s(SuccessModal, "CzcTeTziyjMsSrAVmHuCCb6+Bfg=", false, function() {
  return [useNavigate];
});
_c = SuccessModal;
var _c;
$RefreshReg$(_c, "SuccessModal");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/routes/profile.tsx
var import_stripe = __toESM(require_stripe());
var import_jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/profile.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s2 = $RefreshSig$();
var _s22 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/profile.tsx"
  );
  import.meta.hot.lastModified = "1716402216132.29";
}
function Profile() {
  _s2();
  const {
    user,
    success,
    subscription
  } = useLoaderData();
  const navigation = useNavigation();
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(import_jsx_dev_runtime2.Fragment, { children: [
    success && /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(SuccessModal, {}, void 0, false, {
      fileName: "app/routes/profile.tsx",
      lineNumber: 70,
      columnNumber: 19
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(NavBar_default, { user }, void 0, false, {
      fileName: "app/routes/profile.tsx",
      lineNumber: 71,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("section", { className: "dark:bg-space-900 min-h-screen", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("section", { className: "pt-40 pb-20 px-4 md:px-0 lg:max-w-6xl max-w-3xl mx-auto text-space-500 dark:text-space-300", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h2", { className: "text-4xl md:text-5xl text-space-800 dark:text-white font-semibold", children: "Mi perfil" }, void 0, false, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 74,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "mt-12 flex gap-4 items-center", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("img", { className: "h-20 w-20 rounded-full", alt: "user", src: user.picture }, void 0, false, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 78,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h3", { className: "text-space-800 dark:text-white font-semibold", children: user.name }, void 0, false, {
            fileName: "app/routes/profile.tsx",
            lineNumber: 80,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "text-gray-600 dark:text-gray-400 font-light", children: user.email }, void 0, false, {
            fileName: "app/routes/profile.tsx",
            lineNumber: 83,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 79,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 77,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("hr", { className: "my-10 dark:border-t-white/10" }, void 0, false, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 88,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h2", { className: "text-xl md:text-2xl text-space-800 dark:text-white font-semibold", children: "Plan" }, void 0, false, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 89,
        columnNumber: 11
      }, this),
      user.plan === "PRO" ? /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(CardPro, { isLoading: navigation.state === "submitting", endDate: subscription.endDate, planPrice: subscription.planPrice }, void 0, false, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 92,
        columnNumber: 34
      }, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(CardFree, {}, void 0, false, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 92,
        columnNumber: 160
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/profile.tsx",
      lineNumber: 73,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/routes/profile.tsx",
      lineNumber: 72,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/profile.tsx",
    lineNumber: 69,
    columnNumber: 10
  }, this);
}
_s2(Profile, "Xj/agAAmxZMfx93L71BpuAYvJFM=", false, function() {
  return [useLoaderData, useNavigation];
});
_c2 = Profile;
var CardFree = () => {
  _s22();
  const fetcher = useFetcher();
  const {
    save
  } = useLocalStorage();
  const handleOnClickMonthlySuscription = () => {
    save("from_landing", true);
    fetcher.submit({
      intent: "monthly-suscription-checkout"
    }, {
      method: "post",
      action: "/api/stripe"
    });
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("section", { className: "border-gray-100 dark:bg-[#23252D]  dark:border-none border-[1px] rounded-2xl py-8 px-6 my-6 flex flex-wrap md:flex-nowrap", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Form, { method: "post", className: "min-w-[320px] relative pb-20 md:pb-0", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h3", { className: "text-space-800 dark:text-white text-2xl font-semibold", children: "FREE" }, void 0, false, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 131,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "font-light text-space-500  dark:text-space-400", children: "Perfecto para ti y tu sitio web" }, void 0, false, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 134,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h4", { className: "mt-12 text-[32px] text-space-800 dark:text-white font-bold", children: [
        "$ 0 ",
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("span", { className: "text-space-600 font-light text-base", children: "/mes" }, void 0, false, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 138,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 137,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { name: "intent", value: "manage-stripe", type: "submit", className: twMerge("absolute bottom-0 left-0 mt-8 bg-brand-500 text-lg font-normal h-[48px] rounded-full text-[#fff]  px-8 hover:scale-105 transition-all mb-1 block  disabled:bg-gray-600"), children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("span", { onClick: handleOnClickMonthlySuscription, children: [
        "Mejorar mi plan \u2192",
        " "
      ] }, void 0, true, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 141,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 140,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/profile.tsx",
      lineNumber: 130,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "mt-10 md:mt-0", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h4", { className: "font-semibold text-gray-600  dark:text-gray-400 mt-10 mb-2", children: "Funcionalidades" }, void 0, false, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 147,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "text-gray-600 dark:text-space-400 font-light flex flex-col gap-3", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { children: "\u{1F4CB} 3 proyectos" }, void 0, false, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 151,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { children: "\u{1F4AC} Mensajes ilimitados" }, void 0, false, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 152,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { children: "\u{1F4EA} Notificaciones v\xEDa email" }, void 0, false, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 153,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { children: "\u{1F3A8} Personalizaci\xF3n de formularios" }, void 0, false, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 154,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { children: "\u{1F3AF} Dashboard para administrar tus mensajes" }, void 0, false, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 155,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 150,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/profile.tsx",
      lineNumber: 146,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/profile.tsx",
    lineNumber: 129,
    columnNumber: 10
  }, this);
};
_s22(CardFree, "QDpAlpqm0dL2zIvH9CLZzQ8Z29M=", false, function() {
  return [useFetcher, useLocalStorage];
});
_c22 = CardFree;
var CardPro = ({
  isLoading,
  planPrice,
  endDate
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("section", { style: {
    backgroundImage: `url("/assets/thunder-back.svg")`,
    backgroundPosition: "bottom right",
    backgroundRepeat: "no-repeat"
  }, className: "border-gray-100 border-[1px] dark:bg-[#23252D] dark:border-none rounded-2xl py-8 px-6 my-6 flex flex-wrap md:flex-nowrap", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Form, { method: "post", className: "min-w-[320px] relative pb-20 md:pb-0", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h3", { className: "text-space-800 dark:text-white text-2xl font-semibold", children: "PRO \u2728" }, void 0, false, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 175,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "font-light text-space-500  dark:text-space-400", children: "Ideal si eres freelancer" }, void 0, false, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 178,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h4", { className: "mt-12 text-[32px] text-space-800 dark:text-white font-bold", children: [
        "$ ",
        planPrice,
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("span", { className: "text-space-600 font-light text-base ml-2", children: "USD /mes" }, void 0, false, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 183,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 181,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { disabled: isLoading, name: "intent", value: "manage-stripe", type: "submit", className: twMerge("absolute bottom-0 left-0 mt-8 bg-brand-500 text-lg font-normal h-[48px] rounded-full text-[#fff]  px-8 hover:scale-105 transition-all mb-1 block  disabled:bg-gray-600"), children: isLoading ? /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Spinner, {}, void 0, false, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 188,
        columnNumber: 24
      }, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("span", { children: "Administrar mi plan \u2192 " }, void 0, false, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 188,
        columnNumber: 38
      }, this) }, void 0, false, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 187,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/profile.tsx",
      lineNumber: 174,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "mt-10 md:mt-0", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h4", { className: "font-semibold  text-space-800   dark:text-gray-400", children: "Renovaci\xF3n" }, void 0, false, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 192,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "text-gray-600 dark:text-space-400 font-light my-2", children: [
        "Siguiente fecha de facturaci\xF3n",
        " ",
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("strong", { className: "font-medium", children: new Date(endDate).toLocaleDateString("es-MX", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }) }, void 0, false, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 197,
          columnNumber: 11
        }, this),
        "."
      ] }, void 0, true, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 195,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "text-gray-600 dark:text-space-400 font-light", children: [
        "Si no quieres que tu suscripci\xF3n se renueve, canc\xE9lala al menos",
        " ",
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("strong", { className: "font-medium", children: "1 d\xEDa antes" }, void 0, false, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 209,
          columnNumber: 11
        }, this),
        "."
      ] }, void 0, true, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 207,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h4", { className: "font-semibold  text-space-800   dark:text-gray-400 mt-10 mb-2", children: "Funcionalidades" }, void 0, false, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 211,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "text-gray-600 dark:text-space-400 font-light flex flex-col gap-3", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { children: "\u{1F4CB} Proyectos ilimitados" }, void 0, false, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 215,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { children: "\u{1F4AC} Mensajes ilimitados" }, void 0, false, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 216,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { children: "\u{1F4EA} Notificaciones v\xEDa email" }, void 0, false, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 217,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { children: "\u{1F3A8} M\xE1s opciones para personalizar tus formularios" }, void 0, false, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 218,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { children: "\u{1F468}\u200D\u{1F469}\u200D\u{1F466}\u200D\u{1F466} Administraci\xF3n de usuarios" }, void 0, false, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 219,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { children: "\u{1F3AF} Dashboard para administrar tus mensajes" }, void 0, false, {
          fileName: "app/routes/profile.tsx",
          lineNumber: 220,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/profile.tsx",
        lineNumber: 214,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/profile.tsx",
      lineNumber: 191,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/profile.tsx",
    lineNumber: 169,
    columnNumber: 10
  }, this);
};
_c3 = CardPro;
var _c2;
var _c22;
var _c3;
$RefreshReg$(_c2, "Profile");
$RefreshReg$(_c22, "CardFree");
$RefreshReg$(_c3, "CardPro");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Profile as default
};
//# sourceMappingURL=/build/routes/profile-7IDAI4JZ.js.map
