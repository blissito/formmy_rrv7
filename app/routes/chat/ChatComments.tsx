interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    name: "María García",
    role: "Directora de Marketing",
    company: "TechMéxico",
    quote: "Formmy transformó nuestra atención al cliente. Ahora respondemos 24/7 sin contratar más personal.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria"
  },
  {
    name: "Carlos Rodríguez",
    role: "Fundador",
    company: "StartupLatam",
    quote: "La integración con WhatsApp fue increíble. Nuestras ventas aumentaron 40% en el primer mes.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos"
  },
  {
    name: "Ana López",
    role: "Gerente de Operaciones",
    company: "Comercio Digital",
    quote: "Dejamos de perder clientes por responder tarde. El chatbot captura leads incluso cuando dormimos.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana"
  },
  {
    name: "Diego Martínez",
    role: "CEO",
    company: "SaaS Solutions",
    quote: "La mejor inversión que hicimos este año. Se pagó sola en menos de 2 meses con el aumento de conversiones.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diego"
  }
];

export default function ChatComments() {
  return (
    <section className="flex flex-col items-center max-w-7xl px-4 md:px-[5%] xl:px-0 mx-auto py-16 lg:py-32">
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
                <h3 className="text-xl font-bold">{testimonial.name}</h3>
                <p className="text-gray-400 text-sm">
                  {testimonial.role} at {testimonial.company}
                </p>
              </div>
            </div>

            {/* Quote */}
            <blockquote className="text-lg leading-relaxed text-gray-300">
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