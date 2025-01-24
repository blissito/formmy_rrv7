import { ScrollReveal } from "~/routes/_index";
import { PriceCards } from "../PriceCards";

export const Pricing = () => {
  return (
    <section className="px-[5%] lg:px-0 lg:max-w-6xl max-w-3xl mx-auto text-center py-20 lg:py-[160px]">
      <h2 className=" text-dark dark:text-white text-3xl lg:text-5xl font-bold text-center">
        Escoge tu plan
      </h2>
      <p className=" text-lg md:text-xl lg:text-2xl font-extralight mt-6  text-gray-600 dark:text-space-400">
        Empieza a usar Formmy sin pagar nada. Cambia al Plan{" "}
        <strong>PRO</strong> cuando lo necesites.
      </p>
      <ScrollReveal>
        <PriceCards />
      </ScrollReveal>
    </section>
  );
};
