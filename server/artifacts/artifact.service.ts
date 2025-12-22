import { db } from "~/utils/db.server";
import type { ArtifactStatus, Prisma } from "@prisma/client";
import { transpileJSX } from "./transpiler.service";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateArtifactInput {
  name: string;
  displayName: string;
  description: string;
  code: string;
  authorId: string;
  authorEmail: string;
  category?: string;
  iconUrl?: string;
  propsSchema?: Prisma.InputJsonValue;
  events?: string[];
}

export interface UpdateArtifactInput {
  displayName?: string;
  description?: string;
  code?: string;
  category?: string;
  iconUrl?: string;
  propsSchema?: Prisma.InputJsonValue;
  events?: string[];
}

export interface MarketplaceFilters {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Crear nuevo artefacto (status: DRAFT)
 * Auto-transpila el código JSX → JavaScript
 */
export async function createArtifact(data: CreateArtifactInput) {
  // Transpilar JSX → JavaScript
  const transpiled = transpileJSX(data.code);
  if (!transpiled.success) {
    throw new Error(`Error de transpilación: ${transpiled.error}`);
  }

  return db.artifact.create({
    data: {
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      code: data.code,
      compiledCode: transpiled.code, // Código pre-transpilado
      authorId: data.authorId,
      authorEmail: data.authorEmail,
      category: data.category,
      iconUrl: data.iconUrl,
      propsSchema: data.propsSchema,
      events: data.events ?? [],
      status: "DRAFT",
    },
  });
}

/**
 * Actualizar código y/o metadata (sustituye)
 * Si se actualiza el código, se re-transpila automáticamente
 */
export async function updateArtifact(
  id: string,
  userId: string,
  data: UpdateArtifactInput
) {
  // Verificar ownership
  const artifact = await db.artifact.findUnique({ where: { id } });
  if (!artifact) {
    throw new Error("Artefacto no encontrado");
  }
  if (artifact.authorId !== userId) {
    throw new Error("No tienes permiso para editar este artefacto");
  }

  // Solo permitir edición si está en DRAFT o REJECTED
  if (artifact.status !== "DRAFT" && artifact.status !== "REJECTED") {
    throw new Error("Solo puedes editar artefactos en estado DRAFT o REJECTED");
  }

  // Si se actualiza el código, re-transpilar
  let compiledCode: string | undefined;
  if (data.code) {
    const transpiled = transpileJSX(data.code);
    if (!transpiled.success) {
      throw new Error(`Error de transpilación: ${transpiled.error}`);
    }
    compiledCode = transpiled.code;
  }

  return db.artifact.update({
    where: { id },
    data: {
      ...data,
      ...(compiledCode && { compiledCode }),
      // Si estaba rechazado, volver a DRAFT al editar
      ...(artifact.status === "REJECTED" && { status: "DRAFT" }),
    },
  });
}

/**
 * Eliminar artefacto (solo si DRAFT o propio)
 */
export async function deleteArtifact(id: string, userId: string) {
  const artifact = await db.artifact.findUnique({ where: { id } });
  if (!artifact) {
    throw new Error("Artefacto no encontrado");
  }
  if (artifact.authorId !== userId) {
    throw new Error("No tienes permiso para eliminar este artefacto");
  }

  // Solo permitir eliminar si está en DRAFT
  if (artifact.status !== "DRAFT") {
    throw new Error("Solo puedes eliminar artefactos en estado DRAFT");
  }

  return db.artifact.delete({ where: { id } });
}

// ============================================================================
// REVIEW WORKFLOW
// ============================================================================

/**
 * Enviar a revisión (status → PENDING_REVIEW)
 */
export async function submitForReview(id: string, userId: string) {
  const artifact = await db.artifact.findUnique({ where: { id } });
  if (!artifact) {
    throw new Error("Artefacto no encontrado");
  }
  if (artifact.authorId !== userId) {
    throw new Error("No tienes permiso para enviar este artefacto a revisión");
  }
  if (artifact.status !== "DRAFT" && artifact.status !== "REJECTED") {
    throw new Error(
      "Solo puedes enviar a revisión artefactos en estado DRAFT o REJECTED"
    );
  }

  return db.artifact.update({
    where: { id },
    data: {
      status: "PENDING_REVIEW",
      reviewNotes: null, // Limpiar notas anteriores
    },
  });
}

/**
 * Admin: aprobar artefacto (status → PUBLISHED)
 */
export async function approveArtifact(id: string, adminId: string) {
  const artifact = await db.artifact.findUnique({ where: { id } });
  if (!artifact) {
    throw new Error("Artefacto no encontrado");
  }
  if (artifact.status !== "PENDING_REVIEW") {
    throw new Error("Solo puedes aprobar artefactos pendientes de revisión");
  }

  return db.artifact.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      reviewedBy: adminId,
      reviewedAt: new Date(),
    },
  });
}

