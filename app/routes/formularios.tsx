import HomeHeader from "./home/HomeHeader";
import HomeFooter from "./home/HomeFooter";
import { GeneralCallToAction } from "./home/HomeCallToAction";
import { CompaniesScroll } from "~/components/home/CompaniesScroll";
import { WitoutFormmy } from "~/components/home/WithoutFormmy";
import { FullBanner } from "./home/FullBanner";
import { Registration, Suscription } from "~/components/home/FormmysTypes";
import { Steper } from "~/components/Steper";
import { FullComment } from "~/components/common/FullComment";
import getBasicMetaTags from "~/utils/getBasicMetaTags";

export const meta = () =>
  getBasicMetaTags({
    title: "Crea formularios para tu sitio web sin código | Formmy",
    description:
      "Genera formularios de contacto, registro o listas de espera y agrégalos fácilmente a tu sitio web sin programar",
  });

function CardDemoIA({
  gradient,
  content,
  title,
  description,
}: {
  gradient: string;
  content?: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className={`flex-1  `}>
      <div
        className={` rounded-3xl p-8 flex flex-col items-center shadow-lg h-[280px] md:h-[320px] relative overflow-hidden ${gradient}`}
      >
        {content}
      </div>
      <h3 className="font-bold text-xl md:text-2xl text-center mb-2 text-dark mt-6 md:mt-8">
        {title}
      </h3>
      <p className="text-gray-700 text-center text-base md:text-lg">
        {description}
      </p>
    </div>
  );
}

