import { Tab } from "@headlessui/react";
import { Form, useFetcher } from "react-router";
import { type ReactNode, useState } from "react";
import useLocalStorage from "~/lib/hooks/useLocalStorage";
import { BigCTA, ScrollReveal } from "~/routes/_index";
import { motion } from "framer-motion";
import { GradientButton } from "../ui/GradientButton";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const Pricing = () => {
  return (
    <section className="px-[5%] lg:px-0 lg:max-w-6xl max-w-3xl mx-auto text-center py-20 lg:py-[160px]">
      <h2 className=" text-dark dark:text-white text-3xl lg:text-5xl font-bold text-center">
        Escoge tu plan
      </h2>
      <p className=" text-lg md:text-xl lg:text-2xl font-extralight mt-6  text-gray-600 dark:text-space-400">
        Empieza a usar Formmy sin pagar nada. Cambia al Plan{" "}
        <strong>PRO</strong> cuando lo necesites.
      </p>
      <ScrollReveal>
        <PriceTabs />
      </ScrollReveal>
    </section>
  );
};

const PriceTabs = () => {
  const [activeTab, setActiveTab] = useState(1);
  const fetcher = useFetcher();
  const { save } = useLocalStorage();

  const handleOnClickAnualSuscription = (event) => {
    // return;
    // return console.log("WTF?");
    // save("from_landing", true);
    fetcher.submit(
      { intent: "anual-suscription-checkout" },
      { method: "post", action: "/api/stripe" }
    );
  };

  const handleOnClickMonthlySuscription = () => {
    save("from_landing", true);
    fetcher.submit(
      { intent: "monthly-suscription-checkout" },
      { method: "post", action: "/api/stripe" }
    );
  };

  return (
    <div className="flex-col flex-wrap flex justify-center relative">
      {/* <div className="tabs bg-[#EDEDF1] w-[240px] h-[56px] rounded-full mt-16 flex items-center justify-center"> */}

      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
        <div className="m-auto mb-12 ">
          <Tab.List className="tabs bg-[#EDEDF1] dark:bg-[#1D1C20] w-[240px] h-[56px] rounded-full mt-10 lg:mt-16 flex items-center justify-center">
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-[120px]  h-[56px] border-none rounded-full  text-md font-medium  ",
                  "ring-0 ring-offset-0 focus:outline-none focus:ring-0 ",
                  selected
                    ? " bg-brand-500 text-clear"
                    : "text-space-800  dark:text-white  "
                )
              }
            >
              Mensual
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-[120px]  h-[56px] border-none rounded-full  text-md font-medium  relative ",
                  "ring-0 ring-offset-0 focus:outline-none focus:ring-0 ",
                  selected
                    ? " bg-brand-500 text-clear"
                    : "text-space-800 dark:text-white   "
                )
              }
            >
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
              Anual
            </Tab>
          </Tab.List>
        </div>
        <Tab.Panels>
          <Tab.Panel className="flex gap-8 lg:gap-16 justify-center flex-wrap md:flex-nowrap">
            <PricingCard
              button={
                <Form method="post" className="min-w-full">
                  <BigCTA
                    type="submit"
                    name="intent"
                    value="google-login"
                    className="min-w-full"
                  />
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
              isLoading={fetcher.state !== "idle"}
              onClickButton={handleOnClickMonthlySuscription}
              cta="¡Quiero ser PRO!"
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
          <Tab.Panel className="flex gap-8 lg:gap-16 justify-center flex-wrap md:flex-nowrap">
            <PricingCard
              button={
                <Form method="post" className="min-w-full">
                  <BigCTA
                    type="submit"
                    name="intent"
                    value="google-login"
                    className="min-w-full"
                    containerClassName="w-full"
                  />
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
              isLoading={fetcher.state !== "idle"}
              onClickButton={handleOnClickAnualSuscription}
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
  );
};

export const PricingCard = ({
  plan,
  isDisable,
  name,
  button,
  cta,
  isLoading,
  description,
  benefits,
  price,
  image,
  onClickButton,
}: {
  plan?: string;
  isDisable?: boolean;
  image?: string;
  button?: ReactNode;
  cta?: string;
  isLoading?: boolean;
  onClickButton?: () => void;
  description: any;
  name: any;
  benefits: any;
  price: any;
}) => {
  return (
    <motion.div
      className="box max-w-[360px] w-full grow"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: 0.2,
        ease: [0, 0.71, 0.2, 1.01],
      }}
    >
      <div
        style={{
          backgroundImage: `url(${image})`,
          backgroundPosition: "bottom",
          backgroundRepeat: "no-repeat",
        }}
        className="bg-[#fff] dark:bg-dark  border-solid border-[1px] dark:border-lightgray rounded-xl w-full border-iman   py-[32px] px-6 text-left "
      >
        <h3 className="text-2xl font-bold dark:text-[#e5e7eb] text-[#0F1017]">
          {name}
        </h3>
        <p className="text-space-500 dark:text-space-400 mb-4 font-light">
          {description}
        </p>
        <p>
          {" "}
          <span className="text-4xl font-bold dark:text-white text-space-800">
            $ {price}{" "}
          </span>
          <span className="text-lg text-space-500 dark:text-space-400">
            {" "}
            USD / mes
          </span>
        </p>
        <hr className="my-6 bg-[#EDEDF1] dark:bg-lightgray h-[1px] border-none" />
        <div className="h-[300px]">
          {benefits.map(({ emoji, title }: { emoji: any; title: any }) => {
            return (
              <div key={title} className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{emoji}</span>
                <h4 className="text-space-500 font-light dark:text-space-400">
                  {title}
                </h4>
              </div>
            );
          })}
        </div>

        <hr className="my-6 bg-[#EDEDF1] dark:bg-lightgray h-[1px] border-none" />

        {!button && (
          <div>
            <GradientButton
              disabled={isLoading || isDisable}
              onClick={onClickButton}
              className="bg-brand-500 text-base dark:bg-dark dark:hover:bg-[#1D1E27] transition-all dark:text-white border-neutral-200 dark:border-white/10"
            >
              {cta}
            </GradientButton>
          </div>
        )}
        <div className="flex w-full flex-col  transition-all ">
          {button && button}
        </div>
      </div>
    </motion.div>
  );
};
