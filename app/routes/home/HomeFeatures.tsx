import { cn } from "~/lib/utils";

export function HomeFeatures() {
  return (
    <section className="flex flex-col items-center  max-w-7xl px-4 md:px-[5%] xl:px-0 mx-auto 0">
    <h2 className="heading font-bold text-[#080923] text-3xl md:text-4xl lg:text-6xl text-center mb-4 mt-0 lg:leading-[1.2]">
      ¿Cansado de perder clientes por formularios rotos o chats complicados?
    </h2>
    <p className="paragraph text-gray-600 font-light text-lg md:text-xl md:text-2xl text-center mb-16">
      Agrega un chat que responde solo y formularios que sí funcionan.
    </p>
    <div>
      <ProductCardForms />
      <ProductCardChat />
    </div>
  </section>
  );
}


const ProductCardChat = () => {
    return(
        <div className=" w-full h-[380px] lg:h-[580px] mb-6 mt-0 md:mt-16  flex flex-wrap md:fles-nowrap items-center">
       
        <div className="p-6 md:p-12 w-full md:w-[50%] relative z-[1]">
          <h3 className="heading font-bold text-black text-3xl md:text-4xl lg:text-5xl mb-4">Formularios de contacto o suscripción</h3>
          <p className="paragraph text-neutral-900 text-lg md:text-2xl lg:text-2xl leading-6   lg:leading-10 mb-0 md:mb-8 ">Recibe mensajes de tus clientes sin perder ni uno solo. Personaliza campos, colores, tema y estilo con un par de clics.</p>
          <div className=" gap-2 grid grid-cols-2 gap-y-4">
            <BulletPoint text="Recibe mensajes de tus clientes sin perder ni uno solo" icon="done" />
            <BulletPoint text="Recibe mensajes de tus clientes sin perder ni uno solo" icon="done" />
            <BulletPoint text="Recibe mensajes de tus clientes sin perder ni uno solo" icon="done" />
            <BulletPoint text="Recibe mensajes de tus clientes sin perder ni uno solo" icon="done" />
          </div>
        </div>
        <div className="flex-1 w-[50%] flex justify-center items-center h-full relative z-10 bg-cloud rounded-[40px]">
          <img src="/home/video1.gif" alt="video1" className="h-[80%] rounded-2xl object-cover" />
        </div>
      </div>
    )
}

const ProductCardForms = () => {
  return (
    <div className=" w-full h-[380px] lg:h-[580px] mb-6 mt-0 md:mt-16  flex flex-wrap md:fles-nowrap items-center">
      <div className="flex-1 w-[50%] flex justify-center items-center h-full relative z-10 bg-cloud rounded-[40px]">
        <img src="/home/video1.gif" alt="video1" className="h-[80%] rounded-2xl object-cover" />
      </div>
      <div className="p-6 md:p-12 w-full md:w-[50%] relative z-[1]">
        <h3 className="heading font-bold text-black text-3xl md:text-4xl lg:text-5xl mb-4">Formularios de contacto o suscripción</h3>
        <p className="paragraph text-neutral-900 text-lg md:text-2xl lg:text-2xl leading-6   lg:leading-10 mb-0 md:mb-8 ">Recibe mensajes de tus clientes sin perder ni uno solo. Personaliza campos, colores, tema y estilo con un par de clics.</p>
        <div className=" gap-2 grid grid-cols-2 gap-y-4">
          <BulletPoint text="Recibe mensajes de tus clientes sin perder ni uno solo" icon="done" />
          <BulletPoint text="Recibe mensajes de tus clientes sin perder ni uno solo" icon="done" />
          <BulletPoint text="Recibe mensajes de tus clientes sin perder ni uno solo" icon="done" />
          <BulletPoint text="Recibe mensajes de tus clientes sin perder ni uno solo" icon="done" />
        </div>
      </div>
    </div>
  );
}

const BulletPoint = ({text, icon, className}: {text: string, icon: string, className?: string}) => {
  return (
    <div className="flex flex-col justify-start min-h-12 items-start gap-2">
    <span className={cn("rounded-full grid place-items-center bg-cloud h-12 !min-w-12", className)}>{icon}</span>
    <p className="paragraph text-neutral-900 text-lg md:text-xl ">{text}</p>
    </div>
  );
}
  