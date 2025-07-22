import { data as json, redirect } from "react-router";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
import {
  useState,
  useEffect,
  useRef,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { twMerge } from "tailwind-merge";
import useLocalStorage from "~/lib/hooks/useLocalStorage";
import { db } from "~/utils/db.server";
import { Palomita } from "./config.$projectId.basic";
import Message, {
  type MessageSchema,
  messageSchema,
} from "~/components/formmys/MessageV1";
import { EmojiConfetti } from "~/utils/confetti";
import type { ConfigSchema } from "~/components/formmys/FormyV1";
// import scrollbarStyles from "~/styles/app.css";
import { ProTag } from "~/components/ProTag";
import { FaRegTrashAlt } from "react-icons/fa";
import { removePublicPic, uploadPublicPic } from "~/lib/firebase.client";
import { getUserOrNull } from "server/getUserUtils.server";
import { v4 as uuid } from "uuid";
import toast, { Toaster } from "react-hot-toast";
import { IconCube } from "~/components/IconCube";

// export const links = () => {
//   return [
//     {
//       rel: "stylesheet",
//       href: scrollbarStyles,
//     },
//   ];
// };

export const action = async ({ request, params }: ActionArgs) => {
  const formData = await request.formData();
  const form = Object.fromEntries(formData);
  if (form.intent === "next") {
    // validation
    const validated = messageSchema.safeParse(JSON.parse(form.data as string));
    if (!validated.success) {
      return json(null, { status: 400 });
    }
    const current = await db.project.findUnique({
      where: {
        id: params.projectId,
      },
    });
    if (!current) {
      return json(
        { message: `Formmy con id: ${params.projectId} no encontrado` },
        { status: 404 }
      );
    }

    await db.project.update({
      where: { id: params.projectId },
      data: {
        config: {
          ...current.config,
          ...validated.data,
        },
      },
    });
    return redirect(`/config/${params.projectId}/share`);
  }
  // default:
  return null;
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await getUserOrNull(request);
  const project = await db.project.findUnique({
    where: { id: params.projectId },
    select: { id: true, config: true, type: true },
  });
  if (!project) throw json(null, { status: 404 });
  return {
    configuration: project.config as ConfigSchema,
    isPro: user?.plan === "PRO" ? true : false,
    projectId: project.id,
    type: project.type,
  };
};

// @TODO loader with saved config

export default function MessageConfig() {
  const { configuration, isPro, projectId, type } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [config, setConfig] = useState<MessageSchema>(configuration);
  const { save } = useLocalStorage();
  const renders = useRef(0);

  // states
  // @TODO: config size and amount
  const [showConfetti, setShowConfetti] = useState(false);

  // effects
  useEffect(() => {
    // const got = get("config");
    // setConfig((c) => ({ ...c, ...got }));
    /* eslint-disable */
  }, []);

  useEffect(() => {
    if (renders.current > 0) {
      save("config", config);
    }
    renders.current += 1;
  }, [save, config]);

  // @TODO toaster when error?
  useEffect(() => {}, [fetcher]);

  // handlers
  const handleTextChange = (message: string) =>
    setConfig((c) => ({ ...c, message }));

  const handleConfettiSelection = (confetti: "paper" | "emoji" | null) => {
    setConfig((c) => ({ ...c, confetti }));
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
    setConfig((c) => ({ ...c, icon }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetcher.submit(
      { intent: "next", data: JSON.stringify(config) },
      { method: "post" }
    );
  };
  // @TODO: Show short text
  // const result = messageSchema.safeParse(config);

  const isButtonDisabled =
    !messageSchema.safeParse(config).success || fetcher.state !== "idle";

  return (
    <>
      <Toaster />
      <article className="flex flex-wrap h-screen md:h-screen text-space-900 dark:text-white dark:bg-space-900  ">
        <section className=" pt-12 md:px-12 px-4  w-full lg:min-w-[520px] h-full lg:max-w-[520px] overflow-y-scroll noscroll ">
          <div className=" h-full min-h-[740px] w-full relative">
            <h2 className="text-3xl font-bold  text-space-800 dark:text-white">
              Mensaje final 📨
            </h2>
            <p className="pt-6 text-base font-normal text-gray-600 dark:text-space-300">
              ¿Qué icono quieres mostrar a tu usuario al enviarte un mensaje?
            </p>
            <fetcher.Form onSubmit={handleSubmit} className="flex flex-col">
              <div className="flex flex-wrap gap-4 pt-4">
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
              <p className="pt-6 pb-4 font-normal text-base text-gray-600 dark:text-space-300">
                ¿Qué mensaje quieres mostrar?
              </p>
              <textarea
                wrap="hard"
                // style={{ whiteSpace: "pre" }}
                className="bg-brand-100 dark:bg-gray-900 border-[#E3E1E1] dark:border-none text-gray-600 dark:text-space-400 p-2 rounded text-xs"
                rows={4}
                onChange={(e) => handleTextChange(e.currentTarget.value)}
                value={config.message}
              />
              <p className="pt-6 pb-4 font-normal text-base text-gray-600 dark:text-space-300">
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
              <div className="flex gap-4 absolute w-full bottom-0 z-10 bg-gradient-to-b from-transparent to-clear  dark:to-space-900 pb-8">
                <button
                  onClick={() => navigate(-1)}
                  disabled={isButtonDisabled}
                  type="button"
                  className={twMerge(
                    " grow h-12 rounded-full text-base mt-10 disabled:bg-gray-100 bg-gray-200 text-gray-600 disabled:text-gray-400"
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
              </div>
            </fetcher.Form>
          </div>
        </section>
        <section
          className={twMerge(
            "grow bg-slate-100  dark:bg-[#0D0E13] py-20 lg:py-0 relative",
            config.theme
          )}
        >
          <div className="dark:bg-hole">
            <Message config={config} type={type} />
            {showConfetti ? (
              <EmojiConfetti
                mode={config.confetti === "emoji" ? "emojis" : "default"}
              />
            ) : null}
            <p className="text-space-800/40 dark:text-gray-400 font-light text-center bottom-10 w-full absolute ">
              ¡Así se verá tu Formmy cuando el usuario te envíe un mensaje!
            </p>
          </div>
        </section>
      </article>
    </>
  );
}

export const AddImages = ({
  selected,
  localStorageKey = "images",
  onClick,
  isDisabled,
  isPro = false,
}: {
  localStorageKey?: string;
  selected: string | null;
  onClick?: (arg0: string) => void;
  defaultImages?: string[];
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
    // @TODO: should sizd come from any config?
    if (file.size > 1_000_000) {
      toast.error("Las imagenes no deben superar 1MB", {
        position: "top-left",
      });
      setTheInputKey(uuid());
      return;
    }
    uploadImage(file); // @TODO: progress?
    // set((arr) => [...arr, URL.createObjectURL(file)]);
  };

  const removeImage = (index: number) => {
    const newArr = [...images];
    const url = newArr.splice(index, 1);
    set(newArr);
    removePublicPic(url);
  };

  // @TODO: save this into the DB
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

  console.log("IMAGES: ", images);

  return (
    <>
      <Toaster />
      {images.map((image, index) => (
        <IconCube
          isSelected={selected === image}
          key={index + image}
          onClick={() => onClick?.(image)}
          src={image}
          action={
            <button
              onClick={(event) => {
                event.stopPropagation(); // @TODO: move this to handler
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
