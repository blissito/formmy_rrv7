import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { plans } from "./PricingCards";
import { cn } from "~/lib/utils";
import { Button } from "./Button";

/**
 * ProTag specific for chatbot limits - shows when FREE users reach chatbot creation limits
 * This component needs a relative container (father)
 */
export const ProTagChatbot = ({
  isOpen = false,
  onChange,
  onClose,
  message,
  currentCount,
  maxAllowed,
}: {
  onClose?: () => void;
  isOpen?: boolean;
  onChange?: (arg0: boolean) => void;
  message?: string;
  currentCount?: number;
  maxAllowed?: number;
}) => {
  const [localOpen, setLocalOpen] = useState(isOpen);
  const fetcher = useFetcher();
  // Obtener el plan del usuario
  const userPlan = fetcher.data?.plan || 'Free';

  function closeModal() {
    onChange?.(false);
    setLocalOpen(false);
    onClose?.();
  }

  useEffect(() => {
    fetcher.load("/api/self");
  }, []);

  useEffect(() => {
    setLocalOpen(isOpen);
  }, [isOpen]);

  const defaultMessage = `Tu plan gratuito tiene un límite de ${maxAllowed ?? 1} chatbot${(maxAllowed === 0 || (maxAllowed && maxAllowed > 1)) ? 's' : ''}. Actualiza tu plan para crear chatbots ilimitados.`;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setLocalOpen(true);
          onChange?.(true);
        }}
        className="cursor-pointer flex gap-1 items-center z-10 absolute -top-1 right-2 border-[1px] border-none bg-[#FFEEBC] text-[#DAAC1F] rounded  text-sm py-[2px] px-2"
      >
        <img className="w-[12px]" src="/assets/thunder.svg" alt="thunder" />
        Pro
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
                  <button onClick={closeModal}>
                    <img
                      className="absolute top-6 right-6 dark:opacity-40 z-20"
                      src="/assets/close.svg"
                      alt="close"
                    />
                  </button>
                  <div className="flex flex-wrap lg:flex-nowrap gap-16 ">
                    <div className="w-[540px]">
                      <div className="w-[64px] h-[64px] rounded-lg flex items-center justify-center border-[1px] border-[#DFDFE9] dark:border-[rgba(255,255,255,.1)] mb-8">
                        <img
                          className="w-[32px]"
                          src="/assets/thunder.svg"
                          alt="thunder"
                        />
                      </div>
                      <h3 className="text-2xl text-space-800 dark:text-white font-semibold mb-2">
                        Actualiza tu plan para agregar más chatbots
                      </h3>
                      <p className="text-xl text-gray-600 dark:text-space-300 font-light mb-4">
                        {message || defaultMessage}
                      </p>
                      {currentCount !== undefined && maxAllowed !== undefined && (
                        <div className="bg-gray-50 dark:bg-space-800 rounded-lg p-4 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-space-300">
                              Chatbots creados:
                            </span>
                            <span className="text-sm font-bold text-space-800 dark:text-white">
                              {currentCount} / {maxAllowed === Infinity ? '∞' : maxAllowed}
                            </span>
                          </div>
                        </div>
                      )}
                 
                    </div>
                    <div className="w-full flex flex-col md:flex-row gap-4 justify-center items-stretch">
                      {plans
                        .filter(plan => plan.name !== 'Free')
                        .map((plan) => (
                          <div
                            key={plan.name}
                            className={cn(
                              "flex flex-col rounded-3xl p-8 w-full md:min-w-[280px] md:max-w-[340px] w-full border transition-all",
                              plan.cardClass,
                              plan.highlight && "scale-105 z-10 shadow-2xl"
                            )}
                          >
                            <h3 className={cn("text-3xl font-bold mb-2")}>{plan.name}</h3>
                            <p className={cn("mb-4 text-lg", "text-gray-700")}>{plan.description}</p>
                            <div className="flex items-end gap-2 mb-4">
                              <span className={cn("text-4xl font-bold", "text-black")}>{plan.price}</span>
                              <span className="font-semibold text-lg">MXN</span>
                              <span className={cn("text-lg", "text-gray-500")}>{plan.priceNote}</span>
                            </div>
                            <Button 
                              onClick={() => {
                                if (userPlan.toLowerCase() !== plan.name.split(' ')[0].toLowerCase()) {
                                  window.location.href = '/planes';
                                }
                              }}
                              disabled={userPlan.toLowerCase() === plan.name.split(' ')[0].toLowerCase()}
                              className={cn(
                                "w-full font-bold rounded-full py-3 mt-6",
                                plan.name === 'Pro ✨' 
                                  ? 'bg-yellow-400 hover:bg-yellow-500 text-dark' 
                                  : plan.name === 'Enterprise 🤖' 
                                    ? 'bg-cloud hover:bg-[#5FAFA8] text-dark'
                                    : 'bg-brand-500 hover:bg-brand-600 text-white',
                                userPlan.toLowerCase() === plan.name.split(' ')[0].toLowerCase() && 'opacity-70 cursor-not-allowed'
                              )}
                            >
                              {userPlan.toLowerCase() === plan.name.split(' ')[0].toLowerCase()
                                ? 'Tu plan actual ✅'
                                : plan.name === 'Pro ✨' 
                                  ? '¡Hazte imparable con Pro!'
                                  : plan.name === 'Enterprise 🤖' 
                                    ? '¡Crece tu negocio con Enterprise!'
                                    : '¡Empieza ahora!'}
                            </Button>
                            {plan.arr && (
                              <div className={cn("mt-6 mb-2 font-semibold text-sm", plan.arrClass)}>
                                {plan.arr}
                              </div>
                            )}
                            <div className="mt-2 mb-4">
                              <div className="font-bold mb-2">Incluye:</div>
                              <ul className="space-y-2 text-sm">
                                {plan.includes.map((inc, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-black dark:text-white">{inc}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {plan.extra && plan.extra.length > 0 && (
                              <div className="mt-auto">
                                {plan.arrBoxClass && (
                                  <div className={cn("rounded-xl px-4 py-3 text-sm mt-4 border", plan.arrBoxClass)}>
                                    {plan.extra[0]}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
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