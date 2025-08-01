import { redirect, data as json, useSearchParams } from "react-router";
import {
  Form,
  Link,
  Outlet,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import Nav from "~/components/NavBar";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { twMerge } from "tailwind-merge";
import { ProTag } from "~/components/ProTag";
import { Dropdown } from "~/components/Menu";
import { Button } from "~/components/Button";
import { SiAmazoncloudwatch } from "react-icons/si";
import ConfirmModal from "~/components/ConfirmModal";
import { BsSearch, BsThreeDots } from "react-icons/bs";
import useLocalStorage from "~/lib/hooks/useLocalStorage";
import { type Project, type Permission } from "@prisma/client";
import { type ChangeEvent, useState, type ReactNode, useEffect } from "react";
import { IoMailUnreadOutline } from "react-icons/io5";
import { getUserOrRedirect } from "server/getUserUtils.server";
import type { Route } from "./+types/dash";
import DeleteIcon from "~/components/ui/icons/Delete";
import OpenTabIcon from "~/components/ui/icons/OpenTab";
import ChatIcon from "~/components/ui/icons/ChatIcon";
import CodeIcon from "~/components/ui/icons/Code";
import { MessageIcon } from "~/components/ui/icons/MessageIcon";
import BubbleIcon from "~/components/ui/icons/Buuble";
import { motion } from "framer-motion";

const findActivePermissions = async (email: string): Promise<Permission[]> => {
  const permissions = await db.permission.findMany({
    where: { email, OR: [{ status: "active" }, { status: "pending" }] },
    include: {
      project: {
        select: {
          answers: true,
          id: true,
          name: true,
        },
      },
    },
  });
  const permissionsIdsToRemove = permissions
    .filter((p) => !p.project)
    .map((p) => p.id);
  // this is necesary to not send empty permissions
  await db.permission.deleteMany({
    where: { id: { in: permissionsIdsToRemove } },
  });
  return permissions.filter((p) => !!p.project);
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  const permissions = await findActivePermissions(user.email);
  return {
    user,
    invitedProyects: permissions
      .filter((p) => p.status === "active")
      .map((p) => p.project),
    permission: permissions.find((p) => p.status === "pending"),
    projects: await db.project.findMany({
      where: {
        userId: user.id,
      },
      include: {
        answers: true,
      },
    }),
  };
};

export const BackGround = ({ className }: { className?: string }) => (
  <section
    className={twMerge(
      "bg-[#fff] dark:bg-space-900 absolute w-full -z-10 h-full",
      className
    )}
  />
);

const updatePermission = async (
  status: "active" | "rejected",
  permissionId: string,
  userId: string
) => {
  return await db.permission.update({
    where: { id: permissionId },
    data: { status, userId },
  });
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await getUserOrRedirect(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "accept_invite") {
    const permissionId = formData.get("permissionId") as string;
    if (!permissionId)
      return json(null, { status: 400, statusText: permissionId });
    await updatePermission("active", permissionId, user.id);
    const permission = await db.permission.findUnique({
      where: { id: permissionId },
    });
    invariant(permission);
    return redirect("/dashboard/formmys/" + permission.projectId);
  }

  if (intent === "reject_invite") {
    const permissionId = formData.get("permissionId") as string;
    updatePermission("rejected", permissionId, user.id);
    return { close: true };
    // return redirect("/dash");
  }
  return null;
};


export default function DashboardFormmys({ loaderData }: { loaderData: LoaderData }) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { user, projects, permission, invitedProyects } =
    useLoaderData<typeof loader>();
  const [filtered, setFiltered] = useState<Project[]>(
    projects.concat(invitedProyects)
  );
  const [isSearch, setIsSearch] = useState<string>();
  const isLimited = user.plan === "PRO" ? false : projects.length > 2;
  const isPro = user.plan === "PRO";
  const [isProOpen, setIsProOpen] = useState<boolean>(false);
  const { get, save } = useLocalStorage();
  const [showModal, setShowModal] = useState(false);

  const clearSearch = () => {
    setIsSearch('');
    setFiltered(projects.concat(invitedProyects));
  };

  const onSearch = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    setIsSearch(value);
    setFiltered(
      projects.filter((pro) =>
        pro.name?.toLocaleLowerCase().includes(value.toLocaleLowerCase())
      )
    );
  };

  // if from landing, show modal with tiers
  useEffect(() => {
    const value = get("from_landing");
    if (value) {
      setShowModal(true);
      save("from_landing", false);
    }
    /* eslint-disable */
  }, []);
  // invite modal close
  useEffect(() => {
    if (actionData?.close) {
      setShowInviteModal(false);
      setTimeout(location.reload, 2000);
    }
  }, [actionData]);
  const [showInviteModal, setShowInviteModal] = useState(!!permission);

  // hidding prices for 15 days
  const hid = () => {
    const until = new Date();
    // until.setMinutes(until.getMinutes() + 1);
    until.setDate(until.getDate() + 15);
    localStorage.setItem("hide_price", until.toISOString());
    // close
    setIsProOpen(false);
  };
  useEffect(() => {
    // check for hidden price
    const hide_price = localStorage.getItem("hide_price");
    if (hide_price) {
      const date = new Date(hide_price).getTime();
      const now = Date.now();
      if (now > date) {
        localStorage.removeItem("hide_price");
        setIsProOpen(true);
      }
    } else {
      !isPro && setIsProOpen(true);
    }
  }, []);

  return (
    <section className="">
          <ConfirmModal
              onClose={() => setShowInviteModal(false)}
              isOpen={showInviteModal}
              message={
                <p className="text-base font-normal text-center mb-6  text-gray-600 dark:text-space-400">
                  Te han invitado al Formmy:{" "}
                  <strong>{permission?.project.name}</strong> . Acepta la invitación
                  si quieres ser parte del proyecto.
                </p>
              }
              footer={
                <Form method="post" className="flex gap-6 mb-12">
                  <input
                    className="hidden"
                    name="permissionId"
                    value={permission?.id}
                  />
                  <Button
                    isDisabled={navigation.state !== "idle"}
                    type="submit"
                    name="intent"
                    value="reject_invite"
                    autoFocus
                    className="bg-gray-100 text-gray-600"
                  >
                    Rechazar
                  </Button>
                  <Button
                    isDisabled={
                      navigation.state !== "submitting" && navigation.state !== "idle"
                    }
                    isLoading={navigation.state === "submitting"}
                    name="intent"
                    value="accept_invite"
                    type="submit"
                    className="text-clear"
                  >
                    Aceptar invitación
                  </Button>
                </Form>
              }
              emojis={"📢 📩"}
              title={"¡Hey! Tienes una invitación pendiente"}
            />
      <div className="max-w-7xl mx-auto py-8">
        <nav className="flex gap-2 flex-wrap justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold dark:text-white text-space-800">
              Tus Formmys
            </h2>
          </div>
          <div className="flex gap-2 mt-2 md:mt-0 w-full md:w-fit">
              <div className="relative w-full">
              <span className="absolute top-[11px] left-2 text-gray-400">
                <BsSearch />
              </span>
                <input
                  onChange={onSearch}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && isSearch) {
                      clearSearch();
                    }
                  }}
                  value={isSearch || ''}
                  type="search"
                  placeholder="Busca un Formmy"
                  className={twMerge(
                    "text-dark dark:text-white pl-8 pr-8 border-none input bg-[#F7F7F9] placeholder:text-lightgray focus:ring-1 focus:ring-brand-500 placeholder:font-light rounded-full w-full [&::-webkit-search-cancel-button]:hidden"
                  )}
                  name="search"
                />
                {isSearch && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute bg-perl w-6 h-6 rounded-full right-3 top-1/2 -translate-y-1/2 text-metal transition-colors grid place-items-center"
                    aria-label="Clear search"
                  >
                  <p>  ✕</p>
                  </button>
                )}
              </div>

        
            {!isLimited && (
                <Link to="new">
                  <button className="h-10 w-[auto] md:min-w-[120px] flex gap-1 items-center bg-brand-500 py-3 px-6 rounded-full text-clear hover:ring hover:ring-brand-500 transition-all">
                    + <span className="">Formmy</span>
                  </button>
                </Link>
              )}
              {isLimited && (
                <button
                  className="relative bg-gray-300 h-10 w-[auto] md:min-w-[120px] flex gap-1 items-center py-3 px-6 rounded-full text-gray-400 dark:text-gray-500 hover:ring hover:ring-brand-500 transition-all"
                  onClick={() => setIsProOpen(true)}
                >
                  + <span className="">Formmy</span>
                  <ProTag
                    isOpen={isProOpen}
                    onChange={(val) => setIsProOpen(val)}
                  />
                </button>
              )}  
          </div>
        </nav>
        <section className="flex flex-wrap gap-6">
          {filtered.map((p, index) => (
            <ProjectCard
              key={p.id}
              isInvite={p.userId !== user.id}
              project={p}
              index={index}
              {...p}
            />
          ))}
          {filtered.length === 0 && (
            <motion.div 
              className="mx-auto text-center flex flex-col justify-center w-full min-h-[60vh]"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <img
                  className="flex dark:hidden w-[320px] mx-auto"
                  src="/assets/empty_ghost.svg"
                  alt="empty ghost"
                />
                <img
                  className="hidden dark:flex w-[320px] mx-auto"
                  src="/assets/empty-ghost-dark.svg"
                  alt="empty ghost"
                />
              </motion.div>
              <motion.h2 
                className="font-bold text-dark text-2xl mt-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                ¡Nada por aquí!
              </motion.h2>
              <motion.p 
                className="font-light text-lg mt-4 text-metal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {!isSearch
                  ? "Empieza a recibir mensajes creando tu primer Formmy."
                  : "No encontramos ningún Formmy con ese nombre. Intenta con otro."}
              </motion.p>
            </motion.div>
          )}
        </section>
      </div>
      
      {/* <ProTag
        isOpen={isProOpen}
        onChange={(val) => setIsProOpen(val)}
      /> */}
      <Outlet />
    </section>
  );
}

