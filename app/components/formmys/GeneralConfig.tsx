import { Card } from "~/components/chat/common/Card";
import { Button } from "~/components/Button";
import ConfirmModal from "~/components/ConfirmModal";
import { TextField } from "~/components/formmys/FormyV1";
import { type SyntheticEvent } from "react";

interface GeneralConfigProps {
  project: {
    id: string;
    name: string;
  };
  isCopied: boolean;
  showConfirm: boolean;
  match: string;
  fetcherState: string;
  onCopyToClipboard: (text: string) => void;
  onSetShowConfirm: (show: boolean) => void;
  onSetMatch: (match: string) => void;
  onHandleDelete: () => void;
}

export const GeneralConfig = ({
  project,
  isCopied,
  showConfirm,
  match,
  fetcherState,
  onCopyToClipboard,
  onSetShowConfirm,
  onSetMatch,
  onHandleDelete,
}: GeneralConfigProps) => {
  return (
    <section className="grid gap-5">
      <Card title="General">
        <div className="mb-6 mt-4">
          <span className="text-sm text-gray-600 block mb-2">
            Id de tu Formmy
          </span>
          <nav className="flex gap-2 items-center">
            <p className="font-mono text-sm">{project.id}</p>
            <button
              onClick={() => onCopyToClipboard(project.id)}
              className="w-6 h-6 p-1 rounded-lg hover:bg-gray-100 border border-gray-300 flex items-center justify-center transition-colors"
              aria-label="Copiar ID"
              title="Copiar al portapapeles"
            >
              {isCopied ? (
                <svg
                  className="w-3.5 h-3.5 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <img
                  src="/assets/chat/copy.svg"
                  alt="Copiar"
                  className="w-3.5 h-3.5"
                />
              )}
            </button>
          </nav>
        </div>
        <div className="mb-6">
          <span className="text-sm text-gray-600 block mb-2">Tamaño</span>
        </div>
        <div className="mb-0">
          <span className="text-sm text-gray-600 block mb-2">
            Historial del chat
          </span>
          <p>7 días</p>
        </div>
      </Card>

      <Card title="Eliminar Formmy">
        <div className="flex items-center gap-6">
          <p className="text-metal max-w-[700px]">
            Una vez que elimines tu formmy, tu proyecto y todos los mensajes
            relacionados serán eliminados de forma permanente. Está acción es
            irreversible, así que asegúrate de que está es la acción que quieres
            tomar.
          </p>
          <Button
            isLoading={fetcherState !== "idle"}
            onClick={() => onSetShowConfirm(true)}
            className="block max-w-[220px] mt-0 ml-auto disabled:opacity-50 disabled:cursor-not-allowed w-full bg-red-500 text-white py-2 px-4 rounded-full"
            type="submit"
          >
            Eliminar Formmy
          </Button>
        </div>
      </Card>

      <ConfirmModal
        onClose={() => onSetShowConfirm(false)}
        isOpen={showConfirm}
        title="¿Estás segur@ de eliminar este Formmy?"
        message="Si lo eliminas, dejarás de recibir mensajes y todos los mensajes que
            tenías se eliminarán automáticamente."
        footer={
          <div className="flex mb-8">
            <Button
              autoFocus
              onClick={() => onSetShowConfirm(false)}
              className="bg-gray-300 text-space-700"
            >
              Cancelar
            </Button>
            <Button
              isLoading={fetcherState !== "idle"}
              onClick={match === project.name ? onHandleDelete : undefined}
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
              onHandleDelete();
            }
          }}
        >
          <TextField
            onChange={(value) => onSetMatch(value)}
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
    </section>
  );
};