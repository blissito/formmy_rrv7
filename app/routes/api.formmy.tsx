import { db } from "~/utils/db.server";
import invariant from "tiny-invariant";
import { saveForm } from "~/utils/savers/saveForm";
import { validateBasic } from "~/utils/validation";
import { data as json, type ActionFunctionArgs } from "react-router";
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
      resourceType: "PROJECT",
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

export const action = async ({ request, params }: ActionFunctionArgs) => {
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

  if (intent === "delete_permission") {
    const permissionId = formData.get("permissionId") as string;
    await db.permission.delete({
      where: { id: permissionId },
    });
    return json({ ok: true });
  }

  if (intent === "resend_invitation") {
    const permissionId = formData.get("permissionId") as string;
    // TODO: Implement resend invitation logic
    // This could involve sending an email notification or updating status
    console.log("Resending invitation for permission:", permissionId);
    return json({ ok: true, message: "Invitation resent" });
  }

  if (intent === "submit_formmy") {
    let form = Object.fromEntries(formData) as {
      projectId: string;
      email: string;
    }; // @todo better schema, check subjects types from openAuth project
    const { errors, isValid } = validateBasic(form); // @TODO: will need more advanced schema (maybe) validation
    if (!isValid || !form.projectId) {
      return new Response(
        JSON.stringify({
          ok: false,
          data: form,
          errors,
        }),
        { status: 400 }
      );
    }
    // saving V1
    const projectId = form.projectId;
    delete form.intent;
    delete form.projectId;
    await saveForm({ form, projectId });
    // notify
    await sendAllNotifications(projectId);
    return new Response(JSON.stringify({ ok: true }));
  }

  return null;
};
