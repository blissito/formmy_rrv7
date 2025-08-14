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
      image: "/home/chat-1.webp"
    }
  },
  {
    id: "ventas",
    title: "Agente de ventas",
    content: {
      text: "Recomienda productos, resuelve dudas y genera cotizaciones automáticas según lo que el cliente necesita.",
      image: "/home/chat-2.webp"
    }
  },
  {
    id: "feedback",
    title: "Feedback y encuestas",
    content: {
      text: "Solicita feedback desde tu sitio en el momento justo: después de una compra, una consulta o al cerrar una conversación.",
      image: "/home/chat-3.webp"
    }
  },
  {
    id: "citas",
    title: "Gestión de citas",
    content: {
      text: "Tus clientes pueden agendar citas desde la conversación, sin salir de tu sitio ni esperar a que alguien les conteste.",
      image: "/home/chat-4.webp"
    }
  },
  {
    id: "onboarding",
    title: "Asistente de onboarding",
    content: {
      text: "Guía a los usuarios paso a paso dentro de tu plataforma y responde preguntas frecuentes al instante.",
      image: "/home/chat-5.webp"
    }
  },
  {
    id: "rrhh",
    title: "Asistente de RRHH",
    content: {
      text: "Responde preguntas sobre políticas de la empresa, beneficios, vacaciones y trámites internos.",
      image: "/home/chat-6.webp"
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



