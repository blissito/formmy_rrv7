import React from "react";
import HomeHeader from "./home/HomeHeader";
import HomeFooter from "./home/HomeFooter";
import getBasicMetaTags from "~/utils/getBasicMetaTags";


export const meta = () =>
  getBasicMetaTags({
    title: "Términos y Condiciones | Formmy",
    description:
      "Consulta los Términos y Condiciones de Servicio de Formmy.",
  });

export default function Terms() {
  return (
    <section >
      <HomeHeader/>
      <div className="max-w-3xl mx-auto pb-20 pt-40 md:pt-52 px-4">
      <h2 className="text-3xl font-bold mb-6">Términos y Condiciones de Servicio de Formmy</h2>
      <p className="mb-4 text-sm text-gray-500">Última actualización: 13 de Agosto de 2025</p>
      <p className="mb-4">
        Este Acuerdo regula el acceso y uso de los servicios ofrecidos por Formmy (“Formmy”, “nosotros” o “nuestro”) por parte de sus clientes o usuarios (“Cliente” o “Usuario”), a través del sitio web y plataformas asociadas. Al utilizar cualquier Servicio de Formmy, usted acepta estos Términos y declara contar con capacidad legal conforme a la legislación de los Estados Unidos Mexicanos.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">1. Servicios Ofrecidos</h2>
      <p className="mb-2 font-semibold">a) Plataforma de Agentes Conversacionales con IA</p>
      <p className="mb-2">Una solución en la nube para crear, personalizar y desplegar chatbots con inteligencia artificial, utilizados principalmente en atención al cliente, ventas y automatización de procesos.</p>
      <p className="mb-2 font-semibold">b) Formularios de Contacto para Sitios Web ("Formularios Formmy")</p>
      <p className="mb-4">Un sistema que permite crear y personalizar formularios embebibles en sitios web, con funciones como recolección de datos, integraciones, notificaciones por correo electrónico y visualización de respuestas en un panel de control.</p>
      <p className="mb-4">Ambos servicios están cubiertos por este Acuerdo, y cualquier mención a “el Servicio” incluirá a uno o ambos, según corresponda.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">2. Registro y Acceso</h2>
      <p className="mb-4">Para utilizar el Servicio, el Cliente debe crear una cuenta y aceptar los términos comerciales aplicables al plan contratado. El acceso es exclusivo para el Cliente y sus usuarios autorizados. No está permitido revender, sublicenciar o compartir el acceso con terceros sin consentimiento expreso por escrito de Formmy.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">3. Contenido del Cliente</h2>
      <p className="mb-4">El Cliente es responsable de toda la información, configuraciones, respuestas, datos recolectados y cualquier otro contenido que cargue o genere mediante los Servicios (“Contenido del Cliente”). Formmy no se hace responsable del uso indebido o de la legalidad del contenido cargado por el Cliente o sus usuarios.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">4. Chatbots Formmy con IA: Condiciones Específicas</h2>
      <ul className="list-disc pl-6 mb-4">
        <li><b>Entrenamiento y Personalización:</b> El Cliente es responsable de definir el propósito, contenido, flujo de conversación y datos de entrenamiento de su agente. La precisión y utilidad del chatbot dependen directamente de estos elementos.</li>
        <li><b>Generación Automatizada de Contenido:</b> El Cliente entiende que las respuestas generadas por el agente de IA son automáticas, basadas en modelos de lenguaje entrenados, y no representan una asesoría profesional, legal, médica o financiera. Formmy no garantiza la exactitud ni pertinencia de las respuestas generadas.</li>
        <li><b>Responsabilidad sobre Interacciones:</b> El Cliente asume total responsabilidad por el uso del chatbot dentro de su sitio o canal, así como por cualquier efecto que las respuestas generadas puedan tener sobre sus usuarios finales.</li>
        <li><b>Privacidad y Datos Personales:</b> En caso de que el chatbot recolecte o procese información personal, el Cliente deberá asegurarse de obtener el consentimiento correspondiente, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares. Formmy no accede ni almacena de forma permanente los datos de las conversaciones, salvo cuando sea necesario para la prestación del Servicio o por obligación legal.</li>
        <li><b>Limitaciones del Servicio:</b> El sistema de IA no debe utilizarse para emitir diagnósticos, tomar decisiones críticas automatizadas sin supervisión humana, ni sustituir personal capacitado en funciones sensibles o de alto riesgo.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">5. Formularios Formmy: Condiciones Específicas</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Es responsable de los datos personales recabados a través de los formularios, incluyendo obtener el consentimiento expreso de los usuarios finales.</li>
        <li>Los formularios pueden contener campos personalizables, lógica condicional y conexiones con terceros (CRM, correo electrónico, etc.).</li>
        <li>Formmy no accede ni utiliza los datos recabados, salvo para prestar el Servicio y cumplir obligaciones legales.</li>
        <li>El Cliente es responsable del contenido de los formularios y su adecuación a la legislación en materia de protección de datos personales.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">6. Propiedad Intelectual</h2>
      <p className="mb-4">Todos los derechos sobre la plataforma, código, diseño, documentación y materiales asociados pertenecen exclusivamente a Formmy. El Cliente conserva la titularidad sobre su Contenido, pero otorga a Formmy una licencia limitada, no exclusiva y revocable para utilizarlo con el único fin de operar y mejorar el Servicio.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">7. Restricciones de Uso</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Reproducir, distribuir, sublicenciar o crear obras derivadas del Servicio sin autorización.</li>
        <li>Realizar ingeniería inversa o intentar acceder al código fuente.</li>
        <li>Utilizar el Servicio para actividades ilícitas, fraudulentas o que infrinjan derechos de terceros.</li>
        <li>Interferir con la seguridad o disponibilidad del Servicio.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">8. Integraciones con Terceros</h2>
      <p className="mb-4">El Servicio puede integrarse con herramientas de terceros (como WhatsApp, CRMs, servicios de correo, etc.). El uso de estos servicios se rige por los términos y condiciones de dichos proveedores. Formmy no se responsabiliza del funcionamiento, disponibilidad ni seguridad de servicios ajenos.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">9. Uso de Inteligencia Artificial</h2>
      <p className="mb-2 font-semibold">a) Modelos de IA</p>
      <p className="mb-4">El Servicio utiliza modelos de inteligencia artificial de terceros (incluyendo pero no limitado a GPT-4, Gemini, Claude, Kim y Mistral) para generar respuestas. La precisión y calidad de las respuestas pueden variar y no están garantizadas.</p>
      
      <p className="mb-2 font-semibold">b) Limitaciones de la IA</p>
      <ul className="list-disc pl-6 mb-4">
        <li>Las respuestas generadas por la IA son automáticas y podrían contener inexactitudes o sesgos.</li>
        <li>No se debe confiar en la IA para asesoramiento legal, médico, financiero o profesional.</li>
        <li>El Cliente es responsable de revisar y validar la precisión de las respuestas generadas.</li>
      </ul>

      <p className="mb-2 font-semibold">c) Uso Apropiado</p>
      <p className="mb-4">Queda estrictamente prohibido utilizar el servicio para:</p>
      <ul className="list-disc pl-6 mb-4">
        <li>Generar contenido ilegal, difamatorio, discriminatorio o dañino.</li>
        <li>Suplantar identidades o engañar a los usuarios sobre la naturaleza de la interacción.</li>
        <li>Realizar actividades que violen derechos de propiedad intelectual.</li>
        <li>Recopilar datos personales sin el consentimiento adecuado.</li>
      </ul>

      <p className="mb-2 font-semibold">d) Privacidad y Datos</p>
      <ul className="list-disc pl-6 mb-4">
        <li>Las conversaciones pueden ser procesadas para mejorar la calidad del servicio.</li>
        <li>Se pueden implementar medidas para monitorear y prevenir usos inapropiados.</li>
        <li>Los datos sensibles no deben ser compartidos a través del chat.</li>
      </ul>

      <p className="mb-2 font-semibold">e) Modificaciones del Servicio</p>
      <p className="mb-4">Nos reservamos el derecho de modificar o actualizar los modelos de IA en cualquier momento, lo que podría afectar el comportamiento de los chatbots existentes. Se notificarán los cambios significativos con antelación cuando sea posible.</p>

      <p className="mb-2 font-semibold">f) Limitación de Responsabilidad</p>
      <p className="mb-4">En la máxima medida permitida por la ley, Formmy no será responsable por daños directos, indirectos, incidentales o consecuentes resultantes del uso o la imposibilidad de usar el servicio de IA, incluyendo pero no limitado a pérdida de datos, ingresos o beneficios.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">10. Pagos y Facturación</h2>
      <p className="mb-4">El Cliente se obliga a pagar los montos correspondientes según el plan contratado, mediante los métodos habilitados. Los pagos no son reembolsables, salvo lo dispuesto por la legislación mexicana. La falta de pago podrá dar lugar a la suspensión o terminación del acceso al Servicio.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">11. Protección de Datos y Privacidad</h2>
      <p className="mb-4">Formmy cumple con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y demás normatividad aplicable en México. El Cliente es responsable de garantizar que cuenta con el consentimiento de sus usuarios finales para el tratamiento de datos personales mediante el Servicio. El tratamiento de datos por parte de Formmy se detalla en el Aviso de Privacidad disponible en nuestro sitio web.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">12. Confidencialidad</h2>
      <p className="mb-4">Ambas partes se comprometen a mantener la confidencialidad de la información no pública a la que tengan acceso con motivo del presente Acuerdo. Esta obligación subsistirá incluso después de la terminación de la relación comercial, salvo disposición legal en contrario.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">13. Garantías y Limitación de Responsabilidad</h2>
      <p className="mb-4">El Servicio se proporciona “tal cual” y sin garantías de disponibilidad, continuidad ni resultados específicos. Formmy no será responsable por daños indirectos, punitivos, especiales o consecuenciales derivados del uso del Servicio, salvo lo expresamente previsto por la ley mexicana.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">14. Modificaciones</h2>
      <p className="mb-4">Formmy se reserva el derecho de modificar estos Términos en cualquier momento. Los cambios serán notificados por correo electrónico o mediante el sitio web, y entrarán en vigor 30 días después de su publicación. El uso continuo del Servicio implicará su aceptación.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">15. Terminación</h2>
      <p className="mb-4">El Cliente podrá cancelar su cuenta en cualquier momento desde el panel de control. Formmy podrá suspender o terminar el acceso al Servicio por incumplimiento de estos Términos. Las cláusulas relativas a propiedad intelectual, confidencialidad, datos personales y limitación de responsabilidad continuarán vigentes tras la terminación.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">16. Ley Aplicable y Jurisdicción</h2>
      <p className="mb-4">Este Acuerdo se regirá por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia derivada del mismo, las partes se someten a la jurisdicción exclusiva de los tribunales competentes de la Ciudad de México, renunciando expresamente a cualquier otro fuero.</p>
   </div>
   <HomeFooter/>
    </section>
  );
}
