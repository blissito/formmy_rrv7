import { AiFillCode } from "react-icons/ai";
import { BiSolidMessageMinus } from "react-icons/bi";
import { FaClipboardList, FaProjectDiagram } from "react-icons/fa";
import { PiChalkboardTeacherFill, PiPaintBrushBroadFill } from "react-icons/pi";
import { RiWhatsappFill } from "react-icons/ri";
import { cn } from "~/lib/utils";

export function HomeFeatures() {
  return (
    <section className="flex flex-col items-center  max-w-7xl px-4 md:px-[5%] xl:px-0 mx-auto 0 py-20 lg:py-32">
    <h2 className="heading font-bold text-[#080923] text-3xl md:text-4xl lg:text-6xl text-center mb-16 mt-0 lg:leading-[1.2]">
      ¿Cansado de perder clientes por formularios rotos o chats complicados?
    </h2>
    <div>
      <ProductCardForms />
      <ProductCardChat />
    </div>
  </section>
  );
}


const ProductCardChat = () => {
    return(
        <div className=" w-full h-[380px] lg:h-[580px] mb-6 mt-0 md:mt-32  flex flex-wrap md:fles-nowrap items-center">
        <div className="pr-10 w-full md:w-[55%] relative z-[1]">
          <h3 className="heading font-bold text-black text-2xl md:text-3xl lg:text-5xl mb-4">Chat IA para tu negocio</h3>
          <p className="paragraph text-metal text-lg md:text-lg lg:text-xl  mb-0 md:mb-8  ">Automatiza la atención y soporte con agentes inteligentes que responden 24/7. Mejora la experiencia de tus usuarios y dedica tu tiempo a lo que realmente importa.</p>
          <div className=" gap-x-6 gap-y-8 grid grid-cols-2 gap-y-4">
            <BulletPoint className="bg-bird" text="Personaliza tu chat con el color y estilo de tu marca" icon={<PiPaintBrushBroadFill />}  />
            <BulletPoint className="bg-bird" text="Entrena a tu agente IA para responder tus clientes" icon={<PiChalkboardTeacherFill />}  />
            <BulletPoint className="bg-bird" text="Integra WhatsApp, Instagram y Messenger " icon={<RiWhatsappFill />}  />
            <BulletPoint className="bg-bird" text="Asígnale tareas especiales a tus agentes (enviar correos o agendar citas)" icon={<FaProjectDiagram />}  />
          </div>
        </div>
        <div className="flex-1 w-[50%] flex justify-center items-center h-full relative z-10 bg-bird rounded-[40px]">
          <img src="/home/video3.gif" alt="video1" className="h-[80%] rounded-2xl object-cover" />
        </div>
      </div>
    )
}

const ProductCardForms = () => {
  return (
    <div className=" w-full h-[380px] lg:h-[580px] mb-6 mt-0 md:mt-16  flex flex-wrap md:fles-nowrap items-center">
      <div className="flex-1 w-[45%] flex justify-center items-center h-full relative z-10 bg-cloud rounded-[40px]">
        <img src="/home/video1.gif" alt="video1" className="h-[80%] rounded-2xl object-cover" />
      </div>
      <div className="pl-16 w-full md:w-[55%] relative z-[1]">
        <h3 className="heading font-bold text-black text-2xl md:text-3xl lg:text-5xl mb-4">Formularios de contacto o suscripción</h3>
        <p className="paragraph text-metal text-lg md:text-lg lg:text-xl  mb-0 md:mb-8 "> Agrega formularios a tu sitio web con un par de clics. Recibe mensajes y suscripciones de tus clientes sin perder ni uno solo.</p>
        <div className=" gap-x-6 gap-y-8 grid grid-cols-2">
          <BulletPoint text="Personaliza tu formmy con el color y estilo de tu marca" icon={<PiPaintBrushBroadFill />}  />
          <BulletPoint text="Selecciona o agrega campos personalizados para tus clientes" icon={<FaClipboardList />} />
          <BulletPoint text="Agrega un mensaje para tus clientes al enviar el formulario" icon={<BiSolidMessageMinus />} />
          <BulletPoint text="Invita a tus colaboradores a administrar tus formularios" icon={<AiFillCode />} />
        </div>
      </div>
    </div>
  );
}

const BulletPoint = ({text, icon, className}: {text: string, icon: React.ReactNode, className?: string}) => {
  return (
    <div className="flex flex-col justify-start min-h-12 items-start gap-2">
    <span className={cn("rounded-full grid place-items-center bg-cloud h-12 !min-w-12 text-2xl", className)}>{icon}</span>
    <p className="paragraph text-metal text-lg ">{text}</p>
    </div>
  );
}
  