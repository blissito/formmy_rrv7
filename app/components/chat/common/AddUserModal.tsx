import Spinner from "~/components/Spinner";
import Modal from "~/components/Modal";
import { useState, type ChangeEvent } from "react";
import { z } from "zod";
import { Button } from "~/components/Button";

export const AddUserModal = ({
  isLoading,
  onClose,
  onSubmit,
  projectName,
  cta = "Invitar",
  placeholder = "ejemplo@gmail.com",
}: {
  isLoading?: boolean;
  onClose?: () => void;
  onSubmit: (email: string, role: string) => void;
  projectName: string;
  cta?: string;
  placeholder?: string;
}) => {
  const [email, setEmail] = useState("");
  const [validEmail, setValidEmail] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("VIEWER");

  
  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const emailValue = ev.target.value;
    setEmail(emailValue);
    const { success } = z.string().email().safeParse(emailValue);
    if (success) setValidEmail(emailValue);
    else setValidEmail(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validEmail) {
      onSubmit(validEmail, selectedRole);
    }
  };

  return (
    <Modal title="Agregar usuario" onClose={onClose} size="md" className="  px-4 pb-4 md:pt-0 md:pb-8 md:px-8 box-border overflow-hidden  ">
      <form
        onSubmit={handleSubmit}
      > 
        <div className=" w-full mt-6 md:mt-8">
          <label className="block text-sm font-medium mb-1 text-metal">
            Email
          </label>
          <input
            onChange={handleChange}
            type="email"
            value={email}
            required
            placeholder={placeholder}
            className="h-12 input font-normal w-full md:w-[416px] border-[1px] border-outlines focus:outline-none focus:ring-0  focus:border-brand-500 rounded-xl placeholder:text-lightgray text-dark"
            />
        </div>

        <div className="mb-4 mt-4 md:mt-6">
          <label className="block text-sm font-medium mb-1 text-metal">
            Rol del usuario
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="h-12 input font-normal w-full md:w-[416px] border-[1px] border-outlines focus:outline-none focus:ring-0  focus:border-brand-500 rounded-xl placeholder:text-lightgray text-dark"
            >
            <option value="VIEWER" className="dark:bg-space-900">
              Espectador - Solo lectura
            </option>
            <option value="EDITOR" className="dark:bg-space-900">
              Editor - Lectura y escritura
            </option>
            <option value="ADMIN" className="dark:bg-space-900">
              Admin - Todos los permisos
            </option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {selectedRole === "VIEWER" && "Puede ver conversaciones pero no puede editar la configuración"}
            {selectedRole === "EDITOR" && "Puede ver conversaciones y editar configuración básica"}
            {selectedRole === "ADMIN" && "Tiene acceso completo incluyendo gestión de usuarios"}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            disabled={!validEmail || isLoading}
            type="submit"
          >
            <div className="min-w-[60px] flex justify-center">
              {isLoading ? <Spinner color="brand" /> : cta}
            </div>
          </Button>
        </div>
      </form>
    </Modal>
  );
};