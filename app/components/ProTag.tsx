import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { Tab } from "@headlessui/react";
import { Form, useFetcher } from "react-router";
import { Button } from "./Button";
import { PricingCard } from "./PricingCard";
import { BigCTA } from "./BigCTA";

// @TODO migrate to twMerge
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
/**
 * This component, needs a relative container (father)
 */
export const ProTag = ({
  isOpen = false,
  onChange,
}: {
  isOpen?: boolean;
  onChange?: (arg0: boolean) => void;
}) => {
  const [localOpen, setLocalOpen] = useState(isOpen);
  const fetcher = useFetcher();

  function closeModal() {
    onChange?.(false);
    setLocalOpen(false);
  }

  // function openModal() {
  //   onChange?.(true);
  // }

  useEffect(() => {
    fetcher.load("/api/self");
  }, []);

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
        Pro
      </button>
      <Transition appear show={localOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
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

          <div className="fixed inset-0 overflow-y-auto">
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
                <Dialog.Panel className="w-full relative max-w-7xl transform overflow-hidden rounded-2xl bg-clear dark:bg-space-900 pt-6 pb-10 px-10 text-left align-middle shadow-xl transition-all">
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
                        Mejora tu plan para tener acceso a funcionalidades PRO.
                      </h3>
                      <p className="text-xl	text-gray-600 dark:text-space-300 font-light">
                        Ten acceso a más funcionalidades dentro de Formmy, como
                        más opciones de personalización (bordes, animaciones,
                        colores, campos), mensajes ilimitados y sin marca de
                        agua.
                      </p>
                    </div>
                    <PriceCards plan={fetcher.data?.plan} />
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

const PriceCards = ({ plan }: { plan: string }) => {
  const [activeTab, set] = useState(1);
  const fetcher = useFetcher();
  return (
    <div className="w-full grow-2 ">
      <div className="flex-col flex-wrap flex justify-between relative">
        <Tab.Group defaultIndex={activeTab} onChange={set}>
          <div className="m-auto mb-12">
            <Tab.List className="tabs bg-[#EDEDF1] dark:bg-[#121317] w-[240px] h-[56px] rounded-full mt-16 flex items-center justify-center">
              <Tab
                type="button"
                className={({ selected }) =>
                  classNames(
                    "w-[120px]  h-[56px] border-none rounded-full  text-md font-medium  ",
                    "ring-0 ring-offset-0 focus:outline-none focus:ring-0 ",
                    selected
                      ? " bg-brand-500 text-clear"
                      : "text-space-800  dark:text-white "
                  )
                }
              >
                Mensual
              </Tab>
              <Tab
                type="button"
                className={({ selected }) =>
                  classNames(
                    "w-[120px]  h-[56px] border-none rounded-full  text-md font-medium  ",
                    "ring-0 ring-offset-0 focus:outline-none focus:ring-0 ",
                    selected
                      ? " bg-brand-500 text-clear"
                      : "text-space-800 dark:text-white  "
                  )
                }
              >
                Anual
              </Tab>
            </Tab.List>
          </div>

          <Tab.Panels>
            <Tab.Panel className="flex gap-8 lg:gap-16 justify-center flex-wrap md:flex-nowrap">
              <PricingCard
                plan={plan}
                button={
                  <Form method="post" className="min-w-full">
                    <BigCTA
                      disabled
                      type="submit"
                      name="intent"
                      value="google-login"
                      className="min-w-full"
                    >
                      Este es tu plan
                    </BigCTA>
                  </Form>
                }
                // isLoading={googleLogin.isRunning}
                name="Free"
                cta="Noviembre"
                isDisable
                description="Perfecto para ti y tu sitio web"
                price="0"
                benefits={[
                  {
                    emoji: "📋",
                    title: "3 proyectos",
                  },
                  {
                    emoji: "💬",
                    title: "Mensajes ilimitados",
                  },
                  {
                    emoji: "📪",
                    title: "Notificaciones vía email",
                  },
                  {
                    emoji: "🎨",
                    title: "Personalización de formularios",
                  },
                  {
                    emoji: "🎯",
                    title: "Dashboard para administrar tus mensajes",
                  },
                ]}
              />
              <PricingCard
                button={
                  <Button
                    type="button"
                    isLoading={fetcher.state !== "idle"}
                    onClick={() => {
                      fetcher.submit(
                        { intent: "monthly-suscription-checkout" },
                        { method: "post", action: "/api/stripe" }
                      );
                    }}
                    className="w-full  text-clear mt-0"
                  >
                    ¡Quiero ser pro!
                  </Button>
                }
                name="PRO ✨"
                description="Ideal si eres freelancer"
                price={8}
                image="/assets/thunder-back.svg"
                benefits={[
                  {
                    emoji: "📋",
                    title: "Proyectos ilimitados",
                  },
                  {
                    emoji: "💬",
                    title: "Mensajes ilimitados",
                  },
                  {
                    emoji: "📪",
                    title: "Notificaciones vía email",
                  },
                  {
                    emoji: "🎨",
                    title: "Más opciones para personalizar tus formularios",
                  },
                  {
                    emoji: "👨‍👩‍👦‍👦",
                    title: "Administración de usuarios",
                  },
                  {
                    emoji: "🎯",
                    title: "Dashboard para administrar tus mensajes",
                  },
                ]}
              />
            </Tab.Panel>
            <Tab.Panel className="flex gap-16 justify-between">
              <PricingCard
                button={
                  <Form method="post" className="min-w-full">
                    <BigCTA disabled type="button" className="min-w-full">
                      Este es tu plan
                    </BigCTA>
                  </Form>
                }
                // isLoading={googleLogin.isRunning}
                name="Free"
                description="Perfecto para ti y tu sitio web"
                price="0"
                benefits={[
                  {
                    emoji: "📋",
                    title: "3 proyectos",
                  },
                  {
                    emoji: "💬",
                    title: "Mensajes ilimitados",
                  },
                  {
                    emoji: "📪",
                    title: "Notificaciones vía email",
                  },
                  {
                    emoji: "🎨",
                    title: "Personalización de formularios",
                  },
                  {
                    emoji: "🎯",
                    title: "Dashboard para administrar tus mensajes",
                  },
                ]}
              />
              <PricingCard
                button={
                  <Button
                    isLoading={fetcher.state !== "idle"}
                    type="button"
                    onClick={() => {
                      fetcher.submit(
                        { intent: "anual-suscription-checkout" },
                        { method: "post", action: "/api/stripe" }
                      );
                    }}
                    className="w-full text-clear mt-0"
                  >
                    ¡Quiero ser pro!
                  </Button>
                }
                cta="¡Quiero ser PRO!"
                name="PRO ✨"
                description="Ideal si eres freelancer"
                price={6}
                image="/assets/thunder-back.svg"
                benefits={[
                  {
                    emoji: "📋",
                    title: "Proyectos ilimitados",
                  },
                  {
                    emoji: "💬",
                    title: "Mensajes ilimitados",
                  },
                  {
                    emoji: "📪",
                    title: "Notificaciones vía email",
                  },
                  {
                    emoji: "🎨",
                    title: "Más opciones para personalizar tus formularios",
                  },
                  {
                    emoji: "👨‍👩‍👦‍👦",
                    title: "Administración de usuarios",
                  },
                  {
                    emoji: "🎯",
                    title: "Dashboard para administrar tus mensajes",
                  },
                ]}
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};
