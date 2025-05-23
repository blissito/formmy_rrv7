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
import { getUserOrRedirect } from ".server/getUserUtils";
import type { Route } from "./+types/dash";

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
    return redirect("/dash/" + permission.projectId);
  }

  if (intent === "reject_invite") {
    const permissionId = formData.get("permissionId") as string;
    updatePermission("rejected", permissionId, user.id);
    return { close: true };
    // return redirect("/dash");
  }
  return null;
};

export default function Dash() {
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
    <>
      <ProTag
        onClose={hid}
        isOpen={isProOpen}
        onChange={(val) => setIsProOpen(val)}
      />
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
      {user.plan === "FREE" && showModal && <ProTag isOpen={true} />}
      <section className=" bg-clear dark:bg-space-900">
        <Nav user={user} />
        <BackGround />
        <main className="pt-32 pb-0  px-4 max-w-6xl mx-auto min-h-screen h-full text-space-800 dark:text-space-900 ">
          <nav className="flex gap-2 flex-wrap justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold dark:text-white text-space-800">
                Tus Formmys
              </h2>
            </div>
            <div className="flex gap-2 mt-2 md:mt-0 w-full md:w-fit	">
              <div className="relative w-full">
                <span className="absolute top-3 left-2 text-gray-400">
                  <BsSearch />
                </span>
                <input
                  disabled
                  onChange={onSearch}
                  type="search"
                  placeholder="Busca un Formmy"
                  className={twMerge(
                    "disabled:cursor-not-allowed",
                    " cursor-pointer text-gray-600 dark:text-white pl-8 border-none input dark:bg-[#141419] bg-[#F7F7F9] placeholder:text-space-400  focus:ring-1 focus:ring-brand-500 placeholder:font-light rounded-lg w-full"
                  )}
                  name="search"
                />
              </div>

              {!isLimited && (
                <Link to="new">
                  <button className="h-10 w-[auto] md:min-w-[120px] flex gap-1 items-center bg-brand-500 py-3 px-6 rounded-md text-clear hover:ring transition-all">
                    + <span className="">Formmy</span>
                  </button>
                </Link>
              )}

              {isLimited && (
                <button
                  className="relative bg-gray-300 h-10 w-[auto] md:min-w-[120px] flex gap-1 items-center py-3 px-6 rounded-md text-gray-400 dark:text-gray-500 hover:ring transition-all"
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
          <section className="py-10 md:py-16 flex flex-wrap gap-4">
            {filtered.map((p) => (
              <ProjectCard
                isInvite={p.userId !== user.id}
                key={p.id}
                project={p}
                {...p}
                //@TODO: corder for invite
                // actionNode={<DotsMenu projectId={p.id} onDelete={undefined} />} // incomplete...
              />
            ))}
            {filtered.length < 1 && (
              <div className="mx-auto text-center flex flex-col justify-center">
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
                <h2 className="font-bold mt-8 text-space-800 dark:text-white text-lg">
                  ¡Nada por aquí!
                </h2>
                <p className="font-light mt-4 text-space-600 dark:text-space-400">
                  {!isSearch &&
                    " Crea tu primer Formmy y empieza a recibir mensajes."}
                  {isSearch &&
                    "No encontramos ningún Formmy con ese nombre. Intenta con otro."}
                </p>
              </div>
            )}
          </section>
        </main>
        <Outlet />
      </section>
    </>
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
}: {
  isInvite?: boolean;
  actionNode?: ReactNode;
  project: Project;
  name: string;
  id: string;
}) => {
  return (
    <Link
      to={id ?? ""}
      className=" shadow-[0_4px_16px_0px_rgba(204,204,204,0.25)] hover:shadow-[0_4px_16px_0px_rgba(204,204,204,0.50)]
        dark:shadow-none border border-[#E0E0EE] dark:border-clear/10 bg-[#fff] dark:bg-dark rounded-md p-4  w-full md:w-[268px] cursor-pointer  transition-all"
    >
      <section className="flex justify-between items-center">
        <h2 className="text-xl font-medium dark:text-white text-space-800 truncate">
          {name}
        </h2>
        {actionNode}
        {project.type && <ModificameBRENDIYellowCorner />}
      </section>
      <div className="flex text-sm gap-4 mt-4 justify-between">
        <p className="text-space-600 dark:text-space-400 font-normal ">
          💬 {project.answers?.length} mensajes
        </p>
        {isInvite && <ModificameBRENDIPurpleCorner />}
      </div>
    </Link>
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
  return (
    <div className="group relative border-[1px] text-gray-400 dark:text-gray-400/50 dark:border-gray-400/50 border-gray-400 border-dashed w-7 h-7 flex items-center justify-center rounded-full">
      <IoMailUnreadOutline />
      <div className="scale-0 group-hover:scale-100 absolute top-8 transition-all  flex items-center h-5 dark:border-gray-400/10 dark:border-[1px] -right-4 bg-dark text-white  w-fit px-2 text-xs rounded-md">
        Suscripción
      </div>
    </div>
  );
};