/**
 * Admin: rechazar artefacto con razón
 */
export async function rejectArtifact(
  id: string,
  adminId: string,
  reason: string
) {
  const artifact = await db.artifact.findUnique({ where: { id } });
  if (!artifact) {
    throw new Error("Artefacto no encontrado");
  }
  if (artifact.status !== "PENDING_REVIEW") {
    throw new Error("Solo puedes rechazar artefactos pendientes de revisión");
  }

  return db.artifact.update({
    where: { id },
    data: {
      status: "REJECTED",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNotes: reason,
    },
  });
}

// ============================================================================
// INSTALLATION
// ============================================================================

/**
 * Instalar artefacto en chatbot
 */
export async function installArtifact(
  chatbotId: string,
  artifactId: string,
  userId: string,
  config?: Prisma.InputJsonValue
) {
  // Verificar que el artefacto existe y está publicado
  const artifact = await db.artifact.findUnique({ where: { id: artifactId } });
  if (!artifact) {
    throw new Error("Artefacto no encontrado");
  }
  if (artifact.status !== "PUBLISHED") {
    throw new Error("Solo puedes instalar artefactos publicados");
  }

  // Verificar que el usuario es dueño del chatbot
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { userId: true },
  });
  if (!chatbot) {
    throw new Error("Chatbot no encontrado");
  }
  if (chatbot.userId !== userId) {
    throw new Error("No tienes permiso para instalar artefactos en este chatbot");
  }

  // Crear instalación (upsert por si ya existe)
  const installation = await db.artifactInstallation.upsert({
    where: {
      chatbotId_artifactId: { chatbotId, artifactId },
    },
    create: {
      chatbotId,
      artifactId,
      config,
      isActive: true,
    },
    update: {
      config,
      isActive: true,
    },
    include: { artifact: true },
  });

  // Incrementar contador de instalaciones
  await db.artifact.update({
    where: { id: artifactId },
    data: { installCount: { increment: 1 } },
  });

  return installation;
}

/**
 * Desinstalar artefacto de chatbot
 */
export async function uninstallArtifact(
  chatbotId: string,
  artifactId: string,
  userId: string
) {
  // Verificar que el usuario es dueño del chatbot
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { userId: true },
  });
  if (!chatbot) {
    throw new Error("Chatbot no encontrado");
  }
  if (chatbot.userId !== userId) {
    throw new Error("No tienes permiso para desinstalar artefactos de este chatbot");
  }

  // Eliminar instalación
  const deleted = await db.artifactInstallation.deleteMany({
    where: { chatbotId, artifactId },
  });

  if (deleted.count > 0) {
    // Decrementar contador de instalaciones
    await db.artifact.update({
      where: { id: artifactId },
      data: { installCount: { decrement: 1 } },
    });
  }

  return deleted;
}

/**
 * Actualizar configuración de instalación
 */
