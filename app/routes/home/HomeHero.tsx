import { Form, Link } from "react-router";
import { BigCTA } from "~/components/BigCTA";
import { Button } from "~/components/Button";
import { ContainerScroll } from "~/components/home/ContainerScroll";
import { useState, useEffect } from "react";
import { CompaniesScroll } from "~/components/home/CompaniesScroll";

export default function HomeHero() {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const text = isMobile
    ? "Chat IA para tu sitio web. Fácil y rápido."
    : "Chat IA para tu sitio web. Sin complicaciones.";

  // Letters that will animate with different fonts - responsive for both texts
  const animatedIndexes = isMobile
    ? [0, 5, 8, 13, 16, 19, 23, 29, 30, 33, 37, 1, 3, 11] // For "Fácil y rápido"
    : [0, 5, 8, 13, 16, 19, 23, 29, 34, 38, 44, 1, 3, 11]; // For "Sin complicaciones"

  // Find the position of "A" in "IA"
  const iaPosition = text.indexOf(" IA ");
  const aPosition = iaPosition + 2; // Position of "A" in "IA"

  // Different font sequences for each animated letter to create variety
  const fontSequences = [
    ['Kablammo', 'Rubik Wet Paint', 'Flavors'], // Index 0: Pos 0 = 'C'
    ['Rubik Wet Paint', 'Flavors', 'Kablammo'], // Index 1: Pos 5 = 'I'
    ['Flavors', 'Kablammo', 'Rubik Wet Paint'], // Index 2: Pos 8 = 'p'
    ['Kablammo', 'Flavors', 'Rubik Wet Paint'], // Index 3: Pos 13 = 't'
    ['Rubik Wet Paint', 'Kablammo', 'Flavors'], // Index 4: Pos 16 = 's'
    ['Flavors', 'Rubik Wet Paint', 'Kablammo'], // Index 5: Pos 19 = 'i'
    ['Kablammo', 'Rubik Wet Paint', 'Flavors'], // Index 6: Pos 23 = 'e'
    ['Rubik Wet Paint', 'Flavors', 'Kablammo'], // Index 7: Pos 29 = 'n'
    ['Flavors', 'Kablammo', 'Rubik Wet Paint'], // Index 8: Pos 34 = 'p'
    ['Kablammo', 'Flavors', 'Rubik Wet Paint'], // Index 9: Pos 38 = 'a'
    ['Rubik Wet Paint', 'Kablammo', 'Flavors'], // Index 10: Pos 44 = 's'
    ['Flavors', 'Rubik Wet Paint', 'Kablammo'], // Index 11: Pos 1 = 'h'
    ['Kablammo', 'Flavors', 'Rubik Wet Paint'], // Index 12: Pos 3 = 't'
    ['Rubik Wet Paint', 'Kablammo', 'Flavors']  // Index 13: Pos 11 = 'a'
  ];

  useEffect(() => {
    // Initial scale-in animation (Jitter style)
    const initialAnimation = setTimeout(() => {
      setIsInitialLoad(false);
    }, 100);

    // Quick font cycling phase (starts after scale-in)
    const quickCycle = [
      setTimeout(() => setAnimationPhase(0.1), 400),
      setTimeout(() => setAnimationPhase(0.2), 450),
      setTimeout(() => setAnimationPhase(0.3), 500),
      setTimeout(() => setAnimationPhase(0.4), 550),
      setTimeout(() => setAnimationPhase(0.5), 600),
      setTimeout(() => setAnimationPhase(0.6), 650),
    ];

    // Main animation sequence - with overlapping transitions
    const mainSequence = [
      setTimeout(() => setAnimationPhase(1), 800),
      setTimeout(() => setAnimationPhase(2), 1600),
      setTimeout(() => setAnimationPhase(3), 2400),
      setTimeout(() => setAnimationPhase(4), 3200)
    ];

    return () => [initialAnimation, ...quickCycle, ...mainSequence].forEach(clearTimeout);
  }, []);

  const getFontFamily = (letterIndex: number, phase: number) => {
    const animatedPosition = animatedIndexes.indexOf(letterIndex);
    if (animatedPosition === -1 || phase === 0 || phase >= 4) return 'Poppins, system-ui, sans-serif';

    // Quick cycling phase (0.1 to 0.6)
    if (phase < 1) {
      const quickFonts = ['Kablammo', 'Rubik Wet Paint', 'Flavors', 'Inter', 'Kablammo', 'Flavors'];
      const quickIndex = Math.floor((phase - 0.1) * 10) % quickFonts.length;
      return quickFonts[quickIndex] + ', system-ui, sans-serif';
    }

    // Main sequence (1, 2, 3)
    return fontSequences[animatedPosition][phase - 1] + ', system-ui, sans-serif';
  };

  return (
    <section className="relative overflow-hidden z-10 flex flex-col items-center justify-center min-h-svh pt-32 md:pt-[240px] max-w-[1400px] px-4 md:px-[5%]  lg:px-0 mx-auto">
      <div className="h-[180px]  md:h-[160px] lg:h-[220px] flex items-center justify-center">
        <h1 className=" text-dark heading text-[2.7rem] md:text-5xl lg:text-7xl px-0 md:px-4 xl:text-[106px] text-center leading-none md:leading-tight flex-wrap gap-2" style={{ lineHeight: '1', minHeight: '1em' }}>
          {text.split('').map((char, index) => {
            const isAnimated = animatedIndexes.includes(index);
            const shouldAnimate = isAnimated && animationPhase > 0 && animationPhase < 4;
            const isAinIA = index === aPosition;

            // Special handling for the "A" in "IA"
            if (isAinIA) {
              return (
                <span
                  key={index}
                  className=" inline-block transition-all duration-700 ease-out relative align-baseline"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    width: animationPhase < 4 ? 'auto' : 'auto',
                    height: animationPhase < 4 ? 'auto' : 'auto',
                    verticalAlign: 'text-top'
                  }}
                >
                  {animationPhase >= 4 ? (
                    <img
                      src="/dash/logo-full.svg"
                      alt="Formmy Logo"
                      className="w-10 h-10 md:w-12 md:h-12 xl:w-20 xl:h-20 mt-2 md:mt-0 xl:mt-4"
                      style={{
                        transition: 'all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)',
                        transform: 'scale(1) rotate(0deg) translateY(0px)',
                        opacity: 1
                      }}
                    />
                  ) : (
                    <span
                      className="font-bold"
                      style={{
                        transition: isInitialLoad
                          ? `all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 40}ms`
                          : 'all 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
                        transform: isInitialLoad
                          ? `scale(0.8) translateY(20px)`
                          : animationPhase === 1 ? 'scale(1.02) rotate(1deg) translateY(-1px)'
                          : animationPhase === 2 ? 'scale(1.03) rotate(-0.8deg) translateY(0.5px)'
                          : animationPhase === 3 ? 'scale(1.01) rotate(0.5deg) translateY(-0.8px)'
                          : 'scale(1) rotate(0deg) translateY(0px)',
                        opacity: isInitialLoad ? 0 : 1,
                        fontFamily: getFontFamily(index, animationPhase)
                      }}
                    >
                      A
                    </span>
                  )}
                </span>
              );
            }

            // Generate random subtle animation values for each letter
            const animatedPosition = animatedIndexes.indexOf(index);
            const randomOffset = animatedPosition !== -1 ? animatedPosition : 0;

            const getSubtleTransform = (phase: number) => {
              if (!shouldAnimate) return '';

              const variations = [
                { rotate: 1, translateY: -1, scale: 1.02 },
                { rotate: -0.8, translateY: 0.5, scale: 1.03 },
                { rotate: 0.5, translateY: -0.8, scale: 1.01 },
              ];

              // Handle quick cycling phase (0.1 to 0.6)
              if (phase < 1) {
                const quickIndex = Math.floor((phase - 0.1) * 10) % variations.length;
                const variation = variations[quickIndex];
                return `rotate(${variation.rotate}deg) translateY(${variation.translateY}px) scale(${variation.scale})`;
              }

              // Main sequence (1, 2, 3) - more subtle movements
              const variation = variations[(randomOffset + phase - 1) % variations.length];
              return `rotate(${variation.rotate}deg) translateY(${variation.translateY}px) scale(${variation.scale})`;
            };

            return (
              <span
                key={index}
                className="inline-block transition-all duration-700 ease-out font-bold"
                style={{
                  animationDelay: `${index * 80}ms`,
                  transform: isInitialLoad
                    ? `scale(0.8) translateY(20px)`
                    : shouldAnimate
                      ? getSubtleTransform(animationPhase)
                      : 'scale(1) translateY(0px)',
                  transition: isInitialLoad
                    ? `all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 40}ms`
                    : 'all 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  fontFamily: getFontFamily(index, animationPhase),
                  fontWeight: 'bold',
                  lineHeight: '1',
                  verticalAlign: 'text-top',
                  height: '1em',
                  display: 'inline-flex',
                  opacity: isInitialLoad ? 0 : 1
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </h1>
      </div>
      <span className="paragraph text-dark text-lg md:text-2xl text-center mt-0 lg:mt-8 ">
        Integra en minutos y sin dolores de cabeza.
      </span>
      <div className="flex gap-0 md:gap-4 mt-6 md:mt-10">
        <Form method="post" action="/api/login" id="start_hero">
          <BigCTA type="submit" name="intent" value="google-login" textClassName="text-base md:text-lg text-dark" className="h-14" />
        </Form>
        <Link to="/planes">
        <Button variant="secondary" className="mt-0 h-14 text-base md:text-lg hidden lg:block font-semibold">
          Ver planes
        </Button>
        </Link>
      </div>
      <ContainerScroll>
          <img
            src="/home/ghosty.webp"
            alt="hero"
            height={400}
            width={1400}
            className="mx-auto rounded-2xl object-cover h-full object-left-top hidden lg:block"
            draggable={false}
          />
              <img
            src="/home/ghosty-mobile.webp"
            alt="hero"
            height={400}
            width={400}
            className="mx-auto rounded-2xl object-cover h-full object-left-top lg:hidden"
            draggable={false}
          />
        </ContainerScroll>
      <div className="-mt-40 md:-mt-32 mb-10 bg-outlines w-full h-[1px] flex justify-center items-center text-center">
        <p className="bg-white w-fit -mt-[3px] px-2 text-sm lg:text-base"><strong>+1,000 usuarios usan Formmy</strong> para captar leads, <br className="lg:hidden" />automatizar procesos y atender a sus clientes. </p>
        </div>
      <CompaniesScroll />
    </section>
  );
}
