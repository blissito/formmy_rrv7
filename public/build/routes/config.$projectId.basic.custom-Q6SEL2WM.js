import {
  SelectableImage
} from "/build/_shared/chunk-XZ7VDIAU.js";
import {
  TextField
} from "/build/_shared/chunk-GAAUEO2B.js";
import {
  customInputSchema
} from "/build/_shared/chunk-WAI7GNH5.js";
import "/build/_shared/chunk-YSJMGTXM.js";
import "/build/_shared/chunk-N7VDZ2JV.js";
import "/build/_shared/chunk-IYD4CINF.js";
import "/build/_shared/chunk-OMYSDXL4.js";
import {
  FaRegTrashAlt
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
  Form,
  useFetcher2 as useFetcher
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

// app/routes/config.$projectId.basic.custom.tsx
var import_node = __toESM(require_node());
var import_db = __toESM(require_db());
var import_react2 = __toESM(require_react());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/config.$projectId.basic.custom.tsx"' + id);
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
    "app/routes/config.$projectId.basic.custom.tsx"
  );
  import.meta.hot.lastModified = "1708284120292.0605";
}
var parseZodIssues = (error) => error ? JSON.parse(error).reduce((acc, err) => ({
  ...acc,
  [err.path[0]]: err.message
}), {}) : {};
var initialErrors = {
  options: void 0,
  type: null,
  title: void 0,
  placeholder: void 0
};
function Route() {
  _s();
  const [isSelect, setIsSelect] = (0, import_react2.useState)(false);
  const [errors, setErrors] = (0, import_react2.useState)(initialErrors);
  const fetcher = useFetcher();
  const handleValidation = (form) => {
    let result = customInputSchema.safeParse(form);
    if (isSelect) {
      result = customInputSchema.safeParse(form);
    }
    if (!result.success) {
      console.error(result.error);
      setErrors(parseZodIssues(result.error));
    } else {
      setErrors(initialErrors);
    }
    return result;
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams(formData);
    const form = Object.fromEntries(formData);
    form.options = [...params.getAll("option")];
    form.name = form.title;
    const {
      success,
      data
    } = handleValidation(form);
    if (!success)
      return;
    fetcher.submit({
      data: JSON.stringify(data),
      intent: "add_custom_input"
    }, {
      method: "post"
    });
  };
  const renderError = (error) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "text-red-500 text-xs h-[1px] block", children: error }, void 0, false, {
    fileName: "app/routes/config.$projectId.basic.custom.tsx",
    lineNumber: 146,
    columnNumber: 32
  }, this);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Modal, { title: "Agrega tu propio campo", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Form, { onSubmit: handleSubmit, method: "post", className: "flex flex-col gap-6 py-6", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", { className: "text-base font-normal text-gray-600 dark:text-space-400", children: "\xBFQu\xE9 tipo de campo que quieres agregar?" }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.custom.tsx",
      lineNumber: 149,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("fieldset", { className: twMerge("flex gap-4 justify-between", errors.type && "border-2 rounded-xl border-red-500 p-2"), children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(SelectableImage, { onClick: () => setIsSelect(false), defaultValue: "text", text: "Texto", name: "type", src: "/assets/custom-input/input-selection.svg" }, void 0, false, {
        fileName: "app/routes/config.$projectId.basic.custom.tsx",
        lineNumber: 153,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(SelectableImage, { onClick: () => setIsSelect(true), defaultValue: "select", text: "Selecci\xF3n", name: "type", src: "/assets/custom-input/select-selection.svg" }, void 0, false, {
        fileName: "app/routes/config.$projectId.basic.custom.tsx",
        lineNumber: 154,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/config.$projectId.basic.custom.tsx",
      lineNumber: 152,
      columnNumber: 9
    }, this),
    errors.type && renderError("Selecciona un tipo de input"),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(TextField, { className: "mb-0 placeholder:text-space-300 dark:placeholder:text-space-500 font-light", label: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", { className: "text-base font-normal  text-gray-600 dark:text-space-400", htmlFor: "title", children: "\xBFQu\xE9 titulo/label tendr\xE1 el campo?" }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.custom.tsx",
      lineNumber: 157,
      columnNumber: 114
    }, this), name: "title", placeholder: "Por ejemplo: Edad", error: errors.title && renderError(errors.title) }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.custom.tsx",
      lineNumber: 157,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(TextField, { className: "mb-0 placeholder:text-space-300 font-light", label: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", { className: "text-base font-normal  text-gray-600 dark:text-space-400", htmlFor: "title", children: "\xBFQu\xE9 placeholder tendr\xE1? (opcional)" }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.custom.tsx",
      lineNumber: 161,
      columnNumber: 82
    }, this), name: "placeholder", placeholder: "Por ejemplo: Tecnolog\xEDa", error: errors.placeholder && renderError(errors.placeholder) }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.custom.tsx",
      lineNumber: 161,
      columnNumber: 9
    }, this),
    isSelect && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Options, { error: errors.options && renderError(errors.options) }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.custom.tsx",
      lineNumber: 164,
      columnNumber: 22
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", { className: " text-gray-600 dark:text-space-300 text-base font-normal flex justify-between items-center", children: [
      "\xBFEs este campo obligatorio?",
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Toggle, { name: "isRequired" }, void 0, false, {
        fileName: "app/routes/config.$projectId.basic.custom.tsx",
        lineNumber: 168,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/config.$projectId.basic.custom.tsx",
      lineNumber: 166,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, { type: "submit", autoFocus: true, isLoading: fetcher.state !== "idle" }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.custom.tsx",
      lineNumber: 170,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/config.$projectId.basic.custom.tsx",
    lineNumber: 148,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/routes/config.$projectId.basic.custom.tsx",
    lineNumber: 147,
    columnNumber: 10
  }, this);
}
_s(Route, "q2S5KAevhehWTtXS+QRrJGHXFzU=", false, function() {
  return [useFetcher];
});
_c = Route;
var Options = ({
  error
}) => {
  _s2();
  const [options, setOptions] = (0, import_react2.useState)([null, null]);
  const addOption = () => setOptions((ops) => [...ops, null]);
  const removeOption = (index) => {
    const newArr = [...options];
    newArr.splice(index, 1);
    setOptions(newArr);
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", { className: "text-base font-normal  text-gray-600 dark:text-space-400", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "\xBFCu\xE1les son las opciones dispon\xEDbles?" }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.custom.tsx",
      lineNumber: 191,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: twMerge(error && "border-2 border-red-500 rounded-lg", "grid grid-cols-2 columns-2 gap-2 overflow-y-scroll max-h-52 focus:border-yellow-50 mt-2"), children: options.map((_, index) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "relative", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(TextField, { className: "mb-0 flex-1 placeholder:text-space-300 font-light", name: "option", placeholder: `Opci\xF3n #${index + 1}` }, void 0, false, {
        fileName: "app/routes/config.$projectId.basic.custom.tsx",
        lineNumber: 194,
        columnNumber: 13
      }, this),
      index > 1 && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick: () => removeOption(index), type: "button", className: "hover:scale-110 absolute right-2 top-3", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FaRegTrashAlt, {}, void 0, false, {
        fileName: "app/routes/config.$projectId.basic.custom.tsx",
        lineNumber: 196,
        columnNumber: 17
      }, this) }, void 0, false, {
        fileName: "app/routes/config.$projectId.basic.custom.tsx",
        lineNumber: 195,
        columnNumber: 27
      }, this)
    ] }, index, true, {
      fileName: "app/routes/config.$projectId.basic.custom.tsx",
      lineNumber: 193,
      columnNumber: 36
    }, this)) }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.custom.tsx",
      lineNumber: 192,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "text-red-500 text-xs m-1", children: error }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.custom.tsx",
      lineNumber: 200,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { type: "button", onClick: addOption, className: "text-gray-600 dark:text-gray-400 font-light ", children: "+ Agrega otra" }, void 0, false, {
      fileName: "app/routes/config.$projectId.basic.custom.tsx",
      lineNumber: 201,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/config.$projectId.basic.custom.tsx",
    lineNumber: 190,
    columnNumber: 10
  }, this);
};
_s2(Options, "Ee5KSTi89vFu6FAnFQUMWQfDLPs=");
_c2 = Options;
var _c;
var _c2;
$RefreshReg$(_c, "Route");
$RefreshReg$(_c2, "Options");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Route as default
};
//# sourceMappingURL=/build/routes/config.$projectId.basic.custom-Q6SEL2WM.js.map
