import { Form, Link, useFetcher } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { twMerge } from "tailwind-merge";
import useLocalStorage from "~/lib/hooks/useLocalStorage";
import { searchStripeSubscriptions } from "~/utils/stripe.server";
import Spinner from "~/components/Spinner";

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
    <section className="max-w-7xl mx-auto  py-6  md:py-8 px-4">
        <h2 className="text-2xl md:text-3xl text-space-800 dark:text-white font-semibold mb-8">
          Administra tu plan
        </h2>
        {user.plan === "FREE" && (
            <>
              <CardFree />
              <CardStarter
                isLoading={navigation.state === "submitting"}
                endDate={subscription.endDate}
              />
              <CardPro
                isLoading={navigation.state === "submitting"}
                endDate={subscription.endDate}
              />
              <CardEnterprise
                isLoading={navigation.state === "submitting"}
                endDate={subscription.endDate}
              />
              <TaxesInfo/>
            </>
          )}
          {user.plan === "STARTER" && (
            <>
              <CardStarter
                isLoading={navigation.state === "submitting"}
                endDate={subscription.endDate}
              />
              <CardPro
                isLoading={navigation.state === "submitting"}
                endDate={subscription.endDate}
              />
              <CardEnterprise
                isLoading={navigation.state === "submitting"}
                endDate={subscription.endDate}
              />
              <TaxesInfo/>
            </>
          )}
          {user.plan === "PRO" && (
            <>
              <CardPro
                isLoading={navigation.state === "submitting"}
                endDate={subscription.endDate}
              />
              <CardEnterprise
                isLoading={navigation.state === "submitting"}
                endDate={subscription.endDate}
              />
              <TaxesInfo/>
            </>
          )}
          {user.plan === "ENTERPRISE" && (
            <>
              <CardEnterprise
                isLoading={navigation.state === "submitting"}
                endDate={subscription.endDate}
              />
              <TaxesInfo/>
            </>
          )}
    </section>
  );
}


