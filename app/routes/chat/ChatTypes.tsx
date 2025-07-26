import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@headlessui/react";
import { FaChalkboardTeacher, FaCode, FaEye, FaProjectDiagram, FaRegFileAlt } from "react-icons/fa";
import { cn } from "~/lib/utils";
import { MdOutlineSell, MdOutlineSupportAgent } from "react-icons/md";
import { VscFeedback } from "react-icons/vsc";
import { AiOutlineSchedule } from "react-icons/ai";


const tabContent = [
 
    {
      id: "friction",
      title: "Atención al cliente ",
      icon: MdOutlineSupportAgent,
      content: {
        heading: "Asistente de Atención al cliente y soporte",
        text: <div className="flex flex-col gap-4">
        <p>Con el chatbot, puedes ofrecer respuestas instantáneas 24/7, resolver dudas frecuentes, guiar paso a paso al usuario y hasta automatizar procesos como devoluciones o rastreo de pedidos, todo dentro del mismo chat.</p>
        <p>¿Tu equipo está saturado? El bot filtra lo que puede resolver por su cuenta y solo escala lo necesario, ahorrando tiempo y recursos.</p>
        <p>Más rápido que un mail, más fácil que un FAQ.</p>
        </div>,
        image:
          "/home/type-1.png",
      },
    },
    {
      id: "ventas",
      title: "Agente de ventas",
      icon: MdOutlineSell,
      content: {
        heading: "Tu asistente de ventas 24/7",
        text:<div className="flex flex-col gap-4"> 
        <p>El chatbot no solo responde... vende y cotiza por ti.</p>
        <p>Acompaña al usuario desde el primer "hola" hasta el "comprado": recomienda productos, resuelve dudas, guía el proceso de compra y genera cotizaciones automáticas según lo que el cliente necesita. Todo en tiempo real.</p>
        <p>Ventas automatizadas, atención 24/7 y un asistente que nunca se cansa.</p>
        </div> ,
        image:
        "/home/type-2.png",
      },
    },

    {
      id: "truth",
      title: "Feedback y encuestas en tiempo real",
      icon: VscFeedback,
      content: {
        heading: "No esperes a que tus usuarios te busquen para opinar.",
        text:<div className="flex flex-col gap-4"> 
        <p>Con el chatbot de Formmy, puedes solicitar feedback o lanzar encuestas directamente desde tu sitio o app, en el momento justo: después de una compra, una consulta o al cerrar una conversación.</p>
        <p>Las respuestas llegan sin interrupciones, en el mismo flujo del chat, lo que aumenta la tasa de participación y te da insights valiosos para mejorar tu experiencia.</p>
        <p>Feedback en tiempo real, sin formularios eternos ni correos que nunca se abren.</p>
        </div>,
        image:
        "/home/type-3.png",
      },
    },
    {
      id: "docs",
      title: "Reservas y gestión de citas",
      icon: AiOutlineSchedule,
      content: {
        heading: "Convierte tu chatbot en tu recepcionista virtual",
        text: <div className="flex flex-col gap-4"><p>Con Formmy, tus clientes pueden agendar citas directamente desde la conversación, sin salir de tu sitio ni esperar a que alguien les conteste. El asistente IA se encarga de mostrar disponibilidad, confirmar horarios y enviar recordatorios automáticos por correo o mensaje.</p><p>Todo pasa dentro del chat, sin fricción y con la experiencia que tus clientes esperan.</p></div>,
        buttonText: "Explore Docs",
        image:
        "/home/type-4.png",
      },
    },
    {
      id: "journey",
      title: "Onboarding",
      icon: FaChalkboardTeacher,
      content: {
        heading: "Asistente de Onboarding",
        text: "Tu chatbot se convierte en un asistente personal desde el inicio: guía a los usuarios paso a paso dentro de tu plataforma, responde preguntas frecuentes al instante y automatiza tareas clave. Todo diseñado para que la experiencia sea clara, rápida y sin fricciones. Así, cada nuevo usuario entiende cómo sacarle el máximo provecho a tu producto desde el primer momento, sin necesidad de soporte humano.",
        buttonText: "Learn more",
        image:
        "/home/type-5.png",
      },
    },
  ];
  

export const ChatTypes=()=>{
    return(
        <section className="w-full max-w-7xl mx-auto my-20 md:my-40 px-4">
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-dark mb-16">
        Para que puedes usar Formmy Chat
        </h3>
        <ChatExample />
    </section>
    )
}



export const ChatExample = () => {
    const [activeTab, setActiveTab] = useState(tabContent[0].id);
    const activeContent = tabContent.find((tab) => tab.id === activeTab)?.content;
  
    return (
      <div className="w-full bg-clear rounded-[40px]  border border-gray-300 overflow-hidden">
        <div className="flex border-b border-gray-200 justify-around">
          {tabContent.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 p-4 md:p-6  text-gray-600 focus:outline-none transition-colors duration-300",
                {
                  "text-brand-500 border-b-2 border-brand-500":
                    activeTab === tab.id,
                  "hover:bg-brand-100": activeTab !== tab.id,
                }
              )}
            >
              <tab.icon className="text-xl " />
              <span className="hidden md:inline">{tab.title}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="py-8 px-4 min-h-[60vh]"
          >
            {activeContent && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-3 md:p-12">
                <div className="flex flex-col items-start">
                  <h2 className="text-2xl md:text-4xl font-bold text-dark mb-4">
                    {activeContent.heading}
                  </h2>
                  <p className="text-gray-600 text-base md:text-xl mb-6">
                    {activeContent.text}
                  </p>
                
                </div>
                <div className=" grid place-content-center">
                  <img
                    src={activeContent.image}
                    alt={activeContent.heading}
                    className=" w-auto h-full max-h-[280px] md:max-h-[400px] "
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };