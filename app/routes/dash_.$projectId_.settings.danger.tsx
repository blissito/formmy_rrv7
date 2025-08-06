import { data as json } from "react-router";
import { type SyntheticEvent, useState } from "react";
import { redirect, useFetcher, useLoaderData } from "react-router";
import { Button } from "~/components/Button";
import ConfirmModal from "~/components/ConfirmModal";
import Modal from "~/components/Modal";
import Spinner from "~/components/Spinner";
// import { useToastV1 } from "~/components/Toast";
import { TextField } from "~/components/formmys/FormyV1";
import { db } from "~/utils/db.server";
import { getUserOrRedirect, getProjectWithAccess } from "server/getUserUtils.server";

export const action = async ({ params, request }: ActionArgs) => {
  const user = await getUserOrRedirect(request);
  const intent = (await request.formData()).get("intent") as String;
  
  if (intent === "delete") {
    // Delete requires admin permissions
    const access = await getProjectWithAccess(user.id, params.projectId!, "delete");
    if (!access) {
      throw json(null, { status: 403 });
    }
    
    // @TODO: delete files from firebase
    await db.answer.deleteMany({ where: { projectId: params.projectId } }); // cascade deleting
    await db.project.delete({ where: { id: params.projectId } });
    return redirect("/dash");
  }
  return null;
};

export const loader = async ({ params, request }: LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  const projectId = params.projectId!;
  
  // Danger settings require delete permission (admin level)
  const access = await getProjectWithAccess(user.id, projectId, "delete");
  
  if (!access) {
    throw json(null, { status: 404 });
  }
  
  return { project: access.project };
};

export default function Page() {
  const { project } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [match, set] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  // const { toast } = useToastV1();

  const handleDelete = () => {
    fetcher.submit({ intent: "delete" }, { method: "post" });
    // toast({ text: "Tu formmy se ha eliminado correctamente 🥺" });
  };

  /* <Suspense fallback={null}>{toasters}</Suspense> @TODO: global toastr????? */
  return (
    <>
      <section className="flex flex-col">
        <div className="flex gap-2">
          <h2 className="text-xl font-bold truncate">
            Configuración {project.name}
          </h2>
          {fetcher.state !== "idle" && <Spinner />}
        </div>
        <hr className="mt-2 mb-6 dark:border-t-white/10" />
        <div
          className="flex flex-col gap-14 p-4 border-2 border-[#D5173C] rounded-xl dark:bg-red-100
         bg-red-100/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-md text-[#D5173C]">
                Esto eliminará tu Formmy y todos sus mensajes
              </p>
              <p className="font-light text-sm text-[#D5173C]">
                Si tienes alguna duda, recuerda que siempre podemos platicar:{" "}
                <a href="mailto:hola@formmy.app">hola@formmy.app</a>
              </p>
            </div>
            <Button
              isLoading={fetcher.state !== "idle"}
              onClick={() => setShowConfirm(true)}
              className="bg-[#D5173C] hover:scale-95 transition-all text-xs m-0"
              type="submit"
            >
              Eliminar Formmy
            </Button>
          </div>
        </div>
      </section>

      <ConfirmModal
        onClose={() => setShowConfirm(false)}
        isOpen={showConfirm}
        title="¿Estás segur@ de eliminar este Formmy?"
        message="Si lo eliminas, dejarás de recibir mensajes y todos los mensajes que
            tenías se eliminarán automáticamente."
        footer={
          <div className="flex mb-8">
            <Button
              autoFocus
              onClick={() => setShowConfirm(false)}
              className="bg-gray-300 text-space-700"
            >
              Cancelar
            </Button>
            <Button
              isLoading={fetcher.state !== "idle"}
              onClick={match === project.name ? handleDelete : undefined}
              isDisabled={match !== project.name}
              className="bg-red-400 text-red-100 not:disabled:hover:scale-105 transition-all disabled:bg-gray-500 disabled:text-gray-800"
            >
              Sí, eliminar
            </Button>
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (match === project.name) {
              handleDelete();
            }
          }}
        >
          <TextField
            onChange={(value) => set(value)}
            name="name"
            label={`Escribe el nombre del Formmy: ${project.name}`}
            type="text"
            placeholder={project.name}
            className="mb-0"
            autocomplete="off"
            onPaste={(e: SyntheticEvent) => e.preventDefault()}
          />
        </form>
      </ConfirmModal>
    </>
  );
}
