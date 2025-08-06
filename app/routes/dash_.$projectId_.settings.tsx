// @todo is this deprecated?

import Nav from "~/components/NavBar";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { twMerge } from "tailwind-merge";
import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { ProTag } from "~/components/ProTag";
import { type ReactNode } from "react";
import { useState } from "react";
import { IoReturnUpBackOutline } from "react-icons/io5";
import { BackGround } from "./dash";
import type { Route } from "./+types/dash_.$projectId_.settings.access";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);
  return { user };
};

export default function Route() {
  const { user } = useLoaderData<typeof loader>();
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const params = useParams();
  const { pathname } = useLocation();

  return (
    <article className="min-h-screen pb-8 relative  ">
      <BackGround className="bg-clear " />
      <Nav user={user} />
      <main className="flex md:flex-row flex-col pt-28 px-4 max-w-6xl mx-auto text-space-800 dark:text-white relative">
        <div
          className="absolute top-24 left-12  py-2 border rounded-md px-2 hover:scale-105 active:scale-100 border-brand-500 text-brand-500 cursor-pointer"
          onClick={() => navigate("/dash/" + params.projectId)}
        >
          <IoReturnUpBackOutline />
        </div>
        <nav className="bg-gray-50 m-8 flex flex-col gap-4 py-8 dark:bg-gray-900 rounded-lg">
          <p className="pl-8 font-bold">General</p>
          <MenuItem
            isActive={pathname.includes("notifications")}
            to="notifications"
            className={twMerge(
              pathname.includes("notifications") &&
                "border-l-4 border-brand-500",
              "px-12 py-2 font-normal text-gray-600 dark:text-gray-400"
            )}
            text="Notificaciones"
          />
          <MenuItem
            isActive={pathname.includes("danger")}
            to="danger"
            className={twMerge(
              pathname.includes("danger") && "border-l-4 border-brand-500",
              "px-12 py-2 font-normal text-gray-600 dark:text-gray-400"
            )}
            text="Danger Zone"
          />

          <p className="pl-8 font-bold">Equipo</p>
          {user.plan === "FREE" && (
            <button
              onClick={() => setShow(true)}
              className={twMerge(
                pathname.includes("users") && "border-brand-500",
                "px-12 py-2 text-left text-sm  font-normal border-l-4 border-transparent disabled:text-gray-100 disabled:cursor-not-allowed relative  text-gray-600 dark:text-gray-400 cursor-not-allowed"
              )}
            >
              <ProTag isOpen={show} onChange={(val) => setShow(val)} />
              Usuarios
            </button>
          )}
          {user.plan === "PRO" && (
            <MenuItem
              isActive={pathname.includes("access")}
              to="access"
              className={twMerge(
                pathname.includes("access") && "border-l-4 border-brand-500",
                "px-12 py-2 font-normal text-gray-600 dark:text-gray-400"
              )}
              text="Usuarios"
            />
          )}
        </nav>
        <section className="py-8 px-1 md:px-8 w-full">
          <Outlet />
        </section>
      </main>
    </article>
  );
}

export const MenuItem = ({
  text,
  prefetch = "intent",
  isActive,
  to,
  proTag = false,
  isDisabled,
  className,
}: {
  prefetch?: "intent" | "render";
  className?: string;
  isDisabled?: boolean;
  proTag?: boolean;
  to: string;
  isActive?: boolean;
  text: ReactNode;
}) => {
  const cn = twMerge(
    isDisabled && "cursor-not-allowed",
    "px-12 py-2 font-light border-l-4 border-transparent disabled:text-gray-500 disabled:cursor-not-allowed relative text-sm",
    isActive && "border-brand-500 font-medium",
    isDisabled && "dark:text-gray-600 text-gray-400",
    className
  );
  return isDisabled || !to ? (
    <div className={cn}>
      {proTag && <ProTag />}
      {text}
    </div>
  ) : (
    <Link className={cn} to={to} prefetch={prefetch}>
      {" "}
      {proTag && <ProTag />}
      {text}
    </Link>
  );
};
