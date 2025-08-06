import { data as json } from "react-router";
import { Link, useFetcher, useLoaderData } from "react-router";
import Nav from "~/components/NavBar";
import type { AnswerType } from "~/utils/zod";
import { db } from "~/utils/db.server";
import { iconBtnClass } from "~/components/Code";
import { BackGround, ModificameBRENDIPurpleCorner } from "./dash";
import { AiFillStar } from "react-icons/ai";
import { FiTrash2, FiEdit3, FiSettings } from "react-icons/fi";
import { IoReturnUpBackOutline } from "react-icons/io5";
import { LuClock7 } from "react-icons/lu";
import { BsCodeSlash, BsSearch } from "react-icons/bs";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { AnimatePresence, motion } from "framer-motion";
import { useAnswerOpener } from "./api.answers";
import { FaDownload } from "react-icons/fa";
import { Button } from "~/components/Button";
import { Avatar } from "~/components/icons/Avatar";
import EmptyDark from "~/SVGs/EmptyDark";
import Empty from "~/SVGs/Empty";
import Ghosts from "~/SVGs/Ghosts";
import GhostsDark from "~/SVGs/GhostsDark";
import type { Answer } from "@prisma/client";
import {
  getProjectWithAccess,
  getUserOrRedirect,
} from "server/getUserUtils.server";
import type { Route } from "./+types/dash_.$projectId";

export const action = async ({ request, params }: Route.ActionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  // validation @TODO check fro permissions
  const user = await getUserOrRedirect(request);
  const project = await db.project.findUnique({
    where: { id: params.projectId },
    select: {
      userId: true,
    },
  });
  if (!project) throw json(null, { status: 404 });
  if (user.id !== project.userId) return json(null, { status: 403 });
  // validation
  if (intent === "delete") {
    const answerId = (formData.get("answerId") as string) ?? null;
    if (!answerId) return json({ ok: false }, { status: 404 });
    await db.answer.delete({ where: { id: answerId } });
    return { ok: true };
  }
  if (intent === "favorite") {
    const answerId = String(formData.get("answerId"));
    if (!answerId) return json({ ok: false }, { status: 404 });
    const current = await db.answer.findUnique({ where: { id: answerId } });
    if (!current) {
      return json({ ok: false }, { status: 404 });
    }
    await db.answer.update({
      where: { id: answerId },
      data: {
        favorite: !current.favorite,
      },
    });

    return { ok: true };
  }
  return null;
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  const projectId = params.projectId as string;
  
  // Use centralized function - requires read permission
  const access = await getProjectWithAccess(user.id, projectId, "read");
  
  if (!access) {
    throw json(null, { status: 404 });
  }
  
  return {
    project: access.project,
    user: { ...user, isOwner: access.isOwner, permissions: access.permissions, role: access.userRole },
  };
};

