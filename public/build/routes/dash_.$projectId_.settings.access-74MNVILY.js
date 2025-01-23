import {
  z
} from "/build/_shared/chunk-YSJMGTXM.js";
import "/build/_shared/chunk-N7VDZ2JV.js";
import "/build/_shared/chunk-IYD4CINF.js";
import "/build/_shared/chunk-OMYSDXL4.js";
import {
  FaUsers
} from "/build/_shared/chunk-SGWSEZXL.js";
import "/build/_shared/chunk-2E2SUJIS.js";
import {
  Toggle
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
import {
  require_db
} from "/build/_shared/chunk-KONDUBG3.js";
import {
  require_node
} from "/build/_shared/chunk-G7CHZRZX.js";
import "/build/_shared/chunk-GIAAE3CH.js";
import {
  Form,
  useActionData,
  useFetcher2 as useFetcher,
  useLoaderData2 as useLoaderData,
  useNavigation
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

// app/routes/dash_.$projectId_.settings.access.tsx
var import_node = __toESM(require_node());

// app/components/icons/TrashIcon.tsx
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/icons/TrashIcon.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/icons/TrashIcon.tsx"
  );
  import.meta.hot.lastModified = "1708441241610.1116";
}
var TrashIcon = ({
  fill = "#ED695F"
}) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("svg", { width: "28", height: "28", viewBox: "0 0 28 28", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("path", { d: "M21.175 10.6689L20.825 21.2625C20.7952 22.1698 20.413 23.0297 19.7595 23.6598C19.106 24.2899 18.2328 24.6406 17.325 24.6374H10.675C9.76781 24.6406 8.89503 24.2905 8.24166 23.6611C7.58829 23.0317 7.2057 22.1727 7.17499 21.266L6.82499 10.6689C6.81734 10.4368 6.90218 10.2112 7.06086 10.0417C7.21954 9.87219 7.43905 9.77266 7.67112 9.765C7.90318 9.75734 8.12878 9.84218 8.29829 10.0009C8.4678 10.1595 8.56734 10.3791 8.57499 10.6111L8.92499 21.2074C8.94242 21.6597 9.13446 22.0877 9.46078 22.4015C9.7871 22.7152 10.2223 22.8903 10.675 22.89H17.325C17.7783 22.8903 18.214 22.7147 18.5404 22.4002C18.8668 22.0857 19.0584 21.6568 19.075 21.2039L19.425 10.6111C19.4327 10.3791 19.5322 10.1595 19.7017 10.0009C19.8712 9.84218 20.0968 9.75734 20.3289 9.765C20.5609 9.77266 20.7804 9.87219 20.9391 10.0417C21.0978 10.2112 21.1827 10.4368 21.175 10.6689ZM22.3326 7.1435C22.3326 7.37556 22.2404 7.59812 22.0763 7.76222C21.9122 7.92631 21.6897 8.0185 21.4576 8.0185H6.54324C6.31118 8.0185 6.08862 7.92631 5.92452 7.76222C5.76043 7.59812 5.66824 7.37556 5.66824 7.1435C5.66824 6.91143 5.76043 6.68887 5.92452 6.52478C6.08862 6.36068 6.31118 6.2685 6.54324 6.2685H9.25574C9.53299 6.26924 9.80059 6.16681 10.0065 5.98114C10.2124 5.79547 10.3418 5.53984 10.3696 5.264C10.4342 4.61692 10.7373 4.01706 11.22 3.58129C11.7027 3.14552 12.3303 2.90506 12.9806 2.90675H15.0194C15.6697 2.90506 16.2973 3.14552 16.78 3.58129C17.2626 4.01706 17.5658 4.61692 17.6304 5.264C17.6582 5.53984 17.7876 5.79547 17.9935 5.98114C18.1994 6.16681 18.467 6.26924 18.7442 6.2685H21.4567C21.6888 6.2685 21.9114 6.36068 22.0755 6.52478C22.2396 6.68887 22.3317 6.91143 22.3317 7.1435H22.3326ZM11.8886 6.2685H16.1131C15.9981 6.00577 15.9229 5.72738 15.89 5.4425C15.8683 5.22682 15.7674 5.02686 15.6067 4.88137C15.446 4.73588 15.237 4.65521 15.0202 4.655H12.9815C12.7647 4.65521 12.5558 4.73588 12.3951 4.88137C12.2344 5.02686 12.1334 5.22682 12.1117 5.4425C12.0785 5.72743 12.0039 6.00582 11.8886 6.2685ZM12.7697 19.5256V12.075C12.7697 11.8429 12.6776 11.6204 12.5135 11.4563C12.3494 11.2922 12.1268 11.2 11.8947 11.2C11.6627 11.2 11.4401 11.2922 11.276 11.4563C11.1119 11.6204 11.0197 11.8429 11.0197 12.075V19.5291C11.0197 19.7612 11.1119 19.9837 11.276 20.1478C11.4401 20.3119 11.6627 20.4041 11.8947 20.4041C12.1268 20.4041 12.3494 20.3119 12.5135 20.1478C12.6776 19.9837 12.7697 19.7612 12.7697 19.5291V19.5256ZM16.982 19.5256V12.075C16.982 11.8429 16.8898 11.6204 16.7257 11.4563C16.5616 11.2922 16.3391 11.2 16.107 11.2C15.8749 11.2 15.6524 11.2922 15.4883 11.4563C15.3242 11.6204 15.232 11.8429 15.232 12.075V19.5291C15.232 19.7612 15.3242 19.9837 15.4883 20.1478C15.6524 20.3119 15.8749 20.4041 16.107 20.4041C16.3391 20.4041 16.5616 20.3119 16.7257 20.1478C16.8898 19.9837 16.982 19.7612 16.982 19.5291V19.5256Z", fill }, void 0, false, {
  fileName: "app/components/icons/TrashIcon.tsx",
  lineNumber: 24,
  columnNumber: 5
}, this) }, void 0, false, {
  fileName: "app/components/icons/TrashIcon.tsx",
  lineNumber: 23,
  columnNumber: 7
}, this);
_c = TrashIcon;
var _c;
$RefreshReg$(_c, "TrashIcon");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/components/InputModalForm.tsx
var import_react2 = __toESM(require_react());
var import_jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/InputModalForm.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/InputModalForm.tsx"
  );
  import.meta.hot.lastModified = "1711326193197.4375";
}
var InputModalForm = ({
  isLoading,
  onClose,
  cta = "Invitar",
  placeholder = "ejemplo@gmail.com",
  title
}) => {
  _s();
  const [validEmail, setValidEmail] = (0, import_react2.useState)(null);
  const handleChange = (ev) => {
    const email = ev.target.value;
    const {
      success
    } = z.string().email().safeParse(email);
    if (success)
      setValidEmail(email);
    else
      setValidEmail(null);
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Modal, { onClose, children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Form, { method: "post", className: "px-6 py-8 md:py-10 gap-2 bg-clear dark:bg-space-900 rounded-3xl dark:text-white text-space-900 ", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h2", { className: "font-bold mb-10 text-2xl text-center mt-6 md:mt-0", children: title }, void 0, false, {
      fileName: "app/components/InputModalForm.tsx",
      lineNumber: 45,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "flex w-full", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("input", { onChange: handleChange, type: "email", name: "email", required: true, placeholder, className: "h-10  input font-normal w-full md:w-80 border-[1px] border-gray-100 dark:border-clear/30 dark:bg-transparent focus:outline-none focus:ring-0 bg-transparent focus:border-brand-500 rounded-bl-lg rounded-tl-lg placeholder:text-space-300" }, void 0, false, {
        fileName: "app/components/InputModalForm.tsx",
        lineNumber: 49,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { disabled: !validEmail || isLoading, name: "intent", value: "send_invite", type: "submit", className: "bg-brand-500 h-10 text-clear py-2 px-4 md:px-8 rounded-br-lg rounded-tr-lg disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "w-10 h-6", children: [
        isLoading && /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Spinner, { color: "brand" }, void 0, false, {
          fileName: "app/components/InputModalForm.tsx",
          lineNumber: 53,
          columnNumber: 29
        }, this),
        " ",
        !isLoading && cta
      ] }, void 0, true, {
        fileName: "app/components/InputModalForm.tsx",
        lineNumber: 52,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "app/components/InputModalForm.tsx",
        lineNumber: 51,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/components/InputModalForm.tsx",
      lineNumber: 48,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "h-6" }, void 0, false, {
      fileName: "app/components/InputModalForm.tsx",
      lineNumber: 57,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/InputModalForm.tsx",
    lineNumber: 44,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/components/InputModalForm.tsx",
    lineNumber: 43,
    columnNumber: 10
  }, this);
};
_s(InputModalForm, "dVW3xQe/TzZXtUE10gXfcjfB21I=");
_c2 = InputModalForm;
var _c2;
$RefreshReg$(_c2, "InputModalForm");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/routes/dash_.$projectId_.settings.access.tsx
var import_react4 = __toESM(require_react());
var import_db = __toESM(require_db());

// app/components/Pluralize.tsx
var import_jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/Pluralize.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/Pluralize.tsx"
  );
  import.meta.hot.lastModified = "1711326193198.3748";
}
var Pluralize = ({
  isPlural,
  singleWord,
  pluralWord
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime3.jsxDEV)("span", { children: isPlural ? pluralWord : singleWord }, void 0, false, {
    fileName: "app/components/Pluralize.tsx",
    lineNumber: 26,
    columnNumber: 10
  }, this);
};
_c3 = Pluralize;
var _c3;
$RefreshReg$(_c3, "Pluralize");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// app/routes/dash_.$projectId_.settings.access.tsx
var import_jsx_dev_runtime4 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/dash_.$projectId_.settings.access.tsx"' + id);
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
    "app/routes/dash_.$projectId_.settings.access.tsx"
  );
  import.meta.hot.lastModified = "1737642690821.941";
}
function Route() {
  _s2();
  const navigation = useNavigation();
  const actionData = useActionData();
  const {
    user,
    permissions,
    projectName
  } = useLoaderData();
  const [showModal, setShowModal] = (0, import_react4.useState)(false);
  (0, import_react4.useEffect)(() => {
    if (actionData && (actionData.success === true || actionData.success === false)) {
      setShowModal(false);
    }
  }, [actionData]);
  const isPlural = permissions.length > 1 || permissions.length === 0;
  return /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("article", { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("h1", { className: "font-bold text-xl", children: [
      "Usuarios de ",
      /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("span", { className: "text-brand-500", children: projectName }, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
        lineNumber: 155,
        columnNumber: 21
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 154,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("hr", { className: "mt-2 mb-6 dark:border-t-white/10" }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 157,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("nav", { className: "flex justify-between items-center", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("p", { className: "text-xs text-gray-600 dark:text-gray-400 tracking-wide", children: [
        permissions.length,
        " ",
        /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(Pluralize, { singleWord: "usuario", isPlural, pluralWord: "usuarios" }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
          lineNumber: 163,
          columnNumber: 11
        }, this),
        " ",
        /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(Pluralize, { singleWord: "agregado", isPlural, pluralWord: "agregados" }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
          lineNumber: 164,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
        lineNumber: 159,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("div", { className: "flex items-center gap-4", children: /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(Button, { onClick: () => setShowModal(true), className: "flex items-center py-1 px-2 rounded-md gap-2 max-w-[120px] m-0 hover:scale-105 transition-all hover:bg-brand-300 bg-brand-500 justify-center", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("span", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(FaUsers, {}, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
          lineNumber: 169,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
          lineNumber: 168,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("span", { children: "Agregar" }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
          lineNumber: 171,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
        lineNumber: 167,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
        lineNumber: 166,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 158,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(UserTable, { user, permissions, isLoading: navigation.state !== "idle" }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 175,
      columnNumber: 7
    }, this),
    showModal && /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(InputModalForm, { isLoading: navigation.state !== "idle", onClose: () => setShowModal(false), title: "Ingresa el correo del usuario" }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 176,
      columnNumber: 21
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
    lineNumber: 153,
    columnNumber: 10
  }, this);
}
_s2(Route, "mBYu7ah8RPGtKiiXC958+NHBupA=", false, function() {
  return [useNavigation, useActionData, useLoaderData];
});
_c4 = Route;
var UserTable = ({
  isLoading,
  user,
  permissions
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("section", { className: "my-6 rounded-t-lg", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(Row, { className: "bg-brand-300/20 dark:bg-transparent   rounded-t-xl px-4 py-1", children: /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(UserTableHeader, {}, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 190,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 189,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(Row, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(UserInfo, { isOwner: true, user }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 194,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 193,
      columnNumber: 7
    }, this),
    permissions.map((p) => /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(Row, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(UserInfo, { permission: p, isLoading }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 198,
      columnNumber: 11
    }, this) }, p.email, false, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 197,
      columnNumber: 29
    }, this))
  ] }, void 0, true, {
    fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
    lineNumber: 188,
    columnNumber: 10
  }, this);
};
_c22 = UserTable;
var UserInfo = ({
  isLoading,
  permission,
  isOwner = false,
  user
}) => {
  var _a, _b, _c6, _d, _e;
  _s22();
  const fetcher = useFetcher();
  const handleToggleNotifications = (value) => {
    fetcher.submit({
      intent: "toggle_notifications_for_permission",
      permissionId: permission.id,
      value
    }, {
      method: "POST",
      action: "/api/formmy"
    });
  };
  const avatar = "https://secure.gravatar.com/avatar/23709cd232fbb194583b2af3fe6889dd?s=256&d=mm&r=g";
  return /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(import_jsx_dev_runtime4.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("div", { className: "flex col-span-3 items-center gap-2", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("img", { onError: (ev) => {
        ev.target.onerror = null;
        ev.target.src = avatar;
      }, className: "w-[30px] h-[30px] rounded-full object-cover m-1", src: (_b = isOwner && user ? user.picture : (_a = permission == null ? void 0 : permission.user) == null ? void 0 : _a.picture) != null ? _b : avatar, alt: isOwner && user ? user.name : (_d = (_c6 = permission == null ? void 0 : permission.user) == null ? void 0 : _c6.name) != null ? _d : "avatar" }, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
        lineNumber: 225,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("p", { className: "flex flex-col", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("span", { className: "font-bold text-xs text-gray-600 dark:text-white", children: isOwner ? user == null ? void 0 : user.name : (_e = permission.user) == null ? void 0 : _e.name }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
          lineNumber: 230,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("span", { className: "text-xs text-gray-500 dark:text-gray-400 font-light", children: isOwner && user ? user.email : permission == null ? void 0 : permission.email }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
          lineNumber: 233,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
        lineNumber: 229,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 224,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("p", { className: "font-light", children: isOwner ? "Propietario" : "Invitado" }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 239,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("p", { className: twMerge("font-light text-[#66B86C] dark:text-[#37E8A3] capitalize", (permission == null ? void 0 : permission.status) === "pending" && "text-yellow-500 dark:text-yellow-500", (permission == null ? void 0 : permission.status) === "rejected" && "text-[#ED695F] dark:text-[#EB5757]"), children: isOwner ? "Active" : permission == null ? void 0 : permission.status }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 240,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(Form, { method: "post", className: twMerge("flex gap-3 items-center", isOwner && "hidden"), children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("input", { className: "hidden", name: "permissionId", defaultValue: permission == null ? void 0 : permission.id }, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
        lineNumber: 244,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("button", { name: "intent", value: "delete_permission", type: "submit", className: "group-hover:visible invisible", children: isLoading ? /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(Spinner, {}, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
        lineNumber: 246,
        columnNumber: 24
      }, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(TrashIcon, { fill: "tomato" }, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
        lineNumber: 246,
        columnNumber: 38
      }, this) }, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
        lineNumber: 245,
        columnNumber: 9
      }, this),
      (permission == null ? void 0 : permission.status) === "active" && /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(Toggle, { onChange: handleToggleNotifications, defaultValue: permission == null ? void 0 : permission.notifications }, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
        lineNumber: 248,
        columnNumber: 45
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 243,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
    lineNumber: 223,
    columnNumber: 10
  }, this);
};
_s22(UserInfo, "2WHaGQTcUOgkXDaibwUgjUp1MBY=", false, function() {
  return [useFetcher];
});
_c32 = UserInfo;
var UserTableHeader = () => {
  const classs = "text-space-800 dark:text-white text-xs font-bold py-1";
  return /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)(import_jsx_dev_runtime4.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("p", { className: twMerge(classs, "col-span-3"), children: "Usuario" }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 259,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("p", { className: classs, children: "Role" }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 261,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("p", { className: classs, children: "Estatus" }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 262,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("p", { className: classs, children: "Notificaciones" }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
      lineNumber: 263,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
    lineNumber: 258,
    columnNumber: 10
  }, this);
};
_c42 = UserTableHeader;
var Row = ({
  className,
  ...props
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime4.jsxDEV)("div", { className: twMerge("grid grid-cols-6 px-4 py-3 gap-2 border-b border-b-indigo-100 dark:border-b-white/10 text-xs items-center group", className), ...props }, void 0, false, {
    fileName: "app/routes/dash_.$projectId_.settings.access.tsx",
    lineNumber: 271,
    columnNumber: 10
  }, this);
};
_c5 = Row;
var _c4;
var _c22;
var _c32;
var _c42;
var _c5;
$RefreshReg$(_c4, "Route");
$RefreshReg$(_c22, "UserTable");
$RefreshReg$(_c32, "UserInfo");
$RefreshReg$(_c42, "UserTableHeader");
$RefreshReg$(_c5, "Row");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Route as default
};
//# sourceMappingURL=/build/routes/dash_.$projectId_.settings.access-74MNVILY.js.map
