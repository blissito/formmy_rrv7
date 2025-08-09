import { twMerge } from "tailwind-merge";
import { type ChangeEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ScrollRevealLeft,
  ScrollRevealRight,
} from "~/components/ScrollReveals";

export const FormmysTypes = () => {
  return (
    <section className="min-h-screen w-[90%] xl:w-full  max-w-7xl mx-auto my-52 overflow-hidden">
      <h2 className=" text-dark dark:text-white text-3xl lg:text-5xl font-bold text-center">
        Personaliza tu formmy
      </h2>

      <div className="flex justify-between items-center flex-wrap lg:flex-nowrap w-full gap-12 lg:gap-0 mt-20 ">
        <div className="w-full lg:w-[50%] xl:w-[40%]">
          <ScrollRevealLeft>
            <h2 className=" text-dark dark:text-white text-2xl lg:text-3xl xl:text-4xl font-bold">
              Para formularios de contacto o registro
            </h2>
            <p className="text-lg lg:text-xl xl:text-2xl text-gray-600 dark:text-irongray font-extralight mt-6">
              <strong>Activa o agrega los campos para tu Formmy, </strong>{" "}
              personaliza el tema, el color y hasta el mensaje que verán tus
              usuarios al completar el formulario.
            </p>
            <p className="text-lg lg:text-xl xl:text-2xl text-gray-600 dark:text-irongray font-extralight mt-6">
              {" "}
              ¡Y lo mejor! Agrégalo a tu sitio web pegando{" "}
              <strong>una sola línea de código </strong>o compartélo
              directamente con tus clientes.
            </p>{" "}
          </ScrollRevealLeft>
        </div>
        <Registration />
      </div>
      <div className="flex flex-wrap-reverse lg:flex-nowrap justify-between items-center mt-20 xl:mt-40 gap-12 lg:gap-0">
        <Suscription />
        <div className="w-full lg:w-[50%] xl:w-[40%]">
          <ScrollRevealRight>
            <h2 className=" text-dark dark:text-white text-2xl lg:text-3xl xl:text-4xl font-bold">
              Para formularios de suscripción
            </h2>
            <p className="text-lg lg:text-xl xl:text-2xl text-gray-600 dark:text-irongray font-extralight mt-6">
              Formmy es tan flexible que puedes crear formularios de suscripción
              en un minuto, ya sean{" "}
              <strong>
                {" "}
                listas de espera o registros para tu newsletter.{" "}
              </strong>
            </p>
            <p className="text-lg lg:text-xl xl:text-2xl text-gray-600 dark:text-irongray font-extralight mt-6">
              Personaliza el tema y el color de tu formmy, agrégalo a tu sitio
              web y <strong>descarga tu lista de usuarios.</strong>
            </p>
          </ScrollRevealRight>
        </div>
      </div>
    </section>
  );
};

