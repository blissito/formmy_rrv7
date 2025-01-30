import {
  createBillingSessionOrCheckoutURL,
  searchStripeSubscriptions,
} from "~/utils/stripe.server";
import Nav from "~/components/NavBar";
import { redirect } from "react-router";
import { twMerge } from "tailwind-merge";
import Spinner from "~/components/Spinner";
import type { Route } from "./+types/profile";
import SuccessModal from "~/components/SuccessModal";
import { getUserOrRedirect } from ".server/getUserUtils";
import useLocalStorage from "~/lib/hooks/useLocalStorage";
import { Form, useFetcher, useLoaderData, useNavigation } from "react-router";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  const url = new URL(request.url);
  const success = url.searchParams.get("success") === "1";
  const subscription = await searchStripeSubscriptions(user);
  return {
    user,
    success,
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
};

export default function Profile() {
  const { user, success, subscription } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
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
          {/* <hr className="my-10 dark:border-t-white/10" /> */}
          {/* <div className="flex justify-between gap-4">
            <div>
              <h4 className="font-semibold text-space-800 dark:text-white">
                Eliminar mi cuenta
              </h4>
              <p className="text-gray-500 font-light mt-1">
                Eliminar mi cuenta de forma permanente y eliminar todos mis
                Formmys.
              </p>
            </div>
            <img alt="arrow" src="/assets/Arrow.svg" />
          </div> */}
        </section>
      </section>
    </>
  );
}

export const CardFree = () => {
  const fetcher = useFetcher();
  const { save } = useLocalStorage();

  const handleOnClickMonthlySuscription = () => {
    save("from_landing", true);
    fetcher.submit(
      { intent: "monthly-suscription-checkout" },
      { method: "post", action: "/api/stripe" }
    );
  };

  return (
    <section className="border-gray-100 dark:bg-[#141419]  dark:border-none border-[1px] rounded-2xl py-8 px-6 my-6 flex flex-wrap md:flex-nowrap">
      <Form method="post" className="min-w-[320px] relative pb-20 md:pb-0">
        <h3 className="text-space-800 dark:text-white text-2xl font-semibold">
          FREE
        </h3>
        <p className="font-light text-space-500  dark:text-space-400">
          Perfecto para ti y tu sitio web
        </p>
        <h4 className="mt-12 text-[32px] text-space-800 dark:text-white font-bold">
          $ 0 <span className="text-space-600 font-light text-base">/mes</span>
        </h4>
        <button
          name="intent"
          value="manage-stripe"
          type="submit"
          className={twMerge(
            "absolute bottom-0 left-0 mt-8 bg-brand-500 text-lg font-normal h-[48px] rounded-full text-[#fff]  px-8 hover:scale-105 transition-all mb-1 block  disabled:bg-gray-600"
          )}
        >
          <span onClick={handleOnClickMonthlySuscription}>
            Mejorar mi plan &rarr;{" "}
          </span>
        </button>
      </Form>
      <div className="mt-10 md:mt-0">
        <h4 className="font-semibold text-gray-600  dark:text-gray-400 mt-10 mb-2">
          Funcionalidades
        </h4>
        <div className="text-gray-600 dark:text-space-400 font-light flex flex-col gap-3">
          <p>📋 3 proyectos</p>
          <p>💬 Mensajes ilimitados</p>
          <p>📪 Notificaciones vía email</p>
          <p>🎨 Personalización de formularios</p>
          <p>🎯 Dashboard para administrar tus mensajes</p>
        </div>
      </div>
    </section>
  );
};

export const CardPro = ({
  isLoading,
  planPrice,
  endDate,
}: {
  isLoading?: boolean;
  planPrice?: number;
  endDate?: number;
}) => {
  return (
    <section
      style={{
        backgroundImage: `url("/assets/thunder-back.svg")`,
        backgroundPosition: "bottom right",
        backgroundRepeat: "no-repeat",
      }}
      className="border-gray-100 border-[1px] dark:bg-[#141419] dark:border-none rounded-2xl py-8 px-6 my-6 flex flex-wrap md:flex-nowrap"
    >
      <Form method="post" className="min-w-[320px] relative pb-20 md:pb-0">
        <h3 className="text-space-800 dark:text-white text-2xl font-semibold">
          PRO ✨
        </h3>
        <p className="font-light text-space-500  dark:text-space-400">
          Ideal si eres freelancer
        </p>
        <h4 className="mt-12 text-[32px] text-space-800 dark:text-white font-bold">
          $ {planPrice}
          <span className="text-space-600 font-light text-base ml-2">
            USD /mes
          </span>
        </h4>
        <button
          disabled={isLoading}
          name="intent"
          value="manage-stripe"
          type="submit"
          className={twMerge(
            "absolute bottom-0 left-0 mt-8 bg-brand-500 text-lg font-normal h-[48px] rounded-full text-[#fff]  px-8 hover:scale-105 transition-all mb-1 block  disabled:bg-gray-600"
          )}
        >
          {isLoading ? <Spinner /> : <span>Administrar mi plan &rarr; </span>}
        </button>
      </Form>
      <div className="mt-10 md:mt-0">
        <h4 className="font-semibold  text-space-800   dark:text-gray-400">
          Renovación
        </h4>
        <p className="text-gray-600 dark:text-space-400 font-light my-2">
          Siguiente fecha de facturación{" "}
          <strong className="font-medium">
            {new Date(endDate).toLocaleDateString("es-MX", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </strong>
          .
        </p>
        <p className="text-gray-600 dark:text-space-400 font-light">
          Si no quieres que tu suscripción se renueve, cancélala al menos{" "}
          <strong className="font-medium">1 día antes</strong>.
        </p>
        <h4 className="font-semibold  text-space-800   dark:text-gray-400 mt-10 mb-2">
          Funcionalidades
        </h4>
        <div className="text-gray-600 dark:text-space-400 font-light flex flex-col gap-3">
          <p>📋 Proyectos ilimitados</p>
          <p>💬 Mensajes ilimitados</p>
          <p>📪 Notificaciones vía email</p>
          <p>🎨 Más opciones para personalizar tus formularios</p>
          <p>👨‍👩‍👦‍👦 Administración de usuarios</p>
          <p>🎯 Dashboard para administrar tus mensajes</p>
        </div>
      </div>
    </section>
  );
};
