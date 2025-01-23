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

// app/routes/yutu2.tsx
var import_react = __toESM(require_react());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/yutu2.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/yutu2.tsx"
  );
  import.meta.hot.lastModified = "1707530227033.8516";
}
function SilenceCutter() {
  _s();
  const mr = (0, import_react.createRef)();
  (0, import_react.useEffect)(() => {
    function detectSilence(stream, onSoundEnd = () => {
    }, onSoundStart = () => {
    }, silence_delay = 500, min_decibels = -45) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      const streamNode = ctx.createMediaStreamSource(stream);
      streamNode.connect(analyser);
      analyser.minDecibels = min_decibels;
      const data = new Uint8Array(analyser.frequencyBinCount);
      let silence_start = performance.now();
      let triggered = false;
      function loop(time = 0) {
        requestAnimationFrame(loop);
        analyser.getByteFrequencyData(data);
        if (data.some((v) => v)) {
          if (triggered) {
            triggered = false;
            onSoundStart();
          }
          silence_start = time;
        }
        if (!triggered && time - silence_start > silence_delay) {
          onSoundEnd();
          triggered = true;
        }
      }
      loop();
    }
    function onSilence() {
    }
    function onSpeak() {
    }
    navigator.mediaDevices.getUserMedia({
      audio: true
    }).then((stream) => {
      detectSilence(stream, onSilence, onSpeak);
    }).catch(console.error);
  }, []);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick: () => {
    var _a;
    if (((_a = mr.current) == null ? void 0 : _a.state) === "recording") {
      mr.current.stop();
    }
  }, children: "Detener" }, void 0, false, {
    fileName: "app/routes/yutu2.tsx",
    lineNumber: 67,
    columnNumber: 10
  }, this);
}
_s(SilenceCutter, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = SilenceCutter;
var _c;
$RefreshReg$(_c, "SilenceCutter");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  SilenceCutter as default
};
//# sourceMappingURL=/build/routes/yutu2-RDV5DGVB.js.map