export const DotsMenu = () => {
  return (
    <Dropdown
      items={[]}
      trigger={
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="p-4 cursor-pointer hover:scale-110"
        >
          <BsThreeDots />
        </button>
      }
    />
  );
};

export const ProjectCard = ({
  isInvite,
  actionNode,
  project,
  name,
  id,
  index = 0,
}: {
  isInvite?: boolean;
  actionNode?: ReactNode;
  project: Project;
  name: string;
  id: string;
  index?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className="w-full md:w-[268px]"
    >
      <Link
        to={id ?? ""}
        className="group relative overflow-hidden hover:shadow-[0_4px_16px_0px_rgba(204,204,204,0.25)] dark:shadow-none border border-outlines bg-white rounded-2xl w-full h-full block"
      >
        <section className="bg-gradient-to-r from-[#51B8BF] to-bird w-full h-24 flex items-end justify-center border-b border-outlines">
          <img src="/dash/chat.png" alt="chatbot" />
        </section>
        <div className="flex flex-col px-4 pt-4 pb-2">
          <section className="flex justify-between items-center gap-2 ">
            <h2 className="text-xl font-medium text-dark truncate">
              {name}
            </h2>
            {actionNode}
            {project.type === 'subscription' && <ModificameBRENDIYellowCorner />}
          </section>
          <p className="text-sm text-metal flex-grow">
            {project.summary || 'Pronto podrás saber que es lo que más preguntan tus clientes'}
          </p>
          <div className="flex text-sm gap-4 mt-4 justify-between items-end">
            <p className="text-metal font-normal flex gap-1 items-center">
              <BubbleIcon className="mb-[2px]" /> {project.answers?.length || 0} {project.answers?.length === 1 ? 'mensaje' : 'mensajes'}
            </p>
            {isInvite && <ModificameBRENDIPurpleCorner />}
          </div>
          <div id="actions" className="w-[126px] bg-cover gap-2 h-[36px] bg-actionsBack absolute -bottom-10 right-0 group-hover:-bottom-[1px] -right-[1px] transition-all flex items-center justify-end px-3">
            <DeleteIcon />
            <hr className="h-6 w-[1px] border-none bg-outlines"/>
            <CodeIcon />
            <OpenTabIcon />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export const ModificameBRENDIPurpleCorner = () => {
  return (
    <p className="bg-brand-300 text-clear rounded px-1 flex gap-1 items-center">
      <SiAmazoncloudwatch />
      <span className="text-clear text-xs">Solo lectura</span>
    </p>
  );
};

export const ModificameBRENDIYellowCorner = () => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div 
      className="relative border-[1px] text-gray-400 dark:text-gray-400/50 dark:border-gray-400/50 border-gray-400 border-dashed min-w-7 !w-7 !h-7 flex items-center justify-center rounded-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <IoMailUnreadOutline />
      <div 
        className={`${
          isHovered ? 'scale-100' : 'scale-0'
        } absolute top-1 transition-all flex items-center h-5 dark:border-gray-400/10 dark:border-[1px] right-7 bg-dark text-white w-fit px-2 text-xs rounded-md`}
      >
        Suscripción
      </div>
    </div>
  );
};
