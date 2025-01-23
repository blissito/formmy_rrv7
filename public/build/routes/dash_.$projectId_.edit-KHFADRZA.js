import {
  BiSave,
  Code,
  iconBtnClass
} from "/build/_shared/chunk-FTLGS3GR.js";
import {
  IoReturnUpBackOutline
} from "/build/_shared/chunk-N7VDZ2JV.js";
import "/build/_shared/chunk-IYD4CINF.js";
import "/build/_shared/chunk-OMYSDXL4.js";
import "/build/_shared/chunk-SGWSEZXL.js";
import "/build/_shared/chunk-2E2SUJIS.js";
import {
  NavBar_default
} from "/build/_shared/chunk-EFXLBPE4.js";
import "/build/_shared/chunk-3UHNKOCO.js";
import "/build/_shared/chunk-RGBYWDPK.js";
import "/build/_shared/chunk-QZYI3ZKT.js";
import "/build/_shared/chunk-7ZNLIBJB.js";
import "/build/_shared/chunk-XGABADQ5.js";
import "/build/_shared/chunk-ZOHFZ5HT.js";
import "/build/_shared/chunk-NMZL6IDN.js";
import "/build/_shared/chunk-QKNDBCR7.js";
import {
  twMerge
} from "/build/_shared/chunk-B3ATQ6F7.js";
import {
  require_db
} from "/build/_shared/chunk-KONDUBG3.js";
import "/build/_shared/chunk-G7CHZRZX.js";
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

