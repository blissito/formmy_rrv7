import { useInView, useMotionValueEvent, useScroll } from "framer-motion";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { ScrollReveal } from "../ScrollReveals";

export const StickyScroll = ({
  items,
  onIndexChange,
  numberBgColor = "bg-bird",
}: {
  items: Record<string, ReactNode>[];
  onIndexChange?: (index: number) => void;
  numberBgColor?: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImage, setCurrentImage] = useState(items[currentIndex].img);
  const [currentBgColor, setCurrentBgColor] = useState(items[0].twColor);
  // scroll
  const targetRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: targetRef });
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // console.log("latest", latest);
  });

  const handleEnterIntoView = (index: number) => {
    setCurrentImage(items[index].img);
    setCurrentBgColor(items[index].twColor);
    setCurrentIndex(index);
    onIndexChange?.(index);
  };

  //   console.log("index", currentIndex);

  return (
    <article className={cn(currentBgColor, "transition-all bg-lines bg-cover")}>
      <ScrollReveal>
        <section
          className="flex gap-20 justify-center flex-wrap-reverse lg:flex-nowrap items-start relative py-6 md:py-20 w-full lg:w-[90%] h-max max-w-7xl mx-auto"
          // className="flex px-[5%] gap-20 justify-center xl:flex-nowrap flex-wrap-reverse items-start relative py-10 lg:py-20 h-max max-w-7xl mx-auto "
          ref={targetRef}
        >
          <div className="flex flex-col flex-none lg:flex-1 pb-0 md:py-28 gap-40 lg:gap-80 w-[90%] mx-auto lg:w-[50%] ">
            {items.map(({ text, title, number, img }, index) => (
              <InViewDetector
                onInView={handleEnterIntoView}
                index={index}
                key={String(index) + title}
                className="h-full"
              >
                <div className="flex flex-col items-start gap-4 mb-4 ">
                  {number && (
                    <span className={cn("text-2xl lg:text-3xl xl:text-3xl font-bold text-dark rounded-2xl px-4 py-2 flex-shrink-0", numberBgColor)}>
                      {number}
                    </span>
                  )}
                  <h3
                    className={cn(
                      "text-gray-400/50 font-sans font-bold text-2xl heading lg:text-4xl xl:text-5xl transition-all !leading-[1.15]",
                      {
                        "text-dark dark:text-white": currentImage === img,
                      }
                    )}
                  >
                    {title}
                  </h3>
                </div>
                <div
                  className={cn(
                    "text-lg lg:text-xl xl:text-2xl font-light text-gray-600/50 dark:text-irongray transition-all",
                    {
                      "text-gray-600 dark:text-irongray": currentImage === img,
                    }
                  )}
                >
                  {text}
                </div>
              </InViewDetector>
            ))}
          </div>
          <div className="sticky top-20 bg-white md:top-14 lg:mt-10 h-[320px] md:h-[380px] px-[5%] lg:px-0 lg:top-80 w-full  lg:max-w-[50%] flex-none lg:flex-1  rounded-3xl  flex items-center justify-center   aspect-square">
            <div className="md:w-[80%] lg:w-full mx-auto">{currentImage}</div>
          </div>
        </section>
      </ScrollReveal>
    </article>
  );
};

export const InViewDetector = ({
  children,
  index,
  className,
  onInView,
}: {
  className?: string;
  index: number;
  children?: ReactNode;
  onInView?: (arg0: number) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    amount: 0.5,
    margin: "-100px 0px -100px 0px",
  });

  useEffect(() => {
    if (isInView) {
      onInView?.(index);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView, index]);

  return (
    <div className={className} ref={ref}>
      {children}
    </div>
  );
};
