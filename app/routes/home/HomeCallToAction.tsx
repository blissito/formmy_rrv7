import { Button } from "~/components/Button";
import { AnimatedTooltip } from "~/components/ui/animated-tooltip";
import { Form } from "react-router";
import { BigCTA } from "~/components/BigCTA";

const imgCapturaDePantalla20250708ALaS35003PM1 =
  "/home/demo.webp";

export default function HomeCallToAction() {
  return (
    <section className="relative w-full rounded-t-[40px] bg-dark overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[500px] py-0 pb-10  md:py-24 px-4 md:px-0">
      {/* SVG decorativo en la esquina superior izquierda */}
      <svg
        className="absolute left-0 top-0 z-0 rotate-[180deg]"
        width="100%"
        height="500"
        viewBox="0 0 1920 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0 500C640 0 1280 1000 1920 500"
          stroke="#8b8ae2"
          strokeWidth="80"
          fill="none"
        />
      </svg>
      <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-start  justify-between z-10">
        <div className="flex-1 flex flex-col items-start justify-center mt-16">
          <h2 className="text-white text-4xl md:text-6xl font-bold !leading-[1.3] mb-4 md:mb-8">
         Transforma tu web.
            <br />
            Házlo fácil, rápido y sin código con <span className="text-brand-500">Formmy</span>.
          </h2>
          <Form method="post" action="/api/login">
          <BigCTA type="submit" name="intent" value="google-login"  containerClassName="bg-white hover:bg-[#E1E3E7] heading text-dark text-lg">Empezar gratis <span className="ml-2">→</span></BigCTA>
        </Form>
          {/* <Form method="post" action="/api/login">
          <Button className="ml-0 h-14 bg-white text-dark font-semibold rounded-full px-8 text-base md:text-lg flex items-center gap-2 shadow hover:scale-105 transition">
            Empezar gratis
            <span className="ml-2">→</span>
          </Button>
          </Form> */}
        </div>
        <div className="flex-1 flex items-center justify-center mt-12 md:mt-0 relative">
          {/* Mockup móvil */}
          <div className="w-[200px] md:w-[320px] h-[400px] md:h-[660px] bg-white rounded-[40px] shadow-2xl border-8 border-dark overflow-hidden flex items-end justify-center relative">
            <img
              src={imgCapturaDePantalla20250708ALaS35003PM1}
              alt="App preview"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const people = [
  {
    id: 1,
    name: "Mariana López",
    designation: "Software Engineer",
    image: "https://i.imgur.com/FwjZ8X2.jpg",
  },
  {
    id: 2,
    name: "Rosalba Flores",
    designation: "Marketing Agent",
    image: "https://i.imgur.com/RAiyJBc.jpg",
  },
  {
    id: 3,
    name: "Brenda Ortega",
    designation: "Product Designer",
    image: "https://i.imgur.com/TFQxcIu.jpg",
  },
  {
    id: 4,
    name: "Luis Robles",
    designation: "Contador",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80",
  },
  {
    id: 5,
    name: "Katherine Manson",
    designation: "Maestra de Inglés",
    image: "https://www.e4pros.com/katherine.webp",
  },
];

export const GeneralCallToAction = () => {
  return (
    <section className="relative w-full rounded-t-[40px] bg-dark overflow-hidden flex flex-col md:flex-row items-center justify-center  h-[320px] md:h-[500px]  px-4 md:px-0">
      {/* SVG decorativo en la esquina superior izquierda */}
      <svg
        className="absolute left-0 top-0 z-0 rotate-[180deg]"
        width="100%"
        height="500"
        viewBox="0 0 1920 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0 500C640 0 1280 1000 1920 500"
          stroke="#8b8ae2"
          strokeWidth="80"
          fill="none"
        />
      </svg>

      <section className="w-full flex flex-col justify-center items-center relative z-10">
        <h2 className=" text-white text-3xl lg:text-5xl font-bold text-center">
          Usa Formmy. Ahorra tiempo.
          <span className="block lg:hidden"> Y reduce costos.</span>
        </h2>
        <div className="flex flex-wrap justify-center mx-auto gap-8 mt-6">
          <div className="flex  mb-10 ">
            <AnimatedTooltip items={people} />
          </div>
          <h2 className="hidden lg:block text-white text-3xl lg:text-5xl font-bold text-center">
            Y reduce costos.
          </h2>
        </div>
        <Form method="post" action="/api/login">
          <BigCTA
            className="mx-auto w-[180px]"
            type="submit"
            name="intent"
            value="google-login"
          />
        </Form>
      </section>
    </section>
  );
};
