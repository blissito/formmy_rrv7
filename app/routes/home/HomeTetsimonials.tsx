import React, { useRef } from "react";
import { cn } from "~/lib/utils";
import { motion } from "framer-motion";

interface TestimonialCardProps {
  name: string;
  company: string;
  comment: string;
  img: string;
  className?: string;
  dragConstraints?: React.RefObject<HTMLDivElement | null>;
}

const TestimonialCard = React.forwardRef<HTMLDivElement, TestimonialCardProps>(
  ({ name, company, img, comment, className, dragConstraints }, ref) => {
  return (
    <motion.div 
      drag
      dragElastic={0.2}
      dragTransition={{ bounceStiffness: 100, bounceDamping: 20 }}
      whileDrag={{ scale: 1.02, zIndex: 10 }}
      dragConstraints={dragConstraints}
      className={cn(
        "cursor-grab bg-clear w-full md:w-[281px] h-fit rounded-3xl border border-outlines shadow p-6 flex flex-col justify-between",
        "active:cursor-grabbing hover:shadow-lg hover:border-primary/20",
        className
      )}
    >
      <div>
        <p className="paragraph text-metal text-[18px] mb-4">{comment}</p>
      </div>
      <div className="flex items-center gap-4 mt-4">
        <img 
          src={img} 
          alt={name} 
          className="w-10 h-10 rounded-full object-cover"
          loading="lazy"
        />
        <div>
          <div className="font-bold heading text-black text-[16px]">{name}</div>
          <div className="paragraph text-irongray text-[12px]">{company}</div>
        </div>
      </div>
    </motion.div>
  );
});

export default function HomeTestimonials() {
  const testimonials = [
    {
      name: "Rosalba Flores",
      company: "Collectum Datos",
      comment: "Como agencia de investigación, el chat de Formmy ha cambiado la interacción con los panelistas. Antes, nuestro tiempo se destinaba a resolver dudas sobre cómo completar encuestas. Ahora, hemos reducido ese tiempo en un 70%. Nuestros panelistas están más satisfechos y las tasas de finalización de encuestas han aumentado significativamente.",
      img: "https://i.imgur.com/RAiyJBc.jpg",
    },
    {
      name: "José Olmedo",
      company: "TiendaOnlinePro",
      comment: "La facilidad para crear formularios de suscripción y contacto ha superado mis expectativas. Lo que antes tomaba horas ahora lo hago en minutos.",
      img: "/home/jose.webp",    },
    {
      name: "Rocío Ortega",
      company: "Banquetería Rossy ",
      comment: "Desde que empece a usar Formmy en mi sitio web, las ventas aumentaron en un 45% y mis clientes están encantados, reciben respuestas rápidas y eficientes 24/7.",
      img: "/home/rocio.webp",
    },
    {
      name: "Eduardo Castillo",
      company: "Estudio Creativo Revolve",
      comment: "Los formularios personalizables me han ahorrado incontables horas de desarrollo. Ahora puedo ofrecer a mis clientes soluciones profesionales sin necesidad de programar una sola línea de código.",
      img: "/home/client.svg",
    },
    {
      name: "Mariana López",
      company: "Pithaya Agency",
      comment: "Como desarrolladora, he implementado Formmy en varios sitios de clientes y la experiencia siempre ha sido excelente. La configuración es rápida, la integración es limpia y no requiere ningún grado de complejidad, lo cual es ideal para proyectos donde se busca eficiencia sin sacrificar funcionalidad.",
      img: "https://i.imgur.com/FwjZ8X2.jpg",
    },
    {
      name: "Laura Ramírez",
      company: "Freelancer",
      comment: "He estado usando Formmy durante un año y su soporte al cliente es excepcional. La integración de sus herramientas en mi flujo de trabajo ha sido fluida y eficiente.",
      img: "/home/client.svg",
    },
    {
      name: "Brenda González",
      company: "FixterOrg",
      comment: "Como Freelancer, Formmy me ha permitido ofrecer a mis clientes su propio dashbaord para administrar sus mensajes de forma fácil y en tiempo real.",
      img: "https://i.imgur.com/TFQxcIu.jpg",
    },
    {
      name: "Abraham González",
      company: "Diseñador gráfico",
      comment: "Agregar Formmy a mi website personal fue rápido y fácil. Me encantaron los formularios y el chat IA. .",
      img: "/home/abraham.webp",
    },
  ];
  const constraintsRef = useRef<HTMLDivElement | null>(null);
  return (
    <div ref={constraintsRef} className="w-full h-fit overflow-hidden">
      <section className="max-w-7xl px-4 md:px-[5%] xl:px-0 mx-auto  h-fit">
      <h2 className="heading font-bold text-[#080923] text-3xl md:text-4xl lg:text-6xl text-center mb-4 mt-0 lg:leading-[1.2]">
        Únete a otros equipos que potencian sus negocios con IA
      </h2>
      <p className="paragraph text-gray-600 font-light text-lg md:text-xl md:text-2xl text-center mb-10 md:mb-16">
        Formularios + chat AI = menos trabajo, más resultados.
      </p>
      <div className="flex flex-wrap items-start justify-center h-fit lg:h-[800px] gap-8 ">
        <div className="flex flex-col gap-8">
          <TestimonialCard 
            ref={constraintsRef}
            dragConstraints={constraintsRef}
            name={testimonials[0].name}
            company={testimonials[0].company}
            comment={testimonials[0].comment}
            img={testimonials[0].img} />
          <TestimonialCard 
            ref={constraintsRef}
            dragConstraints={constraintsRef}
            name={testimonials[7].name}
            company={testimonials[7].company}
            comment={testimonials[7].comment}
            img={testimonials[7].img} />
        </div>
        <div className="flex flex-col gap-8">
          <TestimonialCard 
            ref={ref => {}}
            dragConstraints={constraintsRef}
            name={testimonials[2].name}
            company={testimonials[2].company}
            comment={testimonials[2].comment}
            img={testimonials[2].img} />
          <TestimonialCard 
            ref={ref => {}}
            dragConstraints={constraintsRef}
            name={testimonials[1].name}
            company={testimonials[1].company}
            comment={testimonials[1].comment}
            img={testimonials[1].img} />
        </div>
        <div className="hidden lg:flex flex-col gap-8">
          <TestimonialCard 
            ref={ref => {}}
            dragConstraints={constraintsRef}
            name={testimonials[4].name}
            company={testimonials[4].company}
            comment={testimonials[4].comment}
            img={testimonials[4].img} />
          <TestimonialCard 
            ref={ref => {}}
            dragConstraints={constraintsRef}
            name={testimonials[5].name}
            company={testimonials[5].company}
            comment={testimonials[5].comment}
            img={testimonials[5].img} />
      </div>

      <div className=" flex-col gap-8 hidden xl:flex">
          <TestimonialCard 
            ref={ref => {}}
            dragConstraints={constraintsRef}
            name={testimonials[6].name}
            company={testimonials[6].company}
            comment={testimonials[6].comment}
            img={testimonials[6].img} />
          <TestimonialCard 
            ref={ref => {}}
            dragConstraints={constraintsRef}
            name={testimonials[3].name}
            company={testimonials[3].company}
            comment={testimonials[3].comment}
            img={testimonials[3].img} />
      </div>
      </div>
    </section>
    </div>
  );
} 