export function Quote() {
    return (
        <section className="flex flex-col items-center text-center max-w-6xl px-4 md:px-[5%] xl:px-0 mx-auto 0 py-20 lg:py-32 ">
        <h3 className="text-7xl heading leading-[1.2]">
          "Nunca pensé que integrar un chatbot IA fuera{" "}
          <span style={{
            fontFamily: 'Kablammo, system-ui, sans-serif',
            background: '#9A99EA',
            color: '#191A20',
            padding: '8px 16px',
            borderRadius: '12px',
            display: 'inline-block',
            transform: 'rotate(-2deg)',
            boxShadow: '0 4px 8px rgba(138, 215, 201, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)',
            margin: '0 8px'
          }}>
            tan fácil
          </span>
          , Formmy lo hizo en minutos."
        </h3>
        <div className="border flex gap-2 border-outlines pl-2 py-2 pr-4 rounded-full mt-14">
          <img className="w-14 h-14 rounded-full object-contain" src="https://i.imgur.com/RAiyJBc.jpg" alt="Quote" />
          <div className="text-left flex flex-col items-left justify-center">
            <h3 className="heading text-dark">Rosalba Flores</h3>
            <p className="text-metal text-sm">Collectum Datos</p>
          </div>
        </div>
        </section>
    )
}