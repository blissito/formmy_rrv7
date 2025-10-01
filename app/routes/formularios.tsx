import HomeHeader from "./home/HomeHeader";
import HomeFooter from "./home/HomeFooter";
import { GeneralCallToAction } from "./home/HomeCallToAction";
import { CompaniesScroll } from "~/components/home/CompaniesScroll";
import { WitoutFormmy } from "~/components/home/WithoutFormmy";
import { FullBanner } from "./home/FullBanner";
import { Registration, Suscription } from "~/components/home/FormmysTypes";
import { FullComment } from "~/components/common/FullComment";
import getBasicMetaTags from "~/utils/getBasicMetaTags";
import { Quote } from "./home/Quote";
import { FormSteps } from "./forms/FormSteps";
import { FormComments } from "./forms/FormComments";
import { Form } from "react-router";
import { BigCTA } from "~/components/BigCTA";
import { Compare } from "~/components/ui/compare";
import { motion } from "framer-motion";
import { HighlightBadge } from "~/components/HighlightBadge";

export const meta = () =>
  getBasicMetaTags({
    title: "Crea formularios para tu sitio web sin código | Formmy",
    description:
      "Genera formularios de contacto, registro o listas de espera y agrégalos fácilmente a tu sitio web sin programar",
  });

function CardDemoIA({
  gradient,
  content,
  title,
  description,
}: {
  gradient: string;
  content?: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className={`flex-1  `}>
      <div
        className={` rounded-3xl p-8 flex flex-col items-center shadow-lg h-[280px] md:h-[320px] relative overflow-hidden ${gradient}`}
      >
        {content}
      </div>
      <h3 className="font-bold text-xl md:text-2xl text-center mb-2 text-dark mt-6 md:mt-8">
        {title}
      </h3>
      <p className="text-gray-700 text-center text-base md:text-lg">
        {description}
      </p>
    </div>
  );
}

export default function Formularios() {
  const stepsWithImages = [
    {
      title: "Crea un proyecto",
      desc: "Ve a tu Dashboard y da clic en la pestaña de «Formmys».",
      image: "/home/form-steper-1.webp",
    },
    {
      title: "Selecciona el tipo de Formmy",
      desc: " Da clic en «+ Formmy», bautiza tu primer Formmy y elige el tipo de Formmy que necesitas: formulario de contacto y de suscripción.",
      image: "/home/form-steper-2.webp",
    },
    {
      title: "Personaliza tus campos, colores y estilos",
      desc: "Activa o agrega los campos para tu Formmy, personaliza el tema, el color principal y el estilo de tus inputs.",
      image: "/home/form-steper-3.webp",
    },
    {
      title: "Escribe el mensaje final",
      desc: "Ponle tu estilo al mensaje que verán tus usuarios al completar el formulario.",
      image: "/home/form-steper-4.webp",
    },
    {
      title: "Copia y pega en tu HTML o JSX",
      desc: "Formmy es compatible con cualquier lenguaje, así que solo tienes que copiar una línea de código y pegarla en tu proyecto. ¡Y listo! ¡Empieza a recibir mensajes de tus clientes!",
      image: "/home/form-steper-5.webp",
    },
  ];

  return (
    <main className="bg-clear  ">
      <HomeHeader />
      <div className="max-w-7xl mb-0 lg:mb-10 min-h-svh pt-32 pb-20 md:pt-40 lg:pt-48   mx-auto px-4 md:px-[5%] xl:px-0 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-16">
        <div className="w-full lg:w-[50%] flex flex-col items-center lg:items-start">
          <HighlightBadge highlightText="Sin código." normalText="Copia, pega y listo." />
          <h1 className="heading font-bold text-dark text-3xl md:text-4xl lg:text-6xl mb-4 !leading-[1.1] text-center md:text-left">
          Formmys para tu sitio web
          </h1>
          <p className="text-metal text-base md:text-lg lg:text-2xl font-light text-center md:text-left">
          Crea formularios personalizados para tu sitio web, recopila información de tus usuarios y gestiona tus datos de manera sencilla y segura con Formmy.
          </p>
          <Form method="post" className="mt-8 lg:mt-10 mx-auto md:mx-0" action="/api/login">
            <BigCTA type="submit" name="intent" value="google-login" />
          </Form>
        </div>
        <div className="w-full lg:w-[50%] relative mt-10 lg:mt-0">
            <Compare
                    firstImage="/assets/with-formmy.svg"
                    secondImage="/home/contacto2.webp"
                    firstImageClassName="object-cover object-left-top"
                    secondImageClassname="object-cover object-left-top"
                    className="h-[300px] md:h-[400px] lg:h-[500px] w-full mt-0 border border-outlines rounded-[24px] md:rounded-[32px] lg:rounded-[40px]"
                    slideMode="hover"
            />
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 -bottom-4 md:-bottom-8 z-50"
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.8,
                delay: 0.3,
                type: "spring",
                stiffness: 100,
                damping: 10
              }}
            >
              <motion.img
                src="/home/suscribers.svg"
                alt="Subscribers"
                className="w-32 md:w-40 h-auto shadow-lg rounded-2xl"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
        </div>
      </div>
   
      <section
        id="cards"
        className="w-full max-w-7xl mx-auto my-16 md:my-32 px-4"
      >
        <h2 className="text-3xl md:text-4xl lg:text-5xl  font-bold text-center mb-10 md:mb-16 text-dark">
          Por qué debes probar Formmy
        </h2>
        <div className="flex flex-col md:flex-row gap-10 md:gap-8 justify-center items-stretch">
          <CardDemoIA
            gradient="bg-[#FBE05D]"
            content={
              <div className=" h-full place-content-center">
                <img className=" object-contain h-full" src="/home/bento1.webp" />
              </div>
            }
            title="Compatible con cualquier framework"
            description="Formmy es compatible con cualquier framework, puedes agregarlo a tu sitio web usando el SDK, el iframe o el link directo."
          />
          <CardDemoIA
            gradient="bg-[#76D3CB]"
            content={
              <div className="w-full h-full grid place-content-center">
                <img className="h-full" src="/home/bento2.webp" />
              </div>
            }
            title="Fácil y rápido de configurar"
            description="Crea tu Formmy en menos de 5 minutos, sin código, sin complicaciones y sin tecnicismos. Solo unos clics y listo."
          />
          <CardDemoIA
            gradient="bg-[#DF7CB0]"
            content={
              <div className="w-full h-full absolute left-10 top-0 grid place-content-center">
                <img className="!w-[180%]" src="/home/bento3.webp" />
              </div>
            }
            title="Personlizable"
            description="Olvídate de los formularios genéricos. Con Formmy personaliza los campos, colores y estilo para que todo refleje tu marca."
          />
        </div>
      </section>
     
      <Quote highlightStyle={{backgroundColor: "#EDC75A"}} beforeHighlight="Mis clientes han quedado " afterHighlight="con la facilidad de uso y la fiabilidad del servicio. Además, el diseño del dashboard es intuitivo y profesional." highlightText="encantados" authorName="Mariana López" authorTitle="Pithaya Agency" authorImage="https://i.imgur.com/FwjZ8X2.jpg"/>

      <FormSteps
        steps={stepsWithImages}
        title="Crea tu primer Formmy con un par de clics"
      />
      
      <FormComments />

      <GeneralCallToAction />
      <HomeFooter />
    </main>
  );
}
