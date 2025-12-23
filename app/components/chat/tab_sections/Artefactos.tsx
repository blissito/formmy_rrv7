/**
 * Artefactos - Marketplace y gestión de componentes interactivos
 *
 * Los artefactos son componentes React que el agente puede invocar
 * durante las conversaciones para mostrar UI interactiva al usuario.
 *
 * Ejemplos de uso:
 * - Selector de fecha/hora para agendar citas
 * - Formulario de pago
 * - Galería de productos
 * - Encuestas interactivas
 */

import { useState, useEffect } from "react";
import { useRevalidator } from "react-router";
import toast from "react-hot-toast";
import { ChipTabs, useChipTabs } from "../common/ChipTabs";
import type { Chatbot, User, Artifact, ArtifactInstallation } from "@prisma/client";
import {
  HiOutlineDownload,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineExternalLink,
  HiOutlinePuzzle,
  HiOutlineCollection,
  HiOutlineSparkles,
} from "react-icons/hi";
import { cn } from "~/lib/utils";

// Type for installation with artifact included
type InstallationWithArtifact = ArtifactInstallation & {
  artifact: Artifact;
};

interface ArtefactosProps {
  chatbot: Chatbot;
  user: User;
  installedArtifacts: InstallationWithArtifact[];
}

// Admin emails for review badge
const ADMIN_EMAILS = ["brenda@formmy.app", "blissito@gmail.com", "fixtergeek@gmail.com"];

function isAdmin(email: string | null | undefined): boolean {
  return email ? ADMIN_EMAILS.includes(email) : false;
}

