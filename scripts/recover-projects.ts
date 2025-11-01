import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

interface OldProject {
  _id: { $oid: string };
  slug: string;
  name: string;
  userId: { $oid: string };
  email?: string;
  isActive?: boolean;
  config?: any;
  settings?: any;
  createdAt: { $date: string };
  updatedAt: { $date: string };
}

interface OldAnswer {
  _id: { $oid: string };
  projectId: { $oid: string };
  data: any;
  favorite?: boolean;
  deleted?: boolean;
  opened?: boolean;
  createdAt: { $date: string };
  updatedAt?: { $date: string };
}

function parseDate(dateObj: { $date: string } | string): Date {
  if (typeof dateObj === 'string') return new Date(dateObj);
  return new Date(dateObj.$date);
}

async function recoverProjects() {
  console.log('🔄 RECUPERANDO PROYECTOS OMITIDOS');
  console.log('═══════════════════════════════════════════════════\n');

  // Cargar reporte
  const report = JSON.parse(fs.readFileSync('migration-report.json', 'utf-8'));
  const recoverableProjects = report.projectsNotMigrated.filter((p: any) => p.recoverable);

  console.log(`📦 Proyectos recuperables: ${recoverableProjects.length}\n`);

  // Cargar datos antiguos
  const oldProjects: OldProject[] = JSON.parse(
    fs.readFileSync('respaldo/blissmo.Project.json', 'utf-8')
  );
  const oldAnswers: OldAnswer[] = JSON.parse(
    fs.readFileSync('respaldo/blissmo.Answer.json', 'utf-8')
  );

  let projectsRecovered = 0;
  let answersRecovered = 0;
  let errors = 0;

  for (const recoverable of recoverableProjects) {
    try {
      // Verificar si ya existe
      const existing = await prisma.project.findUnique({
        where: { id: recoverable.id }
      });

      if (existing) {
        console.log(`⏭️  Proyecto ya existe: ${recoverable.name}`);
        continue;
      }

      // Obtener datos del proyecto original
      const oldProject = oldProjects.find(p => p._id.$oid === recoverable.id);

      if (!oldProject) {
        console.error(`❌ No se encontró proyecto en backup: ${recoverable.id}`);
        errors++;
        continue;
      }

      // Crear proyecto con nuevo userId
      const projectData: any = {
        id: oldProject._id.$oid,
        slug: oldProject.slug,
        name: oldProject.name,
        userId: recoverable.newUserId, // ← Usar el ID nuevo del usuario
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

      if (oldProject.email) projectData.email = oldProject.email;

      await prisma.project.create({ data: projectData });
      console.log(`✅ Proyecto recuperado: ${oldProject.name}`);
      projectsRecovered++;

      // Migrar respuestas asociadas
      const projectAnswers = oldAnswers.filter(a => a.projectId.$oid === oldProject._id.$oid);

      for (const answer of projectAnswers) {
        try {
          await prisma.answer.create({
            data: {
              id: answer._id.$oid,
              projectId: answer.projectId.$oid,
              data: answer.data,
              favorite: answer.favorite || false,
              deleted: answer.deleted || false,
              opened: answer.opened || false,
              createdAt: parseDate(answer.createdAt),
              updatedAt: answer.updatedAt ? parseDate(answer.updatedAt) : parseDate(answer.createdAt)
            }
          });
          answersRecovered++;
        } catch (error: any) {
          if (error.code !== 'P2002') { // Ignorar duplicados
            console.error(`  ⚠️  Error en respuesta: ${error.message}`);
          }
        }
      }

      if (projectAnswers.length > 0) {
        console.log(`  📥 ${projectAnswers.length} respuestas migradas`);
      }

    } catch (error: any) {
      console.error(`❌ Error recuperando ${recoverable.name}: ${error.message}`);
      errors++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 RESULTADO:');
  console.log(`  ✅ Proyectos recuperados: ${projectsRecovered}`);
  console.log(`  📥 Respuestas recuperadas: ${answersRecovered}`);
  console.log(`  ❌ Errores: ${errors}`);
  console.log('═══════════════════════════════════════════════════\n');

  await prisma.$disconnect();
}

recoverProjects().catch(console.error);
