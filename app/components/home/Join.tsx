import { Form } from "react-router";
import { BigCTA, ScrollReveal } from "~/routes/_index";
import { AnimatedTooltip } from "../ui/animated-tooltip";

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
    name: "Gina González",
    designation: "Maestra de Inglés",
    image: "https://i.imgur.com/0yXHsGx.png0",
  },
];

export const Join = () => {
  return (
    <section className="bg-patternwhite dark:bg-pattern bg-no-repeat bg-contain bg-center max-w-7xl min-h-[70vh]  mx-auto py-20 flex flex-col justify-center items-center">
      <ScrollReveal>
        <h2 className=" text-dark dark:text-white text-3xl lg:text-5xl font-bold text-center">
          Usa Formmy. Ahorra tiempo.
          <span className="block lg:hidden"> Y reduce costos.</span>
        </h2>
        <div className="flex flex-wrap justify-center mx-auto gap-8 mt-6">
          <div className="flex  mb-10 ">
            <AnimatedTooltip items={people} />
          </div>
          <h2 className="hidden lg:block text-dark dark:text-white text-3xl lg:text-5xl font-bold text-center">
            Y reduce costos.
          </h2>
        </div>
      </ScrollReveal>
      <ScrollReveal>
        <Form method="post">
          <BigCTA
            className="mx-auto w-[180px]"
            type="submit"
            name="intent"
            value="google-login"
          />
        </Form>
      </ScrollReveal>
    </section>
  );
};
