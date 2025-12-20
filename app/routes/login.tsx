import { useState } from "react";
import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/login";
import { commitSession, getSession } from "~/sessions";
import { authenticateWithPassword } from "server/auth/password.server";
import { getUserOrNull } from "server/getUserUtils.server";
import { cn } from "~/lib/utils";
import { HiEye, HiEyeOff } from "react-icons/hi";

export const meta = () => [
  { title: "Iniciar sesión - Formmy" },
];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrNull(request);
  if (user) throw redirect("/dashboard/ghosty");
  return null;
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "email-login") {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      return { error: "Email y contraseña son requeridos" };
    }

    const result = await authenticateWithPassword(email, password);

    if (!result.success) {
      return { error: result.error };
    }

    const session = await getSession(request.headers.get("Cookie"));
    session.set("userId", email);

    throw redirect("/dashboard/ghosty", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }

  return null;
};

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block mb-8 text-center">
          <img src="/assets/formmy-logo.png" alt="Formmy" className="h-10 mx-auto" />
        </Link>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h1 className="text-2xl font-bold text-dark text-center mb-2">
            Bienvenido de vuelta
          </h1>
          <p className="text-space-300 text-center mb-8">
            Inicia sesión en tu cuenta
          </p>

          {/* Google Login */}
          <Form method="post" action="/api/login" className="mb-6">
            <button
              type="submit"
              name="intent"
              value="google-login"
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-full py-3 px-4 text-dark font-medium hover:bg-gray-50 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>
          </Form>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-space-300 text-sm">o</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Email/Password Form */}
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="email-login" />

            {actionData?.error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {actionData.error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="h-12 w-full border border-gray-200 focus:outline-none focus:border-brand-500 rounded-xl px-4 placeholder:text-space-300"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-dark">
                  Contraseña
                </label>
                <Link to="/forgot-password" className="text-sm text-brand-500 hover:text-brand-600">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
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
                "Iniciar sesión"
              )}
            </button>
          </Form>

          <p className="text-center text-space-300 text-sm mt-6">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="text-brand-500 font-medium hover:text-brand-600">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
