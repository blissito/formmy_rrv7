export function ChatBanner() {
  const integrations = [
    { name: "Calendar", icon: "/home/calendar.svg" },
    { name: "Stripe", icon: "/home/stripe.svg" },
    { name: "Gmail", icon: "https://logo.clearbit.com/google.com" },
    { name: "Messenger", icon: "/home/messenger.svg" },
    { name: "WhatsApp", icon: "/home/whats.webp" }
  ];

  const features = [
    { icon: "🎙️", text: "Audio Based" },
    { icon: "🚫", text: "No Bots" },
    { icon: "👥", text: "In-person Meetings" },
    { icon: "💻", text: "Online Meetings" },
    { icon: "🎥", text: "All Video Conferencing Platforms" }
  ];

  return (
    <section className="w-full my-20">
      <div className="relative max-w-7xl mx-auto bg-gradient-to-br from-dark via-[#6969A5] to-dark text-white overflow-hidden rounded-3xl">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: "url('https://images.pexels.com/photos/3184160/pexels-photo-3184160.jpeg')"
          }}
        />

        <div className="relative px-4 md:px-[5%] xl:px-12 py-16 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Aprovecha el kit<br />
              de herramientas.<br />
            </h2>
            <p className="text-lg text-gray-300 max-w-md">
              Integra mensajerías como WhatsApp, Messenger o Instagram. Y configura formmy actions para automatizar procesos como enviar emails, generar links de pago o enviar mensajes automáticos.
            </p>
          </div>

          <div className="relative flex justify-center items-center min-h-[500px]">
            <div className="relative w-[400px] h-[500px] flex flex-col items-center justify-center -mt-10">
              {integrations.map((integration, index) => {
                // Tamaño escalonado: primera más pequeña, luego más grandes
                const sizes = [90, 100, 120, 140, 160];
                const size = sizes[index];

                // Rotaciones definidas alternando positivo/negativo
                const rotations = [18, -8, 20, 8, -5];
                const rotation = rotations[index];

                // Posicionamiento centrado para sobreposición
                const topPositions = [50, 120, 200, 280, 360];
                const leftPositions = [220, 140, 200, 100, 210];

                return (
                  <div
                    key={index}
                    className="absolute transition-all duration-300 hover:scale-110 hover:z-50"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      top: `${topPositions[index]}px`,
                      left: `${leftPositions[index]}px`,
                      transform: `rotate(${rotation}deg)`,
                      zIndex: index,
                    }}
                  >
                    <div
                      className="w-full h-full bg-white rounded-xl p-[10%] shadow-xl"
                      style={{
                        animation: `float ${3 + index * 0.5}s ease-in-out infinite`,
                      }}
                    >
                      <img
                        src={integration.icon}
                        alt={integration.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>
      </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
    </section>
  );
}