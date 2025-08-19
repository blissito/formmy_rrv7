import { AnimatePresence } from "framer-motion";
import { type ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { IoIosArrowDown } from "react-icons/io";
import { ScrollReveal } from "~/components/ScrollReveals";

export const Faq = () => (
  <section className="max-w-[90%] xl:max-w-7xl mx-auto my-20 md:my-40">
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
            question="¿Puedo personalizar el diseño de mis formularios?"
            answer={
              <p>
                Sí, puedes personalizar los colores, textos y estilos de tus
                formularios para que combinen con la imagen de tu marca. Los
                planes GROW y PRO desbloquean opciones avanzadas de
                personalización.
              </p>
            }
          />
          <Question
            question="¿Cómo recibo las respuestas de mis formularios?"
            answer={
              <p>
                Todas las respuestas se almacenan en tu dashboard de Formmy y
                también puedes recibir notificaciones por correo electrónico
                cada vez que alguien complete un formulario.
              </p>
            }
          />

          <Question
            question="¿Con qué frameworks es compatible Formmy?"
            answer={
              <p>
                Es{" "}
                <span className="text-brand-500">
                  compatible con cualquier framework web
                </span>
                . Para agregar Formmy a tu sitio web, solo debes hacer el
                copy/paste de un iframe. 🥳 🤩
              </p>
            }
          />

          <Question
            question="¿Qué pasa si no puedo acceder a mi cuenta?"
            answer={
              <p>
                Si por algún motivo ya no tienes acceso al correo/cuenta con el
                que te registraste, escríbenos directamente a{" "}
                <a
                  href="mailto:hola@formmy.app"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="text-brand-500">hola@formmy.app</span>
                </a>{" "}
              </p>
            }
          />

          <Question
            question="¿Emiten factura fiscal?"
            answer={
              <p>
                Sí, despues de suscribirte al Plan PRO completa tus datos
                fiscales desde tu perfil - Administrar plan y te haremos llegar
                tu factura vía email, si tienes alguna duda escríbenos a{" "}
                <a
                  href="mailto:hola@formmy.app"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="text-brand-500">hola@formmy.app</span>
                </a>
              </p>
            }
          />
          <Question
            question="¿Cúal es la diferencia principal entre los planes Free, Starter, Pro y Enterprise?"
            answer={
              <>
                <p>Encuentra el plan que más te conviene:</p>
                <ul>
                  <li>
                    <strong>Free:</strong> Plan básico que incluye solo 3 formularios, 
                    0 chatbots, con trial de 60 días de acceso completo.
                  </li>
                  <li>
                    <strong>Starter ($149 MXN/mes):</strong> Incluye 2 chatbots, 
                    50 conversaciones mensuales con modelos GPT-5 Nano y Gemini 2.5 Flash-Lite.
                  </li>
                  <li>
                    <strong>Pro ($499 MXN/mes):</strong> Para quienes buscan más potencia,
                    incluye 10 chatbots, 250 conversaciones con Claude 3 Haiku.
                  </li>
                  <li>
                    <strong>Enterprise ($1,499 MXN/mes):</strong> Acceso ilimitado,
                    1000 conversaciones con GPT-5 Mini y Claude 3.5 Haiku.
                  </li>
                </ul>
                <p>
                  Cada plan está diseñado para acompañarte en el crecimiento de
                  tu negocio, desde tus primeros pasos hasta la automatización
                  avanzada con IA.
                </p>
              </>
            }
          />
        </div>
        <div className="flex flex-col gap-8">
          <Question
            question="¿Cuánto tiempo puedo permanecer en el Plan Free?"
            answer="Si no necesitas más de 3 formularios o chatbots IA, puedes quedarte en Free toda la vida sin pagar nada. Después del trial de 60 días, tendrás acceso solo a formularios básicos. 💸👴🏼"
          />
          <Question
            question="¿Cómo funciona el Chatbot IA?"
            answer={
              <>
                <p>
                  El chatbot IA de Formmy se integra fácilmente en tu sitio web
                  y responde automáticamente a las preguntas de tus visitantes,
                  guiándolos y captando leads sin que tengas que estar
                  conectado. Puedes personalizar sus respuestas, entrenarlo con
                  información de tu negocio y elegir el tono de comunicación.
                  Así, tu sitio ofrece atención 24/7 y una experiencia moderna y
                  eficiente para tus usuarios.
                </p>
              </>
            }
          />
          <Question
            question="¿Qué modelos utiliza el Chatbot IA?"
            answer={
              <>
                <p>
                  El Chatbot IA de Formmy utiliza modelos avanzados de lenguaje
                  natural: GPT-5 Nano y Gemini 2.5 Flash-Lite en el plan Starter,
                  Claude 3 Haiku en el plan Pro, y GPT-5 Mini con Claude 3.5 Haiku 
                  en el plan Enterprise. Siempre buscamos integrar la mejor
                  tecnología disponible para ofrecer respuestas útiles,
                  naturales y seguras en tu sitio web.
                </p>
              </>
            }
          />
          <Question
            question="¿Puedo probar el chatbot IA antes de pagar?"
            answer={
              <p>
                ¡Sí! El plan Free incluye acceso completo al chatbot IA por 60 días para
                que puedas probarlo y ver cómo ayuda a tus visitantes antes de
                decidir si quieres un plan superior.
              </p>
            }
          />
          <Question
            question="¿Formmy cumple con la protección de datos?"
            answer={
              <p>
                Sí, Formmy cumple con las normativas de protección de datos y
                privacidad. Tus datos y los de tus usuarios están seguros y
                nunca se comparten con terceros sin tu consentimiento.
              </p>
            }
          />

          <Question
            question="¿En qué idiomas puede responder el chatbot IA?"
            answer={
              <p>
                El chatbot IA de Formmy puede interactuar en varios idiomas,
                incluyendo español e inglés. Solo tienes que escribirle en el
                idioma que prefieras y responderá de manera natural.
              </p>
            }
          />
          <Question
            question="¿Puedo entrenar o personalizar el chatbot IA con información de mi negocio?"
            answer={
              <p>
                Sí, puedes personalizar el chatbot IA agregando información
                relevante sobre tu negocio, productos o servicios. Así, el bot
                podrá responder de forma más precisa y alineada a tus
                necesidades y las de tus clientes.
              </p>
            }
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
