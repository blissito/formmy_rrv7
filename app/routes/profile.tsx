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
import { getUserOrRedirect } from "server/getUserUtils.server";
import useLocalStorage from "~/lib/hooks/useLocalStorage";
import { Form, useFetcher, useLoaderData, useNavigation } from "react-router";
import { CardFree, CardPro } from "./dashboard.plan";

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

