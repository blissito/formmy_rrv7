interface Step {
    number: string;
    title: string;
    description: string;
    image: string;
    buttonText?: string;
    noPadding?: boolean;
  }

interface StepCardProps {
  step: Step;
  index: number;
  noPadding?: boolean;
}

function StepCard({ step, index, noPadding = false }: StepCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative">
      {/* Text Content */}
      <div className="space-y-4 relative pl-12 md:pl-0 py-4">
        <h3 className="text-4xl md:text-5xl font-bold text-dark relative flex items-start gap-2">
          <span className="text-dark mr-2 relative z-10 bg-bird rounded-xl p-2 w-fit">{step.number}</span>
          <span className="mt-2">{step.title}</span>
        </h3>
        <p className="text-lg text-gray-600 leading-relaxed pl-28">
          {step.description}
        </p>
        {index === 4 && step.buttonText && (
          <button className="mt-6 px-6 py-2 bg-dark ml-28 hover:bg-dark/90 hover:-translate-y-1 transition-all duration-200 text-white rounded-full flex items-center gap-2">
            {step.buttonText}
          </button>
        )}
      </div>

      {/* Image */}
      <div className={`order-first md:order-last overflow-hidden rounded-3xl ${noPadding ? '' : 'bg-steperCover bg-cover'}`}>
        <div className={`w-full h-[462px] ${noPadding ? '' : 'p-10 backdrop-blur bg-white/10'}`}>
          <img
            src={step.image}
            alt={step.title}
            className="w-full h-auto rounded-2xl shadow-2xl object-cover object-center"
          />
        </div>
      </div>
    </div>
  );
}

  const steps: Step[] = [
    {
      number: "01.",
      title: "Crea un Chat",
      description: "Después de crear tu cuenta, ve a la pestaña de Chatbots y da clic en « + Chat ». Sí, así de fácil.",
      image: "/home/foto1.png",
      buttonText: "Learn more",
      noPadding: true
    },
    {
      number: "02.",
      title: "Entrena a tu Agente",
      description: "Comparte información, documentos, preguntas específicas o links sobre tu negocio, para que tu agente se vuelva un experto en tu negocio.  ",
      image: "/home/chat-steper-2.webp",
      buttonText: "Learn more"
    },
    {
      number: "03.",
      title: "Personaliza los colores de tu chat y el rol de tu agente",
      description: "Personaliza el avatar, el color y el saludo de tu chat, además de el modelo y el rol que quieres que use tu agente.",
      image: "/home/chat-steper-3.webp",
      buttonText: "Learn more"
    },
    {
      number: "04.",
      title: "Copia y pega en tu HTML o JSX",
      description: "Copia el SDK o el iframe de chat y pegala en tu proyecto. ¡Tu agente está listo para atender a tus clientes!",
      image: "/home/chat-steper-4.webp",
      buttonText: "Learn more"
    },
    {
      number: "05.",
      title: "Observa y mejora tu agente",
      description: "Visualiza cómo interactúa con los usuarios, detecta patrones y encuentra puntos de mejora. Desde el panel de control puedes ajustar respuestas, agregar información o afinar el tono del chatbot.",
      image: "/home/chat-steper-5.webp",
      buttonText: "Probar"
    }
  ];
  
  export function ChatSteps() {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-[5%] xl:px-0 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl lg:text-6xl  font-bold text-center mb-10 md:mb-32 text-dark">
        Crea tu primer Chatbot en 5 minutos
        </h2>
        <div className="relative">
          {/* Línea punteada vertical conectando los números de steps */}
          <div
            className="hidden md:block absolute left-[44px] top-[180px] border-l-2 border-dashed border-gray-300"
            style={{ height: 'calc(100% - 530px)' }}
          />

          <div className="space-y-24 md:space-y-48">
          {steps.map((step, index) => (
            <StepCard key={index} step={step} index={index} noPadding={step.noPadding} />
          ))}
          </div>
        </div>
      </section>
    );
  }