export default function Detail() {
  //@TODO: paginated messages
  const fetcher = useFetcher();
  const { project, user } = useLoaderData<typeof loader>();
  const [answers, setAnswers] = useState<AnswerType[]>(project.answers ?? []);
  const [currentIndex, setCurrent] = useState(0);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    setAnswers(project.answers ?? []);
  }, [project]);

  const handleDelete = (answer: Answer) => {
    /**
     * Estado boolean: {show &&}
     * Componente con onclick
     * si cancela boolean false
     * si acepta ejecutar función
     */
    // if (
    //   !confirm(
    //     "¿Seguro que quieres eliminar este mensaje? No podrás recuperarlo"
    //   )
    // ) {
    //   return;
    // }
    const filtered = [...answers.filter((a) => a.id !== answer.id)];
    setAnswers(filtered);
    setCurrent(0);
    fetcher.submit(
      { intent: "delete", answerId: answer.id },
      { method: "delete" }
    );
    setShow(false);
  };

  const handleFav = (answerId: string) => {
    const current = answers[currentIndex];
    setAnswers([
      ...answers.map((ans) =>
        ans.id === current.id
          ? { ...current, favorite: !current.favorite }
          : ans
      ),
    ]);
    fetcher.submit({ intent: "favorite", answerId }, { method: "post" });
  };

  const handleSearch = (value: string) => {
    if (!value) {
      setAnswers(project.answers);
    } else {
      const s = search.toLocaleLowerCase();
      setAnswers(
        project.answers.filter(
          (answer) =>
            answer.data?.email?.toLowerCase().includes(s) ||
            answer.data?.name?.toLowerCase().includes(s) ||
            answer.data?.message?.toLowerCase().includes(s) ||
            answer.data?.company?.toLowerCase().includes(s) ||
            answer.data?.phone?.toLowerCase().includes(s)
        )
      );
    }
    setSearch(value);
  };

  const handleChange = (answerId: string) => {
    const index = answers.findIndex((a) => a.id === answerId);
    setCurrent(index);
  };

  const [show, setShow] = useState(false);

  return (
    <>
      <article className="min-h-screen pb-8 relative">
        <BackGround className="bg-clear " />
        <Nav user={user} />
        <AnimatePresence>
          {show && (
            <div className="w-full h-20 flex justify-center absolute top-8 z-[999] ">
              <ConfirmationToast
                onClick={() => {
                  handleDelete(answers[currentIndex]);
                }}
                onClose={() => {
                  setShow(false);
                }}
              />
            </div>
          )}
        </AnimatePresence>

        <main className="pt-20 md:pt-24 px-4 max-w-6xl mx-auto text-space-800 dark:text-white pb-0">
          <nav className="flex items-center gap-2 flex-wrap ">
            <div className="flex flex-col items-start gap-2 mr-auto mb-0 relative">
              <div className="flex gap-1 items-center absolute -left-0 xl:-left-12 ">
                <Link to="/dash" className={iconBtnClass}>
                  <IoReturnUpBackOutline />
                </Link>
              </div>

              <h2 className="m-0 text-3xl font-bold mb-[-8px] text-space-800 dark:text-white mt-12 xl:mt-0 ">
                {project.name}{" "}
              </h2>
              <div className="flex gap-4">
                <p className="text-space-600 dark:text-space-400  font-light">
                  💬 {answers.length} mensaje{answers.length === 1 ? null : "s"}{" "}
                </p>
                {!user.isOwner && <ModificameBRENDIPurpleCorner />}
              </div>
            </div>

            <div className=" grow max-w-xl mt-2 md:mt-10">
              <SearchBar
                onSearch={handleSearch}
                value={search}
                projectId={project.id}
                isDisabled={!user.isOwner}
                // isDisabled
              />
            </div>
          </nav>
          {answers.length < 1 && !search && <EmptyProject />}
          {answers.length < 1 && search && (
            <EmptyProject
              title="No hay conincidencias con tu búsqueda"
              message="Intenta con algo más"
            />
          )}
          {answers.length > 0 && (
            <MessagesViewer
              isOwner={user.isOwner}
              onFav={(answerId) => handleFav(answerId)}
              onClick={() => {
                setShow(true);
              }}
              // onDelete={(answerId) => handleDelete(answerId)}
              current={answers[currentIndex]}
              answers={answers}
              onChange={handleChange}
            />
          )}
        </main>
      </article>
    </>
  );
}

