import { db } from "~/utils/db.server";
import invariant from "tiny-invariant";
import { saveForm } from "~/utils/savers/saveForm";
import { validateBasic } from "~/utils/validation";
import { data as json } from "react-router";
import { notifyOwner } from "~/utils/notifyers/notifyOwner";

const sendAllNotifications = async (projectId: string) => {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { name: true, User: true, settings: true },
  });
  invariant(project && project.User);
  const permissions = await db.permission.findMany({
    where: {
      projectId,
      notifications: true,
      status: "active",
    },
    select: {
      email: true,
    },
  });
  let list: string[] = [];
  if (project.User.email && project.settings?.notifications.new) {
    list = [project.User.email]; // owner
  }
  const emails = list.concat(permissions.map((p) => p.email));
  await notifyOwner({ projectId, emails, projectName: project.name });
};

export const action = async ({ request, params }: ActionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "toggle_notifications_for_permission") {
    const permissionId = formData.get("permissionId") as string;
    const value = formData.get("value");
    await db.permission.update({
      where: { id: permissionId },
      data: {
        notifications: value === "true",
      },
    });
    return { ok: true };
  }

  if (intent === "submit_formmy") {
    let form = Object.fromEntries(formData) as {
      projectId: string;
      name: string;
    }; // @todo better schema, check subjects types from openAuth project
    const { errors, isValid } = validateBasic(form); // @TODO: will need more advanced schema (maybe) validation
    if (!isValid || !form.projectId) {
      console.log("ERRORS:", errors);
      console.log("isValid:", isValid);
      console.log("Form:", form);
      return json(
        {
          ok: false,
          errors: {
            ...errors,

            projectId: !form.projectId && "No projectId present",
          },
          data: form,
        },
        { status: 400 }
      );
    }
    // saving V1
    form = { ...form, intent: undefined };
    await saveForm({ form, projectId: form.projectId });
    // notify
    await sendAllNotifications(form.projectId);
    return json({ ok: true });
  }

  return null;
};