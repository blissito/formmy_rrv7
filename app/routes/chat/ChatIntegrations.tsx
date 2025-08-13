import { FaReact, FaWhatsapp } from "react-icons/fa";
import { BenefitCard } from "../home/HomeBenefits";
import { cn } from "~/lib/utils";
import { RiChatVoiceAiLine, RiRobot2Line } from "react-icons/ri";
import { LuListChecks } from "react-icons/lu";

export const ChatIntegrations = () => {
    return (
      <section className="flex flex-col items-center mt-20 md:mt-40 max-w-7xl mx-auto px-4 md:px-[5%] xl:px-0">
        <h2 className="heading font-bold text-dark text-3xl md:text-4xl lg:text-6xl text-center mb-4 mt-0 leading-tight">
        Desbloquea el poder de los agentes IA
        </h2>
        <p className="paragraph text-metal font-light text-lg md:text-xl xl:text-2xl text-center mb-10 md:mb-16">
          Más simple, más rápido y sin complicaciones técnicas.
        </p>
        <div className="w-full grid grid-cols-12 gap-4 md:gap-12">
          <SquareCard
            color="bg-[#F4B9E7]"
            title="Compara los modelos IA"
            desc="Experimenta con más de 10 modelos y configuraciones para asegurarte de tener la mejor configuración para tu negocio."
            icon={<RiRobot2Line />            }
          />
          <SquareCard
            color="bg-[#EDC75A]"
              title="Dale personalidad a tu agente"
              desc="Define la personalidad y propósito de tu chatbot para que hable como tu marca para crear una experiencia única, cercana y memorable."
            icon={<RiChatVoiceAiLine />}
          />
          <SquareCard
            color="bg-[#B2E7CA]"
            title="Agrega Whats App"
            desc="Integra WhatsApp y convierte a tu agente en un asistente omnicanal que atiende a tus clientes sin fricciones, garantizando una experiencia fluida en todos los canales."
            icon={<FaWhatsapp />}
          />
        </div>
        <div className="flex flex-col gap-0 md:gap-4 mt-4 md:mt-8">
          <BenefitCard
            color="bg-[#BBF0FF]"
            title="Define las reglas"
            desc="La IA filtra respuestas imprecisas o fuera de contexto, cuidando la calidad, el tono y la confianza en cada conversación."
            icon={<LuListChecks />}
          />
          <BenefitCard
            color="bg-[#F9A39D]"
            title="Maneja los mensajes poco claros"
            desc=" Tu agente de IA se adapta al lenguaje de cada usuario, entendiendo diferentes tonos, jergas y estilos de conversación para responder de forma natural, cercana y auténtica."
            icon={<FaReact />}
          />
          <BenefitCard
            color="bg-[#C4B9F9]"
            title="Disfruta del soporte multilingüe"
            desc=" Interactúa con usuarios de todo el mundo con la detección y traducción de idiomas automática, brindando asistencia en tiempo real en más de 40 idiomas dependiendo el modelo."
            icon={<FaReact />}
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
    icon?: React.ReactNode;
  }) {
    return (
      <div className="flex flex-col col-span-12 md:col-span-4 justify-start items-start bg-slate-100 p-4 md:p-8 rounded-3xl">
        <div className="flex gap-4 items-center  mb-4 md:mb-6 ">
        <div
          className={cn(
            "w-12 h-12 md:min-w-16 md:min-h-16 text-4xl rounded-xl bg-white flex items-center justify-center text-black",
            color
          )}
        >
          {icon}
        </div>
        <h3 className="heading font-bold leading-tight md:leading-auto text-dark text-xl md:text-2xl  block md:hidden">
          {title}
        </h3>
        </div>
        <h3 className="heading font-bold text-dark text-2xl mb-2 hidden md:block">
          {title}
        </h3>
        <p className="paragraph text-gray-600 text-base md:text-lg col-span-12 mt-0 md:col-span-8">
          {desc}
        </p>{" "}
      </div>
    );
  }
  
  