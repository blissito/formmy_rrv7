import { Toggle } from "~/components/Switch";
import { BsThreeDots } from "react-icons/bs";
import FloatingMenu from "~/components/common/FloatingMenu";

export const UsersTable = () => {
  return (
    <article>
      <section className="grid grid-cols-10 text-sm px-4 ">
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
    <section className="grid items-center grid-cols-10 my-3 border border-outlines p-4 rounded-xl">
      <div className="col-span-1">
      <img
        className="w-10 h-10"
        src="/assets/chat/ghosty.svg"
        alt="user's avatar"
      />
      </div>

      <p className="font-medium text-sm truncate col-span-2">
        brenda@fixter.org
      </p>

      <p className="col-span-2 text-sm">Propietario</p>
      <p className="col-span-2 text-sm">
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
        buttonClassName="text-2xl text-metal hover:bg-irongray/10 transition-all p-1 rounded-full"
        buttonLabel="Opciones"
      />
    </section>
  );
};

// @TODO: add colors
const Status = ({ status }: { status: string }) => {
  return (
    <p className="col-span-2 text-sm text-green-500 capitalize">{status}</p>
  );
};
