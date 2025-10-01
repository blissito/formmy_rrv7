import { useRef } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";
import { StickyScroll } from "~/components/ui/sticky-scroll-reveal";

interface Step {
  number: string;
  title: string;
  description: string;
  buttonText?: string;
}

interface FormStepsProps {
  steps: Array<{
    title: string;
    desc: string;
    image: string;
  }>;
  title?: string;
}

export function FormSteps({ steps, title = "Crea tu primer Formmy en 5 minutos" }: FormStepsProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: stepsContainerRef,
    offset: ["start center", "end center"]
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (videoRef.current && videoRef.current.duration) {
      const videoDuration = videoRef.current.duration;
      const clampedProgress = Math.max(0, Math.min(1, latest));
      const targetTime = clampedProgress * videoDuration;
      videoRef.current.currentTime = targetTime;
    }
  });

  const videoElement = (
    <video
      ref={videoRef}
      className="object-cover h-full w-full rounded-3xl border border-outlines"
      muted
      playsInline
      preload="auto"
      poster={steps[0]?.image}
      onLoadedMetadata={() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }
      }}
    >
      <source src="https://formmy.t3.storage.dev/steps-chat.mp4" type="video/mp4" />
      Tu navegador no soporta el elemento de video.
    </video>
  );

  const formattedSteps: Step[] = steps.map((step, index) => ({
    number: `0${index + 1}.`,
    title: step.title,
    description: step.desc,
    buttonText: index === steps.length - 1 ? "Probar" : undefined,
  }));

  const stickyItems = formattedSteps.map((step, index) => ({
    number: step.number,
    title: step.title,
    twColor: "dark:bg-transparent bg-[#ffffff]",
    text: (
      <div>
        <p className="font-sans text-metal">
          {step.description}
        </p>
        {index === formattedSteps.length - 1 && step.buttonText && (
          <button className="mt-8 text-base px-8 py-3 bg-dark hover:bg-dark/90 hover:-translate-y-1 transition-all duration-200 text-white rounded-full font-medium">
            {step.buttonText}
          </button>
        )}
      </div>
    ),
    img: videoElement
  }));

  return (
    <section className="w-full py-16 md:py-24 relative">
      <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-center mb-10 text-dark dark:text-white px-4 relative z-10">
        {title}
      </h2>

      <div ref={stepsContainerRef} className="relative z-10">
        <StickyScroll items={stickyItems} numberBgColor="bg-cloud" />
      </div>
    </section>
  );
}