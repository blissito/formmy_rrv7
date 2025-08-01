import { Form } from "react-router";
import { BigCTA } from "~/components/BigCTA";
const imgWrite = "/img.png";
import { Button } from "~/components/Button";
import { ContainerScroll } from "~/components/home/ContainerScroll";


export default function HomeHero() {
  return (
    <section className="relative  flex flex-col items-center justify-center min-h-[700px] pt-40 md:pt-[240px] max-w-7xl px-4 md:px-[5%]  lg:px-0 mx-auto">
      <span>
        <div className="heading flex justify-center font-bold text-dark text-4xl md:text-5xl lg:text-[72px] text-center leading-none md:leading-tight flex-wrap gap-2">
          {"Formularios y chat AI".split(" ").map((word, idx) => (
            <span key={idx}>{word}</span>
          ))}
          <img alt="write" className="mx-2 w-10 md:w-16 lg:w-auto" src="/home/write.svg"/>
          {"para tu sitio web. Sin complicaciones.".split(" ").map((word, idx) => (
            <span key={idx + 100}>{word}</span>
          ))}
        </div>
      </span>
      <p className="paragraph text-gray-600 font-light text-xl md:text-2xl text-center mt-4 ">
        Integra en minutos y sin dolores de cabeza.
      </p>
      <div className="flex gap-4 mt-10">
        <Form method="post">
            <BigCTA type="submit" name="intent" value="google-login"  />
          </Form>
        <Button variant="secondary" className="mt-0">
          Ver planes
        </Button>
      </div>
      <ContainerScroll
      >
        <img
          src="/home/home.png"
          alt="hero"
          height={400}
          width={1400}
          className="mx-auto rounded-2xl object-cover h-full object-left-top"
          draggable={false}
        />
      </ContainerScroll>
    </section>
  );
} 