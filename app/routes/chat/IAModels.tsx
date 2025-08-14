import { cn } from "~/lib/utils"
import { useState } from 'react';

export const IAModels = () => {
    return (
     <section className=" my-20 md:my-32 ">
        <div className="text-center mb-12 max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-4">Potenciado por los mejores modelos de IA</h2>
            <p className=" text-lg md:text-xl xl:text-2xl text-metal mx-auto">Nuestros agentes utilizan modelos de inteligencia artificial de última generación para ofrecer respuestas precisas y naturales.</p>
        </div>     
        <div 
        style={{
            transformStyle: 'preserve-3d' as const,
            perspective: "1500px"
        }}
        className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-8 md:gap-4 lg:gap-8 max-w-7xl mx-auto px-4">
          <IAModelCard 
            img="/home/kimi.png"
            initialRotation={{ x: -15, y: 25, z: 2 }}
          />
          <IAModelCard 
            img="/home/ollama.png"
            initialRotation={{ x: 25, y: 35, z: 2 }}
          />
          <IAModelCard 
            img="/home/gpt.webp"
            initialRotation={{ x: 25, y: -35, z: 2 }}
          />
          <IAModelCard 
            img="/home/claude.webp"
            initialRotation={{ x: 0, y: 0, z: 0 }}
          />
          <IAModelCard 
            img="/home/gmeini.webp"
            initialRotation={{ x: 25, y: 35, z: 2 }}
          />
          <IAModelCard 
            img="/home/mistral.png"
            initialRotation={{ x: 25, y: -35, z: 2 }}
          />
          <IAModelCard 
            img="/home/grok.png"
            initialRotation={{ x: -15, y: -25, z: 2 }}
          />
        </div>
     </section>
    )}


interface IAModelCardProps {
  className?: string;
  img?: string;
  style?: React.CSSProperties;
  initialRotation?: {
    x: number;
    y: number;
    z: number;
  };
}

const IAModelCard = ({className, img, style, initialRotation = { x: 0, y: 0, z: 0 }}: IAModelCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation based on mouse position (normalized to -10 to 10 degrees)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * 10;
    const rotateX = ((centerY - y) / centerY) * 10;
    
    setPosition({ x, y });
    setRotation({ x: rotateX, y: rotateY });
  };

  const cardStyle: React.CSSProperties = {
    ...style,
    transform: isHovered 
      ? `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(1.1)`
      : `perspective(1000px) rotateX(${initialRotation.x}deg) rotateY(${initialRotation.y}deg) rotateZ(${initialRotation.z}deg)`,
    transition: 'transform 0.3s ease-out',
    willChange: 'transform',
    boxShadow: '10px 20px 40px rgba(0,0,0,0.08)'
  };

  return (
    <div 
      className={cn(
        "col-span-1 rounded-3xl p-1 md:p-6 bg-white/80 backdrop-blur-sm grid place-items-center",
        "relative hover:z-10 cursor-pointer",
        className
      )}
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setRotation({ x: 0, y: 0 });
      }}
      onMouseMove={handleMouseMove}
    >
      <div className="w-full h-full transform-style-preserve-3d group grid place-items-center">
        <img 
          className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-300" 
          src={img ? img : "/home/anthropic.webp"} 
          alt="AI Model" 
          style={{
            transform: 'translateZ(20px)',
            transition: 'all 0.3s ease-out',
          }}
        />
      </div>
    </div>
  )
}