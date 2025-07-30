import { Button } from "~/components/Button";
import AiIcon from "~/components/ui/icons/AiIcon";
import BookIcon from "~/components/ui/icons/Book";
import DiagramIcon from "~/components/ui/icons/Diagram";
import PartyIcon from "~/components/ui/icons/Party";
import PresentationIcon from "~/components/ui/icons/Presentation";
import { cn } from "~/lib/utils";

export default function DashboardGhosty() {
  return(
    <section className="grid place-content-center h-full">
    <div className="max-w-3xl">
    <h2 className="text-4xl heading text-center mb-6">¡Hola! Conoce a <span className="text-brand-500">Ghosty IA 👻</span>
    </h2>
    <IAInput/>
    <div className="grid grid-cols-2 gap-4 mt-8">
      <ShortCutAi className="bg-bird" title="Genera un reporte de..." description="Interacciones, mensajes, etc." icon={<DiagramIcon className="w-10 h-10 mt-1 ml-1" />}/>
      <ShortCutAi className="bg-salmon" title="Lo nuevo en Formmy ✨" description="features, noticias, estrenos." icon={<PartyIcon className="w-10 h-10 mt-1 ml-1" />}/>
      <ShortCutAi className="bg-grass" title="Explícame..." description="como funcionan los agentes." icon={<BookIcon className="w-10 h-10 mt-1 ml-1" />}/>
      <ShortCutAi className="bg-sky" title="Haz un resumen de..." description="las preguntas más comunes." icon={<PresentationIcon className="w-10 h-10 mt-1 ml-1" />}/>
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
    <div className="flex items-center gap-3 border border-outlines bg-[#FCFDFE] rounded-2xl overflow-hidden p-4 hover:bg-brand-100/40 cursor-pointer">
      <div className={cn("w-10 h-10 md:min-w-12 md:min-h-12 text-4xl rounded-xl grid place-content-center", className)}>
        {icon}
      </div>
      <div>
      <span className="text-dark font-semibold">{title}</span>
      <p className="text-irongray text-sm">{description}</p>
      </div>
    </div>
  );
}