export const ConfirmationToast = ({
  onClick,
  onClose,
}: {
  onClick?: () => void;
  onClose?: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(4px)", y: -20 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      exit={{ opacity: 0, filter: "blur(4px)", y: -20 }}
      transition={{
        type: "spring",
        duration: 0.5,
        bounce: 0.4,
      }}
      className=" max-w-md w-full h-32 bg-clear shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5"
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 pt-0.5">
            <img className="w-10 lg:w-12 " src="/assets/ghost-support.png" />
          </div>
          <div className="ml-6 flex-1">
            <p className=" font-medium text-gray-900">
              ¿Seguro que quieres eliminar este mensaje? Se eliminará
              permanentemente.
            </p>

            <button
              onClick={onClose}
              className="h-8 text-sm mt-4 rounded-full text-gray-600 mr-6 "
            >
              <p>Cancelar</p>
            </button>
            <button
              onClick={onClick}
              className="h-8 text-sm mt-4 rounded-full text-clear px-4 !bg-red-500"
            >
              <p>Eliminar</p>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const SearchBar = ({
  isDisabled,
  onSearch,
  projectId,
  value,
}: {
  isDisabled?: boolean;
  value?: string;
  onSearch: (arg0: string) => void;
  projectId: string;
}) => {
  const [isLoading, set] = useState(false);
  return (
    <div className="flex items-start gap-2 flex-row md:flex-row w-full">
      <div className="relative w-full">
        <span className="absolute top-3 left-2 text-gray-400">
          <BsSearch />
        </span>
        <input
          value={value}
          onChange={(event) => onSearch(event.currentTarget.value)}
          type="search"
          placeholder="Busca un mensaje"
          className="border-none dark:bg-[#141419] bg-[#F7F7F9] pl-8 placeholder:text-space-300 dark:placeholder-gray-400 placeholder:font-light  w-full rounded-lg  outline-none focus:ring-brand-500 focus:ring-1 border-brand-500"
          name="search"
        />
      </div>
      <Link reloadDocument to={`/api/download/${projectId}.csv`}>
        <Button
          onClick={() => {
            set(true);
            setTimeout(() => set(false), 2000);
          }}
          isLoading={isLoading}
          as="link"
          name="intent"
          value="download_all"
          type="submit"
          className={twMerge(iconBtnClass, "bg-transparent m-0 px-2 text-2xl")}
        >
          <FaDownload />
        </Button>
      </Link>
      {isDisabled ? (
        <DisabledButtons />
      ) : (
        <div className="flex gap-2">
          <Link
            to={`/config/${projectId}/basic`}
            className={iconBtnClass + " px-2 text-2xl bg-brand-500 text-clear"}
          >
            <FiEdit3 />
          </Link>
          <Link
            prefetch="intent"
            to="settings/notifications"
            className={iconBtnClass + " px-2 text-2xl"}
          >
            <FiSettings />
          </Link>
          {/* <button
          onClick={() => window.print()}
          className={iconBtnClass + " px-2 text-2xl"}
        >
          <AiOutlineCloudDownload />
        </button> */}
          <Link
            className={iconBtnClass + " px-2 text-2xl"}
            to={`/config/${projectId}/share`}
          >
            <BsCodeSlash />
          </Link>
        </div>
      )}
    </div>
  );
};

const DisabledButton = ({ icon }: { icon: ReactNode }) => (
  <button
    className="flex items-center py-2 border rounded-md hover:scale-105 disabled:hover:scale-100 active:scale-100 border-brand-500 px-2 text-2xl bg-brand-500 text-clear disabled:bg-gray-300 disabled:cursor-not-allowed disabled:border-none disabled:text-clear"
    children={icon}
    disabled
  />
);

const DisabledButtons = () => {
  return (
    <div className="flex gap-2">
      <DisabledButton icon={<FiEdit3 />} />
      <DisabledButton icon={<FiSettings />} />
      <DisabledButton icon={<BsCodeSlash />} />
    </div>
  );
};

const MessagesViewer = ({
  current,
  isOwner,
  answers,
  onFav,
  onChange,
  onClick,
}: {
  isOwner?: boolean;
  onFav: (arg0: string) => void;
  onClick: () => void;
  onChange: (arg0: string) => void;
  current: AnswerType;
  answers: AnswerType[];
}) => {
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    if (active === 1) {
      return answers.filter((answer) => answer.favorite);
    } else {
      return answers;
    }
  }, [active, answers]);

  return (
    <article className="flex mt-8 md:mt-12 gap-8 md:gap-4 flex-col-reverse md:flex-row">
      <section className="flex flex-col md:w-[280px]  w-full">
        <nav className="flex justify-center w-full mb-2 border-b-[1px] border-[#EFEFEF] dark:border-[#2E2E2E] ">
          <button
            onClick={() => setActive(0)}
            className={twMerge(
              "px-6 font-light pb-2 grow",
              active === 0 && "border-b-brand-500 border-b-2 font-medium"
            )}
          >
            Todos
          </button>
          <button
            onClick={() => setActive(1)}
            className={twMerge(
              "font-light px-6 pb-2 grow",
              active === 1 && "border-b-brand-500 border-b-2 font-medium"
            )}
          >
            Favoritos
          </button>
        </nav>
        {/* List */}
        <div className="h-64 md:h-96 overflow-hidden overflow-y-scroll">
          <AnimatePresence mode="popLayout">
            {filtered.map((answer) => (
              <Card
                isCurrent={answer.id == current.id}
                key={answer.id}
                onClick={() => onChange(answer.id)}
                answer={answer}
              />
            ))}
            {active === 1 && !filtered.length && <EmptyFavorites />}
          </AnimatePresence>
        </div>
      </section>
      {/* Detail  */}
      <section className="shadow-[0_4px_16px_0px_rgba(204,204,204,0.25)] dark:shadow-none border border-[#E0E0EE] dark:bg-[#141419] dark:border-transparent rounded-xl md:py-6 md:px-6 px-4 py-4 grow relative">
        <header className="flex items-center md:mb-8 mb-2">
          <div className=" dark:hidden rounded-full w-12 h-12 mr-2 bg-space-100 dark:bg-clear/5 flex justify-center items-center">
            <Avatar fill="#191A20" />
          </div>
          <div className=" dark:flex hidden rounded-full w-12 h-12 mr-2 bg-space-100 dark:bg-clear/5  justify-center items-center">
            <Avatar fill="#B2B3BE" />
          </div>

          <div>
            <p className="text-md mb-[-6px] font-medium">
              {current?.data?.email}
            </p>
            <span className="text-space-600 dark:text-space-400 font-light text-xs ">
              {new Date(current?.createdAt).toLocaleString()}
            </span>
          </div>
          <button
            disabled={!isOwner}
            // onClick={isOwner ? () => onDelete(current?.id) : undefined}
            onClick={isOwner ? () => onClick() : null}
            className={twMerge(
              "ml-auto text-red-500 mr-3",
              "disabled:text-gray-500 disabled:cursor-not-allowed"
            )}
          >
            <FiTrash2 />
          </button>
          <button
            disabled={!isOwner}
            onClick={isOwner ? () => onFav(current?.id) : undefined}
            className={twMerge(
              "text-gray-300 dark:text-gray-300/30 text-lg",
              current?.favorite && "text-yellow-500 dark:text-yellow-500",
              "disabled:text-gray-500 disabled:cursor-not-allowed"
            )}
          >
            <AiFillStar />
          </button>
        </header>
        <p className="text-xs text-gray-500 mb-4">ID: {current.id}</p>
        {Object.keys(current.data || {}).map((field) => (
          <TextGroup
            key={current.data[field]}
            label={field}
            text={current.data[field]}
          />
        ))}
        <Ghosts className="absolute right-4 bottom-2 dark:hidden flex" />
        <GhostsDark className="absolute right-4 bottom-2 dark:flex hidden" />
      </section>
    </article>
  );
};

