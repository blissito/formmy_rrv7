import React, { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
const img = "https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg"

function ChatCard({ label, backgroundImage, imageClassName,description }: { label: string; backgroundImage?: string; imageClassName?: string,  description?: string }) {
  return (
    <div className="bg-white border border-outlines h-fit p-6 w-[340px] rounded-3xl relative overflow-hidden flex-shrink-0">
      <img src={backgroundImage} className="w-full h-[180px] object-cover rounded-2xl"/>
      <h3 className="text-xl md:text-2xl text-dark mt-4 heading">{label}</h3>
      <p className="text-metal text-base md:text-lg">{description}</p>
    </div>
  );
}

const tabContent = [
  {
    id: "friction",
    title: "Atención al cliente",
    content: {
      text: "Ofrece respuestas instantáneas 24/7, resuelve dudas frecuentes, guía paso a paso al usuario y automatiza procesos, todo dentro del mismo chat.",
      image: "/home/chat-1.png"
    }
  },
  {
    id: "ventas",
    title: "Agente de ventas",
    content: {
      text: "Recomienda productos, resuelve dudas y genera cotizaciones automáticas según lo que el cliente necesita.",
      image: "/home/chat-2.png"
    }
  },
  {
    id: "feedback",
    title: "Feedback y encuestas",
    content: {
      text: "Solicita feedback desde tu sitio en el momento justo: después de una compra, una consulta o al cerrar una conversación.",
      image: "/home/chat-3.png"
    }
  },
  {
    id: "citas",
    title: "Gestión de citas",
    content: {
      text: "Tus clientes pueden agendar citas desde la conversación, sin salir de tu sitio ni esperar a que alguien les conteste.",
      image: "/home/chat-4.png"
    }
  },
  {
    id: "onboarding",
    title: "Asistente de onboarding",
    content: {
      text: "Guía a los usuarios paso a paso dentro de tu plataforma y responde preguntas frecuentes al instante.",
      image: "/home/chat-5.png"
    }
  },
  {
    id: "rrhh",
    title: "Asistente de RRHH",
    content: {
      text: "Responde preguntas sobre políticas de la empresa, beneficios, vacaciones y trámites internos.",
      image: "/home/chat-6.png"
    }
  }
];

export default function ChatTypes() {
  const cards = tabContent.map(item => ({
    label: item.title,
    description: item.content.text,
    backgroundImage: item.content.image
  }));
  return (
    <section className="relative w-full flex flex-col items-center my-20 md:my-40 overflow-hidden">
      <h2 className="font-bold text-dark text-3xl md:text-4xl lg:text-6xl text-center mb-10 md:mb-16 leading-tight px-4">
        Para qué puedes usar Formmy Chat
      </h2>
      <ChatCarrusel items={cards} direction="right" speed="slow" />
    </section>
  );
}

 const ChatCarrusel = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: {
    label: string;
    description?: string;
    backgroundImage?: string;
    imageClassName?:string;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);

  useEffect(() => {
    addAnimation();
  }, []);
  const [start, setStart] = useState(false);
  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }
  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards"
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse"
        );
      }
    }
  };
  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };
  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 mx-auto  overflow-hidden",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-6 md:gap-10 animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
      >
         {items.map((item, idx) => (
          <div key={idx} className={idx % 2 !== 0 ? 'mt-20' : ''}>
            <ChatCard 
              label={item.label} 
              backgroundImage={item.backgroundImage} 
              imageClassName={item.imageClassName} 
              description={item.description}
            />
          </div>
        ))}
      </ul>
    </div>
  );
};





// import { useState } from "react";
// import { AnimatePresence, motion } from "framer-motion";
// import { Button } from "@headlessui/react";
// import { FaChalkboardTeacher, FaCode, FaEye, FaProjectDiagram, FaRegFileAlt } from "react-icons/fa";
// import { cn } from "~/lib/utils";
// import { MdOutlineSell, MdOutlineSupportAgent } from "react-icons/md";
// import { VscFeedback } from "react-icons/vsc";
// import { AiOutlineSchedule } from "react-icons/ai";


