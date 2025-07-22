import { data as json } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { ProTag } from "~/components/ProTag";
import Spinner from "~/components/Spinner";
import { Toggle } from "~/components/Switch";
import { db } from "~/utils/db.server";
import { getUserOrNull } from "server/getUserUtils.server";
import { type Notifications, notificationsSchema } from "~/utils/zod";
import type { Route } from "./+types/dash_.$projectId_.settings.notifications";

export const action = async ({ request, params }: Route.ActionArgs) => {
  const formData = await request.formData();
  const notifications = Object.fromEntries(formData);
  const validData = notificationsSchema.parse(notifications) as Notifications;

  await db.project.update({
    where: { id: params.projectId },
    data: { settings: { notifications: validData } },
  });

  return null;
};

// @TODO we need to know if user is prom in this route
export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const user = await getUserOrNull(request); // why? well, not sure... just don't want to redirect.
  const project = await db.project.findUnique({
    where: { id: params.projectId },
  });
  if (!project) throw json(null, { status: 404 });
  const isPro = user?.plan === "PRO" ? true : false;
  return {
    isPro,
    notifications: project.settings?.notifications,
  };
};

export default function Route() {
  const {
    notifications = { new: false, members: false, warning: false }, // true defaults ;)
    isPro,
  } = useLoaderData<typeof loader>();
  // let settings = {};
  const fetcher = useFetcher();

  const updateSettingsWarning = (bool: boolean) =>
    fetcher.submit({ ...notifications, warning: bool }, { method: "post" });

  const updateSettingsMembers = (bool: boolean) =>
    fetcher.submit({ ...notifications, members: bool }, { method: "post" });

  const updateSettingsNew = (bool: boolean) => {
    if (!isPro) {
      fetcher.submit(
        { new: bool, members: false, warning: false },
        { method: "post" }
      );
      return;
    }
    fetcher.submit({ ...notifications, new: bool }, { method: "post" });
  };

  return (
    <section className="flex flex-col">
      <div className="flex gap-2">
        <h2 className="text-xl font-bold">Notificaciones por email</h2>
        {fetcher.state !== "idle" && <Spinner />}
      </div>
      <hr className="mt-2 mb-6 dark:border-t-white/10" />
      <div className="flex flex-col gap-14">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-md">Nuevos mensajes</p>
            <p className="font-light text-sm text-gray-500">
              Recibe un correo cada que tu Formmy recibe un nuevo mensaje.
            </p>
          </div>
          <Toggle
            onChange={updateSettingsNew}
            name="new"
            defaultValue={notifications.new}
          />
        </div>

        <div className="flex justify-between">
          <div>
            <p className="font-bold text-md">Cambio en los miembros</p>
            <p className="font-light text-sm text-gray-500">
              Recibe un correo cuando un nuevo usuario acepte tu invitación como
              administrador
            </p>
          </div>
          <div className="relative">
            <Toggle
              onChange={updateSettingsMembers}
              isDisabled={!isPro}
              defaultValue={notifications.members}
            />
            {!isPro && <ProTag />}
          </div>
        </div>

        <div className="flex justify-between">
          <div>
            <p className="font-bold text-md">Actividad en tu formmy</p>
            <p className="font-light text-sm text-gray-500">
              Recibe un correo cuando se apliquen cambios importantes en tu
              Formmy (como al eliminar el Formmy)
            </p>
          </div>
          <div className="relative">
            {!isPro && <ProTag />}
            <Toggle
              onChange={updateSettingsWarning}
              isDisabled={!isPro}
              defaultValue={notifications.warning}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
