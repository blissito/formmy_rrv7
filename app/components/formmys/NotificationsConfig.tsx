import { Card } from "../chat/common/Card";
import { ProTag } from "../ProTag";
import { Toggle } from "../Switch";

export const NotificationsConfig = ({ 
    notifications, 
    isPro, 
    onUpdateNew, 
    onUpdateMembers, 
    onUpdateWarning 
  }: {
    notifications: { new: boolean; members: boolean; warning: boolean };
    isPro: boolean;
    onUpdateNew: (value: boolean) => void;
    onUpdateMembers: (value: boolean) => void;
    onUpdateWarning: (value: boolean) => void;
  }) => {
    return (
      <section className="">
        <Card title="Configura tus notificaciones">
          <main className="grid gap-6 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-md">Nuevos mensajes</p>
                <p className="font-light text-sm text-gray-500">
                  Recibe un correo cada que tu Formmy recibe un nuevo mensaje.
                </p>
              </div>
              <Toggle
                onChange={onUpdateNew}
                defaultValue={notifications.new}
                name="new"
              />
            </div>
  
            <div className="flex items-center  justify-between">
              <div>
                <p className="font-bold text-md">Cambio en los miembros</p>
                <p className="font-light text-sm text-gray-500">
                  Recibe un correo cuando un nuevo usuario acepte tu invitación como administrador
                </p>
              </div>
              <div className="relative">
                <Toggle
                  onChange={onUpdateMembers}
                  isDisabled={!isPro}
                  defaultValue={notifications.members}
                  name="members"
                />
                {!isPro && <ProTag />}
              </div>
            </div>
  
            <div className="flex items-center  justify-between">
              <div>
                <p className="font-bold text-md">Actividad en tu formmy</p>
                <p className="font-light text-sm text-gray-500">
                  Recibe un correo cuando se apliquen cambios importantes en tu Formmy (como al eliminar el Formmy)
                </p>
              </div>
              <div className="relative">
                {!isPro && <ProTag />}
                <Toggle
                  onChange={onUpdateWarning}
                  isDisabled={!isPro}
                  defaultValue={notifications.warning}
                  name="warning"
                />
              </div>
            </div>
          </main>
        </Card>
      </section>
    );
  };