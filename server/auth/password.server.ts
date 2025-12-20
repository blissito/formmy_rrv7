import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { db } from "~/utils/db.server";

const SALT_ROUNDS = 12;
const PASSWORD_MIN_LENGTH = 8;
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hora

export type PasswordValidation = {
  valid: boolean;
  errors: string[];
};

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Una mayúscula");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Una minúscula");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Un número");
  }

  return { valid: errors.length === 0, errors };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticateWithPassword(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  if (!user || !user.passwordHash) {
    return { success: false, error: "Email o contraseña incorrectos" };
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return { success: false, error: "Email o contraseña incorrectos" };
  }

  return { success: true };
}

export async function createPasswordResetToken(
  email: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    // No revelar si el usuario existe
    return { success: true };
  }

  if (!user.passwordHash) {
    return {
      success: false,
      error:
        "Esta cuenta usa Google para iniciar sesión. Usa el botón de Google.",
    };
  }

  const token = randomUUID();
  const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetExpires: expires,
    },
  });

  return { success: true, token };
}

export async function verifyResetToken(
  token: string
): Promise<{ valid: boolean; userId?: string; email?: string; error?: string }> {
  const user = await db.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
    select: { id: true, email: true },
  });

  if (!user) {
    return { valid: false, error: "Enlace inválido o expirado" };
  }

  return { valid: true, userId: user.id, email: user.email };
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const validation = validatePassword(newPassword);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(". ") };
  }

  const tokenCheck = await verifyResetToken(token);
  if (!tokenCheck.valid) {
    return { success: false, error: tokenCheck.error };
  }

  const passwordHash = await hashPassword(newPassword);

  await db.user.update({
    where: { id: tokenCheck.userId },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  return { success: true };
}

export async function addPasswordToAccount(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const validation = validatePassword(newPassword);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(". ") };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    return { success: false, error: "Usuario no encontrado" };
  }

  if (user.passwordHash) {
    return { success: false, error: "Ya tienes una contraseña" };
  }

  const passwordHash = await hashPassword(newPassword);

  await db.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { success: true };
}
