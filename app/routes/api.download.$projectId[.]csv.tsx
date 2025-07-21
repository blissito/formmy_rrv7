import { data as json } from "react-router";
import type { Answer } from "@prisma/client";
import { getProjectOwner, getUserOrNull } from "server/getUserUtils.server";

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await getUserOrNull(request);
  const project = await getProjectOwner({
    userId: user.id,
    projectId: params.projectId as string,
  });
  let answers: Answer[] = [];
  let fileName = "Formmy";
  if (project) {
    // is owner
    answers = project.answers;
    fileName = project.slug;
  }
  if (!project) {
    const permission = await getPermission({
      userId: user.id,
      projectId: params.projectId as string,
    });
    if (!permission)
      return json("No tienes permiso para ver este contenido", { status: 401 });
    answers = permission.project.answers;
    fileName = permission.project.slug;
  }
  if (!answers.length) return json(null, { status: 204 }); // empty formmy do nothing
  // CSV logic

  return new Response(generateCSV(answers), {
    headers: {
      "Content-Disposition": `filename=${fileName}.csv`,
      "Content-Type": "application/csv",
    },
  });
};

export const generateCSV = (objects: Record<string, any>[]) => {
  const headers = Object.keys(objects[0].data); // last because orderBy desc
  const records = objects
    .map((record) => {
      let str = "";
      headers.forEach((header) => {
        str += (record.data[header] ? record.data[header] : "n/a") + ",";
      });
      return str + "\n";
      //@TODO: extra fields
      // const missingfields = Object.keys(answer.data).filter(
      //   (key) => !headers.includes(key)
      // );
      // missingfields.map((field) => {
      //   str +
      //     `CAMPO_NO_INCLUDIO_EN_LA_VERSION_ACTUAL:${answer.data[field]}` +
      //     ",";
      // });
    })
    .join("");
  return `${headers}\n${records}`;
};
