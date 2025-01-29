import { Form } from "react-router";
import { FlipWords } from "../ui/Flipwords";
import {
  easeInOut,
  motion,
  spring,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { twMerge } from "tailwind-merge";
import { BigCTA } from "../BigCTA";

export const Hero = () => {
  const words = ["contacto", "registro", "suscripción"];
  return (
    <section className="min-h-screen w-full flex md:items-center justify-center  relative overflow-hidden">
      <div className="w-full pt-0 lg:pt-32">
        <div
          style={{
            transformStyle: "preserve-3d",
          }}
          className="dark:block hidden"
        >
          <FloatingItem
            className="-top-[80px]  lg:-top-[160px]  w-44 lg:w-[280px]  absolute object-cover "
            src="/assets/hero/img2-d.svg"
            rotation={6}
            delay={0.9}
          />
          <FloatingItem
            className="w-40  xl:w-[280px] top-40 md:top-[148px] lg:top-20 left-8 md:-left-6  lg:w-[180px] absolute object-cover "
            src="/assets/hero/img1-d.svg"
            rotation={-8}
            delay={0.6}
          />

          <FloatingItem
            className="top-[280px] lg:top-[320px] left-10 xl:left-10 w-40 lg:w-[200px] xl:w-[280px]  absolute object-cover "
            src="/assets/hero/img3-d.svg"
            rotation={8}
            delay={0.3}
          />
          <FloatingItem
            className="w-32  lg:w-[180px]  lg:-top-32 -top-20 right-10 lg:right-16  absolute object-cover "
            src="/assets/hero/img4-d.svg"
            rotation={-6}
            direction={-1}
            delay={1.8}
          />
          <FloatingItem
            className=" w-40 top-20 right-16 md:-right-10  lg:w-[280px]  absolute object-cover "
            src="/assets/hero/img6-d.svg"
            rotation={8}
            direction={-1}
            delay={1.5}
          />
          <FloatingItem
            className="w-44  lg:w-[280px] right-6  lg:right-16 top-[240px] lg:top-[280px] absolute object-cover "
            src="/assets/hero/img5-d.svg"
            rotation={-8}
            direction={-1}
            delay={1.2}
          />
        </div>
        <div
          style={{
            transformStyle: "preserve-3d",
          }}
          className="block dark:hidden"
        >
          <FloatingItem
            className="-top-[80px]  lg:-top-[160px]  w-44 lg:w-[280px]  absolute object-cover "
            src="/assets/hero/img1.svg"
            rotation={6}
            delay={0.9}
          />
          <FloatingItem
            className="w-40  xl:w-[280px] top-40 md:top-[148px] lg:top-20 left-8 md:-left-6  lg:w-[180px] absolute object-cover "
            src="/assets/hero/img2.svg"
            rotation={-8}
            delay={0.6}
          />

          <FloatingItem
            className="top-[280px] lg:top-[320px] left-10 xl:left-10 w-40 lg:w-[200px] xl:w-[280px]  absolute object-cover "
            src="/assets/hero/img3.svg"
            rotation={8}
            delay={0.3}
          />
          <FloatingItem
            className="w-32  lg:w-[180px] lg:-top-32 -top-20 right-10 lg:right-16  absolute object-cover "
            src="/assets/hero/img4.svg"
            rotation={-6}
            direction={-1}
            delay={1.8}
          />
          <FloatingItem
            className=" w-40 top-20 right-16 md:-right-10  lg:w-[280px]  absolute object-cover "
            src="/assets/hero/img5.svg"
            rotation={8}
            direction={-1}
            delay={1.5}
          />
          <FloatingItem
            className="w-44  lg:w-[280px] right-6  lg:right-16 top-[240px] lg:top-[280px] absolute object-cover "
            src="/assets/hero/img6.svg"
            rotation={-8}
            direction={-1}
            delay={1.2}
          />
        </div>
        <div className="flex flex-col items-center pt-[40vh] md:pt-0 px-4 md:px-0 ">
          <h1 className="text-4xl lg:text-7xl !z-[80] text-dark dark:text-white font-bold text-center mt-8  md:mt-16 ">
            Agrega formularios de <FlipWords className="" words={words} />{" "}
            <br />
          </h1>
          <h1 className="text-4xl lg:text-7xl !z-[80] text-dark dark:text-white font-bold text-center -mt-1 md:mt-6 ">
            a tu sitio web fácilmente
          </h1>
          <span className="text-xl lg:text-2xl  text-gray-600 dark:text-irongray font-sans font-extralight mt-4 mb-6 md:mb-16">
            Sin código. Copia, pega y listo.
          </span>
          <Form method="post">
            <BigCTA type="submit" name="intent" value="google-login" />
          </Form>
        </div>
      </div>
    </section>
  );
};

const FloatingItem = ({
  src,
  className,
  rotation = -6,
  direction = 1,
  delay = 0,
}: {
  src: string;
  delay?: number;
  className: string;
  rotation?: number;
  direction?: 1 | -1;
}) => {
  const { scrollY } = useScroll();

  const springScrollY = useSpring(scrollY, { bounce: 0 });

  const opacity = useTransform(springScrollY, [0, 400], [1, 0]);
  const x = useTransform(springScrollY, [0, 400], [0, -200 * direction]);
  const rotationZ = useTransform(
    springScrollY,
    [0, 400],
    [rotation, -rotation],
    { ease: easeInOut }
  );

  useMotionValueEvent(scrollY, "change", (value) => {});

  const scale = useSpring(0.5);
  return (
    <motion.img
      onHoverStart={() => {
        scale.set(1.1);
        console.log("panfilo");
      }}
      onHoverEnd={() => {
        scale.set(1);
      }}
      custom={2}
      style={{
        opacity,
        x,
        rotateZ: rotationZ,
        scale,
      }}
      initial={{ opacity: 0, filter: "blur(4px)", scale: 0.5 }}
      animate={{ opacity: 1, filter: "blur(0)", scale: 1 }}
      transition={{ duration: 1, type: "spring", delay }}
      src={src}
      className={twMerge(" cursor-pointer ", className)}
    />
  );
};
