import { Form } from "react-router";
import { ScrollRevealLeft } from "~/components/ScrollReveals";
import { BigCTA } from "~/components/BigCTA";
import { useEffect, useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { motion } from "framer-motion";

type MessageType = {
  from: "user" | "agent";
  text: string;
  avatar?: string;
};

type AnimatedChatProps = {
  conversations: MessageType[][];
  current: number;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
};

export const ChatHero = () => {
  const conversations = [
    [
      {
        from: "user" as const,
        text: "Hola, quiero pedir información de la clase de inglés",
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      },
      {
        from: "agent" as const,
        text: "¡Hola! Claro, ¿Te interesa el curso de Inglés de Negocios o Inglés Básico?",
      },
      {
        from: "user" as const,
        text: "Inglés de Negocios",
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      },
      {
        from: "agent" as const,
        text: "¡Con gusto! El curso de Inglés de Negocios se imparte los días martes de 5:00 a 6:00 pm, y la clase tiene un costo de $250 mxn. ¿Quieres inscribirte?",
      },
      {
        from: "user" as const,
        text: "Sí",
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      },
    ],
    [
      {
        from: "user" as const,
        text: "¿Tienen tazas de color negro en stock?",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        from: "agent" as const,
        text: "¡Hola! Por el momento están agotadas, pero esperamos nueva mercancía la próxima semana.",
      },
      {
        from: "user" as const,
        text: "¿Me pueden avisar cuando llegue?",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        from: "agent" as const,
        text: "¡Por supuesto! Déjame tu correo para notificarte cuando tengamos inventario disponible.",
      },
      {
        from: "user" as const,
        text: "carlos.rodriguez@gmail.com",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        from: "agent" as const,
        text: "Gracias. Ahora estás en la lista.",
      },
    ],
    [
      {
        from: "user" as const,
        text: "¿Puedo pagar con tarjeta?",
        avatar: "https://randomuser.me/api/portraits/women/65.jpg",
      },
      {
        from: "agent" as const,
        text: "Sí, aceptamos pagos con tarjeta, transferencia y efectivo.",
      },
      {
        from: "user" as const,
        text: "¿Cuál es su dirección?",
        avatar: "https://randomuser.me/api/portraits/women/65.jpg",
      },
      {
        from: "agent" as const,
        text: "Estamos ubicados en Av. Reforma 123, Col. Centro, CDMX. También tenemos envíos a toda la República.",
      },
      {
        from: "user" as const,
        text: "¡Perfecto, gracias!",
        avatar: "https://randomuser.me/api/portraits/women/65.jpg",
      },
      {
        from: "agent" as const,
        text: "¡De nada! Si tienes más preguntas, no dudes en escribirme. ¡Que tengas un excelente día! 😊",
      },
    ],
  ];
  const [current, setCurrent] = useState(0);

  return (
    <div className="w-full mb-10  max-w-7xl mx-auto h-fit md:h-[60vh]  px-4 md:px-[5%] xl:px-0 flex flex-col md:flex-row items-center justify-start md:justify-between gap-0 md:gap-8 ">
      <div className="w-full md:w-1/2 flex flex-col justify-center items-start md:items-start ">
        <h1 className="font-bold text-dark text-3xl md:text-4xl lg:text-6xl mb-4 leading-tight text-center md:text-left">
          Chat IA que conecta
          <br className="hidden md:block" /> con tus clientes
        </h1>
        <p className="text-gray-600 text-lg md:text-xl md:text-2xl  mb-0 max-w-lg text-center md:text-left">
          La forma para crear y desplegar agentes de soporte con IA en tu sitio
          web. Responde preguntas, guía a tus visitantes y capta leads
          automáticamente, 24/7.
        </p>
        <Form method="post" className="mt-10 mx-auto md:mx-0" action="/api/login">
          <BigCTA type="submit" name="intent" value="google-login" />
        </Form>
        <div className="flex items-center gap-2 text-irongray text-base mt-2 mx-auto md:mx-0">
          <span className="inline-block">No necesitas tarjeta</span>
        </div>
      </div>
      <div className="w-full md:w-1/2 flex justify-center items-center pl-0 md:pl-16">
        <motion.div 
          id="chat"
          className="border border-gray-300 rounded-3xl p-4 md:p-8 w-full h-[480px] md:min-h-[550px] flex flex-col justify-end shadow-lg relative overflow-hidden"
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute z-10 border-b border-outlines left-0 top-0 w-full h-16 bg-dark text-white flex gap-3 items-center px-6 text-xl font-medium">
            <img src="/home/ghosty-avatar.svg" />
            Ghosty
          </div>
          <AnimatedChat
            conversations={conversations}
            current={current}
            onPrev={() => setCurrent((c) => Math.max(0, c - 1))}
            onNext={() =>
              setCurrent((c) => Math.min(conversations.length - 1, c + 1))
            }
            onRestart={() => setCurrent(0)}
          />
        </motion.div>
      </div>
    </div>
  );
};

function AnimatedChat({
  conversations,
  current,
  onPrev,
  onNext,
  onRestart,
}: AnimatedChatProps) {
  const messages = conversations[current] || [];
  const [visible, setVisible] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setVisible(0); // reset when conversation changes
    setIsTransitioning(false);
  }, [current]);

  useEffect(() => {
    if (visible < messages.length) {
      const timeout = setTimeout(
        () => setVisible(visible + 1),
        visible === 0 ? 400 : 1800
      );
      return () => clearTimeout(timeout);
    } else if (
      visible === messages.length &&
      current < conversations.length - 1
    ) {
      // Espera 4 segundos, luego hace fade out y cambia de conversación
      const timeout = setTimeout(() => {
        setIsTransitioning(true);
        // Espera el fade out antes de cambiar
        setTimeout(() => {
          setIsTransitioning(false);
          onNext();
        }, 350); // duración del fade out
      }, 4000); // espera antes de iniciar el fade out
      return () => clearTimeout(timeout);
    }
  }, [visible, messages.length, current, conversations.length, onNext]);

  return (
    <div className="flex flex-col justify-end h-full w-full relative">
      <motion.div
        key={current}
        initial={{ opacity: 0 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col justify-end mb-6 h-full w-full text-sm md:text-base"
      >
        {messages.slice(0, visible).map((msg, idx) => (
          <motion.div
            layout="position"
            key={msg.text + idx}
            initial={
              idx === visible - 1
                ? { opacity: 0, y: 20, filter: "blur(6px)" }
                : false
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={
              idx === visible - 1
                ? { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }
                : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
            }
            className={`flex ${
              msg.from === "user" ? "justify-end" : "justify-start"
            } mb-4 w-full`}
          >
            <div
              className={`max-w-[90%] rounded-xl px-2 md:px-5 py-3  flex items-center gap-2 ${
                msg.from === "user"
                  ? "bg-dark  text-white"
                  : "bg-surface text-gray-800"
              }`}
            >
              {msg.from === "agent" && (
                <span className="inline-block bg-dark text-white rounded-full !min-w-8 !h-8 flex items-center justify-center font-bold mr-2">
                  <img src="/home/ghosty-avatar.svg" />
                </span>
              )}
              <span>{msg.text}</span>
              {msg.from === "user" && (
                <img
                  src={msg.avatar}
                  alt="user"
                  className="!w-8 !h-8 rounded-full object-cover"
                />
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
      {/* Controles de navegación: botones circulares con iconos */}
      <div className="absolute -bottom-2 md:-bottom-4 left-0 flex gap-2 z-10">
        <button
          onClick={onPrev}
          disabled={current === 0}
          className="w-10 h-10 rounded-full bg-dark text-clear flex items-center justify-center disabled:bg-gray-200 disabled:text-gray-400  transition hover:scale-95"
          title="Anterior"
        >
          <IoChevronBack size={22} />
        </button>
        <button
          onClick={onNext}
          disabled={current === conversations.length - 1}
          className="w-10 h-10 rounded-full bg-dark text-clear flex items-center justify-center disabled:bg-gray-200 disabled:text-gray-400 transition hover:scale-95"
          title="Siguiente"
        >
          <IoChevronForward size={22} />
        </button>
      </div>
    </div>
  );
}
