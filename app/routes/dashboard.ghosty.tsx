import { Button } from "~/components/Button";
import AiIcon from "~/components/ui/icons/AiIcon";
import BookIcon from "~/components/ui/icons/Book";
import DiagramIcon from "~/components/ui/icons/Diagram";
import PartyIcon from "~/components/ui/icons/Party";
import PresentationIcon from "~/components/ui/icons/Presentation";
import { cn } from "~/lib/utils";

export default function DashboardGhosty() {
  return(
    <section className={cn("grid place-content-center min-h-[calc(100vh-156px)] p-4", "md:p-2 md:h-full")}>
    <div className="max-w-3xl">
    <h2 className={cn("text-2xl heading text-center mb-6", "md:text-4xl")}>¡Hola! Conoce a <span className="text-brand-500">Ghosty IA 👻</span>
    </h2>
    <IAInput/>
    <div className="grid grid-cols-2 gap-4 mt-8">
      <ShortCutAi className="bg-bird" title="Genera un reporte de..." description="Interacciones, mensajes, etc." icon={<DiagramIcon className="md:w-10 md:h-10 w-6 h-6 md:mt-1 md:ml-1 mt-0 ml-0" />}/>
      <ShortCutAi className="bg-salmon" title="Lo nuevo en Formmy ✨" description="features, noticias, estrenos." icon={<PartyIcon className="md:w-10 md:h-10 w-6 h-6 md:mt-1 md:ml-1 mt-[2px] ml-[2px]" />}/>
      <ShortCutAi className="bg-grass" title="Explícame..." description="como funcionan los agentes." icon={<BookIcon className="md:w-10 md:h-10 w-6 h-6 md:mt-1 md:ml-1 mt-0 ml-0" />}/>
      <ShortCutAi className="bg-cloud" title="Haz un resumen de..." description="las preguntas más comunes." icon={<PresentationIcon className="md:w-10 md:h-10 w-6 h-6 md:mt-1 md:ml-1 mt-[2px] ml-[2px]" />}/>
     </div>
    </div>
  </section>
  )
}


const IAInput=()=>{
  return(
    <div className="border border-outlines rounded-full w-full h-14 overflow-hidden flex justify-between items-center px-3">
    <input className="border-none placeholder:text-lightgray text-dark h-12 focus:border-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:shadow-none text-base w-full" type="text" placeholder="Ayúdame a configurar mi chat bot..." />
    <Button className="h-10 mt-0">Enviar</Button>
    </div>
  )
}


const ShortCutAi = ({
  className, title, description, icon
}: {
  className?: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className={cn("flex flex-col items-start gap-2 border border-outlines bg-[#FCFDFE] rounded-2xl overflow-hidden   p-2 hover:bg-brand-100/40 cursor-pointer", "md:flex-row md:items-center md:gap-3 md:p-4")}>
      <div className={cn("w-6 h-6 text-4xl rounded grid place-content-center", "md:rounded-xl md:min-w-12 md:min-h-12", className)}>
        {icon}
      </div>
      <div>
      <span className="text-sm md:text-base text-dark font-semibold">{title}</span>
      <p className="text-irongray text-xs md:text-sm">{description}</p>
      </div>
    </div>
  );
}