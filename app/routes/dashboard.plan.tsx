import { Form, Link, useFetcher } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { twMerge } from "tailwind-merge";
import useLocalStorage from "~/lib/hooks/useLocalStorage";
import { searchStripeSubscriptions } from "~/utils/stripe.server";
import Spinner from "~/components/Spinner";
import { getAvailableCredits } from "server/llamaparse/credits.service";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

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

  const [showCreditsModal, setShowCreditsModal] = React.useState(false);
  const [showConversationsModal, setShowConversationsModal] = React.useState(false);

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
    <section className="max-w-7xl mx-auto py-6 px-4">
        <h2 className="text-2xl md:text-3xl text-dark dark:text-white font-semibold mb-4">
          Administra tu plan
        </h2>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-8">
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
          </div>
          <div className="col-span-12 md:col-span-4 flex flex-col gap-5">
            {/* Banner de compra de créditos */}
            <div className="bg-banner1 bg-cover bg-botton rounded-3xl p-6 relative overflow-hidden">
              {/* Icono decorativo */}
              <div className="absolute bottom-0 right-10 text-8xl">
                <img src="/dash/bliss.svg" alt="Brendi"  />
              </div>

              <div className="relative z-10">
                <h3 className="text-dark text-lg font-bold mb-2">
                  Agrega más créditos para herramientas
                </h3>
                <p className="text-dark text-sm mb-4">
                  Desde $99 mxn por 500 créditos
                </p>
                <button
                  onClick={() => setShowCreditsModal(true)}
                  className="bg-white text-dark text-sm font-medium px-6 py-2 rounded-full hover:shadow-md transition-all"
                >
                  Comprar
                </button>
              </div>
            </div>

            {/* Banner de conversaciones adicionales */}
            <div className="bg-banner2 bg-cover bg-bottom rounded-3xl p-6 relative overflow-hidden">
              {/* Iconos decorativos */}
              <div className="absolute -bottom-2 right-8 flex gap-1">
                <img src="/dash/brendi.svg" alt="Chat" />
              </div>

              <div className="relative z-10">
                <h3 className="text-dark text-lg font-semibold mb-2">
                  Agrega más conversaciones 
                </h3>
                <p className="text-dark text-sm mb-4">
                  Desde ${pricing.price50.toFixed(0)} mxn por 100 conversaciones
                </p>
                <button
                  onClick={() => setShowConversationsModal(true)}
                  className="bg-white text-dark text-sm font-medium px-6 py-2 rounded-full hover:shadow-md transition-all"
                >
                  Comprar
                </button>
              </div>
            </div>
          </div>
              </div>


          {/* Sección de Facturación al final */}
          <TaxesInfo/>

          {/* Modal de Créditos */}
          <AnimatePresence>
            {showCreditsModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur flex items-center justify-center z-50 p-4"
                onClick={() => setShowCreditsModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl relative"
                  onClick={(e) => e.stopPropagation()}
                >
                <button
                  onClick={() => setShowCreditsModal(false)}
                  className="absolute right-4 md:right-8 top-4 md:top-8 hover:opacity-70 transition-opacity"
                >
                  <img
                    alt="close"
                    src="/assets/close.svg"
                    className="w-8 h-8"
                  />
                </button>
                <div className="mb-2">
                  <h2 className="text-dark text-2xl font-bold">Comprar créditos</h2>
                </div>

                <p className="text-metal text-base mb-6 leading-relaxed">
                  Para parsear documentos (PDF, Word, Excel) con OCR, búsqueda web y más.    Primero se usan los del plan, luego los comprados. Los del plan se restablecen cada mes.
                </p>

                <div className="flex flex-wrap items-center gap-6 text-base mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-metal ">Usadas:</span>
                    <span className="font-bold text-teal-700 text-lg">{credits.monthlyUsed.toLocaleString()}</span>
                    <span className="text-metal text-sm">/ {credits.planLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-metal ">Comprados:</span>
                    <span className="font-bold text-teal-700 text-lg">{credits.purchasedCredits.toLocaleString()}</span>
                  </div>
                </div>

                {/* Header de paquetes con fondo */}
                <div className="flex items-center justify-between mb-4 mt-10">
                  <h3 className="text-lg text-dark font-semibold">Selecciona un paquete</h3>
                  <div className="text-right">
                    <div className="text-sm text-metal">
                      <span className="font-semibold text-dark">Desde $99</span> MXN
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      handleBuyCredits("500");
                      setShowCreditsModal(false);
                    }}
                    disabled={buyCredits.state === "submitting"}
                    className="group flex-1 bg-gradient-to-br from-cloud/20 to-cloud/10 border-2 border-cloud/40 rounded-2xl p-4 hover:border-cloud hover:shadow-lg transition-all disabled:opacity-50 hover:scale-[103%] relative overflow-hidden"
                  >
                    {/* Círculo animado */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-cloud/20 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10">
                      <span className="text-2xl">
                        🪙
                      </span>
                      <p className="text-lg font-bold text-dark">500 créditos</p>
                      <p className="text-sm text-metal mt-1">$99 MXN</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      handleBuyCredits("2000");
                      setShowCreditsModal(false);
                    }}
                    disabled={buyCredits.state === "submitting"}
                    className="group flex-1 bg-gradient-to-br from-cloud to-cloud/60 border-2 border-cloud rounded-2xl p-4 hover:shadow-xl transition-all disabled:opacity-50 relative hover:scale-[103%] overflow-hidden"
                  >
                    <span className="absolute top-2 right-2 bg-dark text-white text-[10px] px-3 py-1 rounded-full font-bold z-20">
                      TOP
                    </span>
                    {/* Círculo animado */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10">
                      <span className="text-2xl">
                        💵
                      </span>
                      <p className="text-lg font-bold text-dark">2,000 créditos</p>
                      <p className="text-sm text-dark/70 mt-1 font-medium">$349 MXN</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      handleBuyCredits("5000");
                      setShowCreditsModal(false);
                    }}
                    disabled={buyCredits.state === "submitting"}
                    className="group flex-1 bg-gradient-to-br from-cloud/20 to-cloud/10 border-2 border-cloud/40 rounded-2xl p-4 hover:border-cloud hover:shadow-lg transition-all disabled:opacity-50 hover:scale-[103%] relative overflow-hidden"
                  >
                    {/* Círculo animado */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-cloud/20 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10">
                      <span className="text-2xl">
                        💰
                      </span>
                      <p className="text-lg font-bold text-dark">5,000 créditos</p>
                      <p className="text-sm text-metal mt-1">$799 MXN</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Modal de Conversaciones */}
          <AnimatePresence>
            {showConversationsModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur flex items-center justify-center z-50 p-4"
                onClick={() => setShowConversationsModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl relative"
                  onClick={(e) => e.stopPropagation()}
                >
                <button
                  onClick={() => setShowConversationsModal(false)}
                  className="absolute right-4 md:right-8 top-4 md:top-8 hover:opacity-70 transition-opacity"
                >
                  <img
                    alt="close"
                    src="/assets/close.svg"
                    className="w-8 h-8"
                  />
                </button>
                <div className="mb-2">
                  <h2 className="text-dark text-2xl font-bold">Comprar conversaciones</h2>
                </div>

                <p className="text-metal text-base mb-6 leading-relaxed">
                  Compra conversaciones cuando alcances el límite mensual de tu plan. La conversación se restablece cada mes.
                </p>

                <div className="flex flex-wrap items-center gap-6 text-base mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-metal ">Usadas:</span>
                    <span className="font-bold text-amber-600 text-lg">
                      {conversations.used.toLocaleString()}
                    </span>
                    <span className="text-metal text-sm">
                      / {conversations.limit === Infinity ? "∞" : conversations.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-metal ">Compradas:</span>
                    <span className="font-bold text-amber-600 text-lg">{conversations.purchased.toLocaleString()}</span>
                  </div>
                </div>

                {/* Header de paquetes con fondo */}
                <div className="flex items-center justify-between mb-4 mt-10 ">
                  <h3 className="text-lg text-dark font-semibold">Selecciona un paquete</h3>
                  <div className="text-right">
                    <div className="text-sm text-metal">
                      <span className="font-semibold text-dark">${pricing.perConv}</span> MXN c/u
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      handleBuyConversations(50);
                      setShowConversationsModal(false);
                    }}
                    disabled={buyConversations.state === "submitting"}
                    className="group flex-1 bg-gradient-to-br from-bird/20 to-bird/10 border-2 border-bird/40 rounded-2xl p-4 hover:border-bird hover:shadow-lg transition-all disabled:opacity-50 hover:scale-[103%] relative overflow-hidden"
                  >
                    {/* Círculo animado */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-bird/20 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10">
                      <span className="text-2xl">
                        🪙
                      </span>
                      <p className="text-lg font-bold text-dark">50 convers</p>
                      <p className="text-sm text-metal mt-1">${pricing.price50.toFixed(0)} MXN</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      handleBuyConversations(150);
                      setShowConversationsModal(false);
                    }}
                    disabled={buyConversations.state === "submitting"}
                    className="group flex-1 bg-gradient-to-br from-bird to-bird/60 border-2 border-bird rounded-2xl p-4 hover:shadow-xl transition-all disabled:opacity-50 relative hover:scale-[103%] overflow-hidden"
                  >
                    <span className="absolute top-2 right-2 bg-dark text-white text-[10px] px-3 py-1 rounded-full font-bold z-20">
                      TOP
                    </span>
                    {/* Círculo animado */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10">
                      <span className="text-2xl">
                        💵
                      </span>
                      <p className="text-lg font-bold text-dark">150 convers</p>
                      <p className="text-sm text-dark/70 mt-1 font-medium">${pricing.price150.toFixed(0)} MXN</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      handleBuyConversations(500);
                      setShowConversationsModal(false);
                    }}
                    disabled={buyConversations.state === "submitting"}
                    className="group flex-1 bg-gradient-to-br from-bird/20 to-bird/10 border-2 border-bird/40 rounded-2xl p-4 hover:border-bird hover:shadow-lg transition-all disabled:opacity-50 hover:scale-[103%] relative overflow-hidden"
                  >
                    {/* Círculo animado */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-bird/20 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10">
                      <span className="text-2xl">
                        💰
                      </span>
                      <p className="text-lg font-bold text-dark">500 convers</p>
                      <p className="text-sm text-metal mt-1">${pricing.price500.toFixed(0)} MXN</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>
    </section>
  );
}


