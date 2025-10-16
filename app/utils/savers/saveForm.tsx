import { db } from "../db.server";

export const saveForm = async ({
  form,
  projectId,
}: {
  projectId: string;
  form: Record<string, string | number>;
}) => {
  // Verify project exists and is not archived
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, status: true },
  });

  if (!project || project.status === "ARCHIVED") {
    throw new Error("Project not found or archived");
  }

  return await db.answer.create({
    data: {
      data: form,
      projectId,
    },
  });
};
