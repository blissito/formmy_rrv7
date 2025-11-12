import { Link, useFetcher } from "react-router";
import { Fragment, useCallback, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import ToggleButton from "./Switch";
import { Menu, Transition } from "@headlessui/react";
import { LiaSchoolSolid } from "react-icons/lia";
import { AiOutlineLogout } from "react-icons/ai";
import { RiUserSettingsLine } from "react-icons/ri";
import Spinner from "./Spinner";
import type { User } from "@prisma/client";
import {
  MdOutlineSpeakerNotes,
  MdOutlineDashboardCustomize,
} from "react-icons/md";

const Nav = ({ user, showcta }: { showcta?: boolean; user?: User }) => {
  //   const action = useGoogleCode();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const fetcher = useFetcher();
  // esto pasa después (2)
  useEffect(() => {}, [theme]);

  const updateTheme = (t: "light" | "dark") => {
    if (t === "dark") {
      document.documentElement.classList.add("dark"); // sitio web
      document.querySelector("#theme-trick")?.classList.add("dark"); // página
      localStorage.setItem("theme", "dark"); // navegador
      setTheme("dark"); // componente
    } else {
      document.documentElement.classList.remove("dark");
      document.querySelector("#theme-trick")?.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };
  // esto pasa primero promise
  const onChangeTheme = async () => {
    updateTheme(theme === "dark" ? "light" : "dark");
  };
  // esto pasa al montar (0)
  useEffect(() => {
    const current = localStorage.getItem("theme");
    if (current && (current === "dark" || current === "light")) {
      updateTheme(current);
    } else {
      localStorage.setItem("theme", "dark");
    }
  }, []);

  const handleLogout = () => {
    fetcher.submit(
      { intent: "logout" },
      { method: "post", action: "/api/login" }
    );
  };

  const handleLogin = () => {
    // Clear any saved plan intent when user explicitly clicks login
    // (as opposed to being redirected to login when trying to purchase a plan)
    localStorage.removeItem('formmy_plan_intent');
  };

  return (
    <nav className=" fixed flex items-center  top-0 z-[90]  bg-clear/60 dark:bg-dark/60 backdrop-blur w-full text-black/80 dark:text-slate-300 shadow-sm dark:shadow h-16 md:h-20">
      <section className="w-full flex items-center justify-between py-4 px-4 max-w-3xl mx-auto lg:max-w-6xl ">
        <Link to="/">
          <img
            className="h-8 lg:h-10"
            src="/assets/formmy-logo.png"
            alt="logo formmy"
          />
        </Link>
        <fetcher.Form className="flex items-center gap-2" method="post">
          {user ? (
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="inline-flex w-full justify-center py-2 rounded-md text-sm font-medium  hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                <img
                  className="w-10 h-10 rounded-full"
                  src={user.picture}
                  alt="avatar"
                />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-clear dark:bg-[#1C1E23]  shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-1 py-1 ">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/dash"
                          className={`${
                            active
                              ? "bg-[#F5F5FC] dark:bg-gray-900/40 text-space-800  dark:text-space-300"
                              : "text-space-800  dark:text-clear"
                          } group flex w-full gap-2 items-center rounded-md px-2 py-2 text-sm`}
                        >
                          <MdOutlineDashboardCustomize size="20px" />
                          Dashboard
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/academy"
                          className={`${
                            active
                              ? "bg-[#F5F5FC] dark:bg-gray-900/40 text-space-800  dark:text-space-300"
                              : "text-space-800  dark:text-clear"
                          } group flex w-full gap-2 items-center rounded-md px-2 py-2 text-sm`}
                        >
                          <LiaSchoolSolid size="20px" />
                          Formmy Academy
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/feedback"
                          className={`${
                            active
                              ? "bg-[#F5F5FC] dark:bg-gray-900/40 text-space-800  dark:text-space-300"
                              : "text-space-800  dark:text-clear"
                          } group flex w-full gap-2 items-center rounded-md px-2 py-2 text-sm`}
                        >
                          <MdOutlineSpeakerNotes size="18px" />
                          Feedback
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={`${
                            active
                              ? "bg-[#F5F5FC] dark:bg-gray-900/40 text-space-800  dark:text-space-300"
                              : "text-space-800  dark:text-clear"
                          } group flex w-full gap-2 items-center rounded-md px-2 py-2 text-sm`}
                        >
                          <RiUserSettingsLine size="18px" />
                          Perfil
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          type="button"
                          className={`${
                            active
                              ? "bg-[#F5F5FC] dark:bg-gray-900/40 text-space-800  dark:text-space-300"
                              : "text-space-800  dark:text-clear"
                          } group flex w-full gap-2 items-center rounded-md px-2 py-2 text-sm `}
                        >
                          <AiOutlineLogout size="18px" />
                          Cerrar sesión
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          ) : (
            <>
              {showcta ? (
                <button
                  type="submit"
                  name="intent"
                  value="google-login"
                  disabled={fetcher.state !== "idle"}
                  onClick={handleLogin}
                  className={twMerge(
                    "font-normal",
                    "bg-transparent rounded-full dark:bg-[#1D2027] text-space-800 dark:text-white p-3 px-4  hover:scale-105 transition-all"
                  )}
                >
                  {fetcher.state !== "idle" ? <Spinner /> : "Iniciar sesión"}
                </button>
              ) : null}
            </>
          )}

          <label htmlFor="theme text-xs"></label>
          <ToggleButton theme={theme} onChange={onChangeTheme} />
        </fetcher.Form>
      </section>
    </nav>
  );
};

export default Nav;