export const TaxesInfo=()=>{
    return(
        <section className="border border-outlines rounded-3xl py-8 px-6 mt-6">
            <h2 className="text-dark text-xl font-semibold">Facturación</h2>
            <p className="text-metal text-base mt-1">Si requieres factura fiscal mexicana, envía tu información a <a href="mailto:hola@formmy.app" className="text-brand-600 underline">hola@formmy.app</a>. Si la información fiscal es correcta, la factura será enviada a tu correo en las próximas 72 hrs.</p>
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
      <section className="border-outlines border rounded-3xl p-6  flex flex-wrap md:flex-nowrap gap-6 min-h-[332px]">
        <Form method="post" className="min-w-[280px] relative pb-12 md:pb-0">
          <h3 className="text-dark text-xl font-semibold">
            Free
          </h3>
          <p className="text-metal text-base">
          Perfecto para empezar
          </p>
          <h4 className="mt-2 text-2xl text-dark font-bold">
            $ 0 <span className="text-metal text-base">/mes</span>
          </h4>
          <Link to="/planes">
          <button
            className={twMerge(
              "absolute bottom-0 left-0 mt-4 bg-brand-500 text-base font-normal h-10 rounded-full text-[#fff] px-6 hover:bg-brand-600 transition-all mb-1 block disabled:bg-gray-600"
            )}
          >
            <span onClick={handleOnClickMonthlySuscription}>
              Mejorar mi plan &rarr;
            </span>
          </button>
          </Link>
        </Form>
        <div className="md:mt-0 mt-2">
          <h4 className="font-semibold text-dark text-base mb-1.5">
            Incluye
          </h4>
          <div className="text-metal text-base flex flex-col gap-1.5">
            <p>📋 Hasta 3 formularios con respuestas ilimitadas</p>
            <p>🎨 Personalización básica de formularios</p>
            <p>🤖 Chatbot por 60 días</p>
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
        className="border border-outlines shadow-standard relative rounded-3xl p-6  flex flex-wrap md:flex-nowrap gap-6"
      >
          <img className="h-60 opacity-10 absolute bottom-0 right-0" src="/dash/starter.svg" alt="pro"/>
        <Form method="post" action="/api/stripe" className="min-w-[280px] pb-12 md:pb-0 relative">
          <img className="h-12" src="/dash/starter.svg" alt="pro"/>

          <h3 className="text-brand-500 text-xl font-semibold">
            Pro
          </h3>
          <p className="text-metal text-sm font-regular">
          El plan más completo
          </p>
          <h4 className="mt-6 text-2xl text-dark  font-bold">
            $ 499
            <span className="text-metal text-base ml-1 !font-normal">
              MXN /mes
            </span>
          </h4>
          <button
            disabled={isLoading}
            name="intent"
            value="manage-stripe"
            type="submit"
            className={twMerge(
              "absolute bottom-0 left-0 mt-3 bg-brand-500 text-[#fff] h-10 text-base rounded-full px-6 hover:bg-brand-600 transition-all mb-1 block disabled:bg-gray-600"
            )}
          >
            {isLoading ? <Spinner /> : <span>Administrar plan &rarr; </span>}
          </button>
        </Form>
        <div className="mt-2 md:mt-0">
          <h4 className="font-semibold text-base text-dark">
            Renovación
          </h4>
          <p className="text-metal text-base my-1">
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
          <h4 className="font-bold text-base text-dark mt-3 mb-1">
            Incluye
          </h4>
          <div className="text-metal text-base flex flex-col gap-1">
            <p>📋 Todo lo que incluye el plan Starter</p>
            <p>🤖 10 chatbots</p>
            <p>🪄 50MB de contexto RAG por chatbot</p>
            <p>🚀 Integraciones premium</p>
            <p>👩🏻‍🏫 Claude 3 Haiku premium - Calidad Anthropic</p>
            <p>🪪 250 conversaciones</p>
            <p>⚡ Respuestas 3x más rápidas</p>
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
        className="border border-outlines shadow-standard relative rounded-3xl p-6  flex flex-wrap md:flex-nowrap gap-6"
      >
          <img className="h-60 opacity-10 absolute bottom-0 right-0" src="/dash/enterprise.svg" alt="pro"/>
        <Form method="post" action="/api/stripe" className="min-w-[280px] pb-12 md:pb-0 relative">
          <img className="h-12" src="/dash/enterprise.svg" alt="pro"/>

          <h3 className="text-[#5FAFA8] text-xl font-semibold">
            Enterprise
          </h3>
          <p className="text-metal text-sm font-regular">
          Solución corporativa
          </p>
          <h4 className="mt-6 text-2xl text-dark font-bold">
            $ 2,490
            <span className="text-metal text-base ml-1 !font-normal">
              MXN /mes
            </span>
          </h4>
          <button
            disabled={isLoading}
            name="intent"
            value="manage-stripe"
            type="submit"
            className={twMerge(
              "absolute bottom-0 left-0 mt-3 bg-cloud text-dark h-10 text-base rounded-full px-6 hover:bg-[#5FAFA8] transition-all mb-1 block disabled:bg-gray-600"
            )}
          >
            {isLoading ? <Spinner /> : <span>Administrar plan &rarr; </span>}
          </button>
        </Form>
        <div className="mt-2 md:mt-0">
          <h4 className="font-semibold text-base text-dark">
            Renovación
          </h4>
          <p className="text-metal text-base my-1">
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
          <h4 className="font-bold text-base text-dark mt-3 mb-1">
            Incluye
          </h4>
          <div className="text-metal text-base flex flex-col gap-1">
            <p>📋 Todo lo que incluye el plan Starter</p>
            <p>🤖 Chatbots ILIMITADOS</p>
            <p>🪄 Contexto RAG ilimitado por chatbot</p>
            <p>🚀 Integraciones enterprise</p>
            <p>👩🏻‍🏫 GPT-5 Mini + Claude 3.5 Haiku</p>
            <p>📊 Dashboard de analytics profesional</p>
            <p>🪪 2,500 conversaciones</p>
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
        className="border border-outlines shadow-standard relative rounded-3xl p-6  flex flex-wrap md:flex-nowrap gap-6"
      >
      <img className="h-60 opacity-10 absolute bottom-0 right-0" src="/dash/pro.svg" alt="pro"/>
        <Form method="post" action="/api/stripe" className="min-w-[280px] pb-12 md:pb-0 relative">
          <img className="h-12" src="/dash/pro.svg" alt="starter"/>
          <h3 className="text-pro dark:text-white text-xl font-semibold">
            Starter
          </h3>
          <p className="text-metal text-sm font-regular">
          La opción entrepreneur
          </p>
          <h4 className="mt-6 text-2xl text-dark  font-bold">
          $ 149
            <span className="text-metal text-base ml-1 !font-normal">
              MXN /mes
            </span>
          </h4>
          <button
            disabled={isLoading}
            name="intent"
            value="manage-stripe"
            type="submit"
            className={twMerge(
              "absolute bottom-0 left-0 mt-3 bg-pro text-dark h-10 text-base rounded-full px-6 hover:bg-[#D9B958] transition-all mb-1 block disabled:bg-gray-600"
            )}
          >
            {isLoading ? <Spinner /> : <span>Administrar plan &rarr; </span>}
          </button>
        </Form>
        <div className="mt-2 md:mt-0">
          <h4 className="font-semibold text-base text-dark">
            Renovación
          </h4>
          <p className="text-metal text-base my-1">
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
          <h4 className="font-bold text-base text-dark mt-3 mb-1">
            Incluye
          </h4>
          <div className="text-metal text-base flex flex-col gap-1">
            <p>📋 Formularios ilimitados</p>
            <p>👨‍👩‍👦‍👦 Administración básica de usuarios</p>
            <p>🎨 Personalización avanzada de formularios</p>
            <p>🤖 1 chatbot</p>
            <p>👩🏻‍🏫 Modelos IA última generación (GPT-5 Nano, Gemini 2.5)</p>
            <p>🪪 50 conversaciones/mes</p>
          </div>
        </div>
      </section>
    );
  };
  


export const meta = () => [
  { title: "Plan" },
  { name: "description", content: "Administra tu plan de suscripción" },
];
