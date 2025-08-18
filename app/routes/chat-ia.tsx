import HomeHeader from "./home/HomeHeader";
import { CompaniesScroll } from "~/components/home/CompaniesScroll";
import { Steper } from "../components/Steper";
import { GeneralCallToAction } from "./home/HomeCallToAction";
import HomeFooter from "./home/HomeFooter";
import { AiBanner } from "./home/FullBanner";
import { ChatHero } from "./chat/ChatHero";
import { ChatBenefits } from "./chat/ChatBenefits";
import { FullComment } from "~/components/common/FullComment";
import { ChatIntegrations } from "./chat/ChatIntegrations";
import { IAModels } from "./chat/IAModels";
import { AIMotivation } from "./chat/AIMotivation";
import ChatTypes from "./chat/ChatTypes";
import { SectionFadeIn } from "./home/home";
import getBasicMetaTags from "~/utils/getBasicMetaTags";



export const meta = () =>
  getBasicMetaTags({
    title: "Chatbot IA para tu sitio web | Formmy",
    description:
      "Activa un chatbot con inteligencia artificial en tu sitio web en minutos. Sin código, personalizable y disponible 24/7.",
  });


const stepsWithImages = [
  {
    title: "Crea un Chat",
    desc: "Ve a tu Dashboard y da clic en la pestaña de Chatbots.",
    image: "/home/chat-steper-1.webp",
  },
  {
    title: "Entrena a tu Agente",
    desc: "Comparte información, documentos o links sobre tu negocio con tu agente.",
    image: "/home/chat-steper-2.webp",
  },
  {
    title: "Personaliza los colores y estilos de tu chat",
    desc: "Personaliza el avatar, el color y el saludo de tu chat, además de la personalidad de tu agente.",
    image: "/home/chat-steper-3.webp",
  },
  {
    title: "Copia y pega en tu HTML o JSX",
    desc: "Copia el SDK o el iframe de chat y pegala en tu proyecto. ¡Tu agente está listo para atender a tus clientes!",
    image: "/home/chat-steper-4.webp",
  },
  {
    title: "Observa y mejora tu agente",
    desc: "Visualiza cómo interactúa con los usuarios, detecta patrones y encuentra puntos de mejora. Desde el panel de control puedes ajustar respuestas o afinar el tono del chatbot. Porque un buen agente no solo se lanza, se entrena constantemente.",
    image: "/home/chat-steper-5.webp",
  },
];



export default function ChatIA() {
  return (
    <section className="bg-clear pt-40 md:pt-52 overflow-hidden">
      <HomeHeader />
      <ChatHero />
      <CompaniesScroll />
      <ChatBenefits />
      <AIMotivation />
      <section className="max-w-7xl w-full mx-auto px-4 md:px-[5%] xl:px-0">
        <AiBanner />
      </section>
      <ChatTypes />
      <ChatIntegrations />
      <IAModels/>
        <SectionFadeIn delay={0.4}>
      <section className="grid-cols-2 max-w-7xl mx-auto px-4 ">
        <FullComment
        ImageClassName="h-[400px]"
          className=""
          image="https://i.imgur.com/RAiyJBc.jpg"
          client="Rosalba Flores"
          comment="Como agencia de investigación, el chat de Formmy ha cambiado la interacción con los panelistas. Antes, nuestro tiempo se destinaba a resolver dudas sobre cómo completar encuestas. Ahora, hemos reducido ese tiempo en un 70%. Nuestros panelistas están más satisfechos y las tasas de finalización de encuestas han aumentado significativamente."
          clientCompany="Collectum Datos"
        />
      </section>
      </SectionFadeIn>
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


