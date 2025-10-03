import { FaReact, FaWhatsapp } from "react-icons/fa";
import { BenefitCard } from "../home/HomeBenefits";
import { cn } from "~/lib/utils";
import { RiChatVoiceAiLine, RiRobot2Line } from "react-icons/ri";
import { LuListChecks } from "react-icons/lu";

export const ChatIntegrations = () => {
    return (
      <section className="flex flex-col items-center py-16 lg:py-32 max-w-7xl mx-auto px-4 md:px-[5%] xl:px-0">
        <h2 className="heading font-bold text-dark text-3xl md:text-4xl lg:text-6xl text-center mb-4 mt-0 leading-tight">
        Desbloquea el poder de los agentes IA
        </h2>
        <p className="paragraph text-metal font-light text-lg md:text-xl xl:text-2xl text-center mb-10 md:mb-16">
          Más simple, más rápido y sin complicaciones técnicas.
        </p>
        <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 md:gap-12">
          <SquareCard
            color="bg-[#F4B9E7]"
            title="Compara los modelos IA"
            desc="Experimenta con más de 10 modelos y configuraciones para asegurarte de tener la mejor configuración para tu negocio."
            icon="/home/icon1.png"
          />
          <SquareCard
            color="bg-[#EDC75A]"
              title="Dale personalidad a tu agente"
              desc="Define la personalidad y propósito de tu agente para que hable como tu marca creando una experiencia única, cercana y memorable."
             icon="/home/icon2.svg"
          />
          <SquareCard
            color="bg-[#B2E7CA]"
            title="Agrega Whats App"
            desc="Integra WhatsApp y convierte a tu agente en un asistente omnicanal que atiende a tus clientes sin fricciones, garantizando una experiencia fluida en todos los canales."
        icon="/home/icon3.svg"
          />

          <SquareCard
            color="bg-[#BBF0FF]"
            title="Define las reglas"
            desc="La IA filtra respuestas imprecisas o fuera de contexto, cuidando la calidad, el tono y la confianza en cada conversación."
           icon="/home/icon4.svg"
          />
          <SquareCard
            color="bg-[#F9A39D]"
            title="Maneja los mensajes poco claros"
            desc=" Tu agente de IA se adapta al lenguaje de cada usuario, entendiendo diferentes tonos, jergas y estilos de conversación para responder de forma natural, cercana y auténtica."
            icon="/home/icon5.svg"
          />
          <SquareCard
            color="bg-[#C4B9F9]"
            title="Disfruta del soporte multilingüe"
            desc=" Interactúa con usuarios de todo el mundo con la detección y traducción de idiomas automática, brindando asistencia en tiempo real en más de 40 idiomas dependiendo el modelo."
            icon="/home/icon6.svg"
          />
        </div>
      </section>
    );
  };
  
  function SquareCard({
    color,
    title,
    desc,
    icon,
  }: {
    color: string;
    title: string;
    desc: string;
    icon?: string;
  }) {
    return (
      <div className="flex flex-col col-span-2 justify-start items-start bg-slate-100 p-4 md:p-8 rounded-3xl relative">
        <div className="flex gap-4 items-center  mb-4 md:mb-6 ">
        <div
          className={cn(
            "w-10 lg:w-12 h-10 lg:h-12 md:min-w-16 md:min-h-16 text-4xl rounded-xl flex items-center justify-center text-black ml-0 -mt-8 lg:-ml-14 lg:-mt-14",
            // color
          )}
        >
          <img className="w-full h-full" src={icon} alt="" />
        </div>
      
        </div>
        <h3 className="heading font-bold text-dark text-xl lg:text-2xl  mb-2 ">
          {title}
        </h3>
        <p className="paragraph text-gray-600 text-base md:text-lg col-span-12 mt-0 md:col-span-8">
          {desc}
        </p>{" "}
      </div>
    );
  }
  
  