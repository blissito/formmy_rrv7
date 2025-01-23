import { db } from "../db.server";

export const saveForm = async ({
  form,
  projectId,
}: {
  projectId: string;
  form: Record<string, string | number>;
}) => {
  return await db.answer.create({
    data: {
      data: form,
      projectId,
    },
  });
};
