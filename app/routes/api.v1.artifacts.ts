/**
 * Artifacts API v1 - Marketplace y gestión de artefactos
 *
 * Intents (POST con body { intent, ...params }):
 * - list_marketplace - Artefactos publicados (filtros opcionales)
 * - list_installed - Instalados en chatbot específico
 * - install - Instalar artefacto en chatbot
 * - uninstall - Desinstalar
 * - create - Crear nuevo artefacto (dev)
 * - update - Actualizar código/metadata (sustituye)
 * - delete - Eliminar artefacto
 * - submit_review - Enviar a revisión
 * - approve - Admin: aprobar
 * - reject - Admin: rechazar con razón
 * - list_pending - Admin: lista pendientes
 * - my_artifacts - Mis artefactos (dev)
 * - toggle_active - Toggle activo/inactivo de instalación
 * - update_config - Actualizar configuración de instalación
 */

import type { Route } from "./+types/api.v1.artifacts";
import { getUserOrNull } from "server/getUserUtils.server";
import {
  createArtifact,
  updateArtifact,
  deleteArtifact,
  submitForReview,
  approveArtifact,
  rejectArtifact,
  installArtifact,
  uninstallArtifact,
  getInstalledArtifacts,
  listMarketplace,
  listMyArtifacts,
  listPendingReview,
  getArtifactById,
  getCategories,
  toggleInstallationActive,
  updateInstallationConfig,
  isAdmin,
} from "../../server/artifacts/artifact.service";

/**
 * GET - Marketplace público (no requiere auth)
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");

  // GET /api/v1/artifacts?intent=marketplace
  if (intent === "marketplace") {
    const category = url.searchParams.get("category") ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;
    const limit = url.searchParams.get("limit");
    const offset = url.searchParams.get("offset");

    const result = await listMarketplace({
      category,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return Response.json(result);
  }

  // GET /api/v1/artifacts?intent=categories
  if (intent === "categories") {
    const categories = await getCategories();
    return Response.json({ categories });
  }

  // GET /api/v1/artifacts?intent=detail&id=xxx
  if (intent === "detail") {
    const id = url.searchParams.get("id");
    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }
    const artifact = await getArtifactById(id);
    if (!artifact) {
      return Response.json({ error: "Artifact not found" }, { status: 404 });
    }
    return Response.json({ artifact });
  }

  return Response.json(
    { error: "Invalid intent. Use: marketplace, categories, detail" },
    { status: 400 }
  );
}

/**
 * POST - Operaciones autenticadas
 */
