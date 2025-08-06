import { Form } from "react-router";
import Spinner from "./Spinner";
import Modal from "./Modal";
import { useState, type ChangeEvent } from "react";
import { z } from "zod";
import type { Role } from "@prisma/client";

export const InputModalFormWithRole = ({
  isLoading,
  onClose,
  cta = "Invitar",
  placeholder = "ejemplo@gmail.com",
  title,
}: {
  isLoading?: boolean;
  onClose?: () => void;
  cta?: string;
  placeholder?: string;
  title: string;
}) => {
  const [validEmail, setValidEmail] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("VIEWER");

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const email = ev.target.value;
    const { success } = z.string().email().safeParse(email);
    if (success) setValidEmail(email);
    else setValidEmail(null);
  };

  return (
    <Modal onClose={onClose}>
      <Form
        method="post"
        className="md:px-6 px-4 py-4 md:py-10 gap-2 bg-clear dark:bg-space-900 rounded-3xl dark:text-white text-space-900"
      >
        <h2 className="font-bold mb-6 text-2xl text-center mt-6 md:mt-0">
          {title}
        </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Correo electrónico
          </label>
          <input
            onChange={handleChange}
            type="email"
            name="email"
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
            name="role"
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
            {selectedRole === "VIEWER" && "Puede ver mensajes pero no puede editar ni eliminar"}
            {selectedRole === "EDITOR" && "Puede ver, editar y actualizar, pero no eliminar"}
            {selectedRole === "ADMIN" && "Tiene acceso completo incluyendo eliminar"}
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
            name="intent"
            value="send_invite_with_role"
            type="submit"
            className="bg-brand-500 h-10 text-clear py-2 px-6 rounded-lg disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
          >
            <div className="min-w-[60px] flex justify-center">
              {isLoading ? <Spinner color="brand" /> : cta}
            </div>
          </button>
        </div>
      </Form>
    </Modal>
  );
};