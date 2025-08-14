import React, { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
const img = "https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg"

function DemoCard({ label, backgroundImage, imageClassName,companybrand }: { label: string; backgroundImage?: string; imageClassName?: string, companybrand?:string }) {
  return (
    <div className="bg-dark h-[280px] w-[420px] rounded-3xl relative overflow-hidden flex-shrink-0">
      <div className="h-full w-full relative">
        <div
          className={cn(" w-full mx-auto h-full bg-top bg-no-repeat bg-cover rounded-3xl overflow-hidden", imageClassName)}
          style={{ backgroundImage:  `url('${backgroundImage}')` }}
        />
        <div
          className="absolute bottom-0 left-0 w-full h-full"
          style={{ background: "linear-gradient(-5.9deg, rgba(0,0,0,0.5) 5%, rgba(0,0,0,0.0) 100%)" }}
        />
        <div className="flex gap-2 items-center absolute bottom-6 left-6">
         <div className={cn("w-3 h-3 rounded-full bg-brand-500", companybrand)}></div>
          <div className=" text-white text-lg font-medium ">
            {label}
          </div>
        </div>
      </div>
      <div className="absolute border border-[rgba(75,85,99,0.25)] inset-0 pointer-events-none rounded-3xl" />
    </div>
  );
}

export default function HomeDemos() {
  const cards = [
    { label: "Contacto | E4Pros", imageClassName:"bg-bottom-left", companybrand:"bg-[#8BB236]", backgroundImage:"/home/ejemplos/pros.webp" },
    { label: "Contacto | Brenda GO", imageClassName:"bg-bottom-right", companybrand:"bg-[#9346ED]", backgroundImage:"/home/ejemplos/brendi.webp" },
    { label: "Waitinglist | Fixtergeek",  companybrand:"bg-[#9346ED]", backgroundImage:"/home/ejemplos/ui.webp" },
    { label: "Newsletter | Natoure",  companybrand:"bg-[#ff9365]", backgroundImage:"/home/ejemplos/natoure.webp" },
    { label: "Waitinglist | DenÍk",   companybrand:"bg-[#5158f6]",  backgroundImage:"/home/ejemplos/denik.webp" },
    { label: "Contacto | Raul",  companybrand:"bg-[#f79c08]", backgroundImage:"/home/ejemplos/raul.webp"  },
    { label: "Contacto | FixterOrg",    companybrand:"bg-[#85dbcb]", backgroundImage:"/home/ejemplos/org.webp" },
    // { label: "Registro",  backgroundImage:"https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg" },
    // { label: "Dashboard",  backgroundImage:"https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg" },
    // { label: "Soporte",  backgroundImage:"https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg" },
    // { label: "Integraciones",  backgroundImage:"https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg" },
    // { label: "Personalización",  backgroundImage:"https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg" },
  ];
  return (
    <section className="relative w-full flex flex-col items-center my-20 md:my-40 overflow-hidden">
      <h2 className="font-bold text-[#080923] text-3xl md:text-4xl lg:text-6xl text-center mb-10 md:mb-16 leading-tight px-4">
        Formmy se adapta a lo que necesitas
      </h2>
      <Carrusel items={cards} direction="right" speed="slow" />
    </section>
  );
}

 const Carrusel = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: {
    label: string;
    backgroundImage?: string;
    imageClassName?:string;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);

  useEffect(() => {
    addAnimation();
  }, []);
  const [start, setStart] = useState(false);
  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }
  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards"
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse"
        );
      }
    }
  };
  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };
  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 mx-auto  overflow-hidden",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-4 animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
      >
         {items.map((item, idx) => (
          <DemoCard key={idx} label={item.label} backgroundImage={item.backgroundImage} imageClassName={item.imageClassName} companybrand={item.companybrand} />
        ))}
      </ul>
    </div>
  );
};


