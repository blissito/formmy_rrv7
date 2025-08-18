
import HomeHeader from "./home/HomeHeader";
import HomeFooter from "./home/HomeFooter";
import getBasicMetaTags from "~/utils/getBasicMetaTags";

export const meta = () =>
  getBasicMetaTags({
    title: "Aviso de privacidad | Formmy",
    description:
      "Consulta el Aviso de Privacidad de Formmy.",
  });

export default function Aviso() {
  return (
    <section >
      <HomeHeader/>
      <section className="py-40 lg:max-w-6xl max-w-3xl mx-auto text-gray-600 px-4 md:px-0 ">
        <h2 className="text-dark dark:text-white text-4xl heading">
          Aviso de privacidad
        </h2>
        <p className="mb-4 text-sm text-gray-500">Última actualización: 13 de Agosto de 2025</p>

        <div className="mt-10 ">
        <p>
          FormmyApp, en cumplimiento con lo dispuesto por la Ley Federal de
          Protección de Datos Personales en Posesión de los Particulares, hace
          de su conocimiento el presente Aviso de Privacidad, a fin de
          informarle sobre el tratamiento que se dará a los datos personales que
          usted nos proporciona a través de nuestro sitio web
          https://www.formmy.app (en adelante, el “Sitio”).
        </p>
        <h3 className="font-title font-bold text-2xl text-dark mt-6">
          1. Identidad del Responsable
        </h3>
        <p className="mt-4">
          El responsable del tratamiento de sus datos personales es Formmy App
          (en adelante, “Formmy App”), quien los utilizará conforme a las
          finalidades establecidas en este Aviso.
        </p>
        <h3 className="font-title font-bold text-2xl text-dark mt-6">
          2. Datos personales que se recaban
        </h3>
        <p className="mt-4">
          Los datos personales que podremos recabar directamente de usted o a
          través del uso del Sitio son:
        </p>
        <ul className="mt-4">
          <li>&bull; Nombre completo</li>
          <li>&bull; Dirección de correo electrónico</li>
          <li>&bull; Historial de conversaciones en el chat</li>
          <li>&bull; Preferencias de interacción con la IA</li>
          <li>&bull; Datos de comportamiento en la plataforma</li>
        </ul>
        <h3 className="font-title font-bold text-2xl text-dark mt-6">
          3. Finalidades del tratamiento
        </h3>
        <p className="my-4">
          Sus datos personales serán tratados para las siguientes finalidades:
        </p>

        <p>Finalidades primarias: :</p>
        <ul className="mt-4">
          <li>&bull; Proveer los productos y servicios solicitados.</li>
          <li>&bull; Dar cumplimiento a obligaciones contractuales.</li>
          <li>
            &bull; Contactarlo para dar seguimiento a servicios, soporte técnico
            o aclaraciones.
          </li>
          <li>&bull; Facturación y cobro de servicios.</li>
          <li>
            &bull; Envío de actualizaciones o avisos importantes sobre el
            servicio.
          </li>
        </ul>
        <br/>
        <p>Finalidades secundarias:</p>
        <ul className="mt-4">
          <li>
            &bull; Envío de promociones, boletines informativos y comunicaciones
            de marketing.
          </li>
          <li>
            &bull; Realización de encuestas de satisfacción y estudios de
            mercado.
          </li>
  
          <li>
            &bull; Análisis de interacciones para mejorar la precisión y relevancia de las respuestas de la IA.
          </li>
        </ul>
        <p className="mt-4">
          Si no desea que sus datos se utilicen para finalidades secundarias,
          puede manifestarlo enviando un correo a: hola@formmy.app
        </p>
        <h3 className="font-title font-bold text-2xl text-dark mt-6">
          4. Uso de cookies y tecnologías de rastreo
        </h3>
        <p className="my-4">
          Nuestro Sitio no utiliza cookies, web beacons u otras tecnologías
          similares para monitorear su comportamiento como usuario de Internet.
          La única cookie que utilizamos es para verificar al usuario y mantener
          su sesión abierta en el navegador.
        </p>
        <h3 className="font-title font-bold text-2xl text-dark mt-6">
          5. Procesamiento de Datos por IA
        </h3>
        <p className="my-4">
          Sus interacciones con nuestros asistentes de IA pueden implicar el procesamiento de sus datos personales por parte de modelos de inteligencia artificial de terceros. Estos datos se utilizan únicamente para:
        </p>
        <ul className="mt-4">
          <li>&bull; Generar respuestas a sus consultas</li>
          <li>&bull; Mejorar la precisión y relevancia de las interacciones</li>
        </ul>
        <p className="mt-4">
          Tomamos medidas para anonimizar los datos siempre que sea posible y no utilizamos su información para entrenar modelos de IA de terceros sin su consentimiento explícito.
        </p>
        <p className="mt-4 font-semibold">
          Importante: No nos hacemos responsables por el uso de datos realizado por los modelos de IA de terceros que usted seleccione para su chatbot. Cada proveedor de IA tiene sus propias políticas de privacidad y términos de servicio que rigen el manejo de datos. Le recomendamos revisar las políticas de privacidad de los modelos de IA que elija utilizar a través de nuestra plataforma.
        </p>

        <h3 className="font-title font-bold text-2xl text-dark mt-6">
          6. Transferencias de datos
        </h3>
        <p className="my-4">
          Sus datos personales no serán transferidos a terceros sin su
          consentimiento, salvo en los casos permitidos por la ley, como a
          proveedores que prestan servicios en nuestro nombre bajo cláusulas de
          confidencialidad.
        </p>
        <h3 className="font-title font-bold text-2xl text-dark mt-6">
          7. Derechos ARCO
        </h3>
        <p className="my-4">Usted tiene derecho a:</p>
        <ul className="mt-4">
          <li>&bull; Acceder a sus datos personales.</li>
          <li>&bull; Rectificarlos si son inexactos o incompletos.</li>
          <li>
            &bull; Cancelarlos cuando considere que no se requieren para las
            finalidades señaladas.
          </li>
          <li>
            &bull; Oponerse al tratamiento de los mismos para fines específicos.
          </li>
        </ul>
        <p className="mt-4">
          Puede ejercer sus derechos ARCO enviando un correo electrónico a
          hola@formmy.app, indicando su nombre completo, la relación que
          tiene con nosotros, el derecho que desea ejercer y una descripción
          clara de su solicitud.
        </p>
        <h3 className="font-title font-bold text-2xl text-dark mt-6">
          8. Seguridad de los Datos
        </h3>
        <p className="my-4">
          Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger sus datos personales, incluyendo:
        </p>
        <ul className="mt-4">
          <li>&bull; Cifrado de extremo a extremo para las conversaciones</li>
          <li>&bull; Control de acceso basado en roles</li>
          <li>&bull; Monitoreo continuo de seguridad</li>
        </ul>
        <p className="mt-4">
          A pesar de estas medidas, ninguna transmisión por Internet o almacenamiento electrónico es 100% segura. Le recomendamos no compartir información sensible a través del chat.
        </p>

        <h3 className="font-title font-bold text-2xl text-dark mt-6">
          9. Cambios al Aviso de Privacidad
        </h3>
        <p className="my-4">
          Nos reservamos el derecho de modificar este Aviso de Privacidad en
          cualquier momento. Las modificaciones estarán disponibles en el Sitio
          en la sección correspondiente. Se recomienda revisarlo periódicamente.
        </p>
        <h3 className="font-title font-bold text-2xl text-dark mt-6">
          10. Contacto
        </h3>
        <p className="my-4">
          Para cualquier duda, comentario o solicitud relacionada con el
          presente Aviso de Privacidad, puede contactarnos en:
        </p>
        <p>
          📧 Correo electrónico:{" "}
          <a
            href="mailto:hola@formmy.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 transition-all underline"
          >
         hola@formmy.app
          </a>
        </p>
        <p>
          🌐 Sitio web:{" "}
          <a
            href="www.formmy.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 transition-all underline"
          >
            https://www.formmy.app
          </a>
        </p>
        <p></p>
      </div>
</section>
<HomeFooter/>
    </section>
  );
}
