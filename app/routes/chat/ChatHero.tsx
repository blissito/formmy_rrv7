import { Form } from "react-router";
import { ScrollRevealLeft } from "~/components/ScrollReveals";
import { BigCTA } from "~/components/BigCTA";
import { useEffect, useState } from "react";
import { IoBatteryFull, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { motion } from "framer-motion";
import { BsCloudUpload } from "react-icons/bs";
import { RiEmotionHappyLine } from "react-icons/ri";
import { SiCodeforces } from "react-icons/si";
import { HiOutlineChatBubbleBottomCenterText } from "react-icons/hi2";
import { FaSignal, FaWifi } from "react-icons/fa";

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
    <div className="w-full mb-10   mx-auto px-4 md:px-[5%] xl:px-0 flex flex-col  items-center justify-start md:justify-between gap-0 md:gap-16 ">
      <div className="w-full flex flex-col justify-center items-center">
        <h1 className="font-bold text-dark text-3xl md:text-4xl lg:text-6xl mb-4 leading-tight text-center md:text-left">
          Chat IA que conecta con tus clientes
        </h1>
        <p className="text-metal text-lg md:text-2xl font-light   mb-0 max-w-4xl text-center ">
          La forma más fácil de crear agentes de soporte con IA para tu sitio
          web. Responde preguntas, guía a tus clientes y capta leads
          automáticamente, 24/7.
        </p>
        <Form method="post" className="mt-10 mx-auto md:mx-0" action="/api/login">
          <BigCTA type="submit" name="intent" value="google-login" />
        </Form>
 
      </div>

    </div>
  );
};

const FeatureCard = ({ children, className, style, onMouseEnter, onMouseLeave }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) => {
  return (
    <div 
      className={`bg-white overflow-hidden relative z-10 rounded-2xl h-[220px] w-[180px] p-4 shadow-lg border border-gray-100 w-48 hover:shadow-xl transition-shadow duration-300 ${className || ''}`}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
};

const FeatureCardWithHover = ({ children, className, initialRotation = { x: 0, y: 0, z: 0 } }: {
  children: React.ReactNode;
  className?: string;
  initialRotation?: { x: number; y: number; z: number };
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardStyle: React.CSSProperties = {
    transform: isHovered 
      ? `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1.1)`
      : `perspective(1000px) rotateX(${initialRotation.x}deg) rotateY(${initialRotation.y}deg) rotateZ(${initialRotation.z}deg)`,
    transition: 'transform 0.3s ease-out',
    willChange: 'transform',
    boxShadow: '10px 20px 40px rgba(0,0,0,0.08)'
  };

  return (
    <div 
      className={`bg-white overflow-hidden mt-40 relative z-10 rounded-2xl h-[220px] w-[180px] p-4 shadow-lg border border-gray-100 w-48 hover:shadow-xl transition-shadow duration-300 hover:z-20 cursor-pointer ${className || ''}`}
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};

const ChatPreview = ({ conversations, current, onPrev, onNext, onRestart }: {
  conversations: any[];
  current: number;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
}) => {
  return (
    <motion.div 
      id="chat"
      className="border border-gray-300 bg-white rounded-[48px] p-4 md:px-5 ml-3 w-[280px] lg:w-[332px] lg:h-[650px] h-[500px] flex flex-col justify-end shadow-lg relative overflow-hidden"
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
  
      <div className="absolute flex flex-col z-10 border-b border-outlines left-0 top-0 w-full h-16 text-white flex  items-center  text-xl font-medium">
      <div className="w-full h-12 bg-dark py-2 px-8 text-xs flex justify-between "><p>10:30</p><div className="flex gap-2"><FaSignal />   <FaWifi /><IoBatteryFull /></div>

      </div>
      <div className=" w-full bg-dark text-white flex gap-3 items-center px-6 text-xl font-medium px-6">
        <img src="/home/ghosty-avatar.svg" />
        Ghosty
        </div>
      </div>
      <AnimatedChat
        conversations={conversations}
        current={current}
        onPrev={onPrev}
        onNext={onNext}
        onRestart={onRestart}
      />
    </motion.div>
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
        className="flex flex-col justify-end mb-8 h-full w-full text-sm md:text-base"
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
              className={`max-w-[95%] rounded-xl px-2 md:px-2 py-2  flex ${
                msg.text.length > 50 ? 'items-start' : 'items-center'
              } gap-2 ${
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
              <span className="text-sm">{msg.text}</span>
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
      {/* Caja de texto del chatbot */}
      <div className="absolute -bottom-4 left-0 right-0 z-10 ">
        <div className="bg-white  rounded-full px-4 py-3 flex items-center gap-3 shadow-sm">
          <input 
            type="text" 
            placeholder="Escribe tu mensaje..."
            className="flex-1 bg-transparent rounded-full border border-outlines text-sm text-gray-700 placeholder-gray-400 outline-none"
            disabled
          />
          <button className="bg-brand-500 text-white p-2 rounded-full hover:bg-gray-700 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
