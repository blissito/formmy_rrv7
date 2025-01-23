import { Suspense, useEffect, useState } from "react";

export default function Excalidraw() {
  const [excalidraw, set] = useState(null);

  useEffect(() => {
    const loadExOnClient = async () => {
      const module = await import("@excalidraw/excalidraw");
      set(module.default);
    };
    loadExOnClient();
  }, []);

  return (
    <Suspense fallback={null}>
      <h1 style={{ textAlign: "center" }}>Excalidraw Example Blissmo</h1>
      <div style={{ height: "500px", border: 4, borderColor: "indigo" }}>
        <excalidraw />
      </div>
    </Suspense>
  );
}
