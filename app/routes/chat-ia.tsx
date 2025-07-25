import React from "react";
import HomeHeader from "./home/HomeHeader";
import { CompaniesScroll } from "~/components/home/CompaniesScroll";
import {
  FaReact,
} from "react-icons/fa";
import { Steper, type Step } from "../components/Steper";
import { GeneralCallToAction } from "./home/HomeCallToAction";
import HomeFooter from "./home/HomeFooter";
import { cn } from "~/lib/utils";
import { AiBanner } from "./home/FullBanner";
import { BenefitCard } from "./home/HomeBenefits";
import { ChatHero } from "./chat/ChatHero";
import { ChatBenefits } from "./chat/ChatBenefits";
import { ChatTypes } from "./chat/ChatTypes";
import { FullComment } from "~/components/common/FullComment";
import { ChatIntegrations } from "./chat/ChatIntegrations";


const stepsWithImages = [
  {
    title: "Crea un Proyecto",
    desc: "Crear un Formmy es muy fácil desde el dashboard, solo da clic en «+ Formmy» y bautiza tu primer Formmy 👻.",
    image: "https://images.pexels.com/photos/1595385/pexels-photo-1595385.jpeg",
  },
  {
    title: "Entrena a tu Agente",
    desc: "Elige entre formulario de contacto y de suscripción.",
    image: "https://images.pexels.com/photos/1595385/pexels-photo-1595385.jpeg",
  },
  {
    title: "Personaliza los colores y estilos de tu chat",
    desc: "Activa o agrega los campos para tu Formmy, personaliza el tema, el color principal y el estilo de tus inputs.",
    image: "https://images.pexels.com/photos/1595385/pexels-photo-1595385.jpeg",
  },
  {
    title: "Copia y pega en tu HTML o JSX",
    desc: "Ponle tu estilo al mensaje que verán tus usuarios al completar el formulario.",
    image: "https://images.pexels.com/photos/1595385/pexels-photo-1595385.jpeg",
  },
  {
    title: "Observa y mejora tu agente",
    desc: "Formmy es compatible con cualquier lenguaje, así que solo tienes que copiar una línea de código y pégarla en el tu proyecto. Espera un poco y ¡Empieza a recibir mensajes de tus clientes!",
    image: "https://images.pexels.com/photos/1595385/pexels-photo-1595385.jpeg",
  },
];


export default function ChatIA() {
  return (
    <section className="bg-clear pt-40 md:pt-52 overflow-hidden">
      <HomeHeader />
      <ChatHero />
      <CompaniesScroll />
      <ChatBenefits />
      <section className="max-w-7xl w-full mx-auto   px-4 md:px-[5%] xl:px-0">
        <AiBanner />
      </section>
      <ChatTypes/>
      <ChatIntegrations />
      <section className="grid-cols-2 max-w-7xl mx-auto">
        <FullComment
          className=""
          image=""
          client="Lucía Mendez"
          comment="Lorem ipsum dolor sit amet consectetur adipisicing elit. Alias, architecto. 
        Quam voluptate aspernatur ea dicta voluptates accusantium aliquid ratione, consequatur animi,
         reprehenderit eum cupiditate repellat vel eos maiores. Repellat, eos? "
          clientCompany="Notion"
        />
      </section>
      <section
        id="steper"
        className="w-full md:min-h-fit max-w-7xl mx-auto my-20 md:my-40 px-4 md:px-[5%] xl:px-0 min-h-[800px]"
      >
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-dark">
          Crea tu primer Formmy Chat en 5 minutos
        </h3>
        <Steper
          steps={stepsWithImages.map(({ title, desc }) => ({ title, desc }))}
          renderRight={(selectedStep) => (
            <img
              src={stepsWithImages[selectedStep].image}
              alt={stepsWithImages[selectedStep].title}
              className=" max-h-fit md:max-h-[400px] max-w-full object-contain rounded-2xl shadow-lg"
            />
          )}
          autoAdvanceMs={10000}
        />
      </section>
      <GeneralCallToAction />
      <HomeFooter />
    </section>
  );
}




