import { cn } from "~/lib/utils"
import { motion } from "framer-motion"

export default function DashboardAyuda() {
  return(
    <section className="grid place-content-center h-full p-4 md:p-0">
    <div className="max-w-4xl py-8">
    <h2 className="text-2xl md:text-4xl heading text-center mb-8">¿Necesitas ayuda? 
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <HelpCard index={0} title="Introducción" image="https://mintlify.s3.us-west-1.amazonaws.com/chatbase/user-guides/quick-start/images/introduction/introduction-image-1.png"/>
      <HelpCard index={1} title="Tu primer chatbot ia" image="https://mintlify.s3.us-west-1.amazonaws.com/chatbase/user-guides/quick-start/images/introduction/introduction-image-1.png"/>
      <HelpCard index={2} className="col-span-1 md:col-span-2" title="Entrenamiento de agentes" image="https://mintlify.s3.us-west-1.amazonaws.com/chatbase/user-guides/quick-start/images/introduction/introduction-image-1.png"/>
      <HelpCard index={3} title="Integra WhatsApp a tu chatbot "  className="col-span-1 md:col-span-2" image="https://mintlify.s3.us-west-1.amazonaws.com/chatbase/user-guides/quick-start/images/introduction/introduction-image-1.png"/>
      <HelpCard index={4} title="Tu primer formmy" image="https://mintlify.s3.us-west-1.amazonaws.com/chatbase/user-guides/quick-start/images/introduction/introduction-image-1.png"/>
      <HelpCard index={5} title="Personaliza tu chatbot" image="https://mintlify.s3.us-west-1.amazonaws.com/chatbase/user-guides/quick-start/images/introduction/introduction-image-1.png"/>
      </div>
    </div>
    </section>
  )
}


export const HelpCard=({title,image,className,index = 0}: {title: string, image: string, className?: string, index?: number})=>{
  return(
    <motion.section 
      className={cn("flex flex-col justify-center h-full", className)}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      <motion.div 
        className="w-full h-32 md:h-40 rounded-2xl overflow-hidden border border-outlines"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.5,
          delay: index * 0.1 + 0.1,
          ease: [0.25, 0.1, 0.25, 1]
        }}
      >
        <img className="object-cover object-center  w-full h-full" src={image} alt="blog post" />
      </motion.div>
      <motion.h3 
        className="text-dark text-base md:text-lg heading mt-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: index * 0.1 + 0.2,
          ease: [0.25, 0.1, 0.25, 1]
        }}
      >
        {title}
      </motion.h3>
    </motion.section>
  )
}