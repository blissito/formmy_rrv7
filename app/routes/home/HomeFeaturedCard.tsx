import React, { useState } from "react";
import { TbCopy, TbCheck } from "react-icons/tb";
import { Button } from "~/components/Button";
import { cn } from "~/lib/utils";
import { FullBanner } from "./FullBanner";

function FeaturedCard({ className = "", title, subtitle, img, button, icon, children, pattern }: { className?: string; title: string; subtitle?: string; img?: string; button?: React.ReactNode; icon?: React.ReactNode; children?: React.ReactNode, pattern:boolean }) {
  return (
    <div className={`rounded-3xl  flex h-[360px] overflow-hidden flex-col justify-between shadow-lg ${className}`}>
      <div className="flex flex-col justify-start items-start gap-3 mb-4 ml-8 mt-8 max-w-[300px]">
        {subtitle && <span className={cn("text-xs text-gray-600 font-semibold", {"text-black": !pattern})}>{subtitle}</span>}
        <h3 className="font-bold text-2xl text-black mb-2">{title}</h3>
        {button}
      </div>
      <div className="w-full h-full"> 
          {children}
        </div> 
     {pattern?    <svg className="absolute bottom-0 left-0" width="180" height="80" viewBox="0 0 180 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80C60 0 120 160 180 80" stroke="#9A99EA" strokeWidth="16" fill="none" />
        </svg> : null }
    </div>
  );
}

function DecorativeStarsBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      viewBox="0 0 800 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="80" r="2.5" fill="white" fillOpacity="0.5" />
      <circle cx="200" cy="150" r="1.5" fill="white" fillOpacity="0.3" />
      <circle cx="350" cy="60" r="2" fill="white" fillOpacity="0.4" />
      <circle cx="500" cy="120" r="3" fill="white" fillOpacity="0.6" />
      <circle cx="700" cy="90" r="2" fill="white" fillOpacity="0.5" />
      <circle cx="600" cy="200" r="1.8" fill="white" fillOpacity="0.4" />
      <circle cx="300" cy="300" r="2.2" fill="white" fillOpacity="0.3" />
      <circle cx="750" cy="350" r="1.7" fill="white" fillOpacity="0.5" />
      <circle cx="120" cy="350" r="2.1" fill="white" fillOpacity="0.4" />
      <circle cx="400" cy="200" r="2.8" fill="white" fillOpacity="0.5" />
      <circle cx="50" cy="50" r="1.2" fill="white" fillOpacity="0.3" />
      <circle cx="180" cy="100" r="1.7" fill="white" fillOpacity="0.4" />
      <circle cx="250" cy="250" r="2.3" fill="white" fillOpacity="0.5" />
      <circle cx="320" cy="180" r="1.5" fill="white" fillOpacity="0.3" />
      <circle cx="420" cy="80" r="2.1" fill="white" fillOpacity="0.4" />
      <circle cx="520" cy="300" r="1.9" fill="white" fillOpacity="0.5" />
      <circle cx="600" cy="350" r="2.4" fill="white" fillOpacity="0.3" />
      <circle cx="700" cy="250" r="1.6" fill="white" fillOpacity="0.4" />
      <circle cx="780" cy="100" r="2.2" fill="white" fillOpacity="0.5" />
      <circle cx="650" cy="50" r="1.3" fill="white" fillOpacity="0.3" />
      <circle cx="550" cy="180" r="2.5" fill="white" fillOpacity="0.4" />
      <circle cx="480" cy="350" r="1.8" fill="white" fillOpacity="0.5" />
      <circle cx="350" cy="370" r="2.1" fill="white" fillOpacity="0.3" />
      <circle cx="230" cy="370" r="1.4" fill="white" fillOpacity="0.4" />
      <circle cx="80" cy="300" r="2.6" fill="white" fillOpacity="0.5" />
      <circle cx="20" cy="30" r="1.5" fill="white" fillOpacity="0.4" />
      <circle cx="30" cy="380" r="2.1" fill="white" fillOpacity="0.3" />
      <circle cx="780" cy="50" r="1.8" fill="white" fillOpacity="0.5" />
      <circle cx="790" cy="370" r="2.3" fill="white" fillOpacity="0.4" />
      <circle cx="770" cy="200" r="1.6" fill="white" fillOpacity="0.3" />
      <circle cx="10" cy="200" r="2.2" fill="white" fillOpacity="0.5" />
    </svg>
  );
}

function DiscountBanner({ copied, handleCopy }: { copied: boolean; handleCopy: () => void }) {
  return (
    <div>
      <h2 className="text-2xl md:text-4xl max-w-2xl mt-0 md:mt-12 font-bold"> ¿Listo para empezar? ¡Obtén 20% de descuento en tu primer mes! 🎉 </h2>
      <h2 className="text-2xl md:text-4xl max-w-2xl mt-4 font-bold">Usa el cupón:</h2>
      <div className="flex gap-2 text-brand-500 w-fit mt-4 md:mt-10 px-3 py-1 text-xl md:text-3xl rounded-lg font-bold border border-brand-500 border-dashed">
        <span>FORMMY20</span>
        <button onClick={handleCopy} aria-label="Copiar cupón" className="focus:outline-none">
          {copied ? <TbCheck /> : <TbCopy />}
        </button>
      </div>
    </div>
  );
}

export default function HomeFeaturedCards() {

  return (
    <section className="max-w-7xl mx-auto my-20 md:my-40 grid grid-cols-4 gap-8 px-4 md:px-[5%] xl:px-0">
      <FullBanner/>
      {/* Card pequeña 1 */}
      <FeaturedCard
        className="bg-[#f7f7fa] col-span-4 md:col-span-2 relative"
        title="Visita nuestro Blog"
        pattern={true}
        subtitle="Recursos"
        button={<Button className="bg-brand-500 ml-0 px-6 py-2 relative z-10" >&bull; Explorar</Button>}
      >
     <div className=" relative w-full h-full -top-24">
     <div className="w-64 h-80  bg-blue-400 -rotate-[8deg] rounded-lg absolute right-20 top-5 z-10 overflow-hidden "> 
      <img src="/home/blog.webp" alt="blog" className="w-full h-full object-cover"/>
     </div>
      <div className="w-52 h-80 rotate-[6deg] bg-[#B2E7CA] rounded-lg absolute right-0"></div>
     </div>
      </FeaturedCard>
      {/* Card pequeña 2 */}
      <FeaturedCard
        className="bg-[#EDC75A] text-white col-span-4 md:col-span-2 relative"
        title="Síguenos en redes sociales y entérate de las próximas actualizaciones"
        subtitle="Destacado"
        button={<a href="https://www.linkedin.com/company/formmyapp" target="_blank"><Button className="bg-white ml-0 text-[#23244a] px-6 py-2" variant="secondary">&bull; Seguir</Button></a>}
        icon={<span>♥️</span>}
        pattern={false}
      >
      <img className="scale-[3] absolute right-0" src="/home/mark.svg"/>
      </FeaturedCard>
    </section>
  );
}

export { DecorativeStarsBackground, DiscountBanner }; 