export const Registration = () => {
  const [switcher, setSwitcher] = useState({
    name: false,
    tel: false,
    message: false,
  });
  const update = (key: string, value: boolean) => {
    setSwitcher((obj) => {
      return { ...obj, [key]: value };
    });
  };

  return (
    <ScrollRevealRight className=" ">
      <section className="group w-full max-w-2xl scale-[.90] py-8  lg:pl-8 hidden  md:grid grid-cols-1 md:grid-cols-5 gap-6 relative">
        <span
          style={{ fontFamily: "Licorice" }}
          className="absolute text-brand-500  licorice-regular flex right-16 lg:right-0 xl:right-10 -top-3 md:top-10 opacity-100 group-hover:opacity-100 group-hover:scale-100 transition-all"
        >
          {" "}
          <img
            className=" w-12 rotate-[18deg] "
            src="/assets/doodle-arrow.svg"
            alt="arrow"
          />
          <img className="w-32 -mt-10 ml-2" src="/assets/text.svg" />
        </span>

        <div className="border-outlines bg-clear  dark:shadow-none order-2	md:order-1   rounded-[40px] border h-auto lg:h-[520px] overflow-hidden col-span-1 md:col-span-3 p-6 lg:p-4 xl:p-6">
          <h3 className="text-dark dark:text-[#D5D5D5] text-xl text-center">
            Completa el formulario
          </h3>
          <p className="text-gray-600 dark:text-irongray font-extralight mt-4 mb-4 text-center">
            Nos pondremos en contacto contigo lo antes posible
          </p>
          <div className="flex flex-col items-stretch gap-3 h-full ">
            <AnimatePresence mode="popLayout">
              <motion.input
                layout
                initial={{ opacity: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(4px)" }}
                placeholder="Email"
                className="text-gray-600  dark:text-white dark:active:border-brand-500 dark:focus:border-brand-500 bg-transparent border-iman  rounded-full border font-extralight mt-2 w-full focus:outline-none focus:ring-transparent  focus:border-brand-500 active:border-brand-500 active:outline-transparent"
              />
              {switcher.name && (
                <motion.input
                  layout
                  key="name"
                  initial={{ opacity: 0, filter: "blur(4px)", x: 20 }}
                  animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
                  exit={{ opacity: 0, filter: "blur(4px)", x: 20 }}
                  transition={{
                    type: "spring",
                    duration: 1,
                    bounce: 0.6,
                  }}
                  placeholder="Nombre completo"
                  className="text-gray-600 dark:text-white dark:active:border-brand-500 dark:focus:border-brand-500 bg-transparent border-iman  rounded-full border font-extralight mt-2 w-full focus:outline-none focus:ring-transparent  focus:border-brand-500 active:border-brand-500 active:outline-transparent"
                />
              )}
              {switcher.tel && (
                <motion.input
                  layout
                  key="tel"
                  initial={{ opacity: 0, filter: "blur(4px)", x: 20 }}
                  animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
                  exit={{ opacity: 0, filter: "blur(4px)", x: 20 }}
                  transition={{
                    type: "spring",
                    duration: 1,
                    bounce: 0.6,
                  }}
                  placeholder="Teléfono"
                  className="text-gray-600 dark:text-white dark:active:border-brand-500 dark:focus:border-brand-500 bg-transparent border-iman  rounded-full border font-extralight mt-2 w-full focus:outline-none focus:ring-transparent  focus:border-brand-500 active:border-brand-500 active:outline-transparent"
                />
              )}
              {switcher.message && (
                <motion.textarea
                  layout
                  key="message"
                  initial={{ opacity: 0, filter: "blur(4px)", x: 20 }}
                  animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
                  exit={{ opacity: 0, filter: "blur(4px)", x: 20 }}
                  transition={{
                    type: "spring",
                    duration: 1,
                    bounce: 0.6,
                  }}
                  placeholder="Mensaje"
                  className="text-gray-600 dark:text-white dark:active:border-brand-500 bg-transparent border-iman  rounded-2xl border font-extralight mt-2 w-full focus:outline-none focus:ring-transparent  focus:border-brand-500 active:border-brand-500 active:outline-transparent"
                />
              )}
              <motion.button
                layout
                key="btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  type: "spring",
                }}
                className="bg-brand-500 rounded-full h-10 w-full mt-10 text-clear"
              >
                Enviar
              </motion.button>
            </AnimatePresence>
          </div>
        </div>

        <div className="border-outlines bg-clear  dark:shadow-none order-1	md:order-2  rounded-[40px] border gap-6 p-6  justify-center h-[240px] mt-0 md:mt-20  overflow-hidden col-span-1 md:col-span-2 flex flex-col">
          <Check defaultValue={true} isDisabled label="Email" />
          <Check
            onChange={({
              target: { checked },
            }: ChangeEvent<HTMLInputElement>) => {
              update("name", checked);
            }}
            label="Nombre completo"
          />
          <Check
            onChange={({
              target: { checked },
            }: ChangeEvent<HTMLInputElement>) => {
              update("tel", checked);
            }}
            label="Teléfono"
          />
          <Check
            onChange={({
              target: { checked },
            }: ChangeEvent<HTMLInputElement>) => {
              update("message", checked);
            }}
            label="Mensaje"
          />
        </div>
      </section>
    </ScrollRevealRight>
  );
};

