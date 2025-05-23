import { useState } from "react";
import { Tab } from "@headlessui/react";
import { useFetcher } from "react-router";
import { Button } from "./Button";
import { PricingCard } from "./PricingCard";
import { BigCTA } from "./BigCTA";
import { cn } from "~/lib/utils";

export const PriceCards = ({ plan }: { plan?: string }) => {
  const [activeTab, set] = useState(1);
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";

  const handleLogin = () => {
    if (plan) return;

    fetcher.submit({ intent: "google-login" }, { method: "post" });
  };

  return (
    <div className="w-full grow-2 ">
      <div className="flex-col flex-wrap flex justify-between relative">
        <Tab.Group defaultIndex={activeTab} onChange={set}>
          <div className="m-auto mb-12">
            <Tab.List className="tabs bg-[#EDEDF1] dark:bg-[#121317] w-[240px] h-[56px] rounded-full mt-16 flex items-center justify-center mx-auto">
              <Tab
                type="button"
                className={({ selected }) =>
                  cn(
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
                  cn(
                    "relative",
                    "w-[120px]  h-[56px] border-none rounded-full  text-md font-medium  ",
                    "ring-0 ring-offset-0 focus:outline-none focus:ring-0 ",
                    selected
                      ? " bg-brand-500 text-clear"
                      : "text-space-800 dark:text-white  "
                  )
                }
              >
                <Ahorra />
                Anual
              </Tab>
            </Tab.List>
          </div>

          <Tab.Panels>
            <Tab.Panel className="flex flex-wrap justify-center gap-10">
              <PricingCard
                plan={plan}
                button={
                  <Button
                    isLoading={isLoading}
                    type="button"
                    className="w-full text-clear mt-0 hover:scale-95 transition-all"
                    onClick={handleLogin}
                  >
                    {plan ? "Este es tu plan" : "Comenzar gratis"}
                  </Button>
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
                        { intent: "monthly-suscription" },
                        { method: "post", action: "/api/stripe" }
                      );
                    }}
                    className="w-full  text-clear mt-0 hover:scale-95 transition-all"
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
            <Tab.Panel className="flex flex-wrap justify-center gap-10">
              <PricingCard
                button={
                  <Button
                    isLoading={isLoading}
                    type="button"
                    className="w-full text-clear mt-0 hover:scale-95 transition-all"
                    onClick={handleLogin}
                  >
                    {plan ? "Este es tu plan" : "Comenzar gratis"}
                  </Button>
                }
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
                        { intent: "anual_suscription" },
                        {
                          method: "post",
                          action: "/api/stripe",
                        }
                      );
                    }}
                    className="w-full text-clear mt-0  hover:scale-95 transition-all"
                  >
                    ¡Quiero ser PRO!
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

/** Need a relative father */
const Ahorra = () => {
  return (
    <span
      style={{ fontFamily: "Licorice" }}
      className="absolute text-brand-500 scale-75 licorice-regular flex -right-12 md:-right-28 -top-10 "
    >
      {" "}
      <img
        className=" w-12 rotate-[18deg] "
        src="/assets/doodle-arrow.svg"
        alt="arrow"
      />
      <img className="w-24 -mt-6 ml-2" src="/assets/25.svg" />
    </span>
  );
};
