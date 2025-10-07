import type { Chatbot, User } from "@prisma/client";

export const Contactos = ({
  chatbot,
  user,
}: {
  chatbot: Chatbot;
  user: User;
}) => {
  return (
    <section className="h-full min-h-[60vh] place-items-center grid">
      <div>
        <img
          className="w-40 md:w-[200px] mx-auto"
          src="/dash/comming.svg"
          alt="coming soon"
        />
        <h3 className="text-2xl font-bold text-dark text-center heading mt-6">
          Contactos en Camino
        </h3>
        <p className="paragraph text-center text-metal mt-3 max-w-md mx-auto">
          Estamos trabajando en una herramienta para gestionar los contactos
          recopilados por tu chatbot. Pronto podrás ver, exportar y administrar
          toda la información de tus leads.
        </p>
      </div>
    </section>
  );
};
