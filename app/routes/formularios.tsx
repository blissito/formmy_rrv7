import React, { useState, useEffect } from "react";
import HomeHeader from "./home/HomeHeader";
import { StickyScroll } from "~/components/ui/sticky-scroll-reveal";
import HomeFooter from "./home/HomeFooter";
import { GeneralCallToAction } from "./home/HomeCallToAction";
import { motion, AnimatePresence } from "framer-motion";
import { CompaniesScroll } from "~/components/home/CompaniesScroll";

import { WitoutFormmy } from "~/components/home/WithoutFormmy";
import { FullBanner } from "./home/FullBanner";
import { Registration, Suscription } from "~/components/home/FormmysTypes";
import { Steper } from "~/components/Steper";

function CardDemoIA({ gradient, content, title, description }: {
  gradient: string;
  content?: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className={`flex-1  `}>
      <div className={` rounded-3xl p-8 flex flex-col items-center shadow-lg  h-[320px] relative overflow-hidden ${gradient}`}>
    {content}
      </div>
      <h3 className="font-bold text-2xl text-center mb-2 text-dark mt-8">{title}</h3>
      <p className="text-gray-700 text-center text-lg">{description}</p>
    </div>
  );
}

export default function Formularios() {
  const [selectedStep, setSelectedStep] = useState(0);
  const stepsWithImages = [
    {
      title: "Crea un proyecto",
      desc: "Ve a tu Dashboard y da clic en la pestaña de «Formmys».",
      image: "/home/form-steper-1.png",
    },
    {
      title: "Selecciona el tipo de Formmy",
      desc: " Da clic en «+ Formmy», bautiza tu primer Formmy y elige el tipo de Formmy que necesitas: formulario de contacto y de suscripción.",
      image: "/home/form-steper-2.png",
    },
    {
      title: "Personaliza tus campos, colores y estilos",
      desc: "Activa o agrega los campos para tu Formmy, personaliza el tema, el color principal y el estilo de tus inputs.",
         image: "/home/form-steper-3.png",
    },
    {
      title: "Escribe el mensaje final",
      desc: "Ponle tu estilo al mensaje que verán tus usuarios al completar el formulario.",
         image: "/home/form-steper-4.png",
    },
    {
      title: "Copia y pega en tu HTML o JSX",
      desc: "Formmy es compatible con cualquier lenguaje, así que solo tienes que copiar una línea de código y pegarla en tu proyecto. ¡Y listo! ¡Empieza a recibir mensajes de tus clientes!",
         image: "/home/form-steper-5.png",
    },
  ];

  // Cambio automático de step cada 10 segundos
  // useEffect y setSelectedStep ya no son necesarios aquí

  return (
    <main className="bg-clear pt-40 md:pt-64 overflow-hidden">
      <HomeHeader/>
      <section className="max-w-4xl mx-auto px-4 md:px-[5%] xl:px-0">
      <h1 className="heading font-bold text-dark text-3xl md:text-4xl lg:text-6xl text-center mb-4 mt-0 lg:leading-[1.2]">Formmys para tu sitio web</h1>
      <p className="paragraph text-gray-600 font-light text-lg md:text-xl md:text-2xl  text-center mb-4 md:mb-0">
          Crea formularios personalizados para tu sitio web, recopila información de tus usuarios y gestiona tus datos de manera sencilla y segura con Formmy.
        </p>
      </section>
      <section>
        <div className="flex flex-col items-center  max-w-7xl mx-auto w-full mb-0 md:mb-10 px-4 md:px-[5%] xl:px-0">
              <div className="flex  flex-col md:flex-row items-center justify-around w-full gap-10 md:gap-20 relative">
                <div className="relative z-10 rotate-0 md:-rotate-3  ">
                <Suscription  />
                <div className="absolute left-0 bottom-16 rotate-45 w-52 h-52 bg-brand-100 rounded-3xl -z-10" />
                </div>
                {/* Imagen central */}
                <div className="relative z-10 rotate-0 md:rotate-3 hidden md:block ">
                  <Registration  />
                  <div className="absolute left-1/2 top-40 rotate-45 w-52 h-52 bg-brand-100 rounded-3xl -z-10" />
                </div>
              </div>
            </div>
      </section>
   <CompaniesScroll/>
      <section id="cards" className="w-full max-w-7xl mx-auto my-20 md:my-40 px-4">
        <h2 className="text-3xl md:text-4xl lg:text-5xl  font-bold text-center mb-10 md:mb-16 text-dark">Por qué debes probar Formmy</h2>
        <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
          <CardDemoIA
            gradient="bg-[#FBE05D]"
            content={
             <div>
              <img className="h-[70%]" src="/home/bento1.png"/>
              </div>
            }
         
            title="Compatible con cualquier framework"
            description="Formmy es compatible con cualquier framework, puedes agregarlo a tu sitio web usando el SDK, el iframe o el link directo."
          />
          <CardDemoIA
            gradient="bg-[#76D3CB]"
            content={
              <div className="w-full h-full grid place-content-center">
                 <img className="h-full" src="/home/bento2.png"/>
               </div>
             }
          
            title="Fácil y rápido de configurar"
            description="Crea tu Formmy en menos de 5 minutos, sin código, sin complicaciones y sin tecnicismos. Solo unos clics y listo."
          />
          <CardDemoIA
            gradient="bg-[#DF7CB0]"
            content={
              <div className="w-full h-full absolute left-10 top-0 grid place-content-center">
              <img className="!w-[180%]" src="/home/bento3.png"/>
            </div>
             }
            title="Personlizable"
            description="Olvídate de los formularios genéricos. Con Formmy personaliza los campos, colores y estilo para que todo refleje tu marca."
          />
        </div>
      </section>
      <WitoutFormmy />
      <section className="max-w-7xl mx-auto my-20 md:my-40 grid grid-cols-4 gap-8 px-4 md:px-[5%] xl:px-0">
             <FullBanner/> 
      </section>
      <section id="steper" className="w-full md:min-h-fit max-w-7xl mx-auto my-20 md:my-40 px-4 md:px-[5%] xl:px-0 min-h-[700px]">
      <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-dark">Crea tu primer Formmy con un par de clics</h3>
        <Steper
          steps={stepsWithImages.map(({ title, desc }) => ({ title, desc }))}
          renderRight={(selectedStep) => (
           
              <img
                src={stepsWithImages[selectedStep].image}
                alt={stepsWithImages[selectedStep].title}
                className=" max-h-fit md:max-h-[400px] max-w-full object-contain rounded-2xl shadow-lg"
              />
          
          )}
          autoAdvanceMs={10000}
        />
      </section>

      <GeneralCallToAction/>
      <HomeFooter/>
    </main>
  );
} 