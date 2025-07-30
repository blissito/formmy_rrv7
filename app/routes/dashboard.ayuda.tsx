import { cn } from "~/lib/utils"

export default function DashboardAyuda() {
  return(
    <section className="grid place-content-center h-full">
    <div className="max-w-4xl py-8">
    <h2 className="text-4xl heading text-center mb-8">¿Necesitas ayuda? 
    </h2>
    <div className="grid grid-cols-4 gap-6">
      <HelpCard  title="Introducción" image="https://mintlify.s3.us-west-1.amazonaws.com/chatbase/user-guides/quick-start/images/introduction/introduction-image-1.png"/>
      <HelpCard title="Tu primer chatbot ia" image="https://mintlify.s3.us-west-1.amazonaws.com/chatbase/user-guides/quick-start/images/introduction/introduction-image-1.png"/>
      <HelpCard className="col-span-2" title="Entrenamiento de agentes" image="https://mintlify.s3.us-west-1.amazonaws.com/chatbase/user-guides/quick-start/images/introduction/introduction-image-1.png"/>
      <HelpCard  title="Tu primer formmy" image="https://mintlify.s3.us-west-1.amazonaws.com/chatbase/user-guides/quick-start/images/introduction/introduction-image-1.png"/>
      <HelpCard className="col-span-2" title="Integra WhatsApp a tu chatbot" image="https://mintlify.s3.us-west-1.amazonaws.com/chatbase/user-guides/quick-start/images/introduction/introduction-image-1.png"/>
      <HelpCard title="Personaliza tu chatbot" image="https://mintlify.s3.us-west-1.amazonaws.com/chatbase/user-guides/quick-start/images/introduction/introduction-image-1.png"/>
      </div>
    </div>
    </section>
  )
}


export const HelpCard=({title,image,className}: {title: string, image: string, className?: string})=>{
  return(
    <section className={cn("grid place-content-center h-full", className)}>
      <div className="w-full h-40 rounded-2xl overflow-hidden border border-outlines">
        <img className="object-cover " src={image} alt="blog post" />
      </div>
      <h3 className="text-dark text-lg heading mt-2">{title}</h3>
    </section>
  )
}