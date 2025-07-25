import React from "react";
import { Button } from "~/components/Button";
import { cn } from "~/lib/utils";

const imgImage1 = "/home/video1.gif";
const imgGroup = "http://localhost:3845/assets/ce66d90ade7e8f78c3d31e2a40faa4298fd1fe82.svg";

function ProductCard({ bg, title, desc, img, icon, svgPattern, patternClassName }: { bg: string; title: string; desc: string; img: string; icon: string; svgPattern?:string, patternClassName: string }) {
  return (
    <div className={`relative w-full h-[380px] lg:h-[580px] mb-6 mt-0 md:mt-16 rounded-[40px] flex flex-wrap md:fles-nowrap items-center ${bg} overflow-hidden sticky top-20 z-10`}>
      
      <img className={cn("absolute right-0 bottom-0 z-0 w-[50%] md:w-[auto] ", patternClassName)} src={svgPattern} alt="pattern"/>
      <div className="p-6 md:p-12 w-full md:w-[60%] relative z-[1]">
        <img className="mb-2 md:mb-6 w-12 md:w-22" alt="icon" src={icon}/>
        <h3 className="heading font-bold text-black text-3xl md:text-4xl lg:text-5xl mb-4">{title}</h3>
        <p className="paragraph text-neutral-900 text-lg md:text-2xl lg:text-3xl leading-6   lg:leading-10 mb-0 md:mb-8 ">{desc}</p>
        <Button variant="white" className=" !bg-dark/10 border-none ml-0 mt-4">
          Ver más
        </Button>
      </div>
      <div className="flex-1 w-[40%] flex justify-center items-center h-full relative z-10 ">
        <img src={img} alt={title} className="h-[80%] rounded-2xl object-cover" />
      </div>
    </div>
  );
}

export default function HomeProducts() {
  const products = [
    {
      svgPattern:"/home/ribbon-1.png",
      icon:"/icon-2.svg",
      bg: "bg-[#edc75a]",
      title: "Formularios de contacto",
      desc: "Recibe mensajes de tus clientes sin perder ni uno solo. Personaliza campos, colores, tema y tipografía manualmente o con nuestro asistente IA.",
      img: imgImage1,
    },
    {
      patternClassName:"!top-0",
      svgPattern:"/home/ribbon-2.svg",
      icon:"/icon-1.svg",
      bg: "bg-[#79bc97]",
      title: "Formularios de suscripción",
      desc: "Convierte visitantes en suscriptores con formularios atractivos y fáciles de usar. Conecta con tu newsletter y haz crecer tu comunidad automáticamente.",
      img: imgImage1,
    },
    {
      svgPattern:"/home/ribbon-3.svg",
      icon:"/icon-3.svg",
      bg: "bg-[#9a99ea]",
      title: "Chat IA para tu negocio",
      desc: "Automatiza la atención y soporte con agentes inteligentes que responden 24/7. Mejora la experiencia de tus usuarios y ahorra tiempo en tu operación.",
      img: imgImage1,
    },
  ];
  return (
    <section className="flex flex-col items-center  max-w-7xl px-4 md:px-[5%] xl:px-0 mx-auto -mt-32 md:-mt-20">
      <h2 className="heading font-bold text-[#080923] text-3xl md:text-4xl lg:text-6xl text-center mb-4 mt-0 lg:leading-[1.2]">
        ¿Cansado de perder clientes por formularios rotos o chats complicados?
      </h2>
      <p className="paragraph text-gray-600 font-light text-lg md:text-xl md:text-2xl text-center mb-16">
        Agrega un chat que responde solo y formularios que sí funcionan. Fácil y rápido.
      </p>
      {products.map((p, i) => (
        <ProductCard key={i} {...p} />
      ))}
    </section>
  );
} 