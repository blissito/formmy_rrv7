import type { ReactNode } from "react";
import { BsQuestion } from "react-icons/bs";
import { CgWebsite } from "react-icons/cg";
import { HiOutlineDocumentText } from "react-icons/hi";
import { TbWritingSign } from "react-icons/tb";
import { cn } from "~/lib/utils";
import { IAModelCard } from "./IAModels";

export const ChatBenefits = () => {
    return (
      <section
        id="cards"
        className="w-full max-w-7xl mx-auto  py-16 lg:py-32  px-4"
      >
        <h2 className="text-3xl md:text-4xl lg:text-5xl  font-bold text-center mb-10 md:mb-16 text-dark">
          Por qué debes probar Formmy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <BentoCard className="col-span-1 md:col-span-2 flex flex-col justify-between p-6 md:p-8 relative bg-bird">
               <div 
                 style={{
                     transformStyle: 'preserve-3d' as const,
                     perspective: "1500px"
                 }}
                 className="grid grid-cols-4 gap-8 md:gap-4 lg:gap-8 mt-8 mx-auto px-4">
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

                 </div>
            <div>
              <h2 className="text-2xl heading ">
          Usa los mejores modelos de IA
              </h2>
              <p className="text-dark">
              Nuestros agentes utilizan modelos de inteligencia artificial de última generación para ofrecer respuestas precisas y naturales.
              </p>
            </div>
          </BentoCard>
          <BentoCard className=" col-span-1 p-6 md:p-8 flex flex-col  min-h-[280px] justify-between overflow-hidden bg-cloud">
            <div className="flex items-center justify-center relative">
              {/* Línea punteada circular de fondo */}
              <svg
                width="260"
                height="260"
                viewBox="0 0 260 260"
                fill="none"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
              >
                <circle
                  cx="130"
                  cy="130"
                  r="120"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="6 8"
                  fill="none"
                />
              </svg>
              {/* Editor arriba izquierda */}
              <div className="absolute left-[10px] top-[100px] bg-clear rounded-xl border border-gray-200 shadow px-4 py-2 flex gap-2 items-center text-gray-700 text-xl">
                <span className="font-bold">B</span>
                <span className="italic">I</span>
                <span className="underline">U</span>
                <span className="line-through">S</span>
              </div>
              {/* Paleta arriba derecha */}
              <div className="absolute -right-[10px] top-[60px] bg-clear rounded-xl border border-gray-200 shadow px-4 py-2 flex gap-[-8px] items-center">
                <span
                  className="inline-block w-6 h-6 rounded-full"
                  style={{
                    background: "linear-gradient(135deg, #1abc9c, #2ecc71)",
                  }}
                ></span>
                <span
                  className="inline-block w-6 h-6 rounded-full -ml-2"
                  style={{
                    background: "linear-gradient(135deg, #2ecc71, #f1c40f)",
                  }}
                ></span>
                <span
                  className="inline-block w-6 h-6 rounded-full -ml-2"
                  style={{
                    background: "linear-gradient(135deg, #f1c40f, #e1ff00)",
                  }}
                ></span>
              </div>
              {/* Reply with AI abajo izquierda */}
              <div className="absolute left-[12%] -top-[20px] bg-clear rounded-xl border border-gray-200 shadow px-4 py-2 flex items-center gap-2 text-dark">
                <span className="text-lg">✨</span>
                <span className="font-medium">Responder con IA</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl heading ">Es rápido y simple</h2>
              <p className="text-dark">
                Crea, administra e implementa agentes de IA fácilmente.
              </p>{" "}
            </div>
          </BentoCard>
          <BentoCard className="overflow-hidden bg-[#F4B9E7]">
            <h2 className="text-3xl leading-[1.4] heading p-6 md:p-8 ">
              +50% de empresas en México planea integrar IA en los próximos 1 a 2
              años
            </h2>
          </BentoCard>
          <BentoCard className="p-6 md:p-8 bg-[#BFDD78]">
            <div className="flex flex-col gap-6 items-start justify-center w-full pb-6">
              {/* Mensaje usuario */}
              <div className="flex justify-end w-full">
                <div className="bg-dark text-white font-light border border-gray-200 rounded-2xl px-3 py-2 flex items-center gap-3 shadow-sm">
                  <span className="text-white">
                    Hola, no puedo acceder a mi cuenta y ya seguí los pasos
                  </span>
                  <img
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="user"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </div>
              </div>
              {/* Mensaje IA */}
              <div className="flex justify-start w-full">
                <div className="bg-white rounded-2xl px-3 py-2 flex items-center gap-3 shadow-sm">
                  <span className="inline-flex items-center justify-center min-w-8 min-h-8 rounded-full bg-brand-500 text-clear text-lg">
                    ✨
                  </span>
                  <span className="text-gray-800">
                    Un asesor se pondrá en contacto contigo!
                  </span>
                </div>
              </div>
            </div>
            <h2 className="text-2xl heading mt-0">Busca eficiencia</h2>
            <p className="text-dark">
              Enseña a tu agente cuándo escalar consultas a un agente humano.
            </p>
          </BentoCard>
          <BentoCard className="p-6 md:p-8 bg-[#E56565]">
            <div className="w-full flex flex-col items-center justify-center relative overflow-hidden">
              <img
                src="https://randomuser.me/api/portraits/women/44.jpg"
                alt="Sandra Jones"
                className="w-24 h-24 rounded-full object-cover mb-4"
              />
              <div className="text-xl font-semibold text-gray-900">
                Sandra Cuevas
              </div>
              <div className="w-full flex flex-col gap-2 mt-2">
                <div className="h-4 bg-white/20 rounded-full w-4/5 mx-auto" />
              </div>
            </div>
            <h2 className="text-[22px] heading mt-10">
              {" "}
              69% de los usuarios prefieren hablar con un chatbot
            </h2>
          </BentoCard>
          <BentoCard className="col-span-1 md:col-span-2 p-6 md:p-8 bg-[#C4B9F9]">
            <div className="grid grid-cols-12 gap-3">
              <div className="bg-white border text-dark  h-10 rounded-full flex items-center gap-2 pl-1 pr-2 w-fit col-span-12 ">
                <div className="w-8 h-8 bg-[#BBF0FF] rounded-full flex items-center justify-center">
                  <TbWritingSign />
                </div>
                Lenguaje natural (escribe directamente la información)
              </div>
  
              <div className="bg-white border text-dark  h-10 rounded-full flex items-center gap-2 pl-1 pr-2 w-fit col-span-8 col-start-3">
                <div className="w-8 h-8 bg-[#EDC75A] rounded-full flex items-center justify-center">
                  <CgWebsite />
                </div>
                Sitios web (tu propio website)
              </div>
  
              <div className="bg-white border text-dark  h-10 rounded-full flex items-center gap-2 pl-1 pr-2 w-fit col-span-8 col-start-5">
                <div className="w-8 h-8 bg-[#F4B9E7] rounded-full flex items-center justify-center">
                  <BsQuestion />
                </div>
                Preguntas específicas
              </div>
              <div className="bg-white border text-dark  h-10 rounded-full flex items-center gap-2 pl-1 pr-2 w-fit col-span-8 col-start-7">
                <div className="w-8 h-8 bg-[#B2E7CA] rounded-full flex items-center justify-center">
                  <HiOutlineDocumentText />
                </div>
                Documentos pdf, doc, csv
              </div>
            </div>
            <h2 className="text-2xl heading mt-8">Es muy fácil de entrenar</h2>
            <p className="text-dark">
              Integra diversas fuentes de información para enriquecer el
              conocimiento y las capacidades de tus agentes.
            </p>
          </BentoCard>
        </div>
      </section>
    );
  };
  

  const BentoCard = ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => {
    return (
      <div
        className={cn(
          "border border-gray-300/50 rounded-2xl bg-clear min-h-fit md:min-h-[340px] text-dark bg-outlines/20",
          className
        )}
      >
        {children}
      </div>
    );
  };