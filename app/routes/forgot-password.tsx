import { Form, Link, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/forgot-password";
import { createPasswordResetToken } from "server/auth/password.server";
import { sendPasswordResetEmail } from "server/notifyers/passwordReset";
import { getUserOrNull } from "server/getUserUtils.server";
import { redirect } from "react-router";
import { db } from "~/utils/db.server";
import { cn } from "~/lib/utils";
import { HiCheck } from "react-icons/hi";

export const meta = () => [
  { title: "Recuperar contraseña - Formmy" },
];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrNull(request);
  if (user) throw redirect("/dashboard/ghosty");
  return null;
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    return { error: "El email es requerido" };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { name: true, passwordHash: true },
  });

  // Siempre mostrar éxito para no revelar si el email existe
  if (!user) {
    return { success: true };
  }

  // Usuario solo-Google
  if (!user.passwordHash) {
    return {
      error: "Esta cuenta usa Google para iniciar sesión. Usa el botón de Google.",
    };
  }

  const result = await createPasswordResetToken(email);

  if (result.token) {
    const host =
      process.env.NODE_ENV === "production"
        ? "https://www.formmy.app"
        : "http://localhost:3000";

    const resetLink = `${host}/reset-password?token=${result.token}`;

    try {
      await sendPasswordResetEmail({
        email,
        name: user.name || undefined,
        resetLink,
      });
    } catch (error) {
      console.error("Error enviando email de reset:", error);
      return { error: "Error al enviar el email. Intenta de nuevo." };
    }
  }

  return { success: true };
};

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block mb-8 text-center">
          <img src="/assets/formmy-logo.png" alt="Formmy" className="h-10 mx-auto" />
        </Link>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          {actionData?.success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiCheck className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-dark mb-2">
                Revisa tu email
              </h1>
              <p className="text-space-300 mb-6">
                Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
              </p>
              <Link
                to="/login"
                className="text-brand-500 font-medium hover:text-brand-600"
              >
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-dark text-center mb-2">
                Recuperar contraseña
              </h1>
              <p className="text-space-300 text-center mb-8">
                Te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <Form method="post" className="space-y-4">
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
                    "Enviar enlace"
                  )}
                </button>
              </Form>

              <p className="text-center text-space-300 text-sm mt-6">
                <Link to="/login" className="text-brand-500 font-medium hover:text-brand-600">
                  Volver a iniciar sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
