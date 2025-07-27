import { Form } from "react-router";
import { Button } from "../Button";
import { Meteors } from "./Meteors";
import { BigCTA } from "../BigCTA";

// @ Meteors require Banner to be wrapped in a Suspense!
export const Banner = () => {
  return (
    <section className="max-w-[90%] border-white/10 border-[1px]  xl:max-w-7xl w-full mx-auto rounded-[40px] bg-dark my-0 p-6 md:py-16 md:px-[10%] mb-10 md:mb-20 xl:px-[5%] relative overflow-hidden text-center">
      <h2 className="text-2xl lg:text-4xl font-bold !text-white">
        ¡Prueba Formmy! No te vas a arrepentir.
      </h2>
      <p className="text-lg lg:text-2xl text-white mt-6 max-w-4xl mx-auto  font-light text-white">
        Si tienes alguna duda, agenda un demo en línea para que nuestro equipo
        te muestre todo lo que puedes hacer con Formmy.
      </p>
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 mt-12 justify-center items-center dark">
        <a href="https://wa.me/527757609276?text=¡Hola!%20Quiero%agendar%20un%demo.">
          <Button className="w-full md:w-[180px] bg-clear text-dark mt-0 hover:scale-95 transition-all">
            Agendar demo
          </Button>
        </a>
      </div>
      <Meteors />
      <img
        alt="purple ghost"
        className="absolute -bottom-16 md:bottom-0"
        src="/assets/ghost-glasses.svg"
      />
    </section>
  );
};
