import Spinner from "~/components/Spinner";
import Modal from "~/components/Modal";
import { useState, type ChangeEvent } from "react";
import { z } from "zod";

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
    <Modal onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        className="md:px-6 px-4 py-4 md:py-10 gap-2 bg-clear dark:bg-space-900 rounded-3xl dark:text-white text-space-900"
      >
        <h2 className="font-bold mb-6 text-2xl text-center mt-6 md:mt-0">
          Agregar usuario a {projectName}
        </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Correo electrónico
          </label>
          <input
            onChange={handleChange}
            type="email"
            value={email}
            required
            placeholder={placeholder}
            className="h-10 input font-normal w-full border-[1px] border-gray-100 dark:border-clear/30 dark:bg-transparent focus:outline-none focus:ring-0 bg-transparent focus:border-brand-500 rounded-lg placeholder:text-space-300 px-3"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Rol del usuario
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="h-10 w-full border-[1px] border-gray-100 dark:border-clear/30 dark:bg-transparent focus:outline-none focus:ring-0 bg-transparent focus:border-brand-500 rounded-lg px-3"
          >
            <option value="VIEWER" className="dark:bg-space-900">
              Viewer - Solo lectura
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
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            disabled={!validEmail || isLoading}
            type="submit"
            className="bg-brand-500 h-10 text-clear py-2 px-6 rounded-lg disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
          >
            <div className="min-w-[60px] flex justify-center">
              {isLoading ? <Spinner color="brand" /> : cta}
            </div>
          </button>
        </div>
      </form>
    </Modal>
  );
};