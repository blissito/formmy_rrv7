import React, { useState } from "react";
import { TbCopy, TbCheck } from "react-icons/tb";
import { Form } from "react-router";
import { BigCTA } from "~/components/BigCTA";
import { Button } from "~/components/Button";

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

function DiscountBanner({
  copied,
  handleCopy,
}: {
  copied: boolean;
  handleCopy: () => void;
}) {
  return (
    <div>
      <h2 className="text-2xl md:text-4xl max-w-2xl mt-0 md:mt-12 font-bold text-white">
        {" "}
        ¿Listo para empezar? ¡Obtén 20% de descuento en tu primer mes! 🎉{" "}
      </h2>
      <h2 className="text-2xl md:text-4xl max-w-2xl mt-4 font-bold text-white">
        Usa el cupón:
      </h2>
      <div className="flex gap-2  text-brand-500 w-fit mt-4 md:mt-10 px-3 py-1 text-xl md:text-3xl rounded-lg font-bold border border-brand-500 border-dashed">
        <span>FORMMY20</span>
        <button
          onClick={handleCopy}
          aria-label="Copiar cupón"
          className="focus:outline-none"
        >
          {copied ? <TbCheck /> : <TbCopy />}
        </button>
      </div>
    </div>
  );
}

export const FullBanner = () => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText("FORMMY20");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="col-span-4 h-[400px] md:h-[400px] flex flex-col bg-[#15191E] flex flex-col md:flex-row rounded-3xl py-8 px-6 md:px-12 relative overflow-hidden ">
      {/* Fondo de estrellas decorativas */}
      <DecorativeStarsBackground />
      <DiscountBanner copied={copied} handleCopy={handleCopy} />
      <div className="absolute bottom-0 -right-14 md:right-0 z-10 flex gap-2 md:gap-4 w-auto h-auto">
        <img className="h-[180px] md:h-[400px]" src="/home/figures.svg" />
      </div>
    </div>
  );
};

export const AiBanner = () => {
  return (
    <div className="col-span-4 h-[500px] w-full md:h-[400px] flex flex-col bg-dark text-white md:flex-row rounded-3xl py-8 px-6 md:px-12 relative overflow-hidden ">
      {/* Fondo de estrellas decorativas */}
      <DecorativeStarsBackground />
      <div>
        <h2 className="text-2xl md:text-4xl max-w-2xl mt-0 md:mt-12 font-bold">
          ¡Empieza gratis hoy mismo! 🎉{" "}
        </h2>
        <h2 className="text-2xl md:text-4xl max-w-2xl mt-4 font-bold">
          Crea una cuenta y prueba Formmy Chat por 30 días
        </h2>
        <Form method="post" className="mt-10 mx-auto md:mx-0" action="/api/login">
          <BigCTA type="submit" name="intent" value="google-login" ><p className="!text-base heading">Probar por 30 días</p></BigCTA>
        </Form>
      </div>
      <div className="absolute -bottom-10 md:bottom-0 right-0 z-10 flex gap-2 md:gap-4 w-auto h-auto">
        <img className="h-[240px] md:h-[400px]" src="/home/figures.svg" />
      </div>
    </div>
  );
};

export const DemoBanner = () => {
  return (
    <div className="col-span-4 h-[500px] w-full text-white md:h-[400px] flex flex-col bg-dark flex flex-col md:flex-row rounded-3xl py-8 px-6 md:px-12 relative overflow-hidden ">
      {/* Fondo de estrellas decorativas */}
      <DecorativeStarsBackground />
      <div>
        <h2 className="text-2xl md:text-4xl max-w-2xl mt-0 md:mt-12 font-bold">
          ¡Prueba Formmy! No te vas a arrepentir.{" "}
        </h2>
        <h2 className="text-lg md:text-2xl max-w-2xl mt-4 font-light text-lightgray">
          Si tienes alguna duda, agenda un demo en línea para que nuestro equipo
          te muestre todo lo que puedes hacer con Formmy.
        </h2>
        <a
          href="https://wa.me/527757609276?text=¡Hola!%20Quiero%20agendar%20un%20demo."
          target="_blank"
        >
          <Button variant="secondary" className="ml-0 mt-10">
            Agendar demo
          </Button>
        </a>
      </div>
      <div className="absolute -bottom-16 md:bottom-10 right-10 md:right-24 z-10 flex gap-2 md:gap-4 w-auto h-auto">
        <img className="h-[260px] md:h-[320px]" src="/home/ghosty.svg" />
      </div>
    </div>
  );
};
