import { motion } from "framer-motion";
import React from "react";
import HomeHeader from "./HomeHeader";
import HomeProducts from "./HomeProducts";
import HomeBenefits from "./HomeBenefits";
import HomeDemos from "./HomeDemos";
import HomeTestimonials from "./HomeTetsimonials";
import HomeStats from "./HomeStats";
import HomeFeaturedCards from "./HomeFeaturedCard";
import HomeCallToAction from "./HomeCallToAction";
import HomeFooter from "./HomeFooter";
import HomeHero from "./HomeHero";
import { HomeFeatures } from "./HomeFeatures";
import { Quote } from "./Quote";

export function SectionFadeIn({
  children,
  delay = 0,
}: React.PropsWithChildren<{ delay?: number }>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay }}
    >
      {children}
    </motion.div>
  );
}

export function Home() {
  return (
    <div
      className="bg-[#ffffff] relative size-full "
      data-name="Landingpage"
      id="node-1488_1172"
    >
      <HomeHeader />
        <HomeHero />
      <SectionFadeIn delay={0.2}>
        <HomeFeatures />
      </SectionFadeIn>
      <SectionFadeIn delay={0.2}>
        <Quote/>
      </SectionFadeIn>
      <SectionFadeIn delay={0.3}>
        <HomeBenefits />
      </SectionFadeIn>
      <SectionFadeIn delay={0.4}>
        <HomeDemos />
      </SectionFadeIn>
      <SectionFadeIn delay={0.5}>
        <HomeTestimonials />
      </SectionFadeIn>
      <SectionFadeIn delay={0.6}>
        <HomeStats />
      </SectionFadeIn>
      <SectionFadeIn delay={0.7}>
        <HomeFeaturedCards />
      </SectionFadeIn>
      <HomeCallToAction />
      <HomeFooter />
    </div>
  );
}