export const TaxesInfo=()=>{
    return(
        <section className="border border-outlines rounded-3xl py-8 px-6 mt-6 ">
            <h2 className="text-dark text-xl heading">Facturación</h2>
            <p className="text-metal font-light mt-1">Si requieres factura fiscal mexicana, envía tu información fiscal a <a href="mailto:hola@formmy.app" className="text-brand-600 underline">hola@formmy.app</a>. Si la información fiscal es correcta, la factura será enviada a tu correo en las próximas 72 hrs.</p>
            
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
            Free
          </h3>
          <p className="font-light text-metal">
            Perfecto para empezar con tu website
          </p>
          <h4 className="md:mt-0 mt-4 text-[32px] text-dark font-bold">
            $ 0 <span className="text-metal font-light text-base">/mes</span>
          </h4>
          <Link to="/planes">
          <button
            className={twMerge(
              "absolute bottom-0 left-0 mt-8 bg-brand-500 text-base font-normal h-[48px] rounded-full text-[#fff]  px-8 hover:bg-brand-600 transition-all mb-1 block  disabled:bg-gray-600"
            )}
          >
            <span onClick={handleOnClickMonthlySuscription}>
              Mejorar mi plan &rarr;{" "}
            </span>
          </button>
          </Link>
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
            <p>🤖 Chatbot por 30 días</p>
          </div>
        </div>
      </section>
    );
  };
  
  export const CardPro = ({
    isLoading,
    endDate,
  }: {
    isLoading?: boolean;
    endDate?: number;
  }) => {
    return (
      <section
        className="border border-outlines shadow-standard relative rounded-3xl py-8 px-6 my-6 flex flex-wrap md:flex-nowrap"
      >
          <img className="h-80 opacity-10 absolute bottom-0 right-0" src="/dash/pro.svg" alt="pro"/>
        <Form method="post" action="/api/stripe" className="min-w-[320px]  pb-16 md:pb-0 relative">
          <img className="h-16" src="/dash/pro.svg" alt="pro"/>
        
          <h3 className="text-pro text-2xl font-semibold">
            Pro
          </h3>
          <p className="font-light text-metal">
            Ideal para tu negocio 
          </p>
          <h4 className="mt-4 md:mt-12 text-[32px] text-space-800 dark:text-white font-bold">
            $ 499  
            <span className="text-metal font-light text-base ml-2">
              MXN /mes
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
              {endDate ? new Date(endDate).toLocaleDateString("es-MX", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }) : "No disponible"}
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
            <p>📋 Todo lo que incluye el plan Starter
            </p>
            <p>🤖 10 Chatbots
            </p>
            <p>🪄 Mayor capacidad de entrenamiento para tu agente
            </p>
            <p>🚀 Integraciones de Calendario, Weebhook, WhatsApp y más
            </p>
            <p>👩🏻‍🏫 Acceso a los top Models IA como Claude
            </p>
            <p>🪪 250 conversaciones de chat por mes
            </p>
          </div>
        </div>
      </section>
    );
  };

  export const CardEnterprise = ({
    isLoading,
    endDate,
  }: {
    isLoading?: boolean;
    endDate?: number;
  }) => {
    return (
      <section
        className="border border-outlines shadow-standard relative rounded-3xl py-8 px-6 my-6 flex flex-wrap md:flex-nowrap"
      >
          <img className="h-80 opacity-10 absolute bottom-0 right-0" src="/dash/enterprise.svg" alt="pro"/>
        <Form method="post" action="/api/stripe" className="min-w-[320px]  pb-16 md:pb-0 relative">
          <img className="h-16" src="/dash/enterprise.svg" alt="pro"/>
        
          <h3 className="text-[#5FAFA8] text-2xl font-semibold">
            Enterprise 
          </h3>
          <p className="font-light text-metal">
            Ideal para tu negocio 
          </p>
          <h4 className="mt-4 md:mt-12 text-[32px] text-space-800 dark:text-white font-bold">
           $ 1,499  
            <span className="text-metal font-light text-base ml-2">
              MXN /mes
            </span>
          </h4>
          <button
            disabled={isLoading}
            name="intent"
            value="manage-stripe"
            type="submit"
            className={twMerge(
              "absolute bottom-0 left-0 mt-4 md:mt-8 bg-cloud text-dark h-[48px] rounded-full  px-8 hover:bg-[#5FAFA8] transition-all mb-1 block  disabled:bg-gray-600"
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
              {endDate ? new Date(endDate).toLocaleDateString("es-MX", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }) : "No disponible"}
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
            <p>📋 Todo lo que incluye el plan Starter
            </p>
            <p>🤖 Chatbots ilimitados
            </p>
            <p>🪄 Mayor capacidad de entrenamiento para tu agente
            </p>
            <p>🚀 Integraciones enterprise
            </p>
            <p>👩🏻‍🏫 Acceso a los top Models IA como 👩🏻‍🏫 GPT-5 Mini + Claude 3.5 Haiku
            </p>
            <p>📊 Dashboard de analytics profesional
              </p>
            <p>🪪 1,000 conversaciones de chat por mes
            </p>
            <p>🎧 Soporte prioritario
            </p>
          </div>
        </div>
      </section>
    );
  };
  
  export const CardStarter= ({
    isLoading,
    endDate,
  }: {
    isLoading?: boolean;
    endDate?: number;
  }) => {
    return (
      <section
        className="border border-outlines shadow-standard relative rounded-3xl py-8 px-6 my-6 flex flex-wrap md:flex-nowrap"
      >
      <img className="h-80 opacity-10 absolute bottom-0 right-0" src="/dash/starter.svg" alt="pro"/>
        <Form method="post" action="/api/stripe" className="min-w-[320px]  pb-16 md:pb-0 relative">
          <img className="h-16" src="/dash/starter.svg" alt="pro"/>
          <h3 className="text-brand-500 dark:text-white text-2xl font-semibold">
            Starter 
          </h3>
          <p className="font-light text-metal">
          Perfecto para ti y tu sitio web
          </p>
          <h4 className="mt-4 md:mt-12 text-[32px] text-space-800 dark:text-white font-bold">
          $ 149 
            <span className="text-metal font-light text-base ml-2">
              MXN /mes
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
              {endDate ? new Date(endDate).toLocaleDateString("es-MX", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }) : "No disponible"}
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
          <p>📋 Formularios ilimitados con respuestas ilimitadas            </p>
            <p>👨‍👩‍👦‍👦 Administración de usuarios</p>
            <p>🎨 Personalización avanzada de formmys
            </p>
            <p>🤖 2 Chatbots
            </p>
            <p>👩🏻‍🏫 Acceso a modelos como Gpt, Ollama y Gemini
            </p>
            <p>👩🏻‍🏫 Acceso a +10 modelos IA
            </p>
            <p>🪪 100 conversaciones de chat por mes
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
