import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { plans } from "./PricingCards";
import { cn } from "~/lib/utils";
import { PricingCard } from "./ProTag";

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
                  <div className="flex flex-wrap lg:flex-nowrap gap-4 ">
                    <div className="w-[280px]">
                      <div className="w-[64px] h-[64px] rounded-lg flex items-center justify-center border-[1px] border-[#DFDFE9] dark:border-[rgba(255,255,255,.1)] mb-8">
                        <img
                          className="w-[32px]"
                          src="/assets/thunder.svg"
                          alt="thunder"
                        />
                      </div>
                      <h3 className="text-2xl text-dark dark:text-white font-semibold mb-2">
                        Actualiza tu plan para agregar más chatbots
                      </h3>
                      <p className="text-metal dark:text-space-300 font-light mb-4">
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