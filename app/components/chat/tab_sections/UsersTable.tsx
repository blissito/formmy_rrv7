import { Toggle } from "~/components/Switch";
import { BsThreeDots } from "react-icons/bs";
import FloatingMenu from "~/components/common/FloatingMenu";

export const UsersTable = () => {
  return (
    <article>
      <section className="grid grid-cols-10 text-xs font-medium">
        <h6 className="col-span-1"></h6>
        <h6 className="col-span-2">Email</h6>
        <h6 className="col-span-2">Rol</h6>
        <h6 className="col-span-2">Estatus</h6>
        <h6 className="col-span-2">Notificaciones</h6>
        <h6 className="col-span-1"></h6>
      </section>
      <section>
        {[1, 2, 3].map((n) => (
          <UserRow key={n} />
        ))}
      </section>
    </article>
  );
};

export const UserRow = () => {
  return (
    <section className="grid items-center grid-cols-10 my-3 border border-gray-300 p-3 rounded-xl">
      <img
        className="w-7 h-7 col-span-1"
        src="/assets/chat/ghosty.svg"
        alt="user's avatar"
      />

      <p className="font-medium text-xs truncate col-span-2">
        brenda@fixter.org
      </p>

      <p className="col-span-2 text-xs">Propietario</p>
      <p className="col-span-2 text-xs">
        <Status status="activo" />
      </p>
      <p className="col-span-2 scale-75">
        <Toggle defaultValue={true} />
      </p>
      <FloatingMenu
        items={[
          {
            icon: <img src="/assets/chat/letter.svg" alt="letter icon" />,
            label: "Reenviar",
            onClick: () => {},
          },
          {
            icon: <img src="/assets/chat/recyclebin.svg" alt="trash icon" />,
            label: "Eliminar",
            onClick: () => {},
          },
        ]}
        buttonClassName="text-2xl text-gray-600 hover:bg-gray-100 p-1 rounded-full"
        buttonLabel="Opciones"
      />
    </section>
  );
};

// @TODO: add colors
const Status = ({ status }: { status: string }) => {
  return (
    <p className="col-span-2 text-xs text-green-500 capitalize">{status}</p>
  );
};
