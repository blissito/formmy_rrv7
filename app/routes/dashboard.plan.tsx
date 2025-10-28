import { Form, Link, useFetcher } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { twMerge } from "tailwind-merge";
import useLocalStorage from "~/lib/hooks/useLocalStorage";
import { searchStripeSubscriptions } from "~/utils/stripe.server";
import Spinner from "~/components/Spinner";
import { getAvailableCredits } from "server/llamaparse/credits.service";

type SubscriptionResponse = {
  current_period_end?: number;
  plan?: {
    amount_decimal?: string;
  };
};

export const loader = async ({ request }: { request: Request }) => {
  const user = await getUserOrRedirect(request);
  const subscription = await searchStripeSubscriptions(user) as SubscriptionResponse | null;

  // Obtener créditos disponibles
  const credits = await getAvailableCredits(user.id);

  // Obtener uso de conversaciones
  const { db } = await import("~/utils/db.server");
  const { PLAN_LIMITS } = await import("server/chatbot/planLimits.server");

  const userData = await db.user.findUnique({
    where: { id: user.id },
    select: {
      plan: true,
      purchasedConversations: true,
      chatbots: {
        select: {
          monthlyUsage: true,
        },
      },
    },
  });

  const plan = (userData?.plan || "FREE") as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan];

  const conversationsUsed = userData?.chatbots.reduce(
    (sum, chatbot) => sum + chatbot.monthlyUsage,
    0
  ) || 0;

  const conversationsLimit = limits.maxConversationsPerMonth;
  const purchasedConversations = userData?.purchasedConversations || 0;

  // Total disponible = límite del plan + compradas - usadas
  const totalLimit = conversationsLimit === Infinity
    ? Infinity
    : conversationsLimit + purchasedConversations;

  const conversationsRemaining = totalLimit === Infinity
    ? Infinity
    : Math.max(0, totalLimit - conversationsUsed);

  return {
    user,
    success: false, // No necesitamos el success aquí, pero lo mantenemos para consistencia
    subscription: {
      endDate: subscription?.current_period_end ? subscription.current_period_end * 1000 : 0,
      planPrice: subscription?.plan?.amount_decimal ? Number(subscription.plan.amount_decimal) * 0.01 : 0,
    },
    credits,
    conversations: {
      used: conversationsUsed,
      limit: conversationsLimit,
      purchased: purchasedConversations,
      remaining: conversationsRemaining,
    },
  };
};

