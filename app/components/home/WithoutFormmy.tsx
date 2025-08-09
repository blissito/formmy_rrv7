import { TbChartDots3 } from "react-icons/tb";
import { Compare } from "../ui/compare";
import { ScrollReveal } from "~/components/ScrollReveals";

export const WitoutFormmy = () => {
  return (
    <section className="h-auto w-[90%] xl:w-full  max-w-7xl mx-auto my-20 lg:mt-[80px] lg:mb-[80px] ">
      <ScrollReveal>
        <h2 className=" text-dark dark:text-white text-3xl lg:text-5xl font-bold text-center">
          No más líneas y líneas de inputs y validaciones
        </h2>
        <div className="flex justify-between flex-wrap lg:flex-nowrap items-center mt-4 lg:mt-20">
          <div className="w-full lg:w-[40%] mb-8 lg:mb-0">
            <p className=" text-lg md:text-xl xl:text-2xl  text-dark">
              No te preocupes más por maquetar, estilizar y agregar validaciones
              a cada uno de tus campos, ahorra líneas y líneas de código al usar
              Formmy.
            </p>
            <div className="text-dark text-xl font-extralight flex flex-col gap-3 mt-6 lg:mt-12">
              <div className="flex items-center gap-2 text-lg md:text-xl xl:text-2xl ">
                <div className="min-w-10 ">
                  {" "}
                  <TbChartDots3 className="text-brand-500 " />
                </div>
                <p>Agrega menos código</p>
              </div>
              <div className="flex items-center gap-2 text-lg md:text-xl xl:text-2xl ">
                <div className="min-w-10 ">
                  {" "}
                  <TbChartDots3 className="text-brand-500 " />
                </div>
                <p>Activa los campos con un clic o agrega tus propios campos</p>
              </div>
              <div className="flex items-center gap-2 text-lg md:text-xl xl:text-2xl ">
                <div className="min-w-10 ">
                  {" "}
                  <TbChartDots3 className="text-brand-500 " />
                </div>
                <p> Olvídate de las validaciones</p>
              </div>
              <div className="flex items-center gap-2 text-lg md:text-xl xl:text-2xl ">
                <div className="min-w-10 ">
                  {" "}
                  <TbChartDots3 className="text-brand-500 " />
                </div>
                <p>
                  Recibe notificaciones cada vez que recibes un mensaje o hay un
                  nuevo registro
                </p>
              </div>
            </div>
          </div>

          <Compare
            firstImage="/assets/without-formmy.svg"
            secondImage="/assets/with-formmy.svg"
            firstImageClassName="object-cover object-left-top"
            secondImageClassname="object-cover object-left-top"
            className="h-[320px]  w-full md:h-[500px] lg:w-[50%] mt-0 "
            slideMode="hover"
          />
        </div>
      </ScrollReveal>
    </section>
  );
};
