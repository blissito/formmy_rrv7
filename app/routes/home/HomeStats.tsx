import React from "react";
const imgFaceSmile = "/home/projects.svg";
const imgAddAnchorPointTool = "/home/smile.svg";
const imgWandTool = "/home/magic.svg";

export default function HomeStats() {
  return (
    <section className="flex flex-col items-center gap-0 my-20 md:my-40">
      <h2 className="heading font-bold text-[#080923] text-3xl md:text-4xl lg:text-6xl text-center mb-10 md:mb-16 mt-0 leading-tight">
        Nuestro viaje hasta ahora
      </h2>
      <div className="flex flex-wrap md:flex-nowrap justify-center text-center w-full gap-10 md:gap-16">
        <div className="flex flex-col items-center justify-center  ">
          <img src={imgFaceSmile} alt="face smile" className="w-16 h-16 md:h-20 md:w-20" />
          <span className="heading font-bold text-[#080923] text-7xl md:text-[100px] mb-0 mt-6 pb-0">+1,000</span>
          <span className="paragraph text-gray-600 text-xl md:text-2xl mt-0 ">Usuarios</span>
        </div>
        <div className="flex flex-col items-center justify-center ">
          <img src={imgAddAnchorPointTool} alt="add anchor point" className="w-16 h-16 md:h-20 md:w-20" />
          <span className="heading font-bold text-[#080923] text-7xl md:text-[100px] mb-0 mt-6 pb-0">95%</span>
          <span className="paragraph text-gray-600 text-xl md:text-2xl mt-0 ">Usuarios recomiendan Formmy</span>
        </div>
        <div className="flex flex-col items-center justify-center ">
          <img src={imgWandTool} alt="wand tool" className="w-16 h-16 md:h-20 md:w-20" />
          <span className="heading font-bold text-[#080923] text-7xl md:text-[100px] mb-0 mt-6 pb-0">+1,500</span>
          <span className="paragraph text-gray-600 text-xl md:text-2xl mt-0 ">Proyectos creados</span>
        </div>
      </div>
    </section>
  );
} 