export const Artefactos = ({
  chatbot,
  user,
  installedArtifacts: initialInstalled,
}: ArtefactosProps) => {
  const revalidator = useRevalidator();
  const { currentTab, setCurrentTab } = useChipTabs("marketplace", `artifacts_${chatbot.id}`);

  const [installedArtifacts, setInstalledArtifacts] = useState<InstallationWithArtifact[]>(initialInstalled);
  const [marketplaceArtifacts, setMarketplaceArtifacts] = useState<Artifact[]>([]);
  const [isLoadingMarketplace, setIsLoadingMarketplace] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);

  // Sync from props
  useEffect(() => {
    setInstalledArtifacts(initialInstalled);
  }, [initialInstalled]);

  // Load marketplace artifacts
  useEffect(() => {
    if (currentTab === "marketplace") {
      loadMarketplace();
    }
  }, [currentTab, selectedCategory, searchQuery]);

  // Load pending review count for admins
  useEffect(() => {
    if (isAdmin(user.email)) {
      loadPendingCount();
    }
  }, [user.email]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadMarketplace = async () => {
    setIsLoadingMarketplace(true);
    try {
      const params = new URLSearchParams({ intent: "marketplace" });
      if (selectedCategory) params.set("category", selectedCategory);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/v1/artifacts?${params}`);
      const data = await response.json();

      if (response.ok) {
        setMarketplaceArtifacts(data.artifacts || []);
      } else {
        console.error("Error loading marketplace:", data.error);
      }
    } catch (error) {
      console.error("Error loading marketplace:", error);
    } finally {
      setIsLoadingMarketplace(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/v1/artifacts?intent=categories");
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadPendingCount = async () => {
    try {
      const response = await fetch("/api/v1/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "list_pending" }),
      });
      const data = await response.json();
      if (response.ok) {
        setPendingReviewCount(data.artifacts?.length || 0);
      }
    } catch (error) {
      console.error("Error loading pending count:", error);
    }
  };

  const handleInstall = async (artifactId: string) => {
    try {
      const response = await fetch("/api/v1/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "install",
          chatbotId: chatbot.id,
          artifactId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al instalar");
      }

      toast.success("Artefacto instalado correctamente");
      revalidator.revalidate();
      loadMarketplace(); // Refresh to update install counts
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al instalar");
    }
  };

  const handleUninstall = async (artifactId: string) => {
    if (!confirm("¿Estás seguro de desinstalar este artefacto?")) return;

    try {
      const response = await fetch("/api/v1/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "uninstall",
          chatbotId: chatbot.id,
          artifactId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al desinstalar");
      }

      toast.success("Artefacto desinstalado");
      revalidator.revalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al desinstalar");
    }
  };

  const handleToggleActive = async (artifactId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/v1/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "toggle_active",
          chatbotId: chatbot.id,
          artifactId,
          isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar");
      }

      // Update local state
      setInstalledArtifacts((prev) =>
        prev.map((inst) =>
          inst.artifactId === artifactId ? { ...inst, isActive } : inst
        )
      );

      toast.success(isActive ? "Artefacto activado" : "Artefacto desactivado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar");
    }
  };

  // Check if artifact is already installed
  const isInstalled = (artifactId: string) =>
    installedArtifacts.some((inst) => inst.artifactId === artifactId);

  return (
    <section className="h-full min-h-[60vh] p-4 overflow-y-auto">
      {/* Sub-tabs */}
      <div className="flex items-center justify-between mb-6">
        <ChipTabs
          names={["Marketplace", "Instalados"]}
          activeTab={currentTab === "marketplace" ? "Marketplace" : "Instalados"}
          onTabChange={(tab) => setCurrentTab(tab.toLowerCase())}
        />

        {/* Admin badge for pending reviews */}
        {isAdmin(user.email) && pendingReviewCount > 0 && (
          <a
            href="/dashboard/artifacts/review"
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium hover:bg-amber-200 transition-colors"
          >
            <HiOutlineSparkles className="w-4 h-4" />
            {pendingReviewCount} pendientes de revisión
          </a>
        )}
      </div>

      {/* Marketplace Tab */}
      {currentTab === "marketplace" && (
        <div>
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar artefactos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            {/* Category filter */}
            {categories.length > 0 && (
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Loading state */}
          {isLoadingMarketplace && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            </div>
          )}

          {/* Empty state */}
          {!isLoadingMarketplace && marketplaceArtifacts.length === 0 && (
            <div className="text-center py-12">
              <HiOutlineCollection className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay artefactos disponibles
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchQuery || selectedCategory
                  ? "Intenta con otros filtros de búsqueda"
                  : "Los artefactos aparecerán aquí cuando estén disponibles en el marketplace"}
              </p>
            </div>
          )}

          {/* Artifacts grid */}
          {!isLoadingMarketplace && marketplaceArtifacts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketplaceArtifacts.map((artifact) => (
                <ArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  isInstalled={isInstalled(artifact.id)}
                  onInstall={() => handleInstall(artifact.id)}
                  onUninstall={() => handleUninstall(artifact.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Installed Tab */}
      {currentTab === "instalados" && (
        <div>
          {/* Empty state */}
          {installedArtifacts.length === 0 && (
            <div className="text-center py-12">
              <HiOutlinePuzzle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes artefactos instalados
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Explora el marketplace para encontrar artefactos que potencien tu chatbot
              </p>
              <button
                onClick={() => setCurrentTab("marketplace")}
                className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                Explorar Marketplace
              </button>
            </div>
          )}

          {/* Installed list */}
          {installedArtifacts.length > 0 && (
            <div className="space-y-4">
              {installedArtifacts.map((installation) => (
                <InstalledArtifactCard
                  key={installation.id}
                  installation={installation}
                  onToggleActive={(isActive) =>
                    handleToggleActive(installation.artifactId, isActive)
                  }
                  onUninstall={() => handleUninstall(installation.artifactId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Developer link */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <a
          href="/dashboard/artifacts"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-500 transition-colors"
        >
          <HiOutlineExternalLink className="w-4 h-4" />
          ¿Eres desarrollador? Crea tus propios artefactos
        </a>
      </div>
    </section>
  );
};

// Artifact Card for Marketplace
const ArtifactCard = ({
  artifact,
  isInstalled,
  onInstall,
  onUninstall,
}: {
  artifact: Artifact & { isNative?: boolean };
  isInstalled: boolean;
  onInstall: () => void;
  onUninstall: () => void;
}) => {
  return (
    <div className={cn(
      "bg-white border rounded-xl p-4 hover:shadow-md transition-shadow",
      artifact.isNative ? "border-blue-200 ring-1 ring-blue-100" : "border-gray-200"
    )}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {artifact.iconUrl ? (
          <img
            src={artifact.iconUrl}
            alt={artifact.displayName}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            artifact.isNative
              ? "bg-gradient-to-br from-blue-400 to-blue-600"
              : "bg-gradient-to-br from-brand-400 to-brand-600"
          )}>
            <HiOutlinePuzzle className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 truncate">{artifact.displayName}</h3>
            {artifact.isNative && (
              <span className="flex-shrink-0 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold uppercase tracking-wide">
                Oficial
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {artifact.isNative ? "Formmy" : artifact.authorEmail}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-2 mb-4">{artifact.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {artifact.category && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {artifact.category}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {artifact.installCount} instalaciones
          </span>
        </div>

        {isInstalled ? (
          <button
            onClick={onUninstall}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          >
            <HiOutlineTrash className="w-4 h-4" />
            Desinstalar
          </button>
        ) : (
          <button
            onClick={onInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            <HiOutlineDownload className="w-4 h-4" />
            Instalar
          </button>
        )}
      </div>
    </div>
  );
};

// Installed Artifact Card
const InstalledArtifactCard = ({
  installation,
  onToggleActive,
  onUninstall,
}: {
  installation: InstallationWithArtifact;
  onToggleActive: (isActive: boolean) => void;
  onUninstall: () => void;
}) => {
  const { artifact } = installation;

  return (
    <div
      className={cn(
        "bg-white border rounded-xl p-4 transition-all",
        installation.isActive ? "border-gray-200" : "border-gray-200 opacity-60"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        {artifact.iconUrl ? (
          <img
            src={artifact.iconUrl}
            alt={artifact.displayName}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <HiOutlinePuzzle className="w-6 h-6 text-white" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900">{artifact.displayName}</h3>
          <p className="text-sm text-gray-500 truncate">{artifact.description}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span>Usado {installation.usageCount} veces</span>
            {installation.lastUsedAt && (
              <span>
                Último uso: {new Date(installation.lastUsedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Toggle active */}
          <button
            onClick={() => onToggleActive(!installation.isActive)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              installation.isActive
                ? "bg-green-100 text-green-600 hover:bg-green-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
            title={installation.isActive ? "Desactivar" : "Activar"}
          >
            {installation.isActive ? (
              <HiOutlinePlay className="w-5 h-5" />
            ) : (
              <HiOutlinePause className="w-5 h-5" />
            )}
          </button>

          {/* Uninstall */}
          <button
            onClick={onUninstall}
            className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            title="Desinstalar"
          >
            <HiOutlineTrash className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