export const Check = ({
  label,
  onChange,
  defaultValue = false,
  isDisabled = false,
}: {
  label: string;
  onChange?: (arg0: ChangeEvent<HTMLInputElement>) => void;
  defaultValue?: boolean;
  isDisabled?: boolean;
}) => {
  return (
    <label
      htmlFor={label}
      className="text-dark dark:text-irongray font-light flex justify-between cursor-pointer"
    >
      <span> {label} </span>
      <input
        defaultChecked={defaultValue}
        disabled={isDisabled}
        onChange={onChange}
        className="bg-transparent  border-gray-300 dark:border-white/20 w-6 h-6 md:w-5 md:h-5 rounded checked:bg-[#EFC168] !focus:bg-[#EFC168] checked:focus:bg-[#EFC168] focus:ring-0 checked:hover:bg-[#EFC168]"
        type="checkbox"
        id={label}
        value="first_checkbox"
      />
    </label>
  );
};
export const Suscription = () => {
  const [color, setColor] = useState("#377CE2");

  return (
    <ScrollRevealLeft className=" ">
      <section className="group w-full  py-0 px-0 lg:py-8 lg:pr-8 flex flex-col md:flex-row lg:flex-col gap-6 relative max-w-2xl scale-[.8] md:scale-[.9]">
        <span
          style={{ fontFamily: "Licorice" }}
          className="absolute text-brand-500 licorice-regular flex flex-col right-16 lg:right-0 xl:right-10 -bottom-10 opacity-100  group-hover:opacity-100 group-hover:scale-100 transition-all"
        >
          {" "}
          <img
            className=" w-12 rotate-[90deg] "
            src="/assets/doodle-arrow.svg"
            alt="arrow"
          />{" "}
          <img className="w-24  ml-2" src="/assets/color-check.svg" />
        </span>
        <div className="border-outlines  dark:shadow-none  rounded-[40px] border flex h-[320px] lg:h-[400px] overflow-hidden ">
          <img
            className="w-[30%] lg:w-[50%] h-full object-cover object-center lg:object-right"
            src="https://images.pexels.com/photos/5386754/pexels-photo-5386754.jpeg?auto=compress&cs=tinysrgb&w=800"
          />
          <div className="w-full lg:w-[50%] px-4 py-4 xl:px-8 xl:py-10 bg-clear">
            <h3 className="text-dark dark:text-[#D5D5D5] text-lg lg:text-xl">
              Únete a la lista de espera
            </h3>
            <p className="text-gray-600 dark:text-irongray font-extralight mt-0 lg:mt-4 mb-3 md:mb-6 lg:mb-10 text-sm md:text-base ">
              Sé de los primeros en enterarte del lanzamiento del curso, y
              recibe un descuento especial.
            </p>
            <label className="text-gray-600  dark:text-[#D5D5D5]  ">
              Email
            </label>
            <input
              placeholder="ejemplo@formmy.app"
              className="text-gray-600 dark:text-white dark:active:border-brand-500 dark:focus:border-brand-500 bg-transparent border-iman  rounded-full border font-extralight mt-2 w-full focus:outline-none focus:ring-transparent  focus:border-brand-500 active:border-brand-500 active:outline-transparent"
            />
            <motion.button
              initial={{ backgroundColor: "blue" }}
              animate={{ backgroundColor: color }}
              className="rounded-full h-10 w-full mt-4 text-white "
            >
              Enviar
            </motion.button>
          </div>
        </div>
        <div className="border-outlines bg-clear shadow-[0px_2px_8px_#F8F7F7] dark:shadow-none  rounded-[40px] border flex flex-row md:flex-col lg:flex-row items-center px-4 lg:px-6 gap-3 lg:gap-6 h-14 md:h-fit md:py-6 lg:py-0 py-0 lg:h-20   ">
          <Color
            onClick={() => {
              setColor("#EB9F3A");
            }}
            className="bg-[#EB9F3A] "
          />
          <Color
            onClick={() => {
              setColor("#EFC168");
            }}
            className="bg-[#EFC168] "
          />
          <Color
            onClick={() => {
              setColor("#78A55D");
            }}
            className="bg-[#78A55D]"
          />
          <Color
            onClick={() => {
              setColor("#A57496");
            }}
            className="bg-[#A57496]"
          />
          <Color
            onClick={() => {
              setColor("#377CE2");
            }}
            className="bg-[#377CE2]"
          />
          <AnimatePresence mode="popLayout">
            <motion.span
              initial={{ filter: "blur(8px)" }}
              animate={{ filter: "blur(0px)" }}
              exit={{ filter: "blur(8px)" }}
              key={color}
              className="text-gray-600 dark:text-white/50"
            >
              {color}
            </motion.span>
          </AnimatePresence>
        </div>
      </section>
    </ScrollRevealLeft>
  );
};

const Color = ({
  className,
  onClick,
}: {
  className: string;
  onClick?: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={twMerge(
        "h-7 lg:h-8 xl:h-12 w-16 bg-red-400 rounded-2xl md:rounded-3xl cursor-pointer hover:scale-90 transition-all",
        className
      )}
    ></button>
  );
};
