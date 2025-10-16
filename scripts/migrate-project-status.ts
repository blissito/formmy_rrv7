/**
 * Migration Script: Set default status for existing projects
 *
 * This script updates all existing projects that don't have a status
 * to set their status to 'ACTIVE'
 */

import { db } from "../app/utils/db.server";

async function main() {
  console.log("🔄 Starting migration: Set default project status...");

  try {
    // Find all projects without a status field or with undefined status
    const projects = await db.project.findMany({
      where: {
        OR: [
          { status: { equals: null as any } },
          // MongoDB may store undefined as null
        ]
      },
      select: {
        id: true,
        name: true,
        status: true,
      }
    });

    console.log(`📊 Found ${projects.length} projects to update`);

    if (projects.length === 0) {
      console.log("✅ No projects need updating. All done!");
      return;
    }

    // Update all projects to ACTIVE status
    const result = await db.project.updateMany({
      where: {
        OR: [
          { status: { equals: null as any } },
        ]
      },
      data: {
        status: "ACTIVE",
      }
    });

    console.log(`✅ Migration complete! Updated ${result.count} projects to ACTIVE status`);

    // Verify the migration
    const activeProjects = await db.project.count({
      where: { status: "ACTIVE" }
    });
    console.log(`📈 Total ACTIVE projects: ${activeProjects}`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

main()
  .then(() => {
    console.log("👍 Migration script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration script failed:", error);
    process.exit(1);
  });
