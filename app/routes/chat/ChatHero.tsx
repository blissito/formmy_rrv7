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
        text: "Si tienes más preguntas, no dudes en escribirme. ¡Que tengas un excelente día! 😊",
      },
    ],
  ];
  const [current, setCurrent] = useState(0);

  return (
    <div className="max-w-7xl mb-10 min-h-svh pt-28  mx-auto px-4 md:px-[5%] xl:px-0 flex  items-center justify-start md:justify-between gap-0 md:gap-16 ">
      <div className="w-full lg:w-[50%] flex flex-col ">
        <h1 className="heading font-bold text-dark text-3xl md:text-4xl lg:text-6xl mb-4 !leading-[1.1] text-center md:text-left">
          Chat IA que conecta con tus clientes
        </h1>
        <p className="text-metal text-lg md:text-2xl font-light   text-left ">
          La forma más fácil de crear agentes de soporte con IA para tu sitio
          web. Responde preguntas, guía a tus clientes y capta leads
          automáticamente, 24/7.
        </p>
        <Form method="post" className="mt-10 mx-auto md:mx-0" action="/api/login">
          <BigCTA type="submit" name="intent" value="google-login" />
        </Form>
      </div>
      <div className=" flex justify-center items-start flex-nowrap gap-8 relative">
 
   
        {/* Configuration Cards - Stacked */}
        <div className="hidden lg:flex flex-col items-start justify-start -mt-32 relative">
          {/* Stats Card */}
          <motion.div
            className="relative z-10 -mb-52"
            initial={{ opacity: 0, y: -80, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.9,
              delay: 0.2,
              type: "spring",
              stiffness: 120,
              damping: 12
            }}
          >
            <FeatureCardWithHover initialRotation={{ x: 0, y: 0, z: -12 }}
            className="flex flex-col" 
          >
              <h3 className="font-semibold text-dark ">Personaliza tu chat</h3>
              <div className="grid place-content-center h-full">
              <div className=" w-12 h-12  rounded-full mx-auto border  overflow-hidden"><img src="/dash/logo-full.svg" /></div>
              <p className="text-base text-dark leading-relaxed mt-2 text-center">¡Hola, soy Ghosty!</p>
              <div className="w-12 mx-auto mt-2 h-5 rounded bg-brand-500"></div>
              </div>
            
            </FeatureCardWithHover>
          </motion.div>

          {/* Resume Card */}
          <motion.div
            className="relative z-20 -mb-44 ml-16"
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 1.0,
              delay: 0.5,
              type: "spring",
              stiffness: 100,
              damping: 10
            }}
          >
            <FeatureCardWithHover initialRotation={{ x: 0, y: 0, z: 8 }}>
              <div className="flex items-center gap-2 mb-3">
                  <span className=" font-semibold text-dark">Centraliza tus mensajes</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-white rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-cloud flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                    JD
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-semibold text-gray-900">John Lenon</div>
                    </div>
                    <div className="text-xs text-gray-500 truncate">¿Tienen disponibilidad para esta semana?</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-bird flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                    MR
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-semibold text-gray-900">María Rodríguez</div>
                    </div>
                    <div className="text-xs text-gray-500 truncate">Gracias por la información 👍</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    CS
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-semibold text-gray-900">Carlos Sánchez</div>
                      <div className="text-xs text-gray-400">Monday</div>
                    </div>
                    <div className="text-xs text-gray-500 truncate">Me interesa conocer más sobre el servicio</div>
                  </div>
                </div>
              </div>
            </FeatureCardWithHover>
          </motion.div>

          {/* Contact Card */}
          <motion.div
            className="relative !z-20 ml-8"
            initial={{ opacity: 0, y: -120, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 1.1,
              delay: 0.8,
              type: "spring",
              stiffness: 80,
              damping: 8
            }}
          >
            <FeatureCardWithHover initialRotation={{ x: 0, y: 0, z: -6 }}>
            <h3 className="font-semibold text-dark  mb-3">Entrena a tu agente</h3>
            <div className="w-full h-[80%] border border-dashed border-outlines  p-4 rounded-2xl grid place-content-center relative">
              <div className="absolute w-8 h-8  rounded-full -top-3 right-3 overflow-hidden border-2 border-brand-500"> <img className="w-full h-full object-cover" src="https://images.pexels.com/photos/159519/back-to-school-paper-colored-paper-stationery-159519.jpeg" /></div>
              <div className="absolute w-6 h-6  rounded-full left-2 bottom-4 overflow-hidden border-2 border-sky"> <img className="w-full h-full object-cover" src="https://images.pexels.com/photos/4792285/pexels-photo-4792285.jpeg" /></div>

             <BsCloudUpload className="text-3xl text-metal mx-auto"/>
              <p className="text-xs text-metal leading-relaxed text-center mt-2">Arrastra o selecciona los archivos </p>
            </div>
            </FeatureCardWithHover>
          </motion.div>
        </div>

        <div className="relative px-6 py-3 z-40 -mr-28">
          <ChatPreview
            conversations={conversations}
            current={current}
            onPrev={() => setCurrent((c) => Math.max(0, c - 1))}
            onNext={() => setCurrent((c) => Math.min(conversations.length - 1, c + 1))}
            onRestart={() => setCurrent(0)}
          />
          <img
            src="/mock.png"
            alt="Mock overlay"
            className="w-[300px] lg:w-[360px] h-[520px] lg:h-[680px] absolute top-0 z-20"
          />
        </div>

     
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
      ? `scale(1.1) translateY(-5px)`
      : `scale(1) translateY(0px) rotate(${initialRotation.z}deg)`,
    transition: 'transform 0.3s ease-out',
    willChange: 'transform',
    boxShadow: '10px 20px 40px rgba(0,0,0,0.08)'
  };

  return (
    <div 
      className={`bg-white overflow-hidden mt-40 -mr-8 relative z-10 rounded-2xl h-[220px] w-[240px] p-4 shadow-lg border border-gray-100 w-48 hover:shadow-xl transition-shadow duration-300 hover:z-20 cursor-pointer ${className || ''}`}
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

    >
  
      <div className="absolute flex flex-col z-10 border-b border-outlines left-0 top-0 w-full h-16 text-white flex  items-center  text-xl font-medium">
      <div className="w-full h-12 bg-dark py-2 px-8 text-xs flex justify-between "><p>10:30</p><div className="flex gap-2"><FaSignal />   <FaWifi /><IoBatteryFull /></div>

      </div>
      <div className=" w-full bg-dark text-white flex gap-3 items-center px-6 text-xl font-medium px-6 py-2">
        <img className="w-8" src="/home/ghosty-avatar.svg" />
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
