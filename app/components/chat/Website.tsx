import { useState, useEffect } from "react";
import { Button } from "../Button";
import { Card } from "./common/Card";
import { Input } from "./common/Input";
import { Select } from "./common/Select";
import { useFetchWebsite } from "../../hooks/useFetchWebsite";
import { Table } from "./common/Table";
import type { WebsiteEntry } from "../../types/website";
import toast from "react-hot-toast";
import { IoInformationCircleOutline } from "react-icons/io5";

export const Website = ({
  websiteEntries = [],
  onWebsiteEntriesChange,
  onMarkForRemoval,
  chatbotId,
}: {
  websiteEntries?: WebsiteEntry[];
  onWebsiteEntriesChange?: (entries: WebsiteEntry[]) => void;
  onMarkForRemoval?: (entry: WebsiteEntry) => void;
  chatbotId?: string;
}) => {
  const [formData, setFormData] = useState({
    url: "",
    includeRoutes: "",
    excludeRoutes: "",
    updateFrequency: "yearly",
  });

  // Usar estado interno si no se pasan props (para compatibilidad con Entrenamiento.tsx)
  const [internalWebsiteEntries, setInternalWebsiteEntries] = useState<
    WebsiteEntry[]
  >([]);

  // Determinar qué estado usar
  const currentWebsiteEntries = onWebsiteEntriesChange
    ? websiteEntries
    : internalWebsiteEntries;
  const setCurrentWebsiteEntries = onWebsiteEntriesChange
    ? onWebsiteEntriesChange
    : setInternalWebsiteEntries;

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
      // Si no se encontraron rutas automáticamente, usar solo la página principal
      const routes =
        result.routes && result.routes.length > 0
          ? result.routes
          : [
              formData.url.startsWith("http")
                ? formData.url
                : `https://${formData.url}`,
            ];

      // Validar que haya contenido
      if (!result.content || result.content.trim().length === 0) {
        toast.error("No se pudo extraer contenido de este sitio web");
        return;
      }

      const newEntry: WebsiteEntry = {
        url: formData.url,
        content: result.content,
        routes: routes,
        includeRoutes,
        excludeRoutes,
        updateFrequency: formData.updateFrequency,
        lastUpdated: new Date(),
      };

      const updatedEntries = [...currentWebsiteEntries, newEntry];
      setCurrentWebsiteEntries(updatedEntries);

      // Limpiar el formulario después de agregar
      setFormData({
        url: "",
        includeRoutes: "",
        excludeRoutes: "",
        updateFrequency: "monthly",
      });

      const routeCount = routes.length;
      const message =
        result.routes && result.routes.length > 0
          ? `Sitio web agregado con ${routeCount} página${routeCount !== 1 ? "s" : ""} encontradas`
          : `Sitio web agregado (página principal únicamente - no se encontraron enlaces)`;

      toast.success(message);
      console.log("Rutas encontradas:", result.routes);
      console.log("Rutas usadas:", routes);
      console.log("Contenido del sitio web:", result.content);
    }
  };

  const isDirty = formData.url.trim().length > 0;

  return (
    <>
      <Card
        title="Website o links"
        text={
          <span className="text-metal">
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
          label="URL del sitio web"
          className="mb-1"
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
           <div className="flex gap-1 items-start text-[12px] text-irongray mb-4 md:mb-6">
            <span className="mt-[2px]">
              <IoInformationCircleOutline />
            </span>
            <p>
              Considera que en el caso de las Single Page Applications (SPAs) solo se indexa la URL principal.
            </p>
          </div>
        <div className="flex justify-between w-full gap-4 flex-wrap md:grid-cols-3">
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
className="min-w-full md:min-w-[220px]"
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

        {error && (
          <div className="text-red-500 text-sm mt-2">Error: {error}</div>
        )}

        <Button
          className="w-full md:w-fit h-10 mr-0"
          isDisabled={!isDirty || loading}
          onClick={handleFetchWebsite}
        >
          {loading ? "Obteniendo..." : "Agregar"}
        </Button>
      </Card>
      <Table
        noSelect
        noSearch
        title="Fuentes web"
        className="mt-4"
        websiteEntries={currentWebsiteEntries}
        onRemoveEntry={(index: number) => {
          const entry = currentWebsiteEntries[index];

          // Si tiene contextId y hay función de marcado para eliminar, usarla (virtual)
          if (entry?.contextId && onMarkForRemoval) {
            onMarkForRemoval(entry);
          }

          // Remover del estado local para que no se muestre
          const updatedEntries = currentWebsiteEntries.filter(
            (_, i) => i !== index
          );
          setCurrentWebsiteEntries(updatedEntries);
        }}
        onEditEntry={(index: number) => {
          const entry = currentWebsiteEntries[index];
          if (entry) {
            // Cargar los datos en el formulario para editar
            setFormData({
              url: entry.url,
              includeRoutes: entry.includeRoutes?.join(", ") || "",
              excludeRoutes: entry.excludeRoutes?.join(", ") || "",
              updateFrequency: entry.updateFrequency,
            });

            // Remover la entrada actual para que se pueda actualizar
            const updatedEntries = currentWebsiteEntries.filter(
              (_, i) => i !== index
            );
            setCurrentWebsiteEntries(updatedEntries);
          }
        }}
      />
    </>
  );
};
