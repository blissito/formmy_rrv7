import {
  ProTag
} from "/build/_shared/chunk-OMYSDXL4.js";
import {
  useLocalStorage
} from "/build/_shared/chunk-SGWSEZXL.js";
import {
  BsSearch,
  BsThreeDots
} from "/build/_shared/chunk-2E2SUJIS.js";
import {
  GenIcon,
  NavBar_default,
  qe
} from "/build/_shared/chunk-EFXLBPE4.js";
import {
  ConfirmModal
} from "/build/_shared/chunk-3UHNKOCO.js";
import {
  Button
} from "/build/_shared/chunk-QZYI3ZKT.js";
import {
  twMerge
} from "/build/_shared/chunk-B3ATQ6F7.js";
import {
  require_db
} from "/build/_shared/chunk-KONDUBG3.js";
import {
  require_node
} from "/build/_shared/chunk-G7CHZRZX.js";
import {
  Form,
  Link,
  Outlet,
  useActionData,
  useLoaderData2 as useLoaderData,
  useNavigation
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

// app/routes/dash.tsx
var import_node = __toESM(require_node());
var import_db = __toESM(require_db());

// app/components/Menu.tsx
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/components/Menu.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/components/Menu.tsx"
  );
  import.meta.hot.lastModified = "1707709500238.9924";
}
function Dropdown({
  items,
  trigger
}) {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(qe, { children: [
    trigger,
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(qe.Items, { children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(qe.Item, { children: ({
        active
      }) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", { className: `${active && "bg-blue-500"}`, href: "/account-settings", children: "Documentation" }, void 0, false, {
        fileName: "app/components/Menu.tsx",
        lineNumber: 32,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "app/components/Menu.tsx",
        lineNumber: 29,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(qe.Item, { disabled: true, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "opacity-75", children: "Invite a friend (coming soon!)" }, void 0, false, {
        fileName: "app/components/Menu.tsx",
        lineNumber: 37,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/components/Menu.tsx",
        lineNumber: 36,
        columnNumber: 9
      }, this),
      items
    ] }, void 0, true, {
      fileName: "app/components/Menu.tsx",
      lineNumber: 28,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/components/Menu.tsx",
    lineNumber: 26,
    columnNumber: 10
  }, this);
}
_c = Dropdown;
var DropdownItem = ({
  children
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(qe.Item, { children: ({
    active
  }) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", { className: `${active && "bg-blue-500"}`, href: "/account-settings", children }, void 0, false, {
    fileName: "app/components/Menu.tsx",
    lineNumber: 50,
    columnNumber: 11
  }, this) }, void 0, false, {
    fileName: "app/components/Menu.tsx",
    lineNumber: 47,
    columnNumber: 10
  }, this);
};
_c2 = DropdownItem;
var MenuTrigger = ({
  children
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(qe.Button, { children }, void 0, false, {
    fileName: "app/components/Menu.tsx",
    lineNumber: 59,
    columnNumber: 10
  }, this);
};
_c3 = MenuTrigger;
var _c;
var _c2;
var _c3;
$RefreshReg$(_c, "Dropdown");
$RefreshReg$(_c2, "DropdownItem");
$RefreshReg$(_c3, "MenuTrigger");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

// node_modules/react-icons/si/index.esm.js
function SiAmazoncloudwatch(props) {
  return GenIcon({ "tag": "svg", "attr": { "role": "img", "viewBox": "0 0 24 24" }, "child": [{ "tag": "title", "attr": {}, "child": [] }, { "tag": "path", "attr": { "d": "M18.454 14.905c0-1.676-1.372-3.039-3.059-3.039-1.686 0-3.058 1.363-3.058 3.039 0 1.675 1.372 3.038 3.058 3.038 1.687 0 3.059-1.363 3.059-3.038Zm.862 0c0 2.147-1.759 3.894-3.92 3.894-2.162 0-3.92-1.747-3.92-3.894 0-2.148 1.758-3.895 3.92-3.895 2.161 0 3.92 1.747 3.92 3.895Zm3.617 5.87-3.004-2.688c-.242.34-.523.649-.834.926l2.999 2.687c.256.23.654.208.885-.046a.623.623 0 0 0-.046-.88Zm-7.538-1.206c2.59 0 4.696-2.092 4.696-4.664 0-2.573-2.106-4.665-4.696-4.665-2.589 0-4.696 2.092-4.696 4.665 0 2.572 2.107 4.664 4.696 4.664Zm8.224 2.658c-.293.323-.7.487-1.107.487a1.49 1.49 0 0 1-.995-.378L18.399 19.542a5.543 5.543 0 0 1-3.004.883c-3.064 0-5.557-2.476-5.557-5.52 0-3.044 2.493-5.521 5.557-5.521 3.065 0 5.558 2.477 5.558 5.52 0 .874-.21 1.697-.576 2.432l3.133 2.803c.608.546.657 1.482.11 2.088ZM3.977 7.454c0 .222.014.444.04.659a.426.426 0 0 1-.352.473C2.605 8.858.862 9.681.862 12.148c0 1.863 1.034 2.892 1.902 3.427.297.185.647.284 1.017.288l5.195.005v.856l-5.2-.005a2.815 2.815 0 0 1-1.469-.418C1.447 15.77 0 14.524 0 12.148c0-2.864 1.971-3.923 3.129-4.297a6.093 6.093 0 0 1-.013-.397c0-2.34 1.598-4.767 3.716-5.645 2.478-1.031 5.104-.52 7.022 1.367a7.048 7.048 0 0 1 1.459 2.116 2.79 2.79 0 0 1 1.78-.644c1.287 0 2.735.97 2.993 3.092 1.205.276 3.751 1.24 3.751 4.441 0 1.278-.403 2.333-1.199 3.137l-.614-.6c.632-.638.952-1.491.952-2.537 0-2.8-2.36-3.495-3.374-3.664a.43.43 0 0 1-.353-.496c-.141-1.738-1.18-2.517-2.156-2.517-.616 0-1.193.298-1.584.818a.431.431 0 0 1-.75-.111c-.353-.971-.861-1.788-1.511-2.426-1.663-1.636-3.936-2.079-6.084-1.186-1.787.74-3.187 2.873-3.187 4.855Z" } }] })(props);
}

// app/routes/dash.tsx
var import_react3 = __toESM(require_react());

// node_modules/react-icons/io5/index.esm.js
function IoMailUnreadOutline(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "fill": "none", "strokeLinecap": "round", "strokeLinejoin": "round", "strokeWidth": "32", "d": "M320 96H88a40 40 0 00-40 40v240a40 40 0 0040 40h334.73a40 40 0 0040-40V239" } }, { "tag": "path", "attr": { "fill": "none", "strokeLinecap": "round", "strokeLinejoin": "round", "strokeWidth": "32", "d": "M112 160l144 112 87-65.67" } }, { "tag": "circle", "attr": { "cx": "431.95", "cy": "128.05", "r": "47.95" } }, { "tag": "path", "attr": { "d": "M432 192a63.95 63.95 0 1163.95-63.95A64 64 0 01432 192zm0-95.9a32 32 0 1031.95 32 32 32 0 00-31.95-32z" } }] })(props);
}
function IoReturnUpBackOutline(props) {
  return GenIcon({ "tag": "svg", "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "fill": "none", "strokeLinecap": "round", "strokeLinejoin": "round", "strokeWidth": "32", "d": "M112 160l-64 64 64 64" } }, { "tag": "path", "attr": { "fill": "none", "strokeLinecap": "round", "strokeLinejoin": "round", "strokeWidth": "32", "d": "M64 224h294c58.76 0 106 49.33 106 108v20" } }] })(props);
}

// app/routes/dash.tsx
var import_jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/dash.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/dash.tsx"
  );
  import.meta.hot.lastModified = "1737642690815.2126";
}
var BackGround = ({
  className
}) => /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("section", { className: twMerge("bg-[#fff] dark:bg-space-900 absolute w-full -z-10 h-full", className) }, void 0, false, {
  fileName: "app/routes/dash.tsx",
  lineNumber: 105,
  columnNumber: 7
}, this);
_c4 = BackGround;
function Dash() {
  _s();
  const actionData = useActionData();
  const navigation = useNavigation();
  const {
    user,
    projects,
    permission,
    invitedProyects
  } = useLoaderData();
  const [filtered, setFiltered] = (0, import_react3.useState)(projects.concat(invitedProyects));
  const [isSearch, setIsSearch] = (0, import_react3.useState)();
  const [isProOpen, setIsProOpen] = (0, import_react3.useState)(false);
  const {
    get,
    save
  } = useLocalStorage();
  const [showModal, setShowModal] = (0, import_react3.useState)(false);
  const onSearch = ({
    target: {
      value
    }
  }) => {
    setIsSearch(value);
    setFiltered(projects.filter((pro) => {
      var _a;
      return (_a = pro.name) == null ? void 0 : _a.toLocaleLowerCase().includes(value.toLocaleLowerCase());
    }));
  };
  const isLimited = user.plan === "PRO" ? false : projects.length > 2;
  (0, import_react3.useEffect)(() => {
    const value = get("from_landing");
    if (value) {
      setShowModal(true);
      save("from_landing", false);
    }
  }, []);
  (0, import_react3.useEffect)(() => {
    if (actionData == null ? void 0 : actionData.close) {
      setShowInviteModal(false);
      setTimeout(location.reload, 2e3);
    }
  }, [actionData]);
  const [showInviteModal, setShowInviteModal] = (0, import_react3.useState)(!!permission);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(import_jsx_dev_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(ConfirmModal, { onClose: () => setShowInviteModal(false), isOpen: showInviteModal, message: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "text-base font-normal text-center mb-6  text-gray-600 dark:text-space-400", children: [
      "Te han invitado al Formmy:",
      " ",
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("strong", { children: permission == null ? void 0 : permission.project.name }, void 0, false, {
        fileName: "app/routes/dash.tsx",
        lineNumber: 198,
        columnNumber: 13
      }, this),
      " . Acepta la invitaci\xF3n si quieres ser parte del proyecto."
    ] }, void 0, true, {
      fileName: "app/routes/dash.tsx",
      lineNumber: 196,
      columnNumber: 97
    }, this), footer: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Form, { method: "post", className: "flex gap-6 mb-12", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("input", { className: "hidden", name: "permissionId", value: permission == null ? void 0 : permission.id }, void 0, false, {
        fileName: "app/routes/dash.tsx",
        lineNumber: 201,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Button, { isDisabled: navigation.state !== "idle", type: "submit", name: "intent", value: "reject_invite", autoFocus: true, className: "bg-gray-100 text-gray-600", children: "Rechazar" }, void 0, false, {
        fileName: "app/routes/dash.tsx",
        lineNumber: 202,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Button, { isDisabled: navigation.state !== "submitting" && navigation.state !== "idle", isLoading: navigation.state === "submitting", name: "intent", value: "accept_invite", type: "submit", className: "text-clear", children: "Aceptar invitaci\xF3n" }, void 0, false, {
        fileName: "app/routes/dash.tsx",
        lineNumber: 205,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash.tsx",
      lineNumber: 200,
      columnNumber: 25
    }, this), emojis: "\u{1F4E2} \u{1F4E9}", title: "\xA1Hey! Tienes una invitaci\xF3n pendiente" }, void 0, false, {
      fileName: "app/routes/dash.tsx",
      lineNumber: 196,
      columnNumber: 7
    }, this),
    user.plan === "FREE" && showModal && /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(ProTag, { isOpen: true }, void 0, false, {
      fileName: "app/routes/dash.tsx",
      lineNumber: 209,
      columnNumber: 45
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("section", { className: " bg-clear dark:bg-space-900", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(NavBar_default, { user }, void 0, false, {
        fileName: "app/routes/dash.tsx",
        lineNumber: 211,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(BackGround, {}, void 0, false, {
        fileName: "app/routes/dash.tsx",
        lineNumber: 212,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("main", { className: "py-32 px-4 max-w-6xl mx-auto min-h-screen h-full text-space-800 dark:text-space-900 ", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("nav", { className: "flex gap-2 flex-wrap justify-between items-center", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h2", { className: "text-3xl font-bold dark:text-white text-space-800", children: "Tus Formmys" }, void 0, false, {
            fileName: "app/routes/dash.tsx",
            lineNumber: 216,
            columnNumber: 15
          }, this) }, void 0, false, {
            fileName: "app/routes/dash.tsx",
            lineNumber: 215,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "flex gap-2 mt-2 md:mt-0 w-full md:w-fit	", children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "relative w-full", children: [
              /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("span", { className: "absolute top-3 left-2 text-gray-400", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(BsSearch, {}, void 0, false, {
                fileName: "app/routes/dash.tsx",
                lineNumber: 223,
                columnNumber: 19
              }, this) }, void 0, false, {
                fileName: "app/routes/dash.tsx",
                lineNumber: 222,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("input", { disabled: true, onChange: onSearch, type: "search", placeholder: "Busca un Formmy", className: twMerge("disabled:cursor-not-allowed", " cursor-pointer text-gray-600 dark:text-white pl-8 border-none input dark:bg-[#1D2027] bg-[#F7F7F9] placeholder:text-space-300 placeholder-gray-400 focus:ring-1 focus:ring-brand-500 placeholder:font-light rounded-lg w-full"), name: "search" }, void 0, false, {
                fileName: "app/routes/dash.tsx",
                lineNumber: 225,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "app/routes/dash.tsx",
              lineNumber: 221,
              columnNumber: 15
            }, this),
            !isLimited && /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Link, { to: "new", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { className: "h-10 w-[auto] md:min-w-[120px] flex gap-1 items-center bg-brand-500 py-3 px-6 rounded-md text-clear hover:ring transition-all", children: [
              "+ ",
              /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("span", { className: "", children: "Formmy" }, void 0, false, {
                fileName: "app/routes/dash.tsx",
                lineNumber: 230,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "app/routes/dash.tsx",
              lineNumber: 229,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "app/routes/dash.tsx",
              lineNumber: 228,
              columnNumber: 30
            }, this),
            isLimited && /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { className: "relative bg-gray-300 h-10 w-[auto] md:min-w-[120px] flex gap-1 items-center py-3 px-6 rounded-md text-gray-400 dark:text-gray-500 hover:ring transition-all", onClick: () => setIsProOpen(true), children: [
              "+ ",
              /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("span", { className: "", children: "Formmy" }, void 0, false, {
                fileName: "app/routes/dash.tsx",
                lineNumber: 235,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(ProTag, { isOpen: isProOpen, onChange: (val) => setIsProOpen(val) }, void 0, false, {
                fileName: "app/routes/dash.tsx",
                lineNumber: 236,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "app/routes/dash.tsx",
              lineNumber: 234,
              columnNumber: 29
            }, this)
          ] }, void 0, true, {
            fileName: "app/routes/dash.tsx",
            lineNumber: 220,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/dash.tsx",
          lineNumber: 214,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("section", { className: "py-10 md:py-16 flex flex-wrap gap-4", children: [
          filtered.map((p) => /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(
            ProjectCard,
            {
              isInvite: p.userId !== user.id,
              project: p,
              ...p
            },
            p.id,
            false,
            {
              fileName: "app/routes/dash.tsx",
              lineNumber: 241,
              columnNumber: 32
            },
            this
          )),
          filtered.length < 1 && /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "mx-auto text-center flex flex-col justify-center", children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("img", { className: "flex dark:hidden w-[320px] mx-auto", src: "/assets/empty_ghost.svg", alt: "empty ghost" }, void 0, false, {
              fileName: "app/routes/dash.tsx",
              lineNumber: 246,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("img", { className: "hidden dark:flex w-[320px] mx-auto", src: "/assets/empty-ghost-dark.svg", alt: "empty ghost" }, void 0, false, {
              fileName: "app/routes/dash.tsx",
              lineNumber: 247,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h2", { className: "font-bold mt-8 text-space-800 dark:text-white text-lg", children: "\xA1Nada por aqu\xED!" }, void 0, false, {
              fileName: "app/routes/dash.tsx",
              lineNumber: 248,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "font-light mt-4 text-space-600 dark:text-space-400", children: [
              !isSearch && " Crea tu primer Formmy y empieza a recibir mensajes.",
              isSearch && "No encontramos ning\xFAn Formmy con ese nombre. Intenta con otro."
            ] }, void 0, true, {
              fileName: "app/routes/dash.tsx",
              lineNumber: 251,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "app/routes/dash.tsx",
            lineNumber: 245,
            columnNumber: 37
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/dash.tsx",
          lineNumber: 240,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/dash.tsx",
        lineNumber: 213,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Outlet, {}, void 0, false, {
        fileName: "app/routes/dash.tsx",
        lineNumber: 258,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash.tsx",
      lineNumber: 210,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dash.tsx",
    lineNumber: 195,
    columnNumber: 10
  }, this);
}
_s(Dash, "/dtmMnKyeQZ593MPsSudvLZQsig=", false, function() {
  return [useActionData, useNavigation, useLoaderData, useLocalStorage];
});
_c22 = Dash;
var DotsMenu = () => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Dropdown, { items: [], trigger: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("button", { onClick: (e) => {
    e.stopPropagation();
  }, className: "p-4 cursor-pointer hover:scale-110", children: /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(BsThreeDots, {}, void 0, false, {
    fileName: "app/routes/dash.tsx",
    lineNumber: 270,
    columnNumber: 11
  }, this) }, void 0, false, {
    fileName: "app/routes/dash.tsx",
    lineNumber: 267,
    columnNumber: 40
  }, this) }, void 0, false, {
    fileName: "app/routes/dash.tsx",
    lineNumber: 267,
    columnNumber: 10
  }, this);
};
_c32 = DotsMenu;
var ProjectCard = ({
  isInvite,
  actionNode,
  project,
  name,
  id
}) => {
  var _a;
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(Link, { to: id != null ? id : "", className: " shadow-[0_4px_16px_0px_rgba(204,204,204,0.25)] hover:shadow-[0_4px_16px_0px_rgba(204,204,204,0.50)]\n        dark:shadow-none border border-[#E0E0EE] dark:border-clear/10 bg-[#fff] dark:bg-dark rounded-md p-4   w-[268px] cursor-pointer  transition-all", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("section", { className: "flex justify-between items-center", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("h2", { className: "text-xl font-medium dark:text-white text-space-800 truncate", children: name }, void 0, false, {
        fileName: "app/routes/dash.tsx",
        lineNumber: 284,
        columnNumber: 9
      }, this),
      actionNode,
      project.type && /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(ModificameBRENDIYellowCorner, {}, void 0, false, {
        fileName: "app/routes/dash.tsx",
        lineNumber: 288,
        columnNumber: 26
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash.tsx",
      lineNumber: 283,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "flex text-sm gap-4 mt-4 justify-between", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "text-space-600 dark:text-space-400 font-normal ", children: [
        "\u{1F4AC} ",
        (_a = project.answers) == null ? void 0 : _a.length,
        " mensajes"
      ] }, void 0, true, {
        fileName: "app/routes/dash.tsx",
        lineNumber: 291,
        columnNumber: 9
      }, this),
      isInvite && /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(ModificameBRENDIPurpleCorner, {}, void 0, false, {
        fileName: "app/routes/dash.tsx",
        lineNumber: 294,
        columnNumber: 22
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash.tsx",
      lineNumber: 290,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dash.tsx",
    lineNumber: 281,
    columnNumber: 10
  }, this);
};
_c42 = ProjectCard;
var ModificameBRENDIPurpleCorner = () => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("p", { className: "bg-brand-300 text-clear rounded px-1 flex gap-1 items-center", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(SiAmazoncloudwatch, {}, void 0, false, {
      fileName: "app/routes/dash.tsx",
      lineNumber: 301,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("span", { className: "text-clear text-xs", children: "Solo lectura" }, void 0, false, {
      fileName: "app/routes/dash.tsx",
      lineNumber: 302,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dash.tsx",
    lineNumber: 300,
    columnNumber: 10
  }, this);
};
_c5 = ModificameBRENDIPurpleCorner;
var ModificameBRENDIYellowCorner = () => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "group relative border-[1px] text-gray-400 border-gray-400 border-dashed w-7 h-7 flex items-center justify-center rounded-full", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)(IoMailUnreadOutline, {}, void 0, false, {
      fileName: "app/routes/dash.tsx",
      lineNumber: 308,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime2.jsxDEV)("div", { className: "scale-0 group-hover:scale-100 absolute top-8 transition-all -right-4 bg-dark text-white h-4 w-fit px-2 text-xs rounded-md", children: "Suscripci\xF3n" }, void 0, false, {
      fileName: "app/routes/dash.tsx",
      lineNumber: 309,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dash.tsx",
    lineNumber: 307,
    columnNumber: 10
  }, this);
};
_c6 = ModificameBRENDIYellowCorner;
var _c4;
var _c22;
var _c32;
var _c42;
var _c5;
var _c6;
$RefreshReg$(_c4, "BackGround");
$RefreshReg$(_c22, "Dash");
$RefreshReg$(_c32, "DotsMenu");
$RefreshReg$(_c42, "ProjectCard");
$RefreshReg$(_c5, "ModificameBRENDIPurpleCorner");
$RefreshReg$(_c6, "ModificameBRENDIYellowCorner");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

export {
  IoReturnUpBackOutline,
  BackGround,
  Dash,
  ModificameBRENDIPurpleCorner
};
//# sourceMappingURL=/build/_shared/chunk-N7VDZ2JV.js.map