// const tabContent = [

//     {
//       id: "friction",
//       title: "Atención al cliente ",
//       content: {
//         text: <div className="flex flex-col gap-2"> 
//        <p>Ofrece respuestas instantáneas 24/7, resuelve dudas frecuentes, guía paso a paso al usuario y automatiza procesos, todo dentro del mismo chat.</p>
//        <p>Más rápido que un mail, más fácil que un FAQ.</p>
//         </div>,
//         image:
//           "/home/chat-1.png",
//       },
//     },
//     {
//       id: "ventas",
//       title: "Agente de ventas",
//       content: {
//         text:<div className="flex flex-col gap-2"> 
//         <p>Recomienda productos, resuelve dudas y genera cotizaciones automáticas según lo que el cliente necesita.</p>
//         <p>Ventas automatizadas, atención 24/7 y un asistente que nunca se cansa.</p>
//         </div> ,
//         image:
//         "/home/chat-2.png",
//       },
//     },
//     {
//       id: "ventas",
//       title: "Feedback y encuestas",
//       content: {
//         text:<div className="flex flex-col gap-4"> 
//         <p>Solicita feedback desde tu sitio en el momento justo: después de una compra, una consulta o al cerrar una conversación.</p>
//         <p>Feedback en tiempo real, sin formularios eternos ni correos que nunca se abren.</p>
//         </div> ,
//         image:
//         "/home/chat-3.png",
//       },
//     },
//       {
//       id: "ventas",
//       title: "Gestión de citas",
//       content: {
//         text:<div className="flex flex-col gap-4"> 
//         <p>Tus clientes pueden agendar citas desde la conversación, sin salir de tu sitio ni esperar a que alguien les conteste. </p>
//         <p>Tu agente se encarga de mostrar disponibilidad y agendar citas.</p>
//         </div> ,
//         image:
//         "/home/chat-4.png",
//       },
//     },   
//     {
//       id: "ventas",
//       title: "Asistente de onboarding",
//       content: {
//         text:<div className="flex flex-col gap-4"> 
//         <p>Guía a los usuarios paso a paso dentro de tu plataforma y responde preguntas frecuentes al instante. </p>
//         <p>Todo diseñado para que la experiencia sea clara, rápida y sin fricciones.</p>
//         </div> ,
//         image:
//         "/home/chat-5.png",
//       },
//     }, 
//     {
//       id: "recursos-humanos",
//       title: "Asistente de RRHH",
//       content: {
//         text:<div className="flex flex-col gap-4"> 
//         <p>Responde preguntas sobre políticas de la empresa, beneficios, vacaciones y trámites internos.</p>
//         <p>Mejora la experiencia de los colaboradores con respuestas inmediatas.</p>
//         </div> ,
//         image:
//         "/home/chat-6.png",
//       },
//     },
//   ];
  

// export const ChatTypes=()=>{
//     return (
//     <section className="w-full max-w-7xl mx-auto my-20 md:my-40 px-4">
//       <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-dark mb-10 md:mb-16">
//         Para que puedes usar Formmy Chat
//       </h3>
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
//         {tabContent.map((tab) => (
//           <ChatTypeExample 
//             key={tab.id}
//             title={tab.title}
//             content={tab.content}
//           />
//         ))}
//       </div>
//     </section>
//   )
// }

// interface ChatTypeExampleProps {
//   title: string;
//   content: {
//     text: React.ReactNode;
//     image: string;
//   };
// }

// const ChatTypeExample = ({ title, content }: ChatTypeExampleProps) => {
//   return (
//     <div className="flex flex-col gap-2">
//       <h2 className="text-2xl heading">
//         {title}
//       </h2>
//       <img src={content.image} alt={title} className="w-full h-auto rounded-lg" />
//       <div className="text-metal text-lg">
//         {content.text}
//       </div>
//     </div>
//     )
// }
