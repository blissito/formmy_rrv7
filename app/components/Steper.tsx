import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Step {
  title: string;
  desc?: string;
}

interface SteperProps {
  steps: Step[];
  renderRight: (selectedStep: number) => React.ReactNode;
  autoAdvanceMs?: number;
  className?: string;
}

export const Steper: React.FC<SteperProps> = ({
  steps,
  renderRight,
  autoAdvanceMs = 10000,
  className = "",
}) => {
  const [selectedStep, setSelectedStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedStep((prev) => (prev + 1) % steps.length);
    }, autoAdvanceMs);
    return () => clearInterval(interval);
  }, [steps.length, autoAdvanceMs]);

  const handleStepClick = (idx: number) => {
    setSelectedStep(idx);
  };

  return (
    <section className={`w-full h-[70vh] max-w-7xl mx-auto mt-10 md:mt-16 flex flex-col md:flex-row gap-8 items-center ${className}`}>
         {/* Contenido visual a la izquierda */}
       <div className="w-[50%] flex items-center justify-center h-full w-full">
       <div className="flex items-center justify-center w-full h-full bg-steperCover bg-cover py-4 rounded-3xl">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selectedStep}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-[90%] mx-auto md:w-full h-full flex items-center justify-center "
          >
            {renderRight(selectedStep)}
          </motion.div>
        </AnimatePresence>
        </div>
      </div>
      {/* Steps a la derecha */}
      <div className="w-[50%] flex flex-col gap-2 w-full h-full justify-center">
        {steps.map((step, idx) => (
          <div
            key={step.title}
            className={`rounded-xl px-4 py-1 md:py-3 mb-2 cursor-pointer border ${selectedStep === idx ? "bg-clear border-gray-400/30 text-brand-500" : "bg-transparent border-transparent text-gray-400"}`}
            onClick={() => handleStepClick(idx)}
          >
            {selectedStep === idx ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg md:text-2xl">{`0${idx + 1}.`}</span>
                  <span className="font-semibold text-lg md:text-2xl">{step.title}</span>
                </div>
                {step.desc && (
                  <p className="text-dark text-base md:text-xl mt-2">{step.desc}</p>
                )}
              </motion.div>
            ) : (
              <div className="flex items-center gap-2">
                <span className=" text-base md:text-lg">{`0${idx + 1}.`}</span>
                <span className="text-base md:text-lg">{step.title}</span>
              </div>
            )}
          </div>
        ))}
      </div>
   
    </section>
  );
}; 