import { Form } from "react-router";
import Spinner from "./Spinner";
import Modal from "./Modal";
import { useState, type ChangeEvent } from "react";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { Button } from "./Button";

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
    <Modal onClose={onClose}   title="Agregar usuario" size="md" className="px-4 pb-4 md:pt-0 md:pb-8 md:px-8 box-border overflow-hidden  ">
      <Form
        method="post"
      >
    <div className=" w-full mt-6 md:mt-8">
    <label className="block text-sm font-medium mb-1 text-metal">
           Email
          </label>
          <input
            onChange={handleChange}
            type="email"
            name="email"
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
            name="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="h-12 w-full border-[1px] border-gray-100 dark:border-clear/30 dark:bg-transparent focus:outline-none focus:ring-0 bg-transparent focus:border-brand-500 rounded-lg px-3"
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
                    <Button
                      disabled={!validEmail || isLoading}
                      name="intent"
                      value="send_invite_with_role"
                      type="submit"
                    >
                      <div className="min-w-[60px] flex justify-center">
                        {isLoading ? <Spinner color="brand-500" /> : cta}
                      </div>
                    </Button>
                  </div>

      </Form>
    </Modal>
  );
};