const EmptyFavorites = () => {
  return (
    <div className="text-center mt-12 flex flex-col items-center ">
      <Empty className="w-[200px] dark:hidden flex" />
      {/* <img
        alt="empty"
        className="w-[200px] dark:hidden flex"
        src="/assets/empty-msjs.svg"
      /> */}
      {/* <img
        alt="empty dark"
        className="w-[200px] hidden dark:flex"
        src="/assets/empty-msjs-dark.svg"
      /> */}
      <EmptyDark className="w-[200px] hidden dark:flex" />
      <h3 className="font-bold text-sm text-space-800 dark:text-clear">
        ¡No tienes favoritos!
      </h3>
      <p className="text-gray-600 text-sm dark:text-gray-400 font-light mt-2">
        Marca como favoritos <br /> tus mensajes más importantes.
      </p>
    </div>
  );
};

const EmptyProject = ({
  title,
  message,
}: {
  title?: string;
  message?: string;
}) => {
  return (
    <div className="text-center mt-12 flex flex-col justify-center items-center border-[1px]  dark:border-white/10 border-[#DFDFE9] rounded-lg min-h-[480px]">
      <div>
        <Empty className="max-w-[400px] w-[80%] mx-auto dark:hidden block" />
        <EmptyDark className="max-w-[400px] w-[80%] mx-auto dark:block hidden" />

        <h3 className="font-bold text-lg text-space-800 dark:text-clear">
          {title || "¡Aún no has recibido mensajes!"}
        </h3>
        <p className="text-gray-600 text-sm dark:text-gray-400 font-light mt-2">
          {message || "Espera un poco, tus usuarios están agarrando confianza."}
        </p>
        {/* <h3 className="font-bold text-lg text-space-800 dark:text-clear">
          ¡Nada por aquí!
        </h3>
        <p className="text-gray-600 text-sm dark:text-gray-400 font-light mt-2">
          No encontramos ningún mensaje que coincida con tu búsqueda. Intenta con otro.
        </p> */}
      </div>
    </div>
  );
};

