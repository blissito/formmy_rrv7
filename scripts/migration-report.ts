import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface OldUser {
  _id: { $oid: string };
  email: string;
  customerId?: string;
}

interface OldProject {
  _id: { $oid: string };
  slug: string;
  name: string;
  userId: { $oid: string };
  email?: string;
}

interface OldAnswer {
  _id: { $oid: string };
  projectId: { $oid: string };
  data: any;
}

async function generateMigrationReport() {
  console.log('📊 REPORTE DE MIGRACIÓN FORMMY v1 → v2');
  console.log('═══════════════════════════════════════════════════\n');

  // Cargar datos antiguos
  const oldUsers: OldUser[] = JSON.parse(
    fs.readFileSync('respaldo/blissmo.User.json', 'utf-8')
  );
  const oldProjects: OldProject[] = JSON.parse(
    fs.readFileSync('respaldo/blissmo.Project.json', 'utf-8')
  );
  const oldAnswers: OldAnswer[] = JSON.parse(
    fs.readFileSync('respaldo/blissmo.Answer.json', 'utf-8')
  );

  // Cargar datos nuevos
  const newUsers = await prisma.user.findMany({
    select: { id: true, email: true, customerId: true }
  });
  const newProjects = await prisma.project.findMany({
    select: { id: true, slug: true, name: true, userId: true }
  });
  const newAnswers = await prisma.answer.findMany({
    select: { id: true, projectId: true }
  });

  console.log('📦 RESUMEN GENERAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Usuarios:   ${oldUsers.length} → ${newUsers.length} (${((newUsers.length/oldUsers.length)*100).toFixed(1)}%)`);
  console.log(`Proyectos:  ${oldProjects.length} → ${newProjects.length} (${((newProjects.length/oldProjects.length)*100).toFixed(1)}%)`);
  console.log(`Respuestas: ${oldAnswers.length} → ${newAnswers.length} (${((newAnswers.length/oldAnswers.length)*100).toFixed(1)}%)`);
  console.log('');

  // PASO 1: Usuarios NO migrados
  console.log('\n👤 USUARIOS NO MIGRADOS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const newUserEmails = new Set(newUsers.map(u => u.email));
  const newUserCustomerIds = new Set(newUsers.map(u => u.customerId).filter(Boolean));

  const usersNotMigrated = oldUsers.filter(u => !newUserEmails.has(u.email));

  console.log(`Total: ${usersNotMigrated.length} usuarios\n`);

  const usersWithCustomerId = usersNotMigrated.filter(u => u.customerId);
  const usersWithDuplicateCustomerId = usersNotMigrated.filter(u =>
    u.customerId && newUserCustomerIds.has(u.customerId)
  );

  console.log(`📋 Desglose:`);
  console.log(`  - Con customerId duplicado: ${usersWithDuplicateCustomerId.length}`);
  console.log(`  - Sin customerId: ${usersNotMigrated.length - usersWithCustomerId.length}`);
  console.log(`  - Otros: ${usersNotMigrated.length - usersWithDuplicateCustomerId.length - (usersNotMigrated.length - usersWithCustomerId.length)}`);

  if (usersWithDuplicateCustomerId.length > 0 && usersWithDuplicateCustomerId.length <= 10) {
    console.log('\n🔍 Usuarios con customerId duplicado:');
    usersWithDuplicateCustomerId.forEach(u => {
      console.log(`  - ${u.email} (customerId: ${u.customerId})`);
    });
  }

  // PASO 2: Proyectos NO migrados
  console.log('\n\n📁 PROYECTOS NO MIGRADOS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const newProjectIds = new Set(newProjects.map(p => p.id));
  const projectsNotMigrated = oldProjects.filter(p => !newProjectIds.has(p._id.$oid));

  console.log(`Total: ${projectsNotMigrated.length} proyectos\n`);

  // Analizar por qué no se migraron
  const newUserIds = new Set(newUsers.map(u => u.id));
  const oldUserIds = new Set(oldUsers.map(u => u._id.$oid));

  const projectsMissingUser = projectsNotMigrated.filter(p =>
    !oldUserIds.has(p.userId.$oid) // Usuario nunca existió en BD antigua
  );

  const projectsUserNotMigrated = projectsNotMigrated.filter(p =>
    oldUserIds.has(p.userId.$oid) && !newUserIds.has(p.userId.$oid) // Usuario existió pero no se migró
  );

  const projectsUserIdChanged = projectsNotMigrated.filter(p => {
    const oldUser = oldUsers.find(u => u._id.$oid === p.userId.$oid);
    if (!oldUser) return false;
    const newUser = newUsers.find(u => u.email === oldUser.email);
    return newUser && newUser.id !== p.userId.$oid; // Usuario existe pero con ID diferente
  });

  console.log('📋 Razones de omisión:');
  console.log(`  - Usuario nunca existió: ${projectsMissingUser.length}`);
  console.log(`  - Usuario no migrado: ${projectsUserNotMigrated.length}`);
  console.log(`  - Usuario con ID diferente: ${projectsUserIdChanged.length}`);
  console.log(`  - Otras razones: ${projectsNotMigrated.length - projectsMissingUser.length - projectsUserNotMigrated.length - projectsUserIdChanged.length}`);

  // Proyectos recuperables
  console.log('\n✅ PROYECTOS RECUPERABLES (usuario existe con ID diferente):');
  if (projectsUserIdChanged.length > 0) {
    console.log(`Total: ${projectsUserIdChanged.length}\n`);
    projectsUserIdChanged.slice(0, 10).forEach(p => {
      const oldUser = oldUsers.find(u => u._id.$oid === p.userId.$oid);
      const newUser = newUsers.find(u => u.email === oldUser?.email);
      console.log(`  - ${p.name} (${p.slug})`);
      console.log(`    Usuario: ${oldUser?.email}`);
      console.log(`    Old ID: ${p.userId.$oid}`);
      console.log(`    New ID: ${newUser?.id}`);
      console.log('');
    });
    if (projectsUserIdChanged.length > 10) {
      console.log(`  ... y ${projectsUserIdChanged.length - 10} más\n`);
    }
  } else {
    console.log('  Ninguno\n');
  }

  // PASO 3: Datos huérfanos en BD nueva
  console.log('\n🧹 DATOS HUÉRFANOS EN BD PRODUCCIÓN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Proyectos huérfanos (usuario no existe)
  const allProjects = await prisma.project.findMany({
    select: { id: true, slug: true, name: true, userId: true }
  });
  const allUserIds = new Set((await prisma.user.findMany({ select: { id: true }})).map(u => u.id));
  const orphanProjects = allProjects.filter(p => !allUserIds.has(p.userId));

  console.log(`\n📁 Proyectos sin usuario: ${orphanProjects.length}`);
  if (orphanProjects.length > 0) {
    orphanProjects.slice(0, 5).forEach(p => {
      console.log(`  - ${p.name} (${p.slug}) - userId: ${p.userId}`);
    });
    if (orphanProjects.length > 5) {
      console.log(`  ... y ${orphanProjects.length - 5} más`);
    }
  }

  // Respuestas huérfanas (proyecto no existe)
  const allAnswersInDb = await prisma.answer.findMany({
    select: { id: true, projectId: true, data: true }
  });
  const allProjectIds = new Set((await prisma.project.findMany({ select: { id: true }})).map(p => p.id));
  const orphanAnswers = allAnswersInDb.filter(a => !allProjectIds.has(a.projectId));

  console.log(`\n📥 Respuestas sin proyecto: ${orphanAnswers.length}`);
  if (orphanAnswers.length > 0) {
    orphanAnswers.slice(0, 5).forEach(a => {
      console.log(`  - ${a.data?.name || 'Sin nombre'} - projectId: ${a.projectId}`);
    });
    if (orphanAnswers.length > 5) {
      console.log(`  ... y ${orphanAnswers.length - 5} más`);
    }
  }

  // Permisos huérfanos
  const allPermissions = await prisma.permission.findMany({
    select: { id: true, email: true, projectId: true, chatbotId: true, resourceType: true }
  });
  const allChatbotIds = new Set((await prisma.chatbot.findMany({ select: { id: true }})).map(c => c.id));
  const orphanPermissions = allPermissions.filter(p => {
    if (p.resourceType === 'PROJECT' && p.projectId) {
      return !allProjectIds.has(p.projectId);
    } else if (p.resourceType === 'CHATBOT' && p.chatbotId) {
      return !allChatbotIds.has(p.chatbotId);
    }
    return false;
  });

  console.log(`\n🔐 Permisos sin recurso: ${orphanPermissions.length}`);
  if (orphanPermissions.length > 0) {
    orphanPermissions.slice(0, 5).forEach(p => {
      const resourceId = p.projectId || p.chatbotId || 'N/A';
      console.log(`  - ${p.email} - ${p.resourceType}: ${resourceId}`);
    });
    if (orphanPermissions.length > 5) {
      console.log(`  ... y ${orphanPermissions.length - 5} más`);
    }
  }

  // PASO 4: Resumen final
  console.log('\n\n📊 RESUMEN Y RECOMENDACIONES');
  console.log('═══════════════════════════════════════════════════');

  console.log('\n✅ MIGRACIÓN EXITOSA:');
  console.log(`  - ${newUsers.length} usuarios funcionando`);
  console.log(`  - ${newProjects.length} proyectos activos`);
  console.log(`  - ${newAnswers.length} respuestas preservadas`);

  console.log('\n⚠️  DATOS OMITIDOS (probablemente basura):');
  console.log(`  - ${usersNotMigrated.length} usuarios (${usersWithDuplicateCustomerId.length} duplicados)`);
  console.log(`  - ${projectsNotMigrated.length} proyectos (${projectsMissingUser.length + projectsUserNotMigrated.length} sin usuario válido)`);

  console.log('\n🔄 ACCIÓN REQUERIDA:');
  if (projectsUserIdChanged.length > 0) {
    console.log(`  1. MIGRAR ${projectsUserIdChanged.length} proyectos recuperables`);
    console.log(`     → Usuarios existen pero con ID diferente`);
  }
  if (orphanProjects.length > 0 || orphanAnswers.length > 0 || orphanPermissions.length > 0) {
    console.log(`  2. LIMPIAR datos huérfanos en producción:`);
    if (orphanProjects.length > 0) console.log(`     - ${orphanProjects.length} proyectos sin usuario`);
    if (orphanAnswers.length > 0) console.log(`     - ${orphanAnswers.length} respuestas sin proyecto`);
    if (orphanPermissions.length > 0) console.log(`     - ${orphanPermissions.length} permisos sin recurso`);
  }

  console.log('\n');

  // Guardar reporte detallado
  const report = {
    summary: {
      users: { old: oldUsers.length, new: newUsers.length, notMigrated: usersNotMigrated.length },
      projects: { old: oldProjects.length, new: newProjects.length, notMigrated: projectsNotMigrated.length },
      answers: { old: oldAnswers.length, new: newAnswers.length }
    },
    usersNotMigrated: usersNotMigrated.map(u => ({
      id: u._id.$oid,
      email: u.email,
      customerId: u.customerId,
      reason: u.customerId && newUserCustomerIds.has(u.customerId) ? 'duplicate_customerId' : 'other'
    })),
    projectsNotMigrated: projectsNotMigrated.map(p => {
      const oldUser = oldUsers.find(u => u._id.$oid === p.userId.$oid);
      const newUser = newUsers.find(u => u.email === oldUser?.email);
      return {
        id: p._id.$oid,
        slug: p.slug,
        name: p.name,
        oldUserId: p.userId.$oid,
        newUserId: newUser?.id || null,
        userEmail: oldUser?.email || null,
        recoverable: !!newUser,
        reason: !oldUser ? 'user_never_existed' : (!newUser ? 'user_not_migrated' : 'user_id_changed')
      };
    }),
    orphanData: {
      projects: orphanProjects,
      answers: orphanAnswers.map(a => ({ id: a.id, projectId: a.projectId, name: a.data?.name })),
      permissions: orphanPermissions.map(p => ({
        id: p.id,
        email: p.email,
        resourceType: p.resourceType,
        projectId: p.projectId,
        chatbotId: p.chatbotId
      }))
    }
  };

  fs.writeFileSync('migration-report.json', JSON.stringify(report, null, 2));
  console.log('💾 Reporte detallado guardado en: migration-report.json\n');

  await prisma.$disconnect();

  return report;
}

generateMigrationReport().catch(console.error);