// app/routes/dash_.$projectId_.edit.tsx
var import_db = __toESM(require_db());
var import_react2 = __toESM(require_react());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/dash_.$projectId_.edit.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
var _s2 = $RefreshSig$();
var _s3 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/dash_.$projectId_.edit.tsx"
  );
  import.meta.hot.lastModified = "1708284120296.6587";
}
function Detail() {
  _s();
  const {
    project,
    user
  } = useLoaderData();
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("article", { className: "min-h-screen pb-8", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(NavBar_default, { user }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.edit.tsx",
      lineNumber: 66,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("main", { className: "pt-24 px-4 max-w-4xl mx-auto text-black dark:text-slate-400 pb-6", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("nav", { className: "flex flex-col items-end md:flex-row justify-between gap-4", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex flex-col items-start gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, { to: "/dash/" + project.id, className: iconBtnClass, children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(IoReturnUpBackOutline, {}, void 0, false, {
            fileName: "app/routes/dash_.$projectId_.edit.tsx",
            lineNumber: 71,
            columnNumber: 15
          }, this) }, void 0, false, {
            fileName: "app/routes/dash_.$projectId_.edit.tsx",
            lineNumber: 70,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { className: "text-4xl font-bold", children: project.name }, void 0, false, {
            fileName: "app/routes/dash_.$projectId_.edit.tsx",
            lineNumber: 73,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { children: [
            "Id: ",
            project.id
          ] }, void 0, true, {
            fileName: "app/routes/dash_.$projectId_.edit.tsx",
            lineNumber: 74,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "app/routes/dash_.$projectId_.edit.tsx",
          lineNumber: 69,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "tooltip", "data-tip": "Guardar \u{1F4BE}", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { className: "py-3 text-md rounded-md px-4 flex gap-2 bg-indigo-500 text-white dark:text-black border-none hover:bg-indigo-600", children: [
            /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "text-xl", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(BiSave, {}, void 0, false, {
              fileName: "app/routes/dash_.$projectId_.edit.tsx",
              lineNumber: 80,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "app/routes/dash_.$projectId_.edit.tsx",
              lineNumber: 79,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Guardar cambios" }, void 0, false, {
              fileName: "app/routes/dash_.$projectId_.edit.tsx",
              lineNumber: 82,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "app/routes/dash_.$projectId_.edit.tsx",
            lineNumber: 78,
            columnNumber: 15
          }, this) }, void 0, false, {
            fileName: "app/routes/dash_.$projectId_.edit.tsx",
            lineNumber: 77,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(
            "input",
            {
              type: "search",
              placeholder: "Busca la configuraci\xF3n",
              className: "input dark:bg-slate-800 bg-slate-300 min-w-[320px]",
              name: "search"
            },
            void 0,
            false,
            {
              fileName: "app/routes/dash_.$projectId_.edit.tsx",
              lineNumber: 85,
              columnNumber: 13
            },
            this
          )
        ] }, void 0, true, {
          fileName: "app/routes/dash_.$projectId_.edit.tsx",
          lineNumber: 76,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/dash_.$projectId_.edit.tsx",
        lineNumber: 68,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Code, { project }, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.edit.tsx",
        lineNumber: 90,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(SelectTheme, {}, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.edit.tsx",
        lineNumber: 91,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash_.$projectId_.edit.tsx",
      lineNumber: 67,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dash_.$projectId_.edit.tsx",
    lineNumber: 65,
    columnNumber: 10
  }, this);
}
_s(Detail, "hdxZH0RhbpD5GbrKvJ6wZIr4o2M=", false, function() {
  return [useLoaderData];
});
_c = Detail;
var SelectQuestions = () => {
  _s2();
  const [selected, setSelected] = (0, import_react2.useState)([]);
  const handleSelection = (selection) => {
    if (selected.includes(selection)) {
      setSelected((sel) => {
        return [...sel.filter((s) => s !== selection)];
      });
      return;
    }
    setSelected((sel) => [.../* @__PURE__ */ new Set([...sel, selection])]);
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "w-full grid gap-4", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(TextField, { name: "name", label: "Nombre", isSelected: selected.includes("name"), handleSelection }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.edit.tsx",
      lineNumber: 112,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(TextField, { name: "email", label: "Email", isSelected: selected.includes("email"), handleSelection }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.edit.tsx",
      lineNumber: 113,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(TextField, { name: "tel", label: "Tel\xE9fono", isSelected: selected.includes("tel"), handleSelection }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.edit.tsx",
      lineNumber: 114,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(TextField, { name: "message", label: "Mensaje", isSelected: selected.includes("message"), handleSelection }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.edit.tsx",
      lineNumber: 115,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(TextField, { name: "color", label: "Color del bot\xF3n", isSelected: selected.includes("color"), handleSelection }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.edit.tsx",
      lineNumber: 116,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dash_.$projectId_.edit.tsx",
    lineNumber: 111,
    columnNumber: 10
  }, this);
};
_s2(SelectQuestions, "lGSfRvmoWXlCcuuisg7PtZk/Isc=");
_c2 = SelectQuestions;
var TextField = ({
  handleSelection,
  isSelected,
  name,
  label
}) => {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", { htmlFor: name, className: twMerge("cursor-pointer w-full block label-checked:ring label-checked:ring-indigo-500 rounded-md py-2 px-4 text-center border border-slate-800", isSelected && "ring ring-blue-500 "), children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: label }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.edit.tsx",
      lineNumber: 128,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", { onChange: () => handleSelection(name), hidden: true, checked: isSelected, type: "checkbox", className: "input", name, id: name }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.edit.tsx",
      lineNumber: 129,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dash_.$projectId_.edit.tsx",
    lineNumber: 127,
    columnNumber: 10
  }, this);
};
_c3 = TextField;
var SelectTheme = () => {
  _s3();
  const [selected, setSelected] = (0, import_react2.useState)("dark");
  const handleSelect = (theme) => {
    setSelected(theme);
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("section", { className: "flex gap-8", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex gap-4 flex-wrap flex-1", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick: () => handleSelect("light"), className: twMerge("border border-slate-800 cursor-pointer py-8 px-8 hover:ring hover:ring-indigo-800 rounded-md text-center", selected === "light" && "ring ring-blue-500 hover:ring-blue-500"), children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", { className: "object-cover w-32", src: "/assets/form_light.png", alt: "light" }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.edit.tsx",
          lineNumber: 142,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Light" }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.edit.tsx",
          lineNumber: 143,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/dash_.$projectId_.edit.tsx",
        lineNumber: 141,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick: () => handleSelect("dark"), className: twMerge("border border-slate-800 cursor-pointer py-8 px-8 hover:ring hover:ring-indigo-800/50 rounded-md text-center", selected === "dark" && "ring ring-blue-500 hover:ring-blue-500"), children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", { className: "object-cover w-32", src: "/assets/form_dark.png", alt: "light" }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.edit.tsx",
          lineNumber: 146,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Dark" }, void 0, false, {
          fileName: "app/routes/dash_.$projectId_.edit.tsx",
          lineNumber: 147,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/dash_.$projectId_.edit.tsx",
        lineNumber: 145,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(SelectQuestions, {}, void 0, false, {
        fileName: "app/routes/dash_.$projectId_.edit.tsx",
        lineNumber: 149,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dash_.$projectId_.edit.tsx",
      lineNumber: 140,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex-1 bg-red-500", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("iframe", { width: "100%", height: "100%", title: "formy", src: "/probando/form" }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.edit.tsx",
      lineNumber: 152,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/routes/dash_.$projectId_.edit.tsx",
      lineNumber: 151,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dash_.$projectId_.edit.tsx",
    lineNumber: 139,
    columnNumber: 10
  }, this);
};
_s3(SelectTheme, "YUz5Ife9ZGqpQjMc96EzceFpUOQ=");
_c4 = SelectTheme;
var _c;
var _c2;
var _c3;
var _c4;
$RefreshReg$(_c, "Detail");
$RefreshReg$(_c2, "SelectQuestions");
$RefreshReg$(_c3, "TextField");
$RefreshReg$(_c4, "SelectTheme");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Detail as default
};
//# sourceMappingURL=/build/routes/dash_.$projectId_.edit-KHFADRZA.js.map
