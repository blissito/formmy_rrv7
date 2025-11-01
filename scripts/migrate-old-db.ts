/**
 * Script de migración de base de datos antigua → nueva
 *
 * Migra:
 * - Usuarios (Users)
 * - Proyectos (Projects → Formmys antiguos)
 * - Respuestas (Answers)
 * - Permisos (Permissions)
 *
 * Uso: npx tsx scripts/migrate-old-db.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// ============================================================================
// TIPOS DE DATOS ANTIGUOS
// ============================================================================

interface OldUser {
  _id: { $oid: string };
  email: string;
  name?: string;
  access_token?: string;
  picture?: string;
  provider?: string;
  refresh_token?: string;
  plan?: string;
  customerId?: string;
  subscriptionIds?: string[];
  createdAt: { $date: string };
  updatedAt?: { $date: string };
}

interface OldProject {
  _id: { $oid: string };
  slug: string;
  name: string;
  email?: string;
  userId: { $oid: string };
  isActive?: boolean;
  config?: any;
  settings?: any;
  type?: string;
  createdAt: { $date: string };
  updatedAt?: { $date: string };
}

interface OldAnswer {
  _id: { $oid: string };
  data?: any;
  projectId: { $oid: string };
  userId?: { $oid: string }; // Este campo NO existe en el nuevo schema
  favorite?: boolean;
  deleted?: boolean;
  opened?: boolean;
  createdAt: { $date: string };
  updatedAt?: { $date: string };
}

interface OldPermission {
  _id: { $oid: string };
  email: string;
  status?: string;
  notifications?: boolean;
  userId?: { $oid: string };
  projectId?: { $oid: string };
  can?: {
    read?: boolean;
    write?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  createdAt: { $date: string };
  updatedAt?: { $date: string };
}

// ============================================================================
// HELPERS
// ============================================================================

function parseDate(dateObj: { $date: string } | undefined): Date {
  if (!dateObj) return new Date();
  return new Date(dateObj.$date);
}

function determineRole(can?: OldPermission["can"]): "VIEWER" | "EDITOR" | "ADMIN" {
  if (!can) return "VIEWER";

  // Si tiene todos los permisos → ADMIN
  if (can.read && can.write && can.update && can.delete) {
    return "ADMIN";
  }

  // Si tiene write/update → EDITOR
  if (can.write || can.update) {
    return "EDITOR";
  }

  // Por defecto → VIEWER
  return "VIEWER";
}

function normalizePlan(plan?: string): "FREE" | "TRIAL" | "STARTER" | "PRO" | "ENTERPRISE" {
  if (!plan) return "FREE";

  const upperPlan = plan.toUpperCase();
  if (["FREE", "TRIAL", "STARTER", "PRO", "ENTERPRISE"].includes(upperPlan)) {
    return upperPlan as "FREE" | "TRIAL" | "STARTER" | "PRO" | "ENTERPRISE";
  }

  return "FREE";
}

// ============================================================================
// FUNCIONES DE MIGRACIÓN
// ============================================================================

async function migrateUsers(oldUsers: OldUser[]) {
  console.log(`\n📦 Migrando ${oldUsers.length} usuarios...`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  let customerIdSkipped = 0;

  // PASO 1: Identificar customerIds únicos y válidos
  const customerIdMap = new Map<string, string>(); // customerId -> email
  for (const user of oldUsers) {
    if (user.customerId && user.customerId !== null && typeof user.customerId === 'string' && user.customerId.trim().length > 0) {
      if (customerIdMap.has(user.customerId)) {
        console.warn(`⚠️  customerId duplicado encontrado: ${user.customerId} (${user.email} y ${customerIdMap.get(user.customerId)})`);
      } else {
        customerIdMap.set(user.customerId, user.email);
      }
    }
  }

  console.log(`📌 Encontrados ${customerIdMap.size} customerIds únicos válidos`);

  // PASO 2: Verificar cuáles customerIds ya existen en la BD
  // Ya no podemos usar findUnique, así que obtenemos TODOS los customerIds existentes
  const existingUsers = await prisma.user.findMany({
    where: {
      customerId: { not: null }
    },
    select: { email: true, customerId: true }
  });

  const existingCustomerIds = new Set<string>();
  for (const user of existingUsers) {
    if (user.customerId) {
      existingCustomerIds.add(user.customerId);
      console.log(`⏭️  customerId ya existe en BD: ${user.customerId} (${user.email})`);
    }
  }

  // PASO 3: Migrar usuarios
  for (const oldUser of oldUsers) {
    try {
      // Verificar si el usuario ya existe
      const existing = await prisma.user.findUnique({
        where: { email: oldUser.email },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Construir data object sin campos null/undefined
      const userData: any = {
        id: oldUser._id.$oid,
        email: oldUser.email,
        plan: normalizePlan(oldUser.plan),
        subscriptionIds: oldUser.subscriptionIds || [],

        // Nuevos campos con valores por defecto
        toolCreditsUsed: 0,
        creditsResetAt: new Date(),
        purchasedCredits: 0,
        lifetimeCreditsUsed: 0,
        voiceCreditsUsed: 0,
        voiceMinutesUsed: 0,
        purchasedConversations: 0,

        createdAt: parseDate(oldUser.createdAt),
        updatedAt: parseDate(oldUser.updatedAt),
      };

      // Solo agregar campos opcionales si existen y no son null/undefined
      if (oldUser.name && oldUser.name !== null) userData.name = oldUser.name;
      if (oldUser.access_token && oldUser.access_token !== null) userData.access_token = oldUser.access_token;
      if (oldUser.picture && oldUser.picture !== null) userData.picture = oldUser.picture;
      if (oldUser.provider && oldUser.provider !== null) userData.provider = oldUser.provider;
      if (oldUser.refresh_token && oldUser.refresh_token !== null) userData.refresh_token = oldUser.refresh_token;

      // ⚠️ CRÍTICO: Solo incluir customerId si tiene un valor STRING válido
      // MongoDB unique constraint permite solo UN null, así que NUNCA incluir null
      if (
        oldUser.customerId !== null &&
        oldUser.customerId !== undefined &&
        typeof oldUser.customerId === 'string' &&
        oldUser.customerId.trim().length > 0 &&
        !existingCustomerIds.has(oldUser.customerId)
      ) {
        userData.customerId = oldUser.customerId;
      } else if (oldUser.customerId && existingCustomerIds.has(oldUser.customerId)) {
        customerIdSkipped++;
      }

      // Crear nuevo usuario
      await prisma.user.create({ data: userData });

      console.log(`✅ Usuario migrado: ${oldUser.email}`);
      migrated++;
    } catch (error: any) {
      console.error(`❌ Error migrando usuario ${oldUser.email}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Usuarios: ${migrated} migrados, ${skipped} omitidos, ${errors} errores, ${customerIdSkipped} customerIds duplicados omitidos`);
}

async function migrateProjects(oldProjects: OldProject[]) {
  console.log(`\n📦 Migrando ${oldProjects.length} proyectos...`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const oldProject of oldProjects) {
    try {
      // Verificar si el proyecto ya existe
      const existing = await prisma.project.findUnique({
        where: { slug: oldProject.slug },
      });

      if (existing) {
        console.log(`⏭️  Proyecto ya existe: ${oldProject.slug}`);
        skipped++;
        continue;
      }

      // Verificar que el usuario existe
      const userExists = await prisma.user.findUnique({
        where: { id: oldProject.userId.$oid },
      });

      if (!userExists) {
        console.warn(`⚠️  Usuario no encontrado para proyecto ${oldProject.slug}, omitiendo...`);
        skipped++;
        continue;
      }

      // Construir data object sin campos null/undefined
      const projectData: any = {
        id: oldProject._id.$oid,
        slug: oldProject.slug,
        name: oldProject.name,
        userId: oldProject.userId.$oid,
        isActive: oldProject.isActive !== false,
        status: "ACTIVE",
        type: "contact",
        config: oldProject.config || {
          theme: "light",
          ctaColor: "#1C7AE9",
          inputs: ["email", "name", "message"],
          border: "redondo",
          confetti: "paper",
          message: "Tu mensaje ha sido enviado. Nos pondremos en contacto contigo lo antes posible.",
          icon: "/assets/send-message.svg",
          customInputs: [],
          watermark: false,
        },
        settings: oldProject.settings || {
          notifications: {
            new: true,
            members: false,
            warning: false,
          },
        },
        createdAt: parseDate(oldProject.createdAt),
        updatedAt: parseDate(oldProject.updatedAt),
      };

      // Solo agregar email si existe
      if (oldProject.email) projectData.email = oldProject.email;

      // Crear nuevo proyecto
      await prisma.project.create({ data: projectData });

      console.log(`✅ Proyecto migrado: ${oldProject.slug}`);
      migrated++;
    } catch (error: any) {
      console.error(`❌ Error migrando proyecto ${oldProject.slug}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Proyectos: ${migrated} migrados, ${skipped} omitidos, ${errors} errores`);
}

async function migrateAnswers(oldAnswers: OldAnswer[]) {
  console.log(`\n📦 Migrando ${oldAnswers.length} respuestas...`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const oldAnswer of oldAnswers) {
    try {
      // Verificar si la respuesta ya existe
      const existing = await prisma.answer.findUnique({
        where: { id: oldAnswer._id.$oid },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Verificar que el proyecto existe
      const projectExists = await prisma.project.findUnique({
        where: { id: oldAnswer.projectId.$oid },
      });

      if (!projectExists) {
        console.warn(`⚠️  Proyecto no encontrado para respuesta ${oldAnswer._id.$oid}, omitiendo...`);
        skipped++;
        continue;
      }

      // Construir data object sin campos null/undefined
      const answerData: any = {
        id: oldAnswer._id.$oid,
        projectId: oldAnswer.projectId.$oid,
        favorite: oldAnswer.favorite || false,
        deleted: oldAnswer.deleted || false,
        createdAt: parseDate(oldAnswer.createdAt),
      };

      // Solo agregar campos opcionales si existen
      if (oldAnswer.data) answerData.data = oldAnswer.data;
      if (oldAnswer.opened !== undefined) answerData.opened = oldAnswer.opened;
      if (oldAnswer.updatedAt) answerData.updatedAt = parseDate(oldAnswer.updatedAt);

      // Crear nueva respuesta (SIN userId - no existe en el nuevo schema)
      await prisma.answer.create({ data: answerData });

      migrated++;
    } catch (error: any) {
      console.error(`❌ Error migrando respuesta ${oldAnswer._id.$oid}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Respuestas: ${migrated} migrados, ${skipped} omitidos, ${errors} errores`);
}

async function migratePermissions(oldPermissions: OldPermission[]) {
  console.log(`\n📦 Migrando ${oldPermissions.length} permisos...`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const oldPermission of oldPermissions) {
    try {
      // Verificar si el permiso ya existe
      const existing = await prisma.permission.findUnique({
        where: { id: oldPermission._id.$oid },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Normalizar status
      let status: "pending" | "active" | "rejected" = "pending";
      if (oldPermission.status === "active") status = "active";
      if (oldPermission.status === "rejected") status = "rejected";

      // Determinar role basado en permisos antiguos
      const role = determineRole(oldPermission.can);

      // Construir data object sin campos null/undefined
      const permissionData: any = {
        id: oldPermission._id.$oid,
        email: oldPermission.email,
        status,
        role,
        notifications: oldPermission.notifications !== false,
        resourceType: "PROJECT",
        createdAt: parseDate(oldPermission.createdAt),
        updatedAt: parseDate(oldPermission.updatedAt),
      };

      // Solo agregar campos opcionales si existen
      if (oldPermission.can) permissionData.can = oldPermission.can;
      if (oldPermission.userId?.$oid) permissionData.userId = oldPermission.userId.$oid;
      if (oldPermission.projectId?.$oid) permissionData.projectId = oldPermission.projectId.$oid;

      // Crear nuevo permiso
      await prisma.permission.create({ data: permissionData });

      console.log(`✅ Permiso migrado: ${oldPermission.email}`);
      migrated++;
    } catch (error: any) {
      console.error(`❌ Error migrando permiso ${oldPermission.email}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Permisos: ${migrated} migrados, ${skipped} omitidos, ${errors} errores`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("🚀 Iniciando migración de base de datos antigua → nueva\n");

  const backupPath = path.join(process.cwd(), "respaldo");

  // Verificar que exista la carpeta respaldo
  if (!fs.existsSync(backupPath)) {
    console.error("❌ No se encontró la carpeta 'respaldo'");
    process.exit(1);
  }

  try {
    // 1. Migrar usuarios (primero, porque los demás dependen de ellos)
    console.log("\n═══════════════════════════════════════════════════");
    console.log("PASO 1: MIGRAR USUARIOS");
    console.log("═══════════════════════════════════════════════════");

    const usersFile = path.join(backupPath, "blissmo.User.json");
    const oldUsers: OldUser[] = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
    await migrateUsers(oldUsers);

    // 2. Migrar proyectos
    console.log("\n═══════════════════════════════════════════════════");
    console.log("PASO 2: MIGRAR PROYECTOS");
    console.log("═══════════════════════════════════════════════════");

    const projectsFile = path.join(backupPath, "blissmo.Project.json");
    const oldProjects: OldProject[] = JSON.parse(fs.readFileSync(projectsFile, "utf-8"));
    await migrateProjects(oldProjects);

    // 3. Migrar respuestas
    console.log("\n═══════════════════════════════════════════════════");
    console.log("PASO 3: MIGRAR RESPUESTAS");
    console.log("═══════════════════════════════════════════════════");

    const answersFile = path.join(backupPath, "blissmo.Answer.json");
    const oldAnswers: OldAnswer[] = JSON.parse(fs.readFileSync(answersFile, "utf-8"));
    await migrateAnswers(oldAnswers);

    // 4. Migrar permisos
    console.log("\n═══════════════════════════════════════════════════");
    console.log("PASO 4: MIGRAR PERMISOS");
    console.log("═══════════════════════════════════════════════════");

    const permissionsFile = path.join(backupPath, "blissmo.Permission.json");
    const oldPermissions: OldPermission[] = JSON.parse(fs.readFileSync(permissionsFile, "utf-8"));
    await migratePermissions(oldPermissions);

    console.log("\n═══════════════════════════════════════════════════");
    console.log("✅ MIGRACIÓN COMPLETADA");
    console.log("═══════════════════════════════════════════════════\n");

  } catch (error) {
    console.error("\n❌ Error fatal en la migración:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
