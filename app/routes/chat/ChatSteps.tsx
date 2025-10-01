import { useRef } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";
import { StickyScroll } from "~/components/ui/sticky-scroll-reveal";

interface Step {
  number: string;
  title: string;
  description: string;
  buttonText?: string;
}

const steps: Step[] = [
  {
    number: "01.",
    title: "Crea un Chatbot",
    description: "Después de crear tu cuenta, ve a la pestaña de Chatbots y da clic en « + Chatbot ». ",
    buttonText: "Learn more"
  },
  {
    number: "02.",
    title: "Entrena a tu Agente",
    description: "Comparte información, documentos, preguntas específicas o links sobre tus productos o servicios, para que tu agente se vuelva un experto en tu negocio.",
    buttonText: "Learn more"
  },
  {
    number: "03.",
    title: "Personaliza los colores de tu chat y el rol de tu agente",
    description: "Personaliza el avatar, el color y el saludo de tu chat, además de el modelo y el rol que quieres que tome tu agente.",
    buttonText: "Learn more"
  },
  {
    number: "04.",
    title: "Copia y pega en tu HTML o JSX",
    description: "Copia el SDK o el iframe de chat y pegala en tu proyecto. ¡Tu agente está listo para atender a tus clientes!",
    buttonText: "Learn more"
  },
  {
    number: "05.",
    title: "Observa y mejora tu agente",
    description: "Visualiza cómo interactúa con los usuarios, detecta patrones y encuentra puntos de mejora. Desde el panel de control puedes ajustar respuestas, agregar información o afinar el tono del chatbot.",
    buttonText: "Probar"
  }
];

export function ChatSteps() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: stepsContainerRef,
    offset: ["start center", "end center"]
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (videoRef.current && videoRef.current.duration) {
      const videoDuration = videoRef.current.duration;
      // Clamp entre 0 y 1 para evitar valores fuera de rango
      const clampedProgress = Math.max(0, Math.min(1, latest));
      const targetTime = clampedProgress * videoDuration;
      videoRef.current.currentTime = targetTime;
    }
  });

  const videoElement = (
    <video
      ref={videoRef}
      className="object-cover h-full w-full rounded-3xl border border-outlines"
      muted
      playsInline
      preload="auto"
      poster="/home/chat-steper-1.webp"
      onLoadedMetadata={() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }
      }}
    >
      <source src="https://formmy.t3.storage.dev/steps-chat.mp4" type="video/mp4" />
      Tu navegador no soporta el elemento de video.
    </video>
  );

  const stickyItems = steps.map((step, index) => ({
    number: step.number,
    title: step.title,
    twColor: "dark:bg-transparent bg-[#ffffff]",
    text: (
      <div>
        <p className="font-sans text-metal">
          {step.description}
        </p>
        {index === steps.length - 1 && step.buttonText && (
          <button className="mt-8 text-base px-8 py-3 bg-dark hover:bg-dark/90 hover:-translate-y-1 transition-all duration-200 text-white rounded-full font-medium">
            {step.buttonText}
          </button>
        )}
      </div>
    ),
    img: videoElement
  }));

  return (
    <section className="w-full py-16 md:py-24 relative ">

      <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-center mb-0 lg:mb-10 text-dark dark:text-white px-4 relative z-10">
        Crea tu primer Chatbot en 5 minutos
      </h2>

      <div ref={stepsContainerRef} className="relative z-10 ">
        <StickyScroll items={stickyItems} />
      </div>
    </section>
  );
}