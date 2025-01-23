import { z } from "zod";

export const validateBasic = (
  form: Record<string, string | FormDataEntryValue>
) => {
  const keys = Object.keys(form);
  let errors: {
    email?: string;
    name?: string;
    phone?: string;
    company?: string;
    message?: string;
  } = {};
  let isValid = true;
  if (keys.includes("email")) {
    const result = z
      .string()
      .email({ message: "Introduce un email válido" })
      .safeParse(form.email);
    errors.email = result.error?.issues[0].message;
    isValid = result.success ? isValid : false;
  }
  if (keys.includes("name")) {
    const result = z
      .string()
      .min(4, { message: "Tu nombre debe contener mínimo 4 caracteres" })
      .safeParse(form.name);
    errors.name = result.error?.issues[0].message;
    isValid = result.success ? isValid : false;
  }
  if (keys.includes("phone")) {
    const result = z
      .string()
      .min(10, { message: "Introduce un número de almenos 10 digitos" })
      .safeParse(form.phone);
    errors.phone = result.error?.issues[0].message;
    isValid = result.success ? isValid : false;
  }
  if (keys.includes("company")) {
    const result = z
      .string()
      .min(4, {
        message: "El nombre de la empresa debe tener al menos 4 caracteres",
      })
      .safeParse(form.company);
    errors.company = result.error?.issues[0].message;
    isValid = result.success ? isValid : false;
  }
  if (keys.includes("message")) {
    const result = z
      .string()
      .min(10, {
        message: "El mensaje es muy corto",
      })
      .safeParse(form.message);
    errors.message = result.error?.issues[0].message;
    isValid = result.success ? isValid : false;
  }
  return { errors, isValid };
};
