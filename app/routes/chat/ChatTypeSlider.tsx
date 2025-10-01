import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const tabContent = [
  {
    id: "friction",
    title: "Soporte",
    color: "#76D3CB"
  },
  {
    id: "ventas",
    title: "E-commerce",
    color: "#BFDD78"
  },
  {
    id: "feedback",
    title: "Agencias",
    color: "#FBE05D"
  },
  {
    id: "citas",
    title: "Salones",
    color: "#D56D80"
  },
  {
    id: "onboarding",
    title: "Onboarding",
    color: "#9A99EA"
  },
  {
    id: "nutri",
    title: "Médico",
    color: "#B2E7C9"
  },
  {
    id: "cod",
    title: "Restaurantes",
    color: "#76D3CB"
  },
  {
    id: "doc",
    title: "Educativo",
    color: "#EDC75A"
  }
];

function Bubble({
  item,
  index,
  scrollProgress
}: {
  item: typeof tabContent[0];
  index: number;
  scrollProgress: any;
}) {
  // Distribución circular uniforme
  const total = tabContent.length;
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2; // Empezar desde arriba

  // Usar porcentaje del viewport para que lleguen al borde
  // Radio ajustado para que no se encimen
  const radiusVW = 38;

  const x = Math.cos(angle) * radiusVW;
  const y = Math.sin(angle) * radiusVW;

  // Todas las burbujas crecen y desaparecen al mismo tiempo
  // Crecen desde 0 → 1, luego continúan creciendo moderadamente mientras desaparecen
  const scale = useTransform(
    scrollProgress,
    [0.3, 0.5, 0.7],
    [0, 1, 1.4]
  );

  const opacity = useTransform(
    scrollProgress,
    [0.3, 0.4, 0.55, 0.7],
    [0, 1, 1, 0]
  );

  return (
    <motion.div
      className="absolute rounded-full flex items-center justify-center text-white font-bold text-center shadow-2xl"
      style={{
        left: `calc(50% + ${x}vw)`,
        top: `calc(50% + ${y}vw)`,
        backgroundColor: item.color,
        scale,
        opacity,
        x: "-50%",
        y: "-50%",
        width: "22vw",
        height: "22vw",
        minWidth: "280px",
        minHeight: "280px",
        maxWidth: "400px",
        maxHeight: "400px",
        fontSize: "clamp(20px, 2vw, 28px)",
        padding: "20px"
      }}
    >
      {item.title}
    </motion.div>
  );
}

export default function ChatTypeSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const titleOpacity = useTransform(scrollYProgress, [0.2, 0.35, 0.65, 0.8], [0, 1, 1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-[150vh] flex items-center justify-center my-20"
    >
      <div className="sticky top-0 w-full h-screen flex items-center justify-center">
        {/* Título central fijo */}
        <div className="z-20 relative">
          <h2 className="font-bold text-dark text-3xl md:text-5xl lg:text-6xl text-center px-4 max-w-2xl leading-tight">
            Para qué puedes usar<br />
            Formmy Chat
          </h2>
        </div>

        {/* Burbujas animadas */}
        <div className="absolute inset-0 pointer-events-none">
          {tabContent.map((item, index) => (
            <Bubble
              key={item.id}
              item={item}
              index={index}
              scrollProgress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
}