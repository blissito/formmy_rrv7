
import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
} from "react";
import { twMerge } from "tailwind-merge";
import useLocalStorage from "~/lib/hooks/useLocalStorage";
import Message, {
    type MessageSchema,
    messageSchema,
  } from "~/components/formmys/MessageV1";
import { EmojiConfetti } from "~/utils/confetti";
import type { ConfigSchema } from "~/components/formmys/FormyV1";
import { ProTag } from "~/components/ProTag";
import { FaRegTrashAlt } from "react-icons/fa";
import { removePublicPic, uploadPublicPic } from "~/lib/firebase.client";
import { v4 as uuid } from "uuid";
import toast, { Toaster } from "react-hot-toast";
import { IconCube } from "~/components/IconCube";
import { Palomita } from "./FormmyDesignEdition";
import { useFormmyEdition } from "~/contexts/FormmyEditionContext";

interface FormmyMessageEditionProps {
  configuration: ConfigSchema;
  isPro: boolean;
  projectId: string;
  type: string;
}

export function FormmyMessageEdition({ 
  configuration, 
  isPro, 
  projectId, 
  type 
}: FormmyMessageEditionProps) {
  const { virtualConfig: config, updateVirtualConfig } = useFormmyEdition();
  const [showConfetti, setShowConfetti] = useState(false);

  const handleTextChange = (message: string) =>
    updateVirtualConfig({ message });

  const handleConfettiSelection = (confetti: "paper" | "emoji" | null) => {
    updateVirtualConfig({ confetti });
    if (!confetti) {
      setShowConfetti(false);
      return;
    }
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 2000);
  };

  const handleIconSelection = (icon: string) => {
    updateVirtualConfig({ icon });
  };

  const isButtonDisabled = !messageSchema.safeParse(config).success;
  

  return (
    <article className="grid grid-cols-12 gap-8 h-full">
      <section className="col-span-12 md:col-span-4 noscroll">
        <div className="w-full h-fit">
           <div className=" h-full  w-full relative">
                    <p className=" text-sm font-normal text-metal">
                      ¿Qué icono quieres mostrar a tu usuario al enviarte un mensaje?
                    </p>
                    <form className="flex flex-col">
                      <div className="flex gap-4 pt-4 overflow-x-scroll pb-2">
                        <IconCube
                          onClick={() => handleIconSelection(null)}
                          isSelected={config.icon === null}
                        />
                
                        <IconCube
                          onClick={() =>
                            handleIconSelection("/assets/email-notification.svg")
                          }
                          src="/assets/email-notification.svg"
                          isSelected={config.icon === "/assets/email-notification.svg"}
                        />
                        <IconCube
                          onClick={() => handleIconSelection("/assets/checki.svg")}
                          isSelected={config.icon === "/assets/checki.svg"}
                          src="/assets/checki.svg"
                        />
                        <IconCube
                          onClick={() =>
                            handleIconSelection("/assets/send-message.svg")
                          }
                          isSelected={config.icon === "/assets/send-message.svg"}
                          src="/assets/send-message.svg"
                        />
                        <IconCube
                          onClick={() => handleIconSelection("/assets/mail-noti.svg")}
                          isSelected={config.icon === "/assets/mail-noti.svg"}
                          src="/assets/mail-noti.svg"
                        />
                        {/* PRO only */}
                        <AddImages
                          localStorageKey={`images-${projectId}`}
                          selected={config.icon} // @TODO remove null use undefined
                          onClick={handleIconSelection}
                          isPro={isPro}
                        />
                      </div>
                      <p className="pt-4 pb-2 font-normal text-sm text-metal">
                        ¿Qué mensaje quieres mostrar?
                      </p>
                      <textarea
                        wrap="hard"
                        // style={{ whiteSpace: "pre" }}
                        className="bg-brand-100 border-outlines  text-dark p-2 rounded-xl text-base"
                        rows={4}
                        onChange={(e) => handleTextChange(e.currentTarget.value)}
                        value={config.message}
                      />
                      <p className="pt-6 pb-2 font-normal text-sm text-metal">
                        ¿Quieres agregar una animación de confetti?
                      </p>
                      <div className="flex gap-4 ">
                        <button
                          className="relative"
                          type="button"
                          onClick={() => handleConfettiSelection("paper")}
                        >
                          {config.confetti === "paper" && <Palomita />}
                          <img
                            className={twMerge(
                              "flex dark:hidden w-full h-18 rounded-md transition-all",
                              config.confetti === "paper" && "ring-2 ring-brand-500"
                            )}
                            src="/assets/confetti.svg"
                          />
                          <img
                            src="/assets/dark-confetti.svg"
                            className={twMerge(
                              "hidden dark:flex w-full h-18  rounded-md transition-all",
                              config.confetti === "paper" && "ring-2 ring-brand-500"
                            )}
                          />
                          <p className="py-2 text-xs text-center text-space-600 dark:text-space-300">
                            Papel confetti
                          </p>
                        </button>
                        <button
                          type="button"
                          className="relative"
                          onClick={() => handleConfettiSelection("emoji")}
                        >
                          {config.confetti === "emoji" && <Palomita />}
                          <img
                            src="/assets/emoji-confetti.svg"
                            className={twMerge(
                              "flex dark:hidden w-full h-18  rounded-md transition-all",
                              config.confetti === "emoji" && "ring-2 ring-brand-500"
                            )}
                          />
                          <img
                            src="/assets/dark-emoji.svg"
                            className={twMerge(
                              "hidden dark:flex w-full h-18 rounded-md transition-all",
                              config.confetti === "emoji" && "ring-2 ring-brand-500"
                            )}
                          />
                          <p className="py-2 text-xs text-center text-space-600 dark:text-space-300">
                            Emojies
                          </p>
                        </button>
                      </div>
                      <div>
                        <button
                          type="button"
                          className="relative"
                          onClick={() => handleConfettiSelection(null)}
                        >
                          {config.confetti === null && <Palomita />}
                          <img
                            src="/assets/sin-confetti.svg"
                            className={twMerge(
                              "flex dark:hidden w-full h-18  rounded-md transition-all",
                              config.confetti === null && "ring-2 ring-brand-500"
                            )}
                          />
                          <img
                            src="/assets/dark-nada.svg"
                            className={twMerge(
                              "hidden dark:flex w-full h-18  rounded-md transition-all",
                              config.confetti === null && "ring-2 ring-brand-500"
                            )}
                          />
                          <p className="py-2 text-xs text-center text-space-600 dark:text-space-300">
                            Sin animación
                          </p>
                        </button>
                      </div>
                      {/* <div className="flex gap-4 absolute w-full bottom-0 z-10 bg-gradient-to-b from-transparent to-clear  dark:to-space-900 pb-8">
                        <button
                          onClick={() => navigate(-1)}
                          disabled={isButtonDisabled}
                          type="button"
                          className={twMerge(
                            " grow h-12 rounded-full text-base mt-10 disabled:bg-gray-100 bg-gray-200 text-metal disabled:text-gray-400"
                          )}
                        >
                          Atrás
                        </button>
                        <button
                          disabled={isButtonDisabled}
                          type="submit"
                          className={twMerge(
                            "hover:bg-brand-300 grow-[2] h-12 rounded-full text-base mt-10 disabled:bg-gray-100 bg-brand-500 text-clear disabled:text-gray-400"
                          )}
                        >
                          Guardar
                        </button>
                      </div> */}
                    </form>
                  </div>
        </div>
      </section>

      <section className={twMerge("col-span-12 md:col-span-8 h-fit  md:h-full md:min-h-[calc(100vh-300px)]", config.theme)}>
      <div className="w-full h-full noscroll bg-slate-100 dark:bg-hole overflow-scroll py-10 md:py-0">
      <div className="grid place-items-center h-[90%] ">
            <Message config={config} type={type} />
            {showConfetti ? (
              <EmojiConfetti
                mode={config.confetti === "emoji" ? "emojis" : "default"}
              />
            ) : null}
            {/* <p className="text-space-800/40 dark:text-gray-400 font-light text-center bottom-10 w-full absolute">
              ¡Así se verá tu Formmy cuando el usuario te envíe un mensaje!
            </p> */}
          </div>
        </div>
      </section>
    </article>
  );
}

