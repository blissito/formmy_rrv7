import { Form, Link } from "react-router";
import { BigCTA } from "~/components/BigCTA";
import { Button } from "~/components/Button";
import { ContainerScroll } from "~/components/home/ContainerScroll";
import { useState, useEffect } from "react";
import { CompaniesScroll } from "~/components/home/CompaniesScroll";

export default function HomeHero() {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const text = "Chat IA para tu sitio web. Sin complicaciones.";

  // Letters that will animate with different fonts - adjusted for new text
  const animatedIndexes = [0, 4, 7, 12, 18, 22, 28, 32, 37, 42, 47, 15, 25, 40];

  // Find the position of "A" in "IA"
  const iaPosition = text.indexOf(" IA ");
  const aPosition = iaPosition + 2; // Position of "A" in "IA"

  // Different font sequences for each animated letter to create variety
  const fontSequences = [
    ['Kablammo', 'Rubik Wet Paint', 'Flavors'], // Index 0: Letter 0 (C)
    ['Rubik Wet Paint', 'Flavors', 'Kablammo'], // Index 1: Letter 4 (t)
    ['Flavors', 'Kablammo', 'Rubik Wet Paint'], // Index 2: Letter 7 (I)
    ['Kablammo', 'Flavors', 'Rubik Wet Paint'], // Index 3: Letter 12 (p)
    ['Rubik Wet Paint', 'Kablammo', 'Flavors'], // Index 4: Letter 18 (u)
    ['Flavors', 'Rubik Wet Paint', 'Kablammo'], // Index 5: Letter 22 (s)
    ['Kablammo', 'Rubik Wet Paint', 'Flavors'], // Index 6: Letter 28 (w)
    ['Rubik Wet Paint', 'Flavors', 'Kablammo'], // Index 7: Letter 32 (S)
    ['Flavors', 'Kablammo', 'Rubik Wet Paint'], // Index 8: Letter 37 (c)
    ['Kablammo', 'Flavors', 'Rubik Wet Paint'], // Index 9: Letter 42 (l)
    ['Rubik Wet Paint', 'Kablammo', 'Flavors'], // Index 10: Letter 47 (o)
    ['Flavors', 'Rubik Wet Paint', 'Kablammo'], // Index 11: Letter 15 (a)
    ['Kablammo', 'Flavors', 'Rubik Wet Paint'], // Index 12: Letter 25 (e)
    ['Rubik Wet Paint', 'Kablammo', 'Flavors']  // Index 13: Letter 40 (i)
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
    if (animatedPosition === -1 || phase === 0 || phase >= 4) return 'Inter, system-ui, sans-serif';

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
    <section className="relative  flex flex-col items-center justify-center min-h-svh pt-32 md:pt-[240px] max-w-[1400px] px-4 md:px-[5%]  lg:px-0 mx-auto">
      <div className="h-[140px] md:h-[160px] lg:h-[220px] flex items-center justify-center">
        <h1 className="header text-dark text-4xl md:text-5xl lg:text-[112px] text-center leading-none md:leading-tight flex-wrap gap-2" style={{ lineHeight: '1', minHeight: '1em' }}>
          {text.split('').map((char, index) => {
            const isAnimated = animatedIndexes.includes(index);
            const shouldAnimate = isAnimated && animationPhase > 0 && animationPhase < 4;
            const isAinIA = index === aPosition;

            // Special handling for the "A" in "IA"
            if (isAinIA) {
              return (
                <span
                  key={index}
                  className="inline-block transition-all duration-700 ease-out relative align-baseline"
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
                      className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 mt-4"
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
      <p className="paragraph text-dark text-xl md:text-2xl text-center mt-4 ">
        Integra en minutos y sin dolores de cabeza.
      </p>
      <div className="flex gap-4 mt-10">
        <Form method="post" action="/api/login" id="start_hero">
          <BigCTA type="submit" name="intent" value="google-login" textClassName="text-base md:text-lg" className="h-14" />
        </Form>
        <Link to="/planes">
        <Button variant="secondary" className="mt-0 h-14 text-base md:text-lg">
          Ver planes
        </Button>
        </Link>
      </div>
      <div className="mt-16 mb-10 bg-outlines w-full h-[1px] flex justify-center items-center">
      <p className="bg-white w-fit -mt-[3px] px-2"><strong>+500 usuarios usan Formmy</strong> para captar leads, automatizar procesos y atender a sus clientes. </p>
        </div>
      <CompaniesScroll />
    </section>
  );
}
