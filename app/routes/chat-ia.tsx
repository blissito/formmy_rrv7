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
    title: "Crea un Chat",
    desc: "Ve a tu Dashboard y da clic en la pestaña de Chatbots.",
    image: "/home/chat-steper-1.png",
  },
  {
    title: "Entrena a tu Agente",
    desc: "Comparte información, documentos o links sobre tu negocio con tu agente.",
    image: "/home/chat-steper-2.png",
  },
  {
    title: "Personaliza los colores y estilos de tu chat",
    desc: "Personaliza el avatar, el color y el saludo de tu chat, además de la personalidad de tu agente.",
    image: "/home/chat-steper-3.png",
  },
  {
    title: "Copia y pega en tu HTML o JSX",
    desc: "Copia el SDK o el iframe de chat y pegala en tu proyecto. ¡Tu agente está listo para atender a tus clientes!",
    image: "/home/chat-steper-4.png",
  },
  {
    title: "Observa y mejora tu agente",
    desc: "Visualiza cómo interactúa con los usuarios, detecta patrones y encuentra puntos de mejora. Desde el panel de control puedes ajustar respuestas o afinar el tono del chatbot. Porque un buen agente no solo se lanza, se entrena constantemente.",
    image: "/home/chat-steper-5.png",
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
      <section className="grid-cols-2 max-w-7xl mx-auto px-4 md:px-[5%]">
        <FullComment
          className=""
          image=""
          client="Rosalba Flores"
          comment="Implementé Formmy en mi plataforma de encuestas y es increíble cómo resuelve las dudas de los usuarios. El chatbot explica perfectamente cómo repsonder encuestas y hasta ayuda con el análisis de resultados. Antes me escribían constantemente preguntas repetitivas, ahora el 80% de las consultas se resuelven automáticamente. ¡Los usuarios están más satisfechos y yo tengo más tiempo para mejorar la plataforma!"
          clientCompany="Collectum"
        />
      </section>
      <section
        id="steper"
        className="w-full md:min-h-fit max-w-7xl mx-auto my-20 md:my-40 px-4 md:px-[5%] xl:px-0 min-h-[800px]"
      >
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-dark">
          Crea tu primer Chatbot en 5 minutos
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




