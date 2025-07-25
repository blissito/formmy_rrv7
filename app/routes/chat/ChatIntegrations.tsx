import { FaReact } from "react-icons/fa";
import { BenefitCard } from "../home/HomeBenefits";
import { cn } from "~/lib/utils";

export const ChatIntegrations = () => {
    return (
      <section className="flex flex-col items-center mt-20 md:mt-40 max-w-7xl mx-auto px-4 md:px-[5%] xl:px-0">
        <h2 className="heading font-bold text-[#080923] text-3xl md:text-4xl lg:text-6xl text-center mb-4 mt-0 leading-tight">
          Fácil de integrar
        </h2>
        <p className="paragraph text-gray-600 font-light text-lg md:text-xl xl:text-2xl text-center mb-10 md:mb-16">
          Más simple, más rápido y sin complicaciones técnicas.
        </p>
        <div className="w-full grid grid-cols-12 gap-12">
          <SquareCard
            color="bg-red-500"
            title="Powerful privacy controls"
            desc="   Lorem ipsum dolor sit amet consectetur adipisicing elit. Expedita mollitia consequuntur aliquid animi maiores saepe doloribus, nisi quia doloremque maxime error reprehenderit laudantium."
            icon={<FaReact />}
          />
          <SquareCard
            color="bg-red-500"
            title="Powerful privacy controls"
            desc="   Lorem ipsum dolor sit amet consectetur adipisicing elit. Expedita mollitia consequuntur aliquid animi maiores saepe doloribus, nisi quia doloremque maxime error reprehenderit laudantium."
            icon={<FaReact />}
          />
          <SquareCard
            color="bg-red-500"
            title="Powerful privacy controls"
            desc="   Lorem ipsum dolor sit amet consectetur adipisicing elit. Expedita mollitia consequuntur aliquid animi maiores saepe doloribus, nisi quia doloremque maxime error reprehenderit laudantium."
            icon={<FaReact />}
          />
        </div>
        <div className="flex flex-col gap-4 mt-8">
          <BenefitCard
            color="bg-red-500"
            title="Powerful privacy controls"
            desc="   Lorem ipsum dolor sit amet consectetur adipisicing elit. Expedita mollitia consequuntur aliquid animi maiores saepe doloribus, nisi quia doloremque maxime error reprehenderit laudantium."
            icon={<FaReact />}
          />
          <BenefitCard
            color="bg-red-500"
            title="Powerful privacy controls"
            desc="   Lorem ipsum dolor sit amet consectetur adipisicing elit. Expedita mollitia consequuntur aliquid animi maiores saepe doloribus, nisi quia doloremque maxime error reprehenderit laudantium."
            icon={<FaReact />}
          />
          <BenefitCard
            color="bg-red-500"
            title="Powerful privacy controls"
            desc="   Lorem ipsum dolor sit amet consectetur adipisicing elit. Expedita mollitia consequuntur aliquid animi maiores saepe doloribus, nisi quia doloremque maxime error reprehenderit laudantium."
            icon={<FaReact />}
          />
        </div>
      </section>
    );
  };
  
  function SquareCard({
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
      <div className="flex flex-col  col-span-4 justify-start items-start bg-slate-100 p-8 rounded-3xl">
        <div
          className={cn(
            "w-12 h-12 md:min-w-16 md:min-h-16 text-4xl mb-6 rounded-xl bg-white flex items-center justify-center text-black",
            color
          )}
        >
          {icon}
        </div>
        <h3 className="heading font-bold text-[#080923] text-2xl mb-2 ">
          {title}
        </h3>
        <p className="paragraph text-gray-600 text-lg col-span-12 mt-0 md:col-span-8">
          {desc}
        </p>{" "}
      </div>
    );
  }
  
  