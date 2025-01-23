import { redirect } from "react-router";
import { type ReactNode, useRef } from "react";
import Nav from "~/components/NavBar";
import { createSession, redirectToGoogle } from "~/lib/google.server";
import { destroySession, getSession } from "~/sessions";
import { twMerge } from "tailwind-merge";
import getBasicMetaTags from "~/utils/getBasicMetaTags";
import { GradientButton } from "~/components/ui/GradientButton";
import { Hero } from "~/components/home/hero";
import { CompaniesScroll } from "~/components/home/CompaniesScroll";
import { Pricing } from "~/components/home/Pricing";
import { WitoutFormmy } from "~/components/home/WithoutFormmy";
import { Join } from "~/components/home/Join";
import { FormmysTypes } from "~/components/home/FormmysTypes";
import { Faq } from "~/components/home/Faq";
import { BsTwitter } from "react-icons/bs";
import { FaFacebook, FaYoutube } from "react-icons/fa";
import { motion, useInView } from "framer-motion";
import { AiFillInstagram } from "react-icons/ai";
import { StickySection } from "~/components/home/StickySection";
import { Link } from "react-router";
import { Banner } from "~/components/home/Banner";

export const meta: V2_MetaFunction = () =>
  getBasicMetaTags({
    title: "Formularios de contacto para tu sitio web",
    description:
      "Formularios en tu sitio web fácilmente y sin necesidad de un backend ",
  });

const content = [
  {
    title: "1. Crea un Formmy",
    description: "Selecciona que tipo de formmy quieres y ponle nombre. ",
    content: (
      <div className="h-full w-full bg-[linear-gradient(to_bottom_right,var(--cyan-500),var(--emerald-500))] flex items-center justify-center text-white">
        Collaborative Editing
      </div>
    ),
  },
  {
    title: "2. Personaliza tu Formmy",
    description:
      "Selecciona los campos que quieres agregar a tu formmy, el estilo, el color del botón y agrega el mensaje final que quieres mostrar a tus clientes cuando completen el formulario.",
    content: (
      <div className="h-full w-full  flex items-center justify-center text-white">
        <img
          src="/linear.webp"
          className="h-full w-full object-cover"
          alt="linear board demo"
        />
      </div>
    ),
  },
  {
    title: "3. Copia y pega en tu HTML o JSX.",
    description:
      "Agregar formmy a tus proyectos es tan fácil, solo copia una línea de código y peegala en tu proyecto. ",
    content: (
      <div className="h-full w-full bg-[linear-gradient(to_bottom_right,var(--orange-500),var(--yellow-500))] flex items-center justify-center text-white">
        Version control
      </div>
    ),
  },
  {
    title: "4. Empiza a recibir mensajes de tus clientes",
    description: "Administra los mensajes de tus clientes desde tu dashboard.",
    content: (
      <div className="h-full w-full bg-[linear-gradient(to_bottom_right,var(--cyan-500),var(--emerald-500))] flex items-center justify-center text-white">
        Running out of content
      </div>
    ),
  },
];
const ghost = "https://i.imgur.com/dvGDfHO.png";
export const redirectIfUser = async (request: Request) => {
  const cookie = request.headers.get("Cookie");
  const session = await getSession(cookie);
  if (session.has("userId")) {
    throw redirect("/dash");
  }
};

export const loader = async ({ request, params }: LoaderArgs) => {
  await redirectIfUser(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    await createSession(code, request);
  }
  const success = url.searchParams.get("success") === "1";
  return { success };
};

export const action = async ({ request }: ActionArgs) => {
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
  // const { success } = useLoaderData<typeof loader>();
  return (
    <article id="theme-trick" className=" ">
      <div className="dark:bg-dark ">
        <Nav showcta />
        <Hero />
        <CompaniesScroll />
        <FormmysTypes />
        <Banner />
        <StickySection />
        <Pricing />
        <WitoutFormmy />
        <Faq />
        <Join />
        <Footer />
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

export const BigCTA = ({
  onClick,
  className,
  containerClassName,
  children,
  ...props
}: {
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
  containerClassName: string;
}) => {
  return (
    <GradientButton
      className={twMerge(
        (className =
          "group bg-brand-500 dark:bg-dark dark:hover:bg-[#1D1E27] transition-all text-clear  dark:text-white border-neutral-200 dark:border-white/10"),
        containerClassName
      )}
      {...props}
      onClick={onClick}
    >
      {children ?? (
        <p className="text-base">
          Comenzar gratis <span className="group-hover:rotate-45"> &rarr;</span>
        </p>
      )}
    </GradientButton>
  );
};
