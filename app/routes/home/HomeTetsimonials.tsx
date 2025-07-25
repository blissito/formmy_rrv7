import React from "react";
import { cn } from "~/lib/utils";
const imgPersona = "https://images.pexels.com/photos/927451/pexels-photo-927451.jpeg";


function TestimonialCard({ className = "", testimonial }: { className?: string; testimonial: { name: string; company: string; comment: string; img: string } }) {
  return (
    <div className={cn("bg-clear w-full md:w-[281px] h-fit rounded-3xl shadow p-6 flex flex-col justify-between", className)}>
      <div>
        <p className="paragraph text-gray-600 text-[18px] mb-4">{testimonial.comment}</p>
      </div>
      <div className="flex items-center gap-4 mt-4">
        <img src={testimonial.img} alt={testimonial.name} className="w-10 h-10 rounded-full" />
        <div>
          <div className="font-bold heading text-black text-[16px]">{testimonial.name}</div>
          <div className="paragraph text-gray-600 text-[12px]">{testimonial.company}</div>
        </div>
      </div>
    </div>
  );
}

export default function HomeTestimonials() {
  const testimonials = [
    {
      name: "El pelusa",
      company: "E4pros",
      comment: "Uso Formmy desde hace 2 años, y me ha encantado, crear los formularios, personalizarlos con mi branding y agregarlos a mi sitio web ha sido muy fácil. Ahora voy a probar el Chat ia.",
      img: imgPersona,
    },
    {
      name: "La tecnología",
      company: "InnovaTech",
      comment: "He estado usando Formmy durante un año y su soporte al cliente es excepcional. La integración de sus herramientas en mi flujo de trabajo ha sido fluida y eficiente.",
      img: imgPersona,
    },
    {
      name: "Diseño minimalista",
      company: "Creativa",
      comment: "Formmy me ha permitido dar un giro fresco a mis proyectos. La facilidad de uso y las plantillas son impresionantes.",
      img: imgPersona,
    },
    {
      name: "E-commerce eficiente",
      company: "ShopMaster",
      comment: "Las funciones de análisis son muy robustas y me ayudan a entender mejor a mis clientes. Estoy emocionado de ver cómo puedo crecer con esta plataforma. Me han encantando todos los features.",
      img: imgPersona,
    },
    {
      name: "El pelusa",
      company: "E4pros",
      comment: "Uso Formmy desde hace 2 años, y me ha encantado, crear los formularios, personalizarlos con mi branding y agregarlos a mi sitio web ha sido muy fácil. Ahora voy a probar el Chat ia.",
      img: imgPersona,
    },
    {
      name: "La tecnología",
      company: "InnovaTech",
      comment: "He estado usando Formmy durante un año y su soporte al cliente es excepcional. La integración de sus herramientas en mi flujo de trabajo ha sido fluida y eficiente.",
      img: imgPersona,
    },
    {
      name: "Diseño minimalista",
      company: "Creativa",
      comment: "Formmy me ha permitido dar un giro fresco a mis proyectos. La facilidad de uso y las plantillas son impresionantes.",
      img: imgPersona,
    },
    {
      name: "E-commerce eficiente",
      company: "ShopMaster",
      comment: "Las funciones de análisis son muy robustas y me ayudan a entender mejor a mis clientes. Estoy emocionado de ver cómo puedo crecer con esta plataforma. Me han encantando todos los features.",
      img: imgPersona,
    },
  ];
  return (
    <section className="max-w-7xl px-4 md:px-[5%] xl:px-0 mx-auto my-20 md:my-40">
      <h2 className="heading font-bold text-[#080923] text-3xl md:text-4xl lg:text-6xl text-center mb-4 mt-0 lg:leading-[1.2]">
        Únete a otros equipos que potencian sus negocios con IA
      </h2>
      <p className="paragraph text-gray-600 font-light text-lg md:text-xl md:text-2xl text-center mb-10 md:mb-16">
        Formularios + chat AI = menos trabajo, más resultados.
      </p>
      <div className="flex flex-col flex-wrap h-fit lg:h-[700px] gap-y-6">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className={i < 4 ? "block" : "hidden md:block"}
          >
            <TestimonialCard testimonial={t} />
          </div>
        ))}
      </div>
    </section>
  );
} 