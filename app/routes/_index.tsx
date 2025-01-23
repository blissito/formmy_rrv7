import { Link } from "react-router";
import Nav from "~/components/NavBar";
import { redirect } from "react-router";
import { BsTwitter } from "react-icons/bs";
import type { Route } from "./+types/_index";
import { Hero } from "~/components/home/hero";
import { type ReactNode, useRef } from "react";
import { AiFillInstagram } from "react-icons/ai";
import { Banner } from "~/components/home/Banner";
import { motion, useInView } from "framer-motion";
import { Pricing } from "~/components/home/Pricing";
import { FaFacebook, FaYoutube } from "react-icons/fa";
import getBasicMetaTags from "~/utils/getBasicMetaTags";
import { destroySession, getSession } from "~/sessions";
import { FormmysTypes } from "~/components/home/FormmysTypes";
import { StickySection } from "~/components/home/StickySection";
import { CompaniesScroll } from "~/components/home/CompaniesScroll";
import { createSession, redirectToGoogle } from "~/lib/google.server";
import { redirectIfUser } from ".server/getUserUtils";

export const meta = () =>
  getBasicMetaTags({
    title: "Formularios de contacto para tu sitio web",
    description:
      "Formularios en tu sitio web fácilmente y sin necesidad de un backend ",
  });

const ghost = "https://i.imgur.com/dvGDfHO.png";

export const loader = async ({ request }: Route.LoaderArgs) => {
  await redirectIfUser(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    await createSession(code, request);
  }
  const success = url.searchParams.get("success") === "1";
  return { success };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "google-login") {
    return redirectToGoogle<typeof redirect>(redirect);
  }

  if (intent === "logout") {
    const session = await getSession(request.headers.get("Cookie"));
    throw redirect("/", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }
  return null;
};

export default function Index() {
  return (
    <article id="theme-trick" className=" ">
      <div className="dark:bg-dark ">
        <Nav showcta />
        <Hero />
        <CompaniesScroll />
        <FormmysTypes />
        {/* <Banner /> */}
        <StickySection />
        <Pricing />
        {/* <WitoutFormmy />
        <Faq />
        <Join />
        <Footer /> */}
      </div>
    </article>
  );
}

export const ScrollReveal = ({ children }: { children: ReactNode }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      style={{
        opacity: isInView ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.17, 0.55, 0.55, 1) 0.2s",
        transform: isInView ? "translateY(0)" : "translateY(100px)",
      }}
      ref={ref}
    >
      {children}
    </motion.div>
  );
};
export const ScrollRevealRight = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      style={{
        opacity: isInView ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.17, 0.55, 0.55, 1) .8s",
        transform: isInView ? "translateX(0)" : "translateX(100px)",
      }}
      className={className}
      ref={ref}
    >
      {children}
    </motion.div>
  );
};
export const ScrollRevealLeft = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      style={{
        opacity: isInView ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.17, 0.55, 0.55, 1) .8s",
        transform: isInView ? "translateX(0)" : "translateX(-100px)",
      }}
      className={className}
      ref={ref}
    >
      {children}
    </motion.div>
  );
};

const Footer = () => {
  return (
    <section className="relative border-t-[1px] border-iman dark:border-white/10  w-[90%] xl:w-full max-w-7xl mx-auto pt-12">
      <ScrollReveal>
        <span className="absolute -top-28 lg:-top-[160px] right-10">
          <img className="w-20 lg:w-[100px] " src="/assets/ghost-support.png" />
        </span>
      </ScrollReveal>
      <div className="grid grid-cols-1 lg:grid-cols-4">
        <div className=" pr-8 col-span-1 lg:col-span-2">
          <h3 className="text-lg lg:text-xl font-bold text-dark mb-2 dark:text-white">
            Únete a Formmy 🤓
          </h3>
          <p className="text-gray-600 dark:text-irongray text-base lg:text-lg font-extralight mt-2">
            La mejor forma de agregar formularios a tu sitio web.
          </p>
        </div>
        <div>
          <h3 className="text-base lg:text-lg text-gray-600  dark:text-white font-medium mb-2 mt-6 lg:mt-0 tex-xl">
            Formmy
          </h3>
          <Link to="/feedback" className="">
            <p className="text-gray-600 dark:text-irongray mb-2 font-extralight hover:opacity-60">
              Contacto
            </p>
          </Link>
          <Link to="/terms" className="">
            <p className="text-gray-600 dark:text-irongray mb-2  font-extralight hover:opacity-60">
              Términos y condiciones
            </p>
          </Link>
          {/* <p className="text-gray-600 dark:text-irongray mb-2  font-extralight">
            Empleo
          </p> */}
        </div>
        <div>
          <h3 className="text-base lg:text-lg font-medium text-gray-600 dark:text-white tex-xl mb-2 mt-6 lg:mt-0">
            Centro de ayuda
          </h3>
          <a href="mailto:hola@formmy.app" target="_blank" rel="noreferrer">
            <p className="text-gray-600 dark:text-irongray mb-2  font-extralight hover:opacity-60">
              hola@formmy.app
            </p>
          </a>

          <a
            href="https://calendly.com/brenda-formmy/30min"
            target="_blank"
            rel="noreferrer"
          >
            <p className="text-gray-600 dark:text-irongray  font-extralight hover:opacity-60">
              Calendly
            </p>
          </a>
          <div className="flex gap-6">
            <a
              href="https://www.youtube.com/@_FormmyApp"
              target="_blank"
              rel="noreferrer"
            >
              <FaYoutube className="dark:text-irongray text-gray-400 mt-6 text-2xl hover:opacity-60" />
            </a>
            <a
              href="https://twitter.com/FormmyApp1"
              target="_blank"
              rel="noreferrer"
            >
              <BsTwitter className="dark:text-irongray text-gray-400 mt-6 text-2xl hover:opacity-60" />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61554028371141"
              target="_blank"
              rel="noreferrer"
            >
              <FaFacebook className="dark:text-irongray text-gray-400 mt-6 text-2xl hover:opacity-60" />
            </a>
            <a
              href="https://www.instagram.com/_formmyapp/"
              target="_blank"
              rel="noreferrer"
            >
              <AiFillInstagram className="dark:text-irongray text-gray-400 mt-6 text-2xl hover:opacity-60" />
            </a>
          </div>
        </div>
      </div>
      <div className=" border-t-[1px] border-iman dark:border-white/10 mt-12 text-gray-500 font-extralight text-sm text-center py-4 dark:text-white/20">
        <p>Todos los derechos reservados Formmy® 2024</p>
      </div>
    </section>
  );
};
