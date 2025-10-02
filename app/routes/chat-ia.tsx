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
import ChatTypeSlider from "./chat/ChatTypeSlider";
import { Quote } from "./home/Quote";
import { ChatSteps } from "./chat/ChatSteps";
import { ChatBanner } from "./chat/ChatBanner";
import ChatComments from "./chat/ChatComments";
import HomeProducts from "./home/HomeProducts";


export const meta = () =>
  getBasicMetaTags({
    title: "Chatbot IA para tu sitio web | Formmy",
    description:
      "Activa un chatbot con inteligencia artificial en tu sitio web en minutos. Sin código, personalizable y disponible 24/7.",
      image: "/chat-metaimg.webp",
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
    <section className="bg-clear  ">
      <HomeHeader />
      <ChatHero />
      <SectionFadeIn delay={0.4}>
      <Quote  highlightStyle={{backgroundColor: "#8AD7C9"}} beforeHighlight="Nuestro chatbot es  " afterHighlight="Responde preguntas, delega cuando es necesario y sabe guiar a los clientes." highlightText="excelente." authorName="Abraham González" authorTitle="Restaurante Mi ranchito" authorImage="/home/abraham.webp" />
      </SectionFadeIn>
      <ChatBenefits />
      <ChatSteps />
      <ChatBanner/>
      <ChatIntegrations />
      <ChatComments/>
      <GeneralCallToAction />
      <HomeFooter />
    </section>
  );
}


