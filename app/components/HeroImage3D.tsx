import { useState } from "react";
import Fixed3DCard from "~/components/Fixed3DCard";

export default function HeroImage3D() {
  const [hovering, setHovering] = useState(true);

  return (
    <main className="flex flex-col-reverse sm:flex-row justify-center">
      <section
        onMouseEnter={() => {
          setHovering(true);
        }}
        onMouseLeave={() => {
          setHovering(false);
        }}
        className="relative max-w-[600px]"
        style={{ perspective: "5000px", transformStyle: "flat" }}
      >
        <div className="absolute left-4 top-[160px] z-30 max-w-[280px]">
          <Fixed3DCard
            translateZ="50px"
            rx={25}
            ry={-20}
            isActive={hovering}
            img={"https://i.imgur.com/IVkunJE.png"}
          />
        </div>
        <div className="absolute right-4 bottom-[340px] z-30 max-w-[320px] sm:block hidden">
          <Fixed3DCard
            translateZ="80px"
            rx={25}
            ry={-20}
            isActive={hovering}
            img={"https://i.imgur.com/lf6UKIA.png"}
          />
        </div>

        <div className="-z-10 p-4">
          <Fixed3DCard
            translateZ="-100px"
            rx={25}
            ry={-20}
            isActive={hovering}
            img={"https://i.imgur.com/qBewgS0.png"}
          />
        </div>
        <div className="absolute left-12 bottom-[160px] z-10 max-w-[320px] sm:block hidden">
          <Fixed3DCard
            translateZ="80px"
            rx={25}
            ry={-20}
            isActive={hovering}
            img={"https://i.imgur.com/ej9IseL.png"}
          />
        </div>
      </section>
    </main>
  );
}
