import type { ReactNode } from "react";
import { GradientButton } from "./ui/GradientButton";
import { motion } from "motion/react";

export const PricingCard = ({
  plan,
  isDisable,
  name,
  button,
  cta = "Comienza gratis",
  isLoading,
  description,
  benefits,
  price,
  image,
  onClickButton,
}: {
  plan?: string;
  isDisable?: boolean;
  image?: string;
  button?: ReactNode;
  cta?: string;
  isLoading?: boolean;
  onClickButton?: () => void;
  description: any;
  name: any;
  benefits: any;
  price: any;
}) => {
  return (
    <motion.div
      className="box max-w-[360px] w-full grow"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: 0.2,
        ease: [0, 0.71, 0.2, 1.01],
      }}
    >
      <div
        style={{
          backgroundImage: `url(${image})`,
          backgroundPosition: "bottom",
          backgroundRepeat: "no-repeat",
        }}
        className="bg-[#fff] dark:bg-dark  border-solid border-[1px] dark:border-lightgray rounded-xl w-full border-iman   py-[32px] px-6 text-left "
      >
        <h3 className="text-2xl font-bold dark:text-[#e5e7eb] text-[#0F1017]">
          {name}
        </h3>
        <p className="text-space-500 dark:text-space-400 mb-4 font-light">
          {description}
        </p>
        <p>
          {" "}
          <span className="text-4xl font-bold dark:text-white text-space-800">
            $ {price}{" "}
          </span>
          <span className="text-lg text-space-500 dark:text-space-400">
            {" "}
            USD / mes
          </span>
        </p>
        <hr className="my-6 bg-[#EDEDF1] dark:bg-lightgray h-[1px] border-none" />
        <div className="h-[300px]">
          {benefits.map(({ emoji, title }: { emoji: any; title: any }) => {
            return (
              <div key={title} className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{emoji}</span>
                <h4 className="text-space-500 font-light dark:text-space-400">
                  {title}
                </h4>
              </div>
            );
          })}
        </div>

        <hr className="my-6 bg-[#EDEDF1] dark:bg-lightgray h-[1px] border-none" />

        {!button && (
          <div>
            <GradientButton
              disabled={isLoading || isDisable}
              onClick={onClickButton}
              className="bg-brand-500 text-base dark:bg-dark dark:hover:bg-[#1D1E27] transition-all dark:text-white border-neutral-200 dark:border-white/10"
            >
              {cta}
            </GradientButton>
          </div>
        )}
        <div className="flex w-full flex-col  transition-all ">
          {button && button}
        </div>
      </div>
    </motion.div>
  );
};
