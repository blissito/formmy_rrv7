import { useState } from "react";
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import type { Route } from "./+types/reset-password";
import { resetPassword, verifyResetToken } from "server/auth/password.server";
import { cn } from "~/lib/utils";
import { HiEye, HiEyeOff, HiCheck, HiX } from "react-icons/hi";

export const meta = () => [
  { title: "Nueva contraseña - Formmy" },
];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  console.log("🔐 Reset password loader - URL:", url.pathname + url.search);
  console.log("🔐 Token from URL:", token ? `${token.substring(0, 8)}...` : "NO TOKEN");

  if (!token) {
    console.log("🔐 No token, redirecting to forgot-password");
    throw redirect("/forgot-password");
  }

  const result = await verifyResetToken(token);
  console.log("🔐 Token verification result:", { valid: result.valid, error: result.error });

  if (!result.valid) {
    return { validToken: false, error: result.error, token: null, email: null };
  }

  return { validToken: true, token, email: result.email, error: null };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  console.log("🔑 Reset password action - token received:", token ? `${token.substring(0, 8)}...` : "EMPTY");
  console.log("🔑 Token length:", token.length);

  if (!password) {
    return { error: "La contraseña es requerida" };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden" };
  }

  const result = await resetPassword(token, password);
  console.log("🔑 Reset result:", result);

  if (!result.success) {
    return { error: result.error };
  }

  return { success: true };
};

export default function ResetPassword() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const requirements = [
    { met: password.length >= 8, text: "8+ caracteres" },
    { met: /[A-Z]/.test(password), text: "Mayúscula" },
    { met: /[a-z]/.test(password), text: "Minúscula" },
    { met: /[0-9]/.test(password), text: "Número" },
  ];

  // Success state - CHECK FIRST (loader revalidates after action invalidates token)
  if (actionData?.success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Link to="/" className="block mb-8 text-center">
            <img src="/assets/formmy-logo.png" alt="Formmy" className="h-10 mx-auto" />
          </Link>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiCheck className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-dark mb-2">
              Contraseña actualizada
            </h1>
            <p className="text-space-300 mb-6">
              Tu contraseña ha sido cambiada exitosamente.
            </p>
            <Link
              to="/login"
              className="inline-block bg-brand-500 text-white font-medium py-3 px-6 rounded-full hover:bg-brand-600 transition-all"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Invalid/expired token (checked AFTER success to handle post-reset revalidation)
  if (!loaderData.validToken) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Link to="/" className="block mb-8 text-center">
            <img src="/assets/formmy-logo.png" alt="Formmy" className="h-10 mx-auto" />
          </Link>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiX className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-dark mb-2">
              Enlace inválido
            </h1>
            <p className="text-space-300 mb-6">
              {loaderData.error || "Este enlace ha expirado o ya fue utilizado."}
            </p>
            <Link
              to="/forgot-password"
              className="inline-block bg-brand-500 text-white font-medium py-3 px-6 rounded-full hover:bg-brand-600 transition-all"
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block mb-8 text-center">
          <img src="/assets/formmy-logo.png" alt="Formmy" className="h-10 mx-auto" />
        </Link>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h1 className="text-2xl font-bold text-dark text-center mb-2">
            Nueva contraseña
          </h1>
          <p className="text-space-300 text-center mb-8">
            Crea una nueva contraseña para <strong>{loaderData.email}</strong>
          </p>

          <Form method="post" action={`?token=${loaderData.token}`} className="space-y-4">
            <input type="hidden" name="token" value={loaderData.token || ""} />

            {actionData?.error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {actionData.error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark mb-1.5">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full border border-gray-200 focus:outline-none focus:border-brand-500 rounded-xl px-4 pr-12 placeholder:text-space-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                </button>
              </div>

              {password && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {requirements.map((req, i) => (
                    <span
                      key={i}
                      className={cn(
                        "text-xs flex items-center gap-1",
                        req.met ? "text-green-600" : "text-gray-400"
                      )}
                    >
                      {req.met ? <HiCheck className="w-3 h-3" /> : <HiX className="w-3 h-3" />}
                      {req.text}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark mb-1.5">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                className="h-12 w-full border border-gray-200 focus:outline-none focus:border-brand-500 rounded-xl px-4 placeholder:text-space-300"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full bg-brand-500 text-white font-medium py-3 rounded-full",
                "hover:bg-brand-600 transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                "Cambiar contraseña"
              )}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
