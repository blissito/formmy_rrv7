import { Form, Link } from "react-router";
import { BigCTA } from "~/components/BigCTA";
import { Button } from "~/components/Button";
import { ContainerScroll } from "~/components/home/ContainerScroll";
import { useState, useEffect } from "react";

export default function HomeHero() {
  const [animationPhase, setAnimationPhase] = useState(0);
  const text = "Chat IA para tu sitio web. Sin complicaciones.";

  // Letters that will animate with different fonts - adjusted for new text
  const animatedIndexes = [0, 4, 7, 12, 18, 22, 28, 32, 37, 42, 47, 15, 25, 40];

  // Find the position of "A" in "IA"
  const iaPosition = text.indexOf(" IA ");
  const aPosition = iaPosition + 2; // Position of "A" in "IA"

  // Different font sequences for each animated letter to create variety
  const fontSequences = [
    ['Kablammo', 'Rubik Wet Paint', 'Flavors'], // Letter 0 (C)
    ['Rubik Wet Paint', 'Flavors', 'Kablammo'], // Letter 4 (t)
    ['Flavors', 'Kablammo', 'Rubik Wet Paint'], // Letter 7 (I)
    ['Kablammo', 'Flavors', 'Rubik Wet Paint'], // Letter 12 (p)
    ['Rubik Wet Paint', 'Kablammo', 'Flavors'], // Letter 18 (u)
    ['Flavors', 'Rubik Wet Paint', 'Kablammo'], // Letter 22 (s)
    ['Kablammo', 'Rubik Wet Paint', 'Flavors'], // Letter 28 (w)
    ['Rubik Wet Paint', 'Flavors', 'Kablammo'], // Letter 32 (S)
    ['Flavors', 'Kablammo', 'Rubik Wet Paint'], // Letter 37 (c)
    ['Kablammo', 'Flavors', 'Rubik Wet Paint'], // Letter 42 (l)
    ['Rubik Wet Paint', 'Kablammo', 'Flavors'], // Letter 47 (o)
    ['Flavors', 'Rubik Wet Paint', 'Kablammo'], // Letter 15 (a)
    ['Kablammo', 'Flavors', 'Rubik Wet Paint'], // Letter 25 (e)
    ['Rubik Wet Paint', 'Kablammo', 'Flavors']  // Letter 40 (i)
  ];

  useEffect(() => {
    const intervals = [
      setTimeout(() => setAnimationPhase(1), 500),
      setTimeout(() => setAnimationPhase(2), 1400),
      setTimeout(() => setAnimationPhase(3), 2500),
      setTimeout(() => setAnimationPhase(4), 3800)
    ];

    return () => intervals.forEach(clearTimeout);
  }, []);

  const getFontFamily = (letterIndex: number, phase: number) => {
    const animatedPosition = animatedIndexes.indexOf(letterIndex);
    if (animatedPosition === -1 || phase === 0 || phase >= 4) return 'Inter, system-ui, sans-serif';

    return fontSequences[animatedPosition][phase - 1] + ', system-ui, sans-serif';
  };

  return (
    <section className="relative  flex flex-col items-center justify-center min-h-[700px] pt-32 md:pt-[240px] max-w-7xl px-4 md:px-[5%]  lg:px-0 mx-auto">
      <div className="h-[140px] md:h-[160px] lg:h-[220px] flex items-center justify-center">
        <h1 className="header text-dark text-4xl md:text-5xl lg:text-[100px] text-center leading-none md:leading-tight flex-wrap gap-2" style={{ lineHeight: '1', minHeight: '1em' }}>
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
                    verticalAlign: 'baseline'
                  }}
                >
                  {animationPhase < 4 ? (
                    <img
                      src="/dash/logo-full.svg"
                      alt="Formmy Logo"
                      className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 mt-10"
                      style={{
                        transition: 'all 1s cubic-bezier(0.4, 0.0, 0.2, 1)',
                        transform: animationPhase === 1 ? 'scale(1.1) rotate(2deg) translateY(-1px)' :
                                  animationPhase === 2 ? 'scale(1.25) rotate(-1deg) translateY(1px)' :
                                  animationPhase === 3 ? 'scale(1.05) rotate(0.5deg) translateY(-0.5px)' :
                                  'scale(1) rotate(0deg) translateY(0px)'
                      }}
                    />
                  ) : (
                    <span className="font-bold">A</span>
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
                { rotate: 2, translateY: -2, scale: 1.05 },
                { rotate: -1.5, translateY: 1, scale: 1.08 },
                { rotate: 1, translateY: -1.5, scale: 1.03 },
              ];

              const variation = variations[(randomOffset + phase - 1) % variations.length];
              return `rotate(${variation.rotate}deg) translateY(${variation.translateY}px) scale(${variation.scale})`;
            };

            return (
              <span
                key={index}
                className="inline-block transition-all duration-700 ease-out font-bold"
                style={{
                  animationDelay: `${index * 80}ms`,
                  transform: shouldAnimate ? getSubtleTransform(animationPhase) : 'none',
                  transition: 'all 1s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  fontFamily: getFontFamily(index, animationPhase),
                  fontWeight: 'bold',
                  lineHeight: '1',
                  verticalAlign: 'baseline'
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
      <hr className="my-10 bg-dark w-full"/>
      {/* <ContainerScroll>
        <img
          src="/home/home.webp"
          alt="hero"
          height={400}
          width={1400}
          className="mx-auto rounded-2xl object-cover h-full object-left-top hidden md:block"
          draggable={false}
        />
            <img
          src="/home/home-xs.webp"
          alt="hero"
          height={400}
          width={400}
          className="mx-auto rounded-2xl object-cover h-full object-left-top md:hidden"
          draggable={false}
        />
      </ContainerScroll> */}
    </section>
  );
}
