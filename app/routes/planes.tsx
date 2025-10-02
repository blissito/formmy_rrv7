import HomeHeader from "./home/HomeHeader";
import { PricingCards } from "~/components/PricingCards";
import { PricingComparisonTable } from "~/components/PricingComparisonTable";
import { Faq } from "~/components/home/Faq";
import HomeFooter from "./home/HomeFooter";
import { GeneralCallToAction } from "./home/HomeCallToAction";
import { DemoBanner, FullBanner } from "./home/FullBanner";
import getBasicMetaTags from "~/utils/getBasicMetaTags";


export const meta = () =>
  getBasicMetaTags({
    title: "Planes y Precios | Formmy",
    description:
      "Elige el plan que mejor se adapte a ti.",
  });

export default function Planes() {
  return (
    <section className="bg-clear pt-32 pb-0 md:pt-40 lg:pt-64  overflow-hidden">
      <HomeHeader />
      <section className="flex flex-col items-center  px-4 md:px-[5%] xl:px-0 mx-auto ">
        <h1 className="heading font-bold text-dark text-3xl md:text-4xl lg:text-6xl text-center mb-4 mt-0 lg:leading-[1.2]">
          Elige el plan perfecto para ti
        </h1>
        <p className="paragraph text-metal font-light text-lg md:text-xl md:text-2xl text-center mb-10 lg:mb-20">
          Empieza a usar Formmy sin pagar nada. Puedes cambiar de Plan cuando lo
          necesites.
        </p>
        <PricingCards />
      </section>
      <section className="max-w-7xl w-full mx-auto  my-16 md:my-32 px-4 md:px-[5%] xl:px-0">
        <FullBanner />
      </section>
      <PricingComparisonTable />
      <Faq />
      <GeneralCallToAction />
      <HomeFooter />
    </section>
  );
}
