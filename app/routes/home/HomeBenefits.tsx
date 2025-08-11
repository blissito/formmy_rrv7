import React from "react";

import { MdOutlineIntegrationInstructions } from "react-icons/md";
import { IoColorPaletteOutline } from "react-icons/io5";
import { RiChatAiLine } from "react-icons/ri";
import { PiUserFocusBold } from "react-icons/pi";
import { LuRocket } from "react-icons/lu";
import { cn } from "~/lib/utils";

export function BenefitCard({
  color,
  title,
  desc,
  icon,
}: {
  color: string;
  title: string;
  desc: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative bg-slate-100 w-full my-2 md:my-4 h-fit lg:h-[124px] py-4 lg:py-0 rounded-3xl items-center justify-between px-4 lg:px-8 gap-4 md:gap-6 grid grid-cols-12">
      <div className="flex gap-4 col-span-12 md:col-span-4 items-center">
        <div
          className={cn(
            "w-12 h-12 md:min-w-16 md:min-h-16 text-4xl rounded-xl bg-white flex items-center justify-center text-black",
            color
          )}
        >
          {icon}
        </div>
        <h3 className="heading font-bold text-dark text-xl md:text-2xl ">
          {title}
        </h3>
      </div>
      <p className="paragraph text-metal text-base md:text-xl leading-tight col-span-12 md:col-span-8">
        {desc}
      </p>
    </div>
  );
}

export default function HomeBenefits() {
  const benefits = [
    {
      color: "bg-[#c4b9f9]",
      icon: <MdOutlineIntegrationInstructions />,
      title: "Súper fácil de integrar",
      desc: "Olvídate de instalaciones complicadas. Solo copia y pega el código en tu web y listo, el formulario y el chat IA estarán listos para atender a tus clientes.",
    },
    {
      color: "bg-[#f4b9e7]",
      icon: <IoColorPaletteOutline />,
      title: "Personalizable",
      desc: "Colores, textos y estilos que combinan con tu marca. Haz que el formulario y el chat se vean como parte de tu sitio, no como algo pegado.",
    },
    {
      color: "bg-[#b2e7ca]",
      icon: <RiChatAiLine />,
      title: "Chat IA que conversa como tú lo harías",
      desc: "Responde preguntas comunes, guía a tus visitantes y capta leads automáticamente, sin que tengas que estar conectado todo el día.",
    },
    {
      color: "bg-[#edc75a]",
      icon: <PiUserFocusBold />,
      title: "Capta más clientes, sin perder mensajes",
      desc: "Recibe todas las respuestas en tu correo o dashboard. Nada se pierde, nada se queda sin responder.",
    },
    {
      color: "bg-[#bbf0ff]",
      icon: <LuRocket />,
      title: "Todo en un solo lugar",
      desc: "Gestiona tus formularios y chat desde el mismo panel. Ve tus mensajes, edita tus formularios y ajusta tu chat IA en minutos.",
    },
  ];
  return (
    <section className="flex flex-col items-center mt-20 md:mt-40 max-w-7xl mx-auto px-4 md:px-[5%] xl:px-0">
      <h2 className="heading font-bold text-[#080923] text-3xl md:text-4xl lg:text-6xl text-center mb-4 mt-0 leading-tight">
        Beneficios que notarás desde el primer día
      </h2>
      <p className="paragraph text-gray-600 font-light text-lg md:text-xl md:text-2xl text-center mb-10 md:mb-16">
        Más simple, más rápido y sin complicaciones técnicas.
      </p>
      {benefits.map((b, i) => (
        <BenefitCard key={i} {...b} />
      ))}
    </section>
  );
}
