import { useState } from "react";
import { Button } from "../Button";
import { Card } from "./common/Card";
import { Input } from "./common/Input";
import { Select } from "./common/Select";
import { useFetchWebsite } from "../../hooks/useFetchWebsite";

export const Website = () => {
  const [formData, setFormData] = useState({
    url: "",
    includeRoutes: "",
    excludeRoutes: "",
    updateFrequency: "monthly" as "yearly" | "monthly",
  });
  const [websiteContent, setWebsiteContent] = useState<string>("");
  const { fetchWebsiteContent, loading, error } = useFetchWebsite();

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFetchWebsite = async () => {
    if (!formData.url.trim()) return;

    const includeRoutes = formData.includeRoutes
      ? formData.includeRoutes
          .split(",")
          .map((route) => route.trim())
          .filter(Boolean)
      : undefined;

    const excludeRoutes = formData.excludeRoutes
      ? formData.excludeRoutes
          .split(",")
          .map((route) => route.trim())
          .filter(Boolean)
      : undefined;

    const result = await fetchWebsiteContent({
      url: formData.url,
      includeRoutes,
      excludeRoutes,
      updateFrequency: formData.updateFrequency,
    });

    console.log("RESULT?", result);

    if (result) {
      setWebsiteContent(result.content);
      console.log("Rutas encontradas:", result.routes);
      console.log("Contenido del sitio web:", result.content);
    }
  };

  const isDirty = formData.url.trim().length > 0;

  return (
    <Card
      title="Website o links"
      text={
        <span>
          Rastrea páginas web específicas para actualizar continuamente tu IA.
          Configura las rutas incluidas y excluidas para refinar lo que tu IA
          aprende. Más información.{" "}
          <a className="underline" href="!#">
            Más información
          </a>
        </span>
      }
    >
      <Input
        label="Sitio web"
        className="mb-2"
        left={
          <span className="border-r pr-3 min-h-full flex items-center">
            https://
          </span>
        }
        placeholder="www.firmmy.app"
        name="url"
        value={formData.url}
        onChange={(value) => handleInputChange("url", value)}
      />
      <div className="flex justify-between w-full gap-2 flex-wrap md:grid-cols-3">
        <Input
          label="Incluye solo rutas"
          placeholder="/blog, /ayuda"
          name="includeRoutes"
          value={formData.includeRoutes}
          onChange={(value) => handleInputChange("includeRoutes", value)}
        />
        <Input
          label="Excluir rutas"
          placeholder="/dash, login/"
          name="excludeRoutes"
          value={formData.excludeRoutes}
          onChange={(value) => handleInputChange("excludeRoutes", value)}
        />
        <Select
          label="Actualiza cada"
          value={formData.updateFrequency}
          onChange={(value) => handleInputChange("updateFrequency", value)}
          options={[
            {
              label: "Año",
              value: "yearly",
            },
            {
              label: "Mes",
              value: "monthly",
            },
          ]}
        />
      </div>

      {error && <div className="text-red-500 text-sm mt-2">Error: {error}</div>}

      {websiteContent && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
          <h4 className="font-medium mb-2">Contenido obtenido:</h4>
          <pre className="text-xs whitespace-pre-wrap">
            {websiteContent.substring(0, 500)}...
          </pre>
        </div>
      )}

      <Button
        className="mx-0 ml-auto"
        isDisabled={!isDirty || loading}
        onClick={handleFetchWebsite}
      >
        {loading ? "Obteniendo..." : "Agregar"}
      </Button>
    </Card>
  );
};
