import { ScrollReveal } from "~/routes/_index";
import useLocalStorage from "~/lib/hooks/useLocalStorage";
import { cn } from "~/lib/utils";
import { PricingCard } from "../PricingCard";
import { Link } from "react-router";
import { BigCTA } from "../BigCTA";

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
  // const [activeTab, setActiveTab] = useState(1);

  // const handleOnClickMonthlySuscription = () => {
  //   save("from_landing", true);
  //   fetcher.submit(
  //     { intent: "monthly-suscription-checkout" },
  //     { method: "post", action: "/api/stripe" }
  //   );
  // };

  return (
    <article className="flex-col flex-wrap flex justify-center relative">
      <div className="m-auto mb-12 ">
        <section className="tabs bg-[#EDEDF1] dark:bg-[#1D1C20] w-[240px] h-[56px] rounded-full mt-10 lg:mt-16 flex items-center">
          <section
            className={cn(
              "w-[120px] border-none rounded-full  text-md font-medium  ",
              "ring-0 ring-offset-0 focus:outline-none focus:ring-0 ",
              false
                ? " bg-brand-500 text-clear"
                : "text-space-800  dark:text-white  "
            )}
          >
            Mensual
          </section>
          <section
            className={cn(
              "w-[120px] border-none rounded-full  text-md font-medium  relative ",
              "ring-0 ring-offset-0 focus:outline-none focus:ring-0 ",
              false
                ? " bg-brand-500 text-clear"
                : "text-space-800 dark:text-white   "
            )}
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
          </section>
        </section>
      </div>
      <section>
        {/* <section className="flex gap-8 lg:gap-16 justify-center flex-wrap md:flex-nowrap">
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
        </section> */}
        <section className="flex gap-8 lg:gap-16 justify-center flex-wrap md:flex-nowrap">
          <PricingCard
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
              <Link to="/api/stripe?intent=anual_suscription">
                <BigCTA>Quiero ser Pro</BigCTA>
              </Link>
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
        </section>
      </section>
    </article>
  );
};
