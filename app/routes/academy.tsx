import Nav from "~/components/NavBar";
import { BsPersonVideo2 } from "react-icons/bs";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { useLoaderData } from "react-router";
import { getUserOrNull } from "server/getUserUtils.server";
import type { Route } from "./+types/academy";
import HomeHeader from "./home/HomeHeader";
import HomeFooter from "./home/HomeFooter";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrNull(request);
  return {
    user,
  };
};
export default function academy() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <>
      <HomeHeader />
        <section className="pb-20 md:pb-40 pt-40 md:pt-64 px-4 md:px-0 lg:max-w-6xl max-w-3xl mx-auto text-space-500 dark:text-space-300">
          <h2 className="text-3xl md:text-5xl text-space-800 dark:text-white font-semibold">
            Formmy Academy
          </h2>
          <p className="text-lg md:text-2xl text-metal font-light w-full md:w-[700px] mt-4">
            Empieza a utilizar Formmy en tu sitio web. Agregalo fácilmente a tu
            HTML o a tu proyecto de React, Wordpress, Angular, o más.{" "}
          </p>
          <div className="flex flex-col gap-10 md:gap-8 mt-16">
            <Card
              title="Crea tu primer Formmy"
              description="Empieza a usar Formmy y agrega formularios de contacto a tu sitio web fácilmente."
              duration="3 min"
              image="https://i.imgur.com/mqHOOA0l.png"
              video="https://www.youtube.com/embed/vdixQUHQ01A?si=vtqSg7pSIUH2JBj7"
            />
            <Card
              title="Prueba Formmy PRO ⚡️"
              description="¿Necesitas más opciones de personalización en tu Formmy? Prueba Formmy PRO y aprovecha todas las funcionalidades que tiene para ti."
              duration="3 min"
              image="https://i.imgur.com/oNQy9Kbl.png"
              video="https://www.youtube.com/embed/2V76NB9LLwQ?si=jLVVHM7zkicj3eAW"
            />
            <Card
              title="Agrega Formmy a tu proyecto HTML"
              description="Personaliza tu Formmy y agrégalo directamente en tu HTML."
              duration="2:24 min"
              image="https://i.imgur.com/N8cd2JWl.png"
              video="https://www.youtube.com/embed/1ybL9LZgu_c?si=0t5n1Pmxux2B9Hj2"
            />
            <Card
              title="Agrega Formmy a tu proyecto React"
              description="Agrega Formmy a tu proyecto React paso a paso."
              duration="4:50 min"
              image="https://i.imgur.com/8ixhB2vl.png"
              video="https://www.youtube.com/embed/F9muTF0fg-8?si=q1LN-0KWkd4-LzxI"
            />
          </div>
      </section>
      <HomeFooter/>
    </>
  );
}

const Card = ({
  image,
  title,
  description,
  duration,
  video,
}: {
  image: string;
  title: string;
  description: string;
  duration: string;
  video: string;
}) => {
  let [isOpen, setIsOpen] = useState(false);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  return (
    <section>
      <div
        className="flex flex-wrap lg:flex-nowrap gap-4 md:gap-10 items-center cursor-pointer"
        onClick={openModal}
      >
        <img
          className="w-full object-cover md:w-[300px] h-[180px] rounded-2xl shadow hover:opacity-80  "
          src={image}
        />
        <div>
          <h3 className="text-xl font-semibold md:text-2xl  text-space-800 dark:text-white  mb-1">
            {title}
          </h3>
          <p className="text-base md:text-lg text-gray-600 dark:text-space-400 font-light">
            {description}
          </p>
          <span className="flex items-center gap-1 text-gray-500 font-light text-sm">
            <BsPersonVideo2 />
            {duration}
          </span>
        </div>
      </div>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto ">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full relative max-w-[640px] p-6 md:p-12 transform overflow-hidden rounded-2xl bg-clear dark:bg-[#23252D] text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-800 dark:text-white"
                  >
                    <span className="text-2xl"> {title}</span>
                  </Dialog.Title>
                  {/* <img
                    className="absolute top-6 right-6"
                    src="/assets/close.svg"
                  /> */}
                  <div className=" mt-6">
                    {/* <img
                      className="rounded-2xl w-[100%] h-[315px]"
                      src={image}
                    /> */}
                    <iframe
                      className="rounded-2xl"
                      width="100%"
                      height="315"
                      src={video}
                      title="YouTube video player"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowfullscreen
                    ></iframe>
                    <p className="text-lg text-gray-600 dark:text-space-400 font-light mt-4">
                      {description}
                    </p>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center border border-transparent bg-space-200 dark:bg-[#1D2027] dark:text-white px-4 py-2 text-sm font-medium text-space-800 rounded-full hover:bg-[#EEF0F8] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={closeModal}
                    >
                      Entendido ¡Gracias!
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </section>
  );
};
