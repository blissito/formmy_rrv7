import { useState } from "react";
import { cn } from "~/lib/utils";

function ChatCard({ label, backgroundImage, description, color, isExpanded, onClick }: { 
  label: string; 
  backgroundImage?: string; 
  description?: string;
  color?: string;
  isExpanded?: boolean;
  onClick?: () => void;
}) {
  // Simplified logic: Selected card always goes to positions 2,3,6,7 (center-right 2x2)
  let colSpan = "col-span-1";
  let rowSpan = "row-span-1";
  let gridColumn = "";
  let gridRow = "";
  
  if (isExpanded) {
    colSpan = "col-span-2";
    rowSpan = "row-span-2";
    gridColumn = "col-start-2"; // Column 2-3
    gridRow = "row-start-2"; // Row 2-3
  }

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 ease-in-out hover:scale-[1.02] group",
        colSpan,
        rowSpan,
        gridColumn,
        gridRow,
        isExpanded ? "z-10 grayscale-0" : "z-0 grayscale hover:grayscale-0"
      )}
      style={{ 
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
      onClick={onClick}
    >
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      
      {/* Content */}
      <div className={cn(
        "absolute inset-0 p-6 flex flex-col justify-end text-white transition-opacity duration-300",
        isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <h3 
          className={cn(
            "font-bold text-white mb-2 transition-all duration-300",
            isExpanded ? "text-2xl md:text-3xl" : "text-lg md:text-xl"
          )}
        >
          {label}
        </h3>
        {isExpanded && (
          <p className="text-white/90 text-base md:text-lg leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Color indicator */}
      <div 
        className="absolute top-4 right-4 w-4 h-4 rounded-full border-2 border-white/50"
        style={{ backgroundColor: color || '#f3f4f6' }}
      />
    </div>
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
    title: "E-commerce",
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
      text: "Un prospecto entra al sitio y quiere una cotización → el chatbot recoge sus datos, necesidades y los envía al equipo de ventas.",
      image: "/formmys/formmy5.webp"
    },
    color: "#FBE05D"
  },
  {
    id: "citas",
    title: "Salones de belleza, consultorios o spas",
    content: {
      text: "Un cliente agenda su cita en el chat sin llamar por teléfono → el bot confirma la fecha y envía recordatorios automáticos.",
      image: "/formmys/formmy3.webp"
    },
    color: "#D56D80"
  },
  {
    id: "onboarding",
    title: "Asistente de onboarding",
    content: {
      text: "Guía a los usuarios paso a paso dentro de tu plataforma y responde preguntas frecuentes al instante.",
      image: "/formmys/formmy1.webp"
    },
    color: "#9A99EA"
  },
  {
    id: "nutri",
    title: "Asistente nutricional",
    content: {
      text: "Eres un profesional de la salud con muchos clientes, permite que tu agente resuelva todas esas dudas que solo te quitan tiempo.",
      image: "/formmys/formmy4.webp"
    },
    color: "#B2E7C9"
  },
  {
    id: "cod",
    title: "Host/mesero",
    content: {
      text: "Un usuario quiere pedir comida por WhatsApp → el chatbot toma la orden, sugiere complementos y envía la ubicación de entrega al sistema.",
      image: "/formmys/formmy2.webp"
    },
    color: "#76D3CB"
  },
  {
    id: "doc",
    title: "Asistente maestro",
    content: {
      text: "Responde preguntas sobre políticas de la empresa, beneficios, vacaciones y trámites internos.",
      image: "/formmys/formmy9.webp"
    },
    color: "#FBE05D"
  }
  ,
  {
    id: "rrhh",
    title: "Asistente de RRHH",
    content: {
      text: "Responde preguntas sobre políticas de la empresa, beneficios, vacaciones y trámites internos.",
      image: "/formmys/formmy9.webp"
    },
    color: "#FBE05D"
  },
  {
    id: "ecommerce",
    title: "Asistente de e-commerce",
    content: {
      text: "Ayuda a los clientes a encontrar productos, procesar pedidos y resolver dudas sobre envíos y devoluciones.",
      image: "/formmys/formmy1.webp"
    },
    color: "#FF6B6B"
  },
  {
    id: "educacion",
    title: "Tutor educativo",
    content: {
      text: "Responde dudas académicas, proporciona explicaciones personalizadas y guía el proceso de aprendizaje.",
      image: "/formmys/formmy2.webp"
    },
    color: "#4ECDC4"
  },
  {
    id: "inmobiliaria",
    title: "Agente inmobiliario",
    content: {
      text: "Filtra propiedades según preferencias, agenda visitas y proporciona información detallada sobre inmuebles.",
      image: "/formmys/formmy3.webp"
    },
    color: "#45B7D1"
  },
  {
    id: "restaurante",
    title: "Asistente de restaurante",
    content: {
      text: "Toma reservaciones, recomienda platos, informa sobre ingredientes y gestiona pedidos para delivery.",
      image: "/formmys/formmy4.webp"
    },
    color: "#F39C12"
  }
];


export default function ChatTypeSlider() {
  const [expandedIndex, setExpandedIndex] = useState(0);
  
  const cards = tabContent.map(item => ({
    label: item.title,
    description: item.content.text,
    backgroundImage: item.content.image,
    color: item.color
  }));

  return (
    <section className="relative w-full flex flex-col items-center my-20 md:my-40 px-4">
      <h2 className="font-bold text-dark text-3xl md:text-4xl lg:text-6xl text-center mb-10 md:mb-16 leading-tight">
        Para qué puedes usar Formmy Chat
      </h2>
      
      {/* Gallery Grid - 4x4 grid with 13 cards (3 spaces remain empty) */}
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-4 grid-rows-4 gap-4 h-[800px] relative">
          {cards.slice(0, 13).map((card, index) => (
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