const Card = ({
  answer,
  isCurrent,
  onClick,
}: {
  isCurrent: boolean;
  onClick?: () => void;
  answer: AnswerType;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const openAnswer = useAnswerOpener();

  useEffect(() => {
    if (!isCurrent || !ref.current) return;

    // chulada
    ref.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [isCurrent]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    if (answer.opened) return;
    openAnswer(answer);
  };

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: 10, filter: "blur(9px)" }}
      animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
      exit={{ x: -50, opacity: 0, filter: "blur(9px)" }}
      transition={{ type: "spring", bounce: 0.4 }}
      ref={ref}
      onClick={handleClick}
      className={twMerge(
        " px-4 py-[12px] flex border-b-[1px] border-[#EFEFEF] items-center w-full dark:bg-transparent dark:border-transparent ",
        isCurrent && " bg-[#F5F5FC] dark:bg-gray-900/40"
      )}
    >
      <div
        className={twMerge(
          " dark:hidden rounded-full w-12 h-12 mr-2 bg-space-100 dark:bg-clear/5 flex justify-center items-center",
          isCurrent && " border-2 border-brand-500 "
        )}
      >
        <Avatar fill="#191A20" />
      </div>
      <div
        className={twMerge(
          " dark:flex hidden rounded-full w-12 h-12 mr-2 bg-space-100 dark:bg-clear/5  justify-center items-center",
          isCurrent && " border-2 border-brand-500 "
        )}
      >
        <Avatar fill="#B2B3BE" />
      </div>

      <div className="grid text-left">
        <p className="text-xs">{answer.data.email}</p>
        <p
          className={twMerge(
            "text-xs mt-[2px] text-gray-500 dark:text-space-400 font-light",
            isCurrent && "text-gray-600 dark:text-space-300"
          )}
        >
          {new Date(answer.createdAt).toLocaleDateString()}
        </p>
      </div>
      {!answer.opened && (
        <span
          tabIndex={-1}
          className="bg-brand-500 text-white ml-auto rounded-full"
        >
          <LuClock7 />
        </span>
      )}
      {answer.favorite && (
        <button
          tabIndex={-1}
          type="button"
          className={twMerge(
            "text-gray-300 text-lg ml-auto",
            "text-yellow-500"
          )}
        >
          <AiFillStar />
        </button>
      )}
    </motion.button>
  );
};

const TextGroup = ({ label, text }: { label: string; text?: string }) => {
  return (
    <>
      <span className="capitalize text-xs text-space-600 dark:text-space-400 font-light">
        {label}
      </span>
      <p
        className={twMerge(
          "text-base mb-2 text-space-800 dark:text-white ",
          !text && ""
        )}
      >
        {text ? text : "N/A"}
      </p>
    </>
  );
};