export async function updateInstallationConfig(
  chatbotId: string,
  artifactId: string,
  userId: string,
  config: Prisma.InputJsonValue
) {
  // Verificar ownership del chatbot
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { userId: true },
  });
  if (!chatbot) {
    throw new Error("Chatbot no encontrado");
  }
  if (chatbot.userId !== userId) {
    throw new Error("No tienes permiso para configurar este artefacto");
  }

  return db.artifactInstallation.update({
    where: {
      chatbotId_artifactId: { chatbotId, artifactId },
    },
    data: { config },
  });
}

/**
 * Toggle activo/inactivo de instalación
 */
export async function toggleInstallationActive(
  chatbotId: string,
  artifactId: string,
  userId: string,
  isActive: boolean
) {
  // Verificar ownership del chatbot
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { userId: true },
  });
  if (!chatbot) {
    throw new Error("Chatbot no encontrado");
  }
  if (chatbot.userId !== userId) {
    throw new Error("No tienes permiso para modificar este artefacto");
  }

  return db.artifactInstallation.update({
    where: {
      chatbotId_artifactId: { chatbotId, artifactId },
    },
    data: { isActive },
  });
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Lista instalados en chatbot específico
 */
export async function getInstalledArtifacts(chatbotId: string) {
  return db.artifactInstallation.findMany({
    where: { chatbotId },
    include: { artifact: true },
    orderBy: { installedAt: "desc" },
  });
}

/**
 * Lista artefactos PUBLISHED (marketplace)
 */
export async function listMarketplace(filters?: MarketplaceFilters) {
  const where: Prisma.ArtifactWhereInput = {
    status: "PUBLISHED",
    ...(filters?.category && { category: filters.category }),
    ...(filters?.search && {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { displayName: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ],
    }),
  };

  // Intentar ordenar con isNative primero, fallback si el campo no existe aún
  let artifacts;
  let total;

  try {
    [artifacts, total] = await Promise.all([
      db.artifact.findMany({
        where,
        // Nativos primero, luego por popularidad
        orderBy: [{ isNative: "desc" }, { installCount: "desc" }, { createdAt: "desc" }],
        take: filters?.limit ?? 50,
        skip: filters?.offset ?? 0,
      }),
      db.artifact.count({ where }),
    ]);
  } catch {
    // Fallback: sin ordenar por isNative (para compatibilidad con schema antiguo)
    [artifacts, total] = await Promise.all([
      db.artifact.findMany({
        where,
        orderBy: [{ installCount: "desc" }, { createdAt: "desc" }],
        take: filters?.limit ?? 50,
        skip: filters?.offset ?? 0,
      }),
      db.artifact.count({ where }),
    ]);
  }

  return { artifacts, total };
}

/**
 * Mis artefactos (dev)
 */
export async function listMyArtifacts(userId: string) {
  return db.artifact.findMany({
    where: { authorId: userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { installations: true } },
    },
  });
}

/**
 * Admin: lista pendientes de revisión
 */
export async function listPendingReview() {
  return db.artifact.findMany({
    where: { status: "PENDING_REVIEW" },
    orderBy: { updatedAt: "asc" }, // FIFO
  });
}

/**
 * Obtener artefacto por ID
 */
export async function getArtifactById(id: string) {
  return db.artifact.findUnique({
    where: { id },
    include: {
      _count: { select: { installations: true } },
    },
  });
}

/**
 * Obtener artefacto por nombre (slug)
 */
export async function getArtifactByName(name: string) {
  return db.artifact.findUnique({
    where: { name },
  });
}

/**
 * Obtener categorías disponibles
 */
export async function getCategories() {
  const result = await db.artifact.groupBy({
    by: ["category"],
    where: {
      status: "PUBLISHED",
      category: { not: null },
    },
    _count: true,
  });

  return result
    .filter((r) => r.category !== null)
    .map((r) => ({
      category: r.category!,
      count: r._count,
    }));
}
