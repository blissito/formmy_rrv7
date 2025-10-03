interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Laura Mendoza",
    role: "Directora de Marketing",
    company: "E-commerce Plus",
    quote: "Nuestras suscripciones crecieron 3x desde que usamos Formmy. Los formularios se ven profesionales y son súper fáciles de implementar.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura"
  },
  {
    name: "Roberto Silva",
    role: "Fundador",
    company: "Consultoría Digital",
    quote: "Capturamos más leads que nunca. Los formularios personalizados generan mucha más confianza que los genéricos.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto"
  },
  {
    name: "Patricia Gómez",
    role: "Product Manager",
    company: "SaaS México",
    quote: "La integración fue instantánea. En 5 minutos ya teníamos formularios funcionando en todas nuestras landing pages.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Patricia"
  },
  {
    name: "Javier Torres",
    role: "CEO",
    company: "Agency Digital",
    quote: "Nuestros clientes aman lo fácil que es personalizar los formularios. Ya no necesitan contratar desarrolladores para cada cambio.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Javier"
  }
];

export function FormComments() {
  return (
    <section className="flex flex-col items-center max-w-7xl px-4 md:px-[5%] xl:px-0 mx-auto py-20 lg:py-32 relative">
      {/* Título sticky */}
      <div className="sticky top-[18vh] md:top-[20vh] lg:top-[24vh] z-10 text-center mb-32 px-4 pointer-events-none">
      <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold">
          Usuarios que aman
          <br />
          Formmy
        </h2>
      </div>

      {testimonials.map((testimonial, index) => {
        // Rotación alterna entre positiva y negativa
        const rotation = (index % 2 === 0 ? 1 : -1) * (2 + index * 0.5);

        return (
          <div
            key={index}
            className="relative w-full max-w-4xl mb-6 mt-0 md:mt-16 rounded-3xl bg-dark text-white p-8 shadow-2xl transition-all duration-500 sticky top-[32vh] lg:top-[50vh] z-20"
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {/* Avatar y nombre */}
            <div className="flex items-center gap-4 mb-6">
              <img
                src={testimonial.avatar}
                alt={testimonial.name}
                className="w-16 h-16 rounded-full border-2 border-cloud"
              />
              <div>
                <h3 className="text-lg md:text-xl font-bold">{testimonial.name}</h3>
                <p className="text-gray-400 text-xs md:text-sm">
                  {testimonial.role} at {testimonial.company}
                </p>
              </div>
            </div>

            {/* Quote */}
            <blockquote className="text-base md:text-lg leading-relaxed text-gray-300">
              "{testimonial.quote}"
            </blockquote>

            {/* Decoración de comillas */}
            <div className="absolute top-4 right-8 text-6xl text-cloud font-serif">
              "
            </div>
          </div>
        );
      })}
    </section>
  );
}