const AddImages = ({
  selected,
  localStorageKey = "images",
  onClick,
  isDisabled,
  isPro = false,
}: {
  localStorageKey?: string;
  selected: string | null;
  onClick?: (arg0: string) => void;
  isDisabled?: boolean;
  isPro?: boolean;
}) => {
  const [images, set] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [theInputKey, setTheInputKey] = useState(uuid());
  const { save, get } = useLocalStorage<string[]>();
  const renders = useRef(0);

  const uploadImage = async (file: File) => {
    const url = await uploadPublicPic(file);
    set((i) => [...i, url]);
  };

  const handleOpen = () => inputRef.current?.click();

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target || !e.target.files?.length) return;
    const file = e.target.files[0];
    if (file.size > 1_000_000) {
      toast.error("Las imagenes no deben superar 1MB", {
        position: "top-left",
      });
      setTheInputKey(uuid());
      return;
    }
    uploadImage(file);
  };

  const removeImage = (index: number) => {
    const newArr = [...images];
    const url = newArr.splice(index, 1);
    set(newArr);
    removePublicPic(url);
  };

  useEffect(() => {
    if (!images?.length) return;
    save(localStorageKey, images);
  }, [images]);

  useEffect(() => {
    if (renders.current > 0) return;
    renders.current += 1;
    const images = get(localStorageKey);
    set(images ?? []);
  }, []);

  return (
    <>
      {images.map((image, index) => (
        <IconCube
          isSelected={selected === image}
          key={index + image}
          onClick={() => onClick?.(image)}
          src={image}
          action={
            <button
              onClick={(event) => {
                event.stopPropagation();
                removeImage(index);
              }}
              type="button"
              className="text-xs top-1 bg-clear absolute right-1 hover:scale-110"
            >
              <FaRegTrashAlt />
            </button>
          }
        />
      ))}

      {(!images || images.length < 3) && (
        <>
          <button
            onClick={handleOpen}
            disabled={isDisabled || !isPro}
            type="button"
            className="disabled:cursor-not-allowed w-12 cursor-pointer h-12 bg-space-200 dark:bg-gray-900 rounded-md flex items-center justify-center text-gray-400 relative"
          >
            <span>+</span>
            {!isPro && <ProTag />}
          </button>
          <input
            key={theInputKey}
            onChange={handleImage}
            ref={inputRef}
            className="hidden"
            type="file"
            accept="image/png, image/jpeg, image/jpg"
          />
        </>
      )}
    </>
  );
};
