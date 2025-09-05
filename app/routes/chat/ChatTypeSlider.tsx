import { useState, useEffect } from "react";
import { cn } from "~/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function ChatCard({ label, backgroundImage, description, color, isExpanded, onClick }: { 
  label: string; 
  backgroundImage?: string; 
  description?: string;
  color?: string;
  isExpanded?: boolean;
  onClick?: () => void;
}) {
  // Responsive expansion logic
  let colSpan = "col-span-1";
  let rowSpan = "row-span-1";
  let gridColumn = "";
  let gridRow = "";
  
  if (isExpanded) {
    colSpan = "col-span-2";
    rowSpan = "row-span-2";
    // Mobile: Center expansion (cols 1-2, rows 3-4)
    // Tablet: Center-right expansion (cols 2-3, rows 2-3) 
    // Desktop: Center-right expansion (cols 2-3, rows 2-3)
    gridColumn = "col-start-1 md:col-start-2"; 
    gridRow = "row-start-3 md:row-start-2";
  }

  return (
    <motion.div 
      className={cn(
        "relative overflow-hidden rounded-3xl cursor-pointer group",
        colSpan,
        rowSpan,
        gridColumn,
        gridRow,
        isExpanded ? "z-10 grayscale-0" : "z-0 grayscale hover:grayscale-0"
      )}
      style={{ 
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        // Asegurar que respete los límites del grid
        maxWidth: '100%',
        maxHeight: '100%'
      }}
      onClick={onClick}
      layout
      initial={{ scale: 1, opacity: 0.8 }}
      animate={{ 
        scale: 1, // Remover el scale para evitar desbordamientos
        opacity: isExpanded ? 1 : 0.8,
        transition: {
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      
      {/* Content */}
      <motion.div 
        className="absolute inset-0 p-3 md:p-6 flex flex-col justify-end text-white"
        animate={{
          opacity: isExpanded ? 1 : 0,
          transition: {
            duration: 0.3,
            delay: isExpanded ? 0.2 : 0
          }
        }}
        whileHover={{
          opacity: 1,
          transition: { duration: 0.2 }
        }}
      >
        <motion.h3 
          className={`font-bold text-white mb-1 md:mb-2 py-1 w-fit px-1 md:px-2 rounded ${
            isExpanded ? "text-3xl" : "text-xl"
          }`}
          style={{ 
            backgroundColor: isExpanded ? (color || '#f3f4f6') : 'transparent'
          }}
        >
          {label}
        </motion.h3>
        <AnimatePresence>
          {isExpanded && (
            <motion.p 
              className="text-white/90 text-xs md:text-base lg:text-lg leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: {
                  duration: 0.4,
                  delay: 0.3
                }
              }}
              exit={{ 
                opacity: 0, 
                y: -20,
                transition: {
                  duration: 0.2
                }
              }}
            >
              {description}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Color indicator */}
      <motion.div 
        className="absolute top-2 right-2 md:top-4 md:right-4 rounded-full border-2 border-white/50"
        style={{ backgroundColor: color || '#f3f4f6' }}
        animate={{
          width: isExpanded ? "1.25rem" : "0.75rem",
          height: isExpanded ? "1.25rem" : "0.75rem",
          transition: {
            duration: 0.3,
            ease: "easeInOut"
          }
        }}
      />
    </motion.div>
  );
}

const tabContent = [
  {
    id: "friction",
    title: "Soporte y atención al cliente",
    content: {
      text: "Ofrece respuestas instantáneas 24/7, resuelve dudas frecuentes, guía paso a paso al usuario y automatiza procesos, todo dentro del mismo chat.",
      image: "/formmys/formmy7.webp"
    },
    color: "#76D3CB"
  },
  {
    id: "ventas",
    title: "Asesor de ventas E-commerce",
    content: {
      text: "Un cliente pregunta por la talla disponible de unos tenis a medianoche → el chatbot responde, muestra inventario y le da el link directo para comprar.",
      image: "/formmys/formmy6.webp"
    },
    color: "#BFDD78"
  },
  {
    id: "feedback",
    title: "Agencias de marketing 📈",
    content: {
      text: "Cuando un usuario entra al sitio y quiere una cotización → el chatbot recoge sus datos, necesidades y los envía al asesor encargado.",
      image: "/formmys/formmy5.webp"
    },
    color: "#FBE05D"
  },
  {
    id: "citas",
    title: "Salones de belleza, consultorios o spas",
    content: {
      text: "Permite a tus clientes agendar citas en el chat sin llamar por teléfono, el bot muestra los horarios disponibles y agenda la cita.",
      image: "/formmys/formmy3.webp"
    },
    color: "#D56D80"
  },
  {
    id: "onboarding",
    title: "Asistente de onboarding",
    content: {
      text: "Tu asistente guía a los usuarios paso a paso dentro de tu plataforma y responde preguntas frecuentes al instante.",
      image: "/formmys/formmy1.webp"
    },
    color: "#9A99EA"
  },
  {
    id: "nutri",
    title: "Asistente médico",
    content: {
      text: "Si eres un profesional de la salud con muchos pacientes, permite que tu agente resuelva todas esas dudas que solo te quitan tiempo.",
      image: "/formmys/formmy4.webp"
    },
    color: "#B2E7C9"
  },
  {
    id: "cod",
    title: "Host/mesero",
    content: {
      text: "Ahora tus clientes puede hacer pedidos por chat, tu asistente siempre esta listo para tomar la orden, sugiere complementos y envia la informacion de pago.",
      image: "/formmys/formmy11.webp"
    },
    color: "#76D3CB"
  },
  {
    id: "doc",
    title: "Asistente educativo",
    content: {
      text: "¿Eres profesor o tutor en línea? Responde automaticamente preguntas sobre tus horarios, costos, materias y agenda una clase muestra.",
      image: "/formmys/formmy10.webp"
    },
    color: "#EDC75A"
  }
  ,
  // {
  //   id: "rrhh",
  //   title: "Asistente de RRHH",
  //   content: {
  //     text: "Responde preguntas sobre políticas de la empresa, beneficios, vacaciones y trámites internos.",
  //     image: "/formmys/formmy12.webp"
  //   },
  //   color: "#FBE05D"
  // },
  {
    id: "ecommerce",
    title: "Asistente personal",
    content: {
      text: "¿Necesitas ayuda con tu marca personal? Deja que tu asistente responda preguntas sobre tus servicios, cotizaciones y envíe links de pagos.",
      image: "/formmys/formmy1.webp"
    },
    color: "#FF6B6B"
  },
  // {
  //   id: "educacion",
  //   title: "Tutor educativo",
  //   content: {
  //     text: "Responde dudas académicas, proporciona explicaciones personalizadas y guía el proceso de aprendizaje.",
  //     image: "/formmys/formmy2.webp"
  //   },
  //   color: "#4ECDC4"
  // },
  // {
  //   id: "inmobiliaria",
  //   title: "Agente inmobiliario",
  //   content: {
  //     text: "Filtra propiedades según preferencias, agenda visitas y proporciona información detallada sobre inmuebles.",
  //     image: "/formmys/formmy3.webp"
  //   },
  //   color: "#45B7D1"
  // },
  // {
  //   id: "restaurante",
  //   title: "Asistente de restaurante",
  //   content: {
  //     text: "Toma reservaciones, recomienda platos, informa sobre ingredientes y gestiona pedidos para delivery.",
  //     image: "/formmys/formmy4.webp"
  //   },
  //   color: "#F39C12"
  // }
];


export default function ChatTypeSlider() {
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const cards = tabContent.map(item => ({
    label: item.title,
    description: item.content.text,
    backgroundImage: item.content.image,
    color: item.color
  }));

  const cardCount = isMobile ? 11 : 13;

  return (
    <section className="relative w-full flex flex-col items-center my-20 md:my-40 px-4">
      <h2 className="font-bold text-dark text-3xl md:text-4xl lg:text-6xl text-center mb-10 md:mb-16 leading-tight">
        Para qué puedes usar Formmy Chat
      </h2>
      
      {/* Gallery Grid - Responsive: Mobile 2x6, Tablet 3x5, Desktop 4x4 */}
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 grid-rows-6 md:grid-cols-3 md:grid-rows-5 lg:grid-cols-4 lg:grid-rows-3 gap-2 md:gap-4 h-[600px] md:h-[700px] lg:h-[700px] relative overflow-hidden">
          {cards.slice(0, cardCount).map((card, index) => (
            <ChatCard
              key={index}
              label={card.label}
              description={card.description}
              backgroundImage={card.backgroundImage}
              color={card.color}
              isExpanded={expandedIndex === index}
              onClick={() => setExpandedIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

