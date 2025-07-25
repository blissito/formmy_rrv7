import React from "react";
import { PriceCards } from "../components/PriceCards";
import HomeHeader from "./home/HomeHeader";
import { SectionFadeIn } from "./home/home";
import { PricingCards } from "~/components/PricingCards";
import { Banner } from "~/components/home/Banner";
import { Faq } from "~/components/home/Faq";
import { Join } from "~/components/home/Join";
import HomeFooter from "./home/HomeFooter";
import HomeCallToAction, { GeneralCallToAction } from "./home/HomeCallToAction";
import { AiBanner, DemoBanner } from "./home/FullBanner";

export default function Planes() {
  return (
    <section className="bg-clear pt-40 md:pt-64 overflow-hidden">
        <HomeHeader />
     <section className="flex flex-col items-center max-w-7xl px-4 md:px-[5%] xl:px-0 mx-auto ">
      <h1 className="heading font-bold text-dark text-3xl md:text-4xl lg:text-6xl text-center mb-4 mt-0 lg:leading-[1.2]">
        Elige el plan perfecto para ti
      </h1>
      <p className="paragraph text-gray-600 font-light text-lg md:text-xl md:text-2xl text-center mb-10 md:mb-20">
      Empieza a usar Formmy sin pagar nada. Puedes cambiar de Plan cuando lo necesites.
      </p>
      <PricingCards />
    </section> 
    <section className="max-w-7xl w-full mx-auto  my-20 md:my-40 px-4 md:px-[5%] xl:px-0">
        <DemoBanner/> 
      </section>
    <Faq />
    <GeneralCallToAction/>
    <HomeFooter/>
 </section>
  );
} 