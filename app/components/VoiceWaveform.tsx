/**
 * VoiceWaveform Component
 * Visualización animada de voz tipo Siri
 *
 * Muestra 12 barras verticales que se animan cuando la voz está activa
 */

import { motion } from "framer-motion";
import { useMemo } from "react";

interface VoiceWaveformProps {
  isActive: boolean;
}

export default function VoiceWaveform({ isActive }: VoiceWaveformProps) {
  // Generar valores aleatorios UNA SOLA VEZ para evitar re-renders
  const barAnimations = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => ({
      heights: [
        Math.random() * 30 + 15, // Min height: 15-45px
        Math.random() * 50 + 25, // Max height: 25-75px
        Math.random() * 30 + 15, // Return to min
      ],
      delay: index * 0.05, // Efecto onda escalonado
    }));
  }, []); // Solo generar una vez al montar el componente

  return (
    <div className="flex items-center justify-center gap-1 h-20">
      {barAnimations.map((bar, index) => (
        <motion.div
          key={index}
          className="w-1 bg-gradient-to-t from-blue-500 via-blue-400 to-blue-300 rounded-full"
          animate={{
            height: isActive ? bar.heights : 8, // 8px cuando inactivo
          }}
          transition={{
            duration: 0.8,
            repeat: isActive ? Infinity : 0,
            ease: "easeInOut",
            delay: bar.delay,
            repeatType: "mirror", // Suaviza la transición en el loop
          }}
        />
      ))}
    </div>
  );
}