export async function action({ request }: Route.ActionArgs) {
  // Verificar autenticación
  const user = await getUserOrNull(request);

  if (!user) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { intent } = body;

  try {
    switch (intent) {
      // ============================================
      // MARKETPLACE & INSTALLATION
      // ============================================

      case "list_installed": {
        const { chatbotId } = body;
        if (!chatbotId) {
          return Response.json(
            { error: "chatbotId is required" },
            { status: 400 }
          );
        }
        const installations = await getInstalledArtifacts(chatbotId);
        return Response.json({ installations });
      }

      case "install": {
        const { chatbotId, artifactId, config } = body;
        if (!chatbotId || !artifactId) {
          return Response.json(
            { error: "chatbotId and artifactId are required" },
            { status: 400 }
          );
        }
        const installation = await installArtifact(
          chatbotId,
          artifactId,
          user.id,
          config
        );
        return Response.json({ installation });
      }

      case "uninstall": {
        const { chatbotId, artifactId } = body;
        if (!chatbotId || !artifactId) {
          return Response.json(
            { error: "chatbotId and artifactId are required" },
            { status: 400 }
          );
        }
        await uninstallArtifact(chatbotId, artifactId, user.id);
        return Response.json({ success: true });
      }

      case "toggle_active": {
        const { chatbotId, artifactId, isActive } = body;
        if (!chatbotId || !artifactId || typeof isActive !== "boolean") {
          return Response.json(
            { error: "chatbotId, artifactId and isActive are required" },
            { status: 400 }
          );
        }
        const installation = await toggleInstallationActive(
          chatbotId,
          artifactId,
          user.id,
          isActive
        );
        return Response.json({ installation });
      }

      case "update_config": {
        const { chatbotId, artifactId, config } = body;
        if (!chatbotId || !artifactId) {
          return Response.json(
            { error: "chatbotId and artifactId are required" },
            { status: 400 }
          );
        }
        const installation = await updateInstallationConfig(
          chatbotId,
          artifactId,
          user.id,
          config
        );
        return Response.json({ installation });
      }

      // ============================================
      // DEVELOPER CRUD
      // ============================================

      case "create": {
        const { name, displayName, description, code, category, iconUrl, propsSchema, events } =
          body;
        if (!name || !displayName || !description || !code) {
          return Response.json(
            { error: "name, displayName, description and code are required" },
            { status: 400 }
          );
        }
        // Validar formato del nombre (slug)
        if (!/^[a-z0-9-]+$/.test(name)) {
          return Response.json(
            { error: "name must be lowercase alphanumeric with hyphens only" },
            { status: 400 }
          );
        }
        const artifact = await createArtifact({
          name,
          displayName,
          description,
          code,
          authorId: user.id,
          authorEmail: user.email,
          category,
          iconUrl,
          propsSchema,
          events,
        });
        return Response.json({ artifact });
      }

      case "update": {
        const { id, displayName, description, code, category, iconUrl, propsSchema, events } =
          body;
        if (!id) {
          return Response.json({ error: "id is required" }, { status: 400 });
        }
        const artifact = await updateArtifact(id, user.id, {
          displayName,
          description,
          code,
          category,
          iconUrl,
          propsSchema,
          events,
        });
        return Response.json({ artifact });
      }

      case "delete": {
        const { id } = body;
        if (!id) {
          return Response.json({ error: "id is required" }, { status: 400 });
        }
        await deleteArtifact(id, user.id);
        return Response.json({ success: true });
      }

      case "my_artifacts": {
        const artifacts = await listMyArtifacts(user.id);
        return Response.json({ artifacts });
      }

      case "submit_review": {
        const { id } = body;
        if (!id) {
          return Response.json({ error: "id is required" }, { status: 400 });
        }
        const artifact = await submitForReview(id, user.id);
        return Response.json({ artifact });
      }

      // ============================================
      // ADMIN REVIEW
      // ============================================

      case "list_pending": {
        if (!isAdmin(user.email)) {
          return Response.json(
            { error: "Admin access required" },
            { status: 403 }
          );
        }
        const artifacts = await listPendingReview();
        return Response.json({ artifacts });
      }

      case "approve": {
        if (!isAdmin(user.email)) {
          return Response.json(
            { error: "Admin access required" },
            { status: 403 }
          );
        }
        const { id } = body;
        if (!id) {
          return Response.json({ error: "id is required" }, { status: 400 });
        }
        const artifact = await approveArtifact(id, user.id);
        return Response.json({ artifact });
      }

      case "reject": {
        if (!isAdmin(user.email)) {
          return Response.json(
            { error: "Admin access required" },
            { status: 403 }
          );
        }
        const { id, reason } = body;
        if (!id || !reason) {
          return Response.json(
            { error: "id and reason are required" },
            { status: 400 }
          );
        }
        const artifact = await rejectArtifact(id, user.id, reason);
        return Response.json({ artifact });
      }

      default:
        return Response.json(
          {
            error: "Invalid intent",
            validIntents: [
              "list_installed",
              "install",
              "uninstall",
              "toggle_active",
              "update_config",
              "create",
              "update",
              "delete",
              "my_artifacts",
              "submit_review",
              "list_pending",
              "approve",
              "reject",
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Artifacts API Error]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