export default function Formularios() {
  const stepsWithImages = [
    {
      title: "Crea un proyecto",
      desc: "Ve a tu Dashboard y da clic en la pestaña de «Formmys».",
      image: "/home/form-steper-1.webp",
    },
    {
      title: "Selecciona el tipo de Formmy",
      desc: " Da clic en «+ Formmy», bautiza tu primer Formmy y elige el tipo de Formmy que necesitas: formulario de contacto y de suscripción.",
      image: "/home/form-steper-2.webp",
    },
    {
      title: "Personaliza tus campos, colores y estilos",
      desc: "Activa o agrega los campos para tu Formmy, personaliza el tema, el color principal y el estilo de tus inputs.",
      image: "/home/form-steper-3.webp",
    },
    {
      title: "Escribe el mensaje final",
      desc: "Ponle tu estilo al mensaje que verán tus usuarios al completar el formulario.",
      image: "/home/form-steper-4.webp",
    },
    {
      title: "Copia y pega en tu HTML o JSX",
      desc: "Formmy es compatible con cualquier lenguaje, así que solo tienes que copiar una línea de código y pegarla en tu proyecto. ¡Y listo! ¡Empieza a recibir mensajes de tus clientes!",
      image: "/home/form-steper-5.webp",
    },
  ];

  return (
    <main className="bg-clear pt-40 md:pt-64 overflow-hidden">
      <HomeHeader />
      <section className="max-w-4xl mx-auto px-4 md:px-[5%] xl:px-0">
        <h1 className="heading font-bold text-dark text-3xl md:text-4xl lg:text-6xl text-center mb-4 mt-0 lg:leading-[1.2]">
          Formmys para tu sitio web
        </h1>
        <p className="paragraph text-gray-600 font-light text-lg md:text-xl md:text-2xl  text-center mb-4 md:mb-0">
          Crea formularios personalizados para tu sitio web, recopila
          información de tus usuarios y gestiona tus datos de manera sencilla y
          segura con Formmy.
        </p>
      </section>
      <section>
        <div className="flex flex-col items-center  max-w-7xl mx-auto w-full mb-0 md:mb-10 px-4 md:px-[5%] xl:px-0">
          <div className="flex  flex-col md:flex-row items-center justify-around w-full gap-10 md:gap-20 relative">
            <div className="relative z-10 rotate-0 md:-rotate-3  ">
              <Suscription />
              <div className="absolute left-0 bottom-16 rotate-45 w-52 h-52 bg-brand-100 rounded-3xl -z-10" />
            </div>
            {/* Imagen central */}
            <div className="relative z-10 rotate-0 md:rotate-3 hidden md:block ">
              <Registration />
              <div className="absolute left-1/2 top-40 rotate-45 w-52 h-52 bg-brand-100 rounded-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>
      <CompaniesScroll />
      <section
        id="cards"
        className="w-full max-w-7xl mx-auto my-20 md:my-40 px-4"
      >
        <h2 className="text-3xl md:text-4xl lg:text-5xl  font-bold text-center mb-10 md:mb-16 text-dark">
          Por qué debes probar Formmy
        </h2>
        <div className="flex flex-col md:flex-row gap-10 md:gap-8 justify-center items-stretch">
          <CardDemoIA
            gradient="bg-[#FBE05D]"
            content={
              <div className=" h-full place-content-center">
                <img className=" object-contain h-full" src="/home/bento1.webp" />
              </div>
            }
            title="Compatible con cualquier framework"
            description="Formmy es compatible con cualquier framework, puedes agregarlo a tu sitio web usando el SDK, el iframe o el link directo."
          />
          <CardDemoIA
            gradient="bg-[#76D3CB]"
            content={
              <div className="w-full h-full grid place-content-center">
                <img className="h-full" src="/home/bento2.webp" />
              </div>
            }
            title="Fácil y rápido de configurar"
            description="Crea tu Formmy en menos de 5 minutos, sin código, sin complicaciones y sin tecnicismos. Solo unos clics y listo."
          />
          <CardDemoIA
            gradient="bg-[#DF7CB0]"
            content={
              <div className="w-full h-full absolute left-10 top-0 grid place-content-center">
                <img className="!w-[180%]" src="/home/bento3.webp" />
              </div>
            }
            title="Personlizable"
            description="Olvídate de los formularios genéricos. Con Formmy personaliza los campos, colores y estilo para que todo refleje tu marca."
          />
        </div>
      </section>
      <WitoutFormmy />
        <section className="grid-cols-2 max-w-7xl mx-auto px-4 ">
             <FullComment
               className="bg-[#FBE05D]"
               image="https://i.imgur.com/FwjZ8X2.jpg"
               client="Mariana López"
               comment={<div className="flex flex-col gap-2">
               <p>Como desarrolladora, he implementado Formmy en varios sitios de clientes y la experiencia siempre ha sido excelente. La configuración es rápida, la integración es limpia y no requiere ningún grado de complejidad, lo cual es ideal para proyectos donde se busca eficiencia sin sacrificar funcionalidad.
               </p>
               <p>Mis clientes han quedado encantados con la facilidad de uso y la fiabilidad del servicio. Además, el diseño del dashboard es intuitivo y profesional.</p>
              <p>Formmy destaca por su simplicidad bien pensada. Lo recomiendo totalmente para quienes buscan una solución sólida y rápida para formularios.</p>
               </div>}
               clientCompany="Pithaya Agency"
             />
      </section>
      <section
        id="steper"
        className="w-full md:min-h-fit max-w-7xl mx-auto my-20 md:my-40 px-4 md:px-[5%] xl:px-0 min-h-[700px]"
      >
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-dark">
          Crea tu primer Formmy con un par de clics
        </h3>
        <Steper
          steps={stepsWithImages.map(({ title, desc }) => ({ title, desc }))}
          renderRight={(selectedStep) => (
            <img
              src={stepsWithImages[selectedStep].image}
              alt={stepsWithImages[selectedStep].title}
              className=" max-h-fit md:max-h-[400px] max-w-full object-contain rounded-2xl shadow-lg"
            />
          )}
          autoAdvanceMs={10000}
        />
      </section>

      <GeneralCallToAction />
      <HomeFooter />
    </main>
  );
}
