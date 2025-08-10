import { Form, useFetcher } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { twMerge } from "tailwind-merge";
import useLocalStorage from "~/lib/hooks/useLocalStorage";
import { searchStripeSubscriptions } from "~/utils/stripe.server";

type SubscriptionResponse = {
  current_period_end?: number;
  plan?: {
    amount_decimal?: string;
  };
};

export const loader = async ({ request }: { request: Request }) => {
  const user = await getUserOrRedirect(request);
  const subscription = await searchStripeSubscriptions(user) as SubscriptionResponse | null;
  
  return {
    user,
    success: false, // No necesitamos el success aquí, pero lo mantenemos para consistencia
    subscription: {
      endDate: subscription?.current_period_end ? subscription.current_period_end * 1000 : 0,
      planPrice: subscription?.plan?.amount_decimal ? Number(subscription.plan.amount_decimal) * 0.01 : 0,
    },
  };
};

export default function DashboardPlan() {
  const { user, subscription } = useLoaderData<{
    user: any;
    success: boolean;
    subscription: {
      endDate: number;
      planPrice: number;
    };
  }>();
  
  const navigation = useNavigation();

  return (
    <section className="max-w-7xl mx-auto h-full py-4 md:py-8 px-4">
        <h2 className="text-2xl md:text-3xl text-space-800 dark:text-white font-semibold mb-8">
          Administra tu plan
        </h2>
        {user.plan === "PRO" ? (
            <>
               <CardFree
            isLoading={navigation.state === "submitting"}
            endDate={subscription.endDate}
            planPrice={subscription.planPrice}
          />
          <CardPro
            isLoading={navigation.state === "submitting"}
            endDate={subscription.endDate}
            planPrice={subscription.planPrice}
          />
          <CardGrow
          isLoading={navigation.state === "submitting"}
          endDate={subscription.endDate}
          planPrice={subscription.planPrice}
        />
        <TaxesInfo/>
        </>
        ) : (
          <CardFree />
        )}
    </section>
  );
}


