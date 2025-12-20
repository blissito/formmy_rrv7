import { useState } from "react";
import {
  createBillingSessionOrCheckoutURL,
  searchStripeSubscriptions,
} from "~/utils/stripe.server";
import Nav from "~/components/NavBar";
import { redirect } from "react-router";
import type { Route } from "./+types/profile";
import SuccessModal from "~/components/SuccessModal";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { useLoaderData, useNavigation, useActionData, Form } from "react-router";
import { CardFree, CardPro } from "./dashboard.plan";
import { addPasswordToAccount } from "server/auth/password.server";
import { db } from "~/utils/db.server";
import { cn } from "~/lib/utils";
import { HiEye, HiEyeOff, HiCheck, HiX } from "react-icons/hi";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  const url = new URL(request.url);
  const success = url.searchParams.get("success") === "1";
  const subscription = await searchStripeSubscriptions(user);

  // Check if user has password
  const userWithPassword = await db.user.findUnique({
    where: { email: user.email },
    select: { passwordHash: true, provider: true },
  });

  return {
    user,
    success,
    hasPassword: !!userWithPassword?.passwordHash,
    provider: userWithPassword?.provider || "google",
    subscription: {
      endDate: subscription?.current_period_end * 1000,
      planPrice: subscription?.plan?.amount_decimal * 0.01,
    },
  };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const intent = formData.has("intent")
    ? String(formData.get("intent"))
    : undefined;

  if (intent === "manage-stripe") {
    const user = await getUserOrRedirect(request);
    const url = new URL(request.url);
    const link = await createBillingSessionOrCheckoutURL(user, url.origin);
    return redirect(link);
  }

  if (intent === "add-password") {
    const user = await getUserOrRedirect(request);
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (!password) {
      return { passwordError: "La contraseña es requerida" };
    }

    if (password !== confirmPassword) {
      return { passwordError: "Las contraseñas no coinciden" };
    }

    const result = await addPasswordToAccount(user.id, password);

    if (!result.success) {
      return { passwordError: result.error };
    }

    return { passwordSuccess: true };
  }

  return null;
};

export default function Profile() {
  const { user, success, subscription, hasPassword, provider } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const requirements = [
    { met: password.length >= 8, text: "8+ caracteres" },
    { met: /[A-Z]/.test(password), text: "Mayúscula" },
    { met: /[a-z]/.test(password), text: "Minúscula" },
    { met: /[0-9]/.test(password), text: "Número" },
  ];

  return (
    <>
      {success && <SuccessModal />}
      <Nav user={user} />
      <section className="dark:bg-space-900 min-h-screen">
        <section className="pt-32 md:pt-40 pb-20 px-4 md:px-0 lg:max-w-6xl max-w-3xl mx-auto text-space-500 dark:text-space-300">
          <h2 className="text-3xl md:text-5xl text-space-800 dark:text-white font-semibold">
            Mi perfil
          </h2>
          <div className="mt-12 flex gap-4 items-center">
            <img
              className="h-20 w-20 rounded-full"
              alt="user"
              src={user.picture}
            />
            <div>
              <h3 className="text-space-800 dark:text-white font-semibold">
                {user.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-light">
                {user.email}
              </p>
            </div>
          </div>

          <hr className="my-6 md:my-10 dark:border-t-white/10" />

          <h2 className="text-xl md:text-2xl text-space-800 dark:text-white font-semibold">
            Plan
          </h2>
          {user.plan === "PRO" ? (
            <CardPro
              isLoading={navigation.state === "submitting"}
              endDate={subscription.endDate}
              planPrice={subscription.planPrice}
            />
          ) : (
            <CardFree />
          )}

          <hr className="my-6 md:my-10 dark:border-t-white/10" />

          <h2 className="text-xl md:text-2xl text-space-800 dark:text-white font-semibold mb-4">
            Seguridad
          </h2>

          <div className="bg-gray-50 dark:bg-space-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white dark:bg-space-700 rounded-full flex items-center justify-center">
                {provider === "google" ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                ) : (
                  <span className="text-lg">🔐</span>
                )}
              </div>
              <div>
                <p className="font-medium text-space-800 dark:text-white">
                  {provider === "google" ? "Cuenta de Google" : "Email y contraseña"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {hasPassword
                    ? "Puedes iniciar sesión con Google o contraseña"
                    : "Iniciaste sesión con Google"}
                </p>
              </div>
            </div>

            {!hasPassword && !showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="text-brand-500 hover:text-brand-600 text-sm font-medium"
              >
                Agregar contraseña
              </button>
            )}

            {actionData?.passwordSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <HiCheck className="w-5 h-5" />
                Contraseña agregada exitosamente
              </div>
            )}

            {showPasswordForm && !hasPassword && !actionData?.passwordSuccess && (
              <Form method="post" className="mt-4 space-y-4 max-w-md">
                <input type="hidden" name="intent" value="add-password" />

                {actionData?.passwordError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {actionData.passwordError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-dark dark:text-white mb-1.5">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 w-full border border-gray-200 dark:border-space-600 dark:bg-space-700 focus:outline-none focus:border-brand-500 rounded-xl px-4 pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <HiEyeOff className="w-5 h-5" />
                      ) : (
                        <HiEye className="w-5 h-5" />
                      )}
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
                          {req.met ? (
                            <HiCheck className="w-3 h-3" />
                          ) : (
                            <HiX className="w-3 h-3" />
                          )}
                          {req.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark dark:text-white mb-1.5">
                    Confirmar contraseña
                  </label>
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    className="h-12 w-full border border-gray-200 dark:border-space-600 dark:bg-space-700 focus:outline-none focus:border-brand-500 rounded-xl px-4"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={navigation.state === "submitting"}
                    className={cn(
                      "bg-brand-500 text-white font-medium py-2.5 px-6 rounded-full",
                      "hover:bg-brand-600 transition-all",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {navigation.state === "submitting" ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Guardar"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="text-gray-500 hover:text-gray-700 font-medium py-2.5 px-4"
                  >
                    Cancelar
                  </button>
                </div>
              </Form>
            )}
          </div>
        </section>
      </section>
    </>
  );
}