export default function DashboardPlan() {
  const { user, subscription, credits, conversations } = useLoaderData<{
    user: any;
    success: boolean;
    subscription: {
      endDate: number;
      planPrice: number;
    };
    credits: any;
    conversations: {
      used: number;
      limit: number | typeof Infinity;
      purchased: number;
      remaining: number | typeof Infinity;
    };
  }>();

  const navigation = useNavigation();
  const buyCredits = useFetcher();
  const buyConversations = useFetcher();

  const handleBuyCredits = (packageSize: string) => {
    const formData = new FormData();
    formData.append("intent", `credits_${packageSize}`);
    buyCredits.submit(formData, { method: "post", action: "/api/stripe" });
  };

  const handleBuyConversations = (amount: number) => {
    const formData = new FormData();
    formData.append("intent", `conversations_${amount}`);
    formData.append("plan", user.plan);
    buyConversations.submit(formData, { method: "post", action: "/api/stripe" });
  };

  // Calcular precios según el plan
  const getConversationPricing = () => {
    switch (user.plan) {
      case "STARTER":
      case "TRIAL":
        return {
          price50: 74.50,   // 50 conv * $1.49
          price150: 223.50, // 150 conv * $1.49
          price500: 745.00, // 500 conv * $1.49
          perConv: 1.49,
        };
      case "PRO":
        return {
          price50: 49.50,   // 50 conv * $0.99
          price150: 148.50, // 150 conv * $0.99
          price500: 495.00, // 500 conv * $0.99
          perConv: 0.99,
        };
      case "ENTERPRISE":
        return {
          price50: 34.50,   // 50 conv * $0.69
          price150: 103.50, // 150 conv * $0.69
          price500: 345.00, // 500 conv * $0.69
          perConv: 0.69,
        };
      default:
        return {
          price50: 99.00,
          price150: 249.00,
          price500: 699.00,
          perConv: 1.98,
        };
    }
  };

  const pricing = getConversationPricing();

  return (
    <section className="max-w-7xl mx-auto py-4 px-4">
        <h2 className="text-2xl md:text-3xl text-space-800 dark:text-white font-semibold mb-4">
          Administra tu plan
        </h2>
        {(user.plan === "FREE" || user.plan === "TRIAL") && <CardFree />}
          {user.plan === "STARTER" && (
            <CardStarter
              isLoading={navigation.state === "submitting"}
              endDate={subscription.endDate}
            />
          )}
          {user.plan === "PRO" && (
            <CardPro
              isLoading={navigation.state === "submitting"}
              endDate={subscription.endDate}
            />
          )}
          {user.plan === "ENTERPRISE" && (
            <CardEnterprise
              isLoading={navigation.state === "submitting"}
              endDate={subscription.endDate}
            />
          )}

          {/* Secciones de Créditos y Conversaciones lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
            {/* Sección de Créditos */}
            <section className="border border-outlines rounded-2xl py-5 px-6">
              <div className="flex flex-col justify-between h-full gap-5">
                <div>
                  <h2 className="text-dark text-xl font-semibold mb-2.5">Créditos para herramientas</h2>
                  <p className="text-metal text-base mb-4">
                    Para parsear documentos (PDF, Word, Excel) con OCR, búsqueda web, enlaces de pago, y más.
                  </p>

                  <div className="flex flex-wrap items-center gap-5 text-base mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-metal">Disponibles:</span>
                      <span className="font-bold text-green-600 text-lg">
                        {(credits.monthlyAvailable + credits.purchasedCredits).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-metal">Plan:</span>
                      <span className="font-bold text-brand-600 text-lg">{credits.monthlyAvailable.toLocaleString()}</span>
                      <span className="text-metal text-sm">/ {credits.planLimit.toLocaleString()}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-metal">Comprados:</span>
                      <span className="font-bold text-purple-600 text-lg">{credits.purchasedCredits.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-sm text-metal bg-gray-50 p-2.5 rounded">
                    Primero se usan los del plan, luego los comprados. Los del plan se resetean cada mes.
                  </div>
                </div>

                {/* Paquetes de créditos */}
                <div className="flex flex-col gap-3">
                  <span className="text-base text-dark font-semibold">Comprar más créditos</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleBuyCredits("500")}
                      disabled={buyCredits.state === "submitting"}
                      className="flex-1 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg px-4 py-3 hover:border-brand-400 hover:shadow-md transition-all disabled:opacity-50"
                    >
                      <p className="text-base font-bold text-brand-600">500</p>
                      <p className="text-sm text-metal">$99</p>
                    </button>
                    <button
                      onClick={() => handleBuyCredits("2000")}
                      disabled={buyCredits.state === "submitting"}
                      className="flex-1 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-brand-400 rounded-lg px-4 py-3 hover:border-brand-500 hover:shadow-lg transition-all disabled:opacity-50 relative"
                    >
                      <span className="absolute -top-2 -right-2 bg-brand-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        TOP
                      </span>
                      <p className="text-base font-bold text-brand-600">2,000</p>
                      <p className="text-sm text-metal">$349</p>
                    </button>
                    <button
                      onClick={() => handleBuyCredits("5000")}
                      disabled={buyCredits.state === "submitting"}
                      className="flex-1 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg px-4 py-3 hover:border-brand-400 hover:shadow-md transition-all disabled:opacity-50"
                    >
                      <p className="text-base font-bold text-brand-600">5,000</p>
                      <p className="text-sm text-metal">$799</p>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Sección de Conversaciones */}
            <section className="border border-outlines rounded-2xl py-5 px-6">
              <div className="flex flex-col justify-between h-full gap-5">
                <div>
                  <h2 className="text-dark text-xl font-semibold mb-2.5">Conversaciones adicionales</h2>
                  <p className="text-metal text-base mb-4">
                    Compra conversaciones cuando alcances el límite mensual de tu plan.
                  </p>

                  <div className="flex flex-wrap items-center gap-5 text-base mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-metal">Disponibles:</span>
                      <span className="font-bold text-green-600 text-lg">
                        {conversations.remaining === Infinity ? "∞" : conversations.remaining.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-metal">Plan:</span>
                      <span className="font-bold text-brand-600 text-lg">
                        {conversations.used.toLocaleString()}
                      </span>
                      <span className="text-metal text-sm">
                        / {conversations.limit === Infinity ? "∞" : conversations.limit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-metal">Compradas:</span>
                      <span className="font-bold text-purple-600 text-lg">{conversations.purchased.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-sm text-metal bg-gray-50 p-2.5 rounded">
                    Las conversaciones compradas se suman a tu límite del plan. Resetean cada mes.
                  </div>
                </div>

                {/* Paquetes de conversaciones */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-base text-dark font-semibold">Comprar más</span>
                    <span className="text-sm text-metal">
                      ${pricing.perConv} MXN c/u
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleBuyConversations(50)}
                      disabled={buyConversations.state === "submitting"}
                      className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg px-4 py-3 hover:border-green-400 hover:shadow-md transition-all disabled:opacity-50"
                    >
                      <p className="text-base font-bold text-green-600">50</p>
                      <p className="text-sm text-metal">${pricing.price50.toFixed(0)}</p>
                    </button>
                    <button
                      onClick={() => handleBuyConversations(150)}
                      disabled={buyConversations.state === "submitting"}
                      className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg px-4 py-3 hover:border-green-500 hover:shadow-lg transition-all disabled:opacity-50 relative"
                    >
                      <span className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        TOP
                      </span>
                      <p className="text-base font-bold text-green-600">150</p>
                      <p className="text-sm text-metal">${pricing.price150.toFixed(0)}</p>
                    </button>
                    <button
                      onClick={() => handleBuyConversations(500)}
                      disabled={buyConversations.state === "submitting"}
                      className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg px-4 py-3 hover:border-green-400 hover:shadow-md transition-all disabled:opacity-50"
                    >
                      <p className="text-base font-bold text-green-600">500</p>
                      <p className="text-sm text-metal">${pricing.price500.toFixed(0)}</p>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sección de Facturación al final */}
          <TaxesInfo/>
    </section>
  );
}


export const TaxesInfo=()=>{
    return(
        <section className="border border-outlines rounded-2xl py-3 px-5 mt-5">
            <h2 className="text-dark text-base font-semibold">Facturación</h2>
            <p className="text-metal text-sm mt-1">Si requieres factura fiscal mexicana, envía tu información a <a href="mailto:hola@formmy.app" className="text-brand-600 underline">hola@formmy.app</a>. Entrega en 72 hrs.</p>
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
      <section className="border-outlines border rounded-2xl py-3 px-4 my-3 flex flex-wrap md:flex-nowrap gap-4">
        <Form method="post" className="min-w-[280px] relative pb-12 md:pb-0">
          <h3 className="text-dark text-xl font-semibold">
            Free
          </h3>
          <p className="text-metal text-xs">
          Perfecto para empezar
          </p>
          <h4 className="mt-2 text-2xl text-dark font-bold">
            $ 0 <span className="text-metal text-sm">/mes</span>
          </h4>
          <Link to="/planes">
          <button
            className={twMerge(
              "absolute bottom-0 left-0 mt-4 bg-brand-500 text-sm font-normal h-10 rounded-full text-[#fff] px-6 hover:bg-brand-600 transition-all mb-1 block disabled:bg-gray-600"
            )}
          >
            <span onClick={handleOnClickMonthlySuscription}>
              Mejorar mi plan &rarr;
            </span>
          </button>
          </Link>
        </Form>
        <div className="md:mt-0 mt-2">
          <h4 className="font-semibold text-dark text-sm mb-1.5">
            Incluye
          </h4>
          <div className="text-metal text-xs flex flex-col gap-1.5">
            <p>📋 3 formmys</p>
            <p>💬 Mensajes ilimitados</p>
            <p>📪 Notificaciones vía email</p>
            <p>🎨 Personalización básica</p>
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
        className="border border-outlines shadow-standard relative rounded-2xl py-3 px-4 my-3 flex flex-wrap md:flex-nowrap gap-4"
      >
          <img className="h-60 opacity-10 absolute bottom-0 right-0" src="/dash/pro.svg" alt="pro"/>
        <Form method="post" action="/api/stripe" className="min-w-[280px] pb-12 md:pb-0 relative">
          <img className="h-12" src="/dash/starter.svg" alt="pro"/>

          <h3 className="text-brand-500 text-xl font-semibold">
            Pro
          </h3>
          <p className="text-metal text-xs">
          El plan más completo
          </p>
          <h4 className="mt-2 text-2xl text-space-800 dark:text-white font-bold">
            $ 499
            <span className="text-metal text-sm ml-1">
              MXN /mes
            </span>
          </h4>
          <button
            disabled={isLoading}
            name="intent"
            value="manage-stripe"
            type="submit"
            className={twMerge(
              "absolute bottom-0 left-0 mt-3 bg-brand-500 text-[#fff] h-10 text-sm rounded-full px-6 hover:bg-brand-600 transition-all mb-1 block disabled:bg-gray-600"
            )}
          >
            {isLoading ? <Spinner /> : <span>Administrar plan &rarr; </span>}
          </button>
        </Form>
        <div className="mt-2 md:mt-0">
          <h4 className="font-semibold text-sm text-dark">
            Renovación
          </h4>
          <p className="text-metal text-xs my-1">
            Siguiente facturación{" "}
            <strong className="font-bold">
              {endDate ? new Date(endDate).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }) : "No disponible"}
            </strong>
            . Cancela al menos 1 día antes.
          </p>
          <h4 className="font-bold text-sm text-dark mt-3 mb-1">
            Incluye
          </h4>
          <div className="text-metal text-xs flex flex-col gap-1">
            <p>📋 Todo Starter</p>
            <p>🤖 10 Chatbots</p>
            <p>🪄 Mayor entrenamiento</p>
            <p>🚀 Integraciones avanzadas</p>
            <p>👩🏻‍🏫 Top Models IA (Claude)</p>
            <p>🪪 250 conversaciones/mes</p>
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
        className="border border-outlines shadow-standard relative rounded-2xl py-3 px-4 my-3 flex flex-wrap md:flex-nowrap gap-4"
      >
          <img className="h-60 opacity-10 absolute bottom-0 right-0" src="/dash/enterprise.svg" alt="pro"/>
        <Form method="post" action="/api/stripe" className="min-w-[280px] pb-12 md:pb-0 relative">
          <img className="h-12" src="/dash/enterprise.svg" alt="pro"/>

          <h3 className="text-[#5FAFA8] text-xl font-semibold">
            Enterprise
          </h3>
          <p className="text-metal text-xs">
          Solución corporativa
          </p>
          <h4 className="mt-2 text-2xl text-space-800 dark:text-white font-bold">
           $ 1,499
            <span className="text-metal text-sm ml-1">
              MXN /mes
            </span>
          </h4>
          <button
            disabled={isLoading}
            name="intent"
            value="manage-stripe"
            type="submit"
            className={twMerge(
              "absolute bottom-0 left-0 mt-3 bg-cloud text-dark h-10 text-sm rounded-full px-6 hover:bg-[#5FAFA8] transition-all mb-1 block disabled:bg-gray-600"
            )}
          >
            {isLoading ? <Spinner /> : <span>Administrar plan &rarr; </span>}
          </button>
        </Form>
        <div className="mt-2 md:mt-0">
          <h4 className="font-semibold text-sm text-dark">
            Renovación
          </h4>
          <p className="text-metal text-xs my-1">
            Siguiente facturación{" "}
            <strong className="font-bold">
              {endDate ? new Date(endDate).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }) : "No disponible"}
            </strong>
            . Cancela al menos 1 día antes.
          </p>
          <h4 className="font-bold text-sm text-dark mt-3 mb-1">
            Incluye
          </h4>
          <div className="text-metal text-xs flex flex-col gap-1">
            <p>📋 Todo Starter</p>
            <p>🤖 Chatbots ilimitados</p>
            <p>🪄 Mayor entrenamiento</p>
            <p>🚀 Integraciones enterprise</p>
            <p>👩🏻‍🏫 GPT-5 Mini + Claude 3.5</p>
            <p>📊 Analytics profesional</p>
            <p>🪪 1,000 conversaciones/mes</p>
            <p>🎧 Soporte prioritario</p>
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
        className="border border-outlines shadow-standard relative rounded-2xl py-3 px-4 my-3 flex flex-wrap md:flex-nowrap gap-4"
      >
      <img className="h-60 opacity-10 absolute bottom-0 right-0" src="/dash/starter.svg" alt="pro"/>
        <Form method="post" action="/api/stripe" className="min-w-[280px] pb-12 md:pb-0 relative">
          <img className="h-12" src="/dash/pro.svg" alt="starter"/>
          <h3 className="text-pro dark:text-white text-xl font-semibold">
            Starter
          </h3>
          <p className="text-metal text-xs">
          La opción entrepreneur
          </p>
          <h4 className="mt-2 text-2xl text-space-800 dark:text-white font-bold">
          $ 149
            <span className="text-metal text-sm ml-1">
              MXN /mes
            </span>
          </h4>
          <button
            disabled={isLoading}
            name="intent"
            value="manage-stripe"
            type="submit"
            className={twMerge(
              "absolute bottom-0 left-0 mt-3 bg-pro text-dark h-10 text-sm rounded-full px-6 hover:bg-[#D9B958] transition-all mb-1 block disabled:bg-gray-600"
            )}
          >
            {isLoading ? <Spinner /> : <span>Administrar plan &rarr; </span>}
          </button>
        </Form>
        <div className="mt-2 md:mt-0">
          <h4 className="font-semibold text-sm text-dark">
            Renovación
          </h4>
          <p className="text-metal text-xs my-1">
            Siguiente facturación{" "}
            <strong className="font-bold">
              {endDate ? new Date(endDate).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }) : "No disponible"}
            </strong>
            . Cancela al menos 1 día antes.
          </p>
          <h4 className="font-bold text-sm text-dark mt-3 mb-1">
            Incluye
          </h4>
          <div className="text-metal text-xs flex flex-col gap-1">
          <p>📋 Formularios ilimitados</p>
            <p>👨‍👩‍👦‍👦 Admin usuarios</p>
            <p>🎨 Personalización avanzada</p>
            <p>🤖 2 Chatbots</p>
            <p>👩🏻‍🏫 GPT, Ollama, Gemini</p>
            <p>👩🏻‍🏫 +10 modelos IA</p>
            <p>🪪 100 conversaciones/mes</p>
          </div>
        </div>
      </section>
    );
  };
  


export const meta = () => [
  { title: "Plan" },
  { name: "description", content: "Administra tu plan de suscripción" },
];
