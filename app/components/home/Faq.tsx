import { AnimatePresence } from "framer-motion";
import { type ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { IoIosArrowDown } from "react-icons/io";
import { ScrollReveal } from "~/routes/_index";

export const Faq = () => (
  <section className="max-w-[90%] xl:max-w-7xl mx-auto pt-[80px]">
    <h2 className=" text-dark dark:text-white text-3xl lg:text-5xl font-bold text-center">
      {" "}
      Preguntas frecuentes
    </h2>
    <ScrollReveal>
      <div className="mt-12 lg:mt-20 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 ">
        <div className="flex flex-col gap-8">
          <Question
            question="¿Qué tipo de formularios puedo crear con Formmy?"
            answer="Puedes usar Formmy para formularios de contacto, formularios para eventos, o formularios de suscriptores. ¡Tú decides como usarlo!  "
          />
          <Question
            question="¿Con qué frameworks es compatible Formmy?"
            answer={
              <p>
                Es{" "}
                <span className="text-white/80">
                  compatible con cualquier framework web
                </span>
                . Para agregar Formmy a tu sitio web, solo debes hacer el
                copy/paste de un iframe. 🥳 🤩
              </p>
            }
          />
          <Question
            question="¿Cuánto tiempo puedo permanecer en el Plan FREE?"
            answer="Si no piensas tener más de 3 proyectos y no necesitas acceder a las funcionalidades PRO, puedes quedarte en FREE toda la vida sin pagar nada. 💸👴🏼"
          />
        </div>
        <div className="flex flex-col gap-8">
          <Question
            question="¿Cúal es la diferencia entre el Plan FREE y PRO?"
            answer="¡El Plan PRO desbloquea más funcionalidades de Formmy! Como más opciones de personalización, imagenes extra para el mensaje final, campos personalizados, notificaciones específicas, la opción de agregar colaboradores al proyecto, mensajes ilimitados y remosión de la marca de agua."
          />
          <Question
            question="¿Emiten factura fiscal?"
            answer="Sí, despues de suscribirte al Plan PRO completa tus datos fiscales desde tu perfil>Administrar plan y te haremos llegar tu fatura vía email, si tienes alguna duda escríbenos a hola@formmy.app"
          />
          <Question
            question="¿Qué pasa si no puedo acceder a mi cuenta?"
            answer="Si por algún motivo ya no tienes acceso al correo/cuenta con el que te registraste, escríbenos directamente a hola@formmy.app "
          />
        </div>
      </div>
    </ScrollReveal>
  </section>
);

export const Question = ({
  question,
  answer,
}: {
  question: string;
  answer: ReactNode;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-iman dark:border-lightgray   border-[1px] rounded-2xl">
      <button
        className="w-full px-6 py-6 text-lg md:text-xl font-medium text-left flex justify-between items-center"
        onClick={() => {
          setOpen((o) => !o);
        }}
      >
        <p className="w-[90%]  text-dark dark:text-[#D5D5D5] ">{question}</p>
        {open ? (
          <IoIosArrowDown className="rotate-180 transition-all text-dark dark:text-[#D5D5D5]" />
        ) : (
          <IoIosArrowDown className="transition-all text-dark dark:text-[#D5D5D5]" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
          >
            <p className="text-lg text-gray-600 dark:text-irongray font-extralight px-6 pb-8">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