export const TaxesInfo=()=>{
    return(
        <section className="border border-outlines rounded-3xl py-8 px-6 my-6 ">
            <h2 className="text-dark text-xl heading">Facturación</h2>
            <p className="text-metal font-light mt-1">Si requieres factura fiscal mexicana, completa tu información fiscal <a href="" className="text-brand-600 underline">aquí</a>. Si la información fiscal es correcta, la factura será enviada a tu correo en las próximas 72 hrs.</p>
            
        </section>
    )
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
      <section className="border-outlines border  rounded-3xl py-8 px-6 my-6 flex flex-wrap md:flex-nowrap">
        <Form method="post" className="min-w-[320px] relative pb-16 md:pb-0">
          <h3 className="text-dark text-2xl font-semibold">
            FREE
          </h3>
          <p className="font-light text-metal">
            Perfecto para empezar con tu website
          </p>
          <h4 className="md:mt-0 mt-4 text-[32px] text-dark font-bold">
            $ 0 <span className="text-metal font-light text-base">/mes</span>
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
        <div className="md:mt-0 mt-4">
          <h4 className="font-semibold text-dark mb-2">
            Incluye
          </h4>
          <div className="text-metal font-light flex flex-col gap-3">
            <p>📋 3 formmys</p>
            <p>💬 Mensajes ilimitados</p>
            <p>📪 Notificaciones vía email</p>
            <p>🎨 Personalización básica formularios</p>
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
        className="border border-outlines shadow-standard relative rounded-3xl py-8 px-6 my-6 flex flex-wrap md:flex-nowrap"
      >
          <img className="h-80 opacity-10 absolute bottom-0 right-0" src="/dash/pro.svg" alt="pro"/>
        <Form method="post" className="min-w-[320px]  pb-16 md:pb-0 relative">
          <img className="h-16" src="/dash/pro.svg" alt="pro"/>
        
          <h3 className="text-pro text-2xl font-semibold">
            PRO 
          </h3>
          <p className="font-light text-metal">
            Ideal para tu negocio 
          </p>
          <h4 className="mt-4 md:mt-12 text-[32px] text-space-800 dark:text-white font-bold">
            $ {planPrice}
            <span className="text-metal font-light text-base ml-2">
              USD /mes
            </span>
          </h4>
          <button
            disabled={isLoading}
            name="intent"
            value="manage-stripe"
            type="submit"
            className={twMerge(
              "absolute bottom-0 left-0 mt-4 md:mt-8 bg-pro text-dark h-[48px] rounded-full  px-8 hover:bg-[#D9B958] transition-all mb-1 block  disabled:bg-gray-600"
            )}
          >
            {isLoading ? <Spinner /> : <span>Administrar mi plan &rarr; </span>}
          </button>
        </Form>
        <div className="mt-4 md:mt-0">
          <h4 className="font-semibold text-lg  text-dark">
            Renovación
          </h4>
          <p className="text-metal font-light my-2">
            Siguiente fecha de facturación{" "}
            <strong className="font-bold">
              {new Date(endDate).toLocaleDateString("es-MX", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </strong>
            .
          </p>
          <p className="text-metal font-light">
            Si no quieres que tu suscripción se renueve, cancélala al menos{" "}
            <strong className="font-bold">1 día antes</strong>.
          </p>
          <h4 className="font-bold text-lg text-dark mt-10 mb-2">
            Incluye
          </h4>
          <div className="text-metal font-light flex flex-col gap-3">
            <p>📋 Formmys ilimitados con respuestas ilimitadas          </p>
            <p>👨‍👩‍👦‍👦 Administración de usuarios</p>
            <p>🎨 Personalización avanzada de formmys
            </p>
            <p>🤖 5 Chatbots
            </p>
            <p>🪄 Configuración avanzada de agentes </p>
            <p>👩🏻‍🏫 Acceso a +10 modelos IA
            </p>
            <p>🪪 2,000 mensajes de chat por mes
            </p>
          </div>
        </div>
      </section>
    );
  };
  
  export const CardGrow = ({
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
        className="border border-outlines shadow-standard relative rounded-3xl py-8 px-6 my-6 flex flex-wrap md:flex-nowrap"
      >
      <img className="h-80 opacity-10 absolute bottom-0 right-0" src="/dash/starter.svg" alt="pro"/>
        <Form method="post" className="min-w-[320px]  pb-16 md:pb-0 relative">
          <img className="h-16" src="/dash/starter.svg" alt="pro"/>
          <h3 className="text-space-800 dark:text-white text-2xl font-semibold">
            Starter 
          </h3>
          <p className="font-light text-metal">
          Perfecto para ti y tu sitio web
          </p>
          <h4 className="mt-4 md:mt-12 text-[32px] text-space-800 dark:text-white font-bold">
            $ {planPrice}
            <span className="text-metal font-light text-base ml-2">
              USD /mes
            </span>
          </h4>
          <button
            disabled={isLoading}
            name="intent"
            value="manage-stripe"
            type="submit"
            className={twMerge(
              "absolute bottom-0 left-0 mt-8 bg-brand-500 text-base font-normal h-[48px] rounded-full text-[#fff]  px-8 hover:bg-brand-600 transition-all mb-1 block  disabled:bg-gray-600"
            )}
          >
            {isLoading ? <Spinner /> : <span>Administrar mi plan &rarr; </span>}
          </button>
        </Form>
        <div className="mt-4 md:mt-0">
          <h4 className="font-semibold text-lg  text-dark">
            Renovación
          </h4>
          <p className="text-metal font-light my-2">
            Siguiente fecha de facturación{" "}
            <strong className="font-bold">
              {new Date(endDate).toLocaleDateString("es-MX", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </strong>
            .
          </p>
          <p className="text-metal font-light">
            Si no quieres que tu suscripción se renueve, cancélala al menos{" "}
            <strong className="font-bold">1 día antes</strong>.
          </p>
          <h4 className="font-bold text-lg text-dark mt-10 mb-2">
            Incluye
          </h4>
          <div className="text-metal font-light flex flex-col gap-3">
            <p>📋 Formmys ilimitados con respuestas ilimitadas          </p>
            <p>👨‍👩‍👦‍👦 Administración de usuarios</p>
            <p>🎨 Personalización avanzada de formmys
            </p>
            <p>🤖 Chatbot por 30 días
            </p>
          </div>
        </div>
      </section>
    );
  };
  


export const meta = () => [
  { title: "Plan" },
  { name: "description", content: "Administra tu plan de suscripción" },
];
