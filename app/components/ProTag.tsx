import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { plans } from "./PricingCards";
import { cn } from "~/lib/utils";
import { Button } from "./Button";
import Spinner from "./Spinner";

/**
 * This component, needs a relative container (father)
 */
const PricingCard = ({ plan, userPlan }: { plan: any, userPlan: string }) => {
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";

  const handleClick = () => {
    if (userPlan.toLowerCase() !== plan.name.split(' ')[0].toLowerCase() && plan.buttonAction && plan.intent) {
      fetcher.submit(
        { intent: plan.intent },
        { method: "post", action: plan.buttonAction }
      );
    }
  };

  const badgeColors = {
    "Free": "bg-gray-100 text-gray-800",
    "Starter": "bg-yellow-100 text-yellow-800",
    "Pro ✨": "bg-brand-100 text-[#6463A3]",
    "Enterprise 🤖": "bg-cloud/20 text-teal-800"
  };

  const buttonColors = {
    "Free": "bg-gray-200 hover:bg-gray-300 text-gray-800",
    "Starter": "bg-yellow-300 hover:bg-yellow-400 text-gray-900",
    "Pro ✨": "bg-brand-500 hover:bg-brand-600 text-white",
    "Enterprise 🤖": "bg-cloud hover:bg-cloud/90 text-white"
  };

  const hoverBgColors = {
    "Free": "hover:bg-gray-500/5",
    "Starter": "hover:bg-yellow-500/10",
    "Pro ✨": "hover:bg-brand-500/10",
    "Enterprise 🤖": "hover:bg-cloud/10"
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl p-6 w-full md:min-w-[280px] md:max-w-[320px] bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300",
        plan.highlight && "shadow-lg",
        hoverBgColors[plan.name as keyof typeof hoverBgColors]
      )}
    >
      {/* Badge del plan */}
      <div className="flex items-center gap-2 mb-6">
        <span className={cn("px-4 py-2 rounded-full text-sm font-semibold", badgeColors[plan.name as keyof typeof badgeColors])}>
          {plan.name}
        </span>
        {plan.highlight && plan.name === "Pro ✨" && (
          <span className="text-brand-600 text-sm font-semibold">✨ Más popular</span>
        )}
      </div>

      {/* Precio */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
          <span className="text-gray-500 text-sm">{plan.priceNote}</span>
        </div>
      </div>

      {/* Descripción */}
      <p className="text-gray-600 mb-1">{plan.description}</p>


      {/* Botón */}
      <Button
        type="button"
        onClick={handleClick}
        disabled={userPlan.toLowerCase() === plan.name.split(' ')[0].toLowerCase() || isLoading}
        className={cn(
          "w-full font-semibold rounded-full py-3 mb-4",
          buttonColors[plan.name as keyof typeof buttonColors],
          userPlan.toLowerCase() === plan.name.split(' ')[0].toLowerCase() && 'opacity-70 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <Spinner />
        ) : userPlan.toLowerCase() === plan.name.split(' ')[0].toLowerCase() ? (
          'Tu plan actual ✅'
        ) : (
          plan.buttonText || (
            plan.name === 'Pro ✨'
              ? '¡Hazte imparable con Pro!'
              : plan.name === 'Enterprise 🤖'
                ? '¡Crece tu negocio con Enterprise!'
                : '¡Empieza ahora!'
          )
        )}
      </Button>
      <p className={cn("mt-3 text-xs mb-4", plan.arrClass)}>{plan.arr}</p>
      {/* Lista de features */}
      <ul className="space-y-3 mb-3">
        {plan.includes.map((feature: string) => {
          const parts = feature.trim().split(/\s+/);
          const emoji = parts[0];
          const text = parts.slice(1).join(' ');

          return (
            <li key={feature} className="flex items-center gap-3">
              <span className="text-xl flex-shrink-0 self-start">{emoji}</span>
              <span className="text-gray-700 text-sm">{text}</span>
            </li>
          );
        })}
      </ul>
      <div className={cn("mt-auto px-2 rounded-xl", plan.arrBoxClass)}>
        {plan.extra && (
          <p className="mt-3 text-xs mb-4">{plan.extra}</p>
        )}
      </div>
    </div>
  );
};

export const ProTag = ({
  isOpen = false,
  onChange,
  onClose,
  onDismiss,
}: {
  onClose?: () => void;
  isOpen?: boolean;
  onChange?: (arg0: boolean) => void;
  onDismiss?: () => void;
}) => {
  const [localOpen, setLocalOpen] = useState(isOpen);
  const fetcher = useFetcher();
  // Obtener el plan del usuario
  const userPlan = fetcher.data?.plan || 'Free';

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    fetcher.load("/api/self");
  }, []);

  function closeModal() {
    onChange?.(false);
    setLocalOpen(false);
    onClose?.();
    onDismiss?.();
  }

  useEffect(() => {
    setLocalOpen(isOpen);
  }, [isOpen]);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setLocalOpen(true);
          onChange?.(true);
        }}
        className="cursor-pointer flex gap-1 items-center z-10 absolute -top-1 -right-4 border-[1px] border-none bg-[#FFEEBC] text-[#DAAC1F] rounded  text-sm py-[2px] px-2"
      >
        <img className="w-[12px]" src="/assets/thunder.svg" alt="thunder" />
        Upgrade
      </button>
      <Transition appear show={localOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[99]"
          onClose={closeModal}
          open={localOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto ">
            <div className="flex min-h-full items-center justify-center  text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full relative max-w-7xl transform overflow-hidden  rounded-2xl bg-clear dark:bg-space-900 pt-6 pb-10 px-10 text-left align-middle shadow-xl transition-all">
                  <div className="absolute top-6 right-6 flex gap-2 z-20">
                    <button 
                      onClick={onDismiss}
                      className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
                      title="No mostrar por 7 días"
                    >
                      No mostrar por 7 días
                    </button>
                    <button onClick={closeModal}>
                      <img
                        className="dark:opacity-40"
                        src="/assets/close.svg"
                        alt="close"
                      />
                    </button>
                  </div>
                  <div className="flex flex-wrap lg:flex-nowrap gap-4 ">
                    <div className="w-[280px]">
                      <div className="w-[64px] h-[64px] rounded-lg flex items-center justify-center border-[1px] border-[#DFDFE9] dark:border-[rgba(255,255,255,.1)] mb-8">
                        <img
                          className="w-[32px]"
                          src="/assets/thunder.svg"
                          alt="thunder"
                        />
                      </div>
                      <h3 className="text-2xl text-dark font-semibold mb-2">
                        Mejora tu plan para tener acceso a más funcionalidades.
                      </h3>
                      <p className="text-metal font-light">
                        Ten acceso a más funcionalidades dentro de Formmy, como
                        más opciones de personalización, sin marca de agua, más chatbos, mejores modelos IA y más.
                      </p>
                    </div>
                    <div className="w-full flex flex-col md:flex-row gap-4 justify-center items-stretch">
                      {/* Probar flujo */}
                      {plans
                        .filter(plan => plan.name !== 'Free')
                        .map((plan) => (
                          <PricingCard key={plan.name} plan={plan} userPlan={userPlan} />
                        ))}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};
