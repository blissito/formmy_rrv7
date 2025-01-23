import { BigCTA } from "../BigCTA";
import { StickyScroll } from "../ui/sticky-scroll-reveal";
import { Form } from "react-router";

export const StickySection = () => {
  return (
    <article className=" ">
      <div className="h-[60%]  " />
      <StickyScroll
        items={[
          {
            twColor: "dark:bg-[#0A0A0C] bg-[#ffffff]",
            img: (
              <img
                className="object-cover h-full w-full rounded-3xl border border-white/10"
                src="/assets/formmy-1.gif"
                alt="dashboard"
              />
            ),
            text: (
              <div>
                <p className="font-sans ">
                  Crear un Formmy es muy fácil desde el dashboard, solo da clic
                  en «+ Formmy» y bautiza tu primer Formmy 👻.{" "}
                </p>
                <p className="font-sans mt-4">
                  Puedes usar Formmy para crear formularios de contacto, de
                  registro para tus eventos, de suscripción y más.
                </p>
              </div>
            ),
            title: "Crea tu proyecto",
          },
          {
            twColor: "dark:bg-[#0A0A0C] bg-[#ffffff]",

            img: (
              <img
                className="object-cover h-full w-full rounded-3xl border border-white/10"
                src="/assets/formmy-2.gif"
                alt="personalizacion"
              />
            ),
            text: (
              <div>
                <p className="font-sans">
                  Activa los campos que quieres agregar a tu Formmy, selecciona
                  el tema ligth o dark, el estilo de los campos, el color del
                  botón principal e incluso personaliza la imagen, la animación
                  y el mensaje que verán tus clientes al completar el
                  formulario.
                </p>
                <div className="max-w-[180px] mt-12">
                  <Form method="post">
                    <BigCTA type="submit" name="intent" value="google-login" />
                  </Form>{" "}
                </div>
              </div>
            ),
            title: "Personaliza tu Formmy",
          },
          {
            twColor: "dark:bg-[#0A0A0C] bg-[#ffffff]",

            img: (
              <img
                className="object-cover h-full w-full rounded-3xl border border-white/10"
                src="/assets/formmy-3.gif"
                alt="formmy-gif"
              />
            ),
            text: (
              <div>
                <p className="font-sans">
                  Formmy es compatible con cualquier lenguaje, así que solo
                  tienes que copiar una línea de código y pégarla en el tu
                  proyecto.
                </p>{" "}
                <p className="font-sans mt-4">
                  Espera un poco y ¡Empieza a recibir mensajes de tus clientes!
                </p>
              </div>
            ),
            title: "Copia y pega en tu HTML o JSX",
          },
        ]}
      />
      <div className="h-[60%] bg-gray-900" />
    </article>
  );
};
