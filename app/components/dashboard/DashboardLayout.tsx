import type { ReactNode } from "react";
import { Fragment, useCallback, useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { Link, useFetcher } from "react-router";
import { LiaSchoolSolid } from "react-icons/lia";
import { AiOutlineLogout } from "react-icons/ai";
import { RiUserSettingsLine } from "react-icons/ri";
import {
  MdOutlineSpeakerNotes,
  MdOutlineDashboardCustomize,
} from "react-icons/md";
import type { User } from "@prisma/client";
import AiIcon from "../ui/icons/AiIcon";
import { IconButtonLink } from "../ui/IconButtonLink";
import { Button } from "../Button";
import ChatIcon from "../ui/icons/ChatIcon";
import { Avatar } from "../chat";
import { DocumentIcon } from "../ui/icons/DocumentIcon";
import ChatIconActive from "../ui/icons/ChatIconActive";
import DocumentIconActive from "../ui/icons/DocumentIconActive";
import AiIconActive from "../ui/icons/AiIconActive";
import Usage from "../ui/icons/Usage";
import HelpIcon from "../ui/icons/Help";
import HelpIconActive from "../ui/icons/HelpActive";
import { BiGhost } from "react-icons/bi";
import { IoGiftOutline } from "react-icons/io5";
import { cn } from "~/lib/utils";

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
  actionButton?: {
    text: string;
    to: string;
    icon?: ReactNode;
  };
  user?: User;
}

export function DashboardLayout({
  title,
  children,
  actionButton,
  user,
}: DashboardLayoutProps) {
  return (
    <div className={cn("mx-auto w-full overflow-hidden h-full min-h-svh max-h-svh bg-surface flex  flex-col-reverse pr-2 pl-2 box-border overflow-y-scroll", "md:flex-row  md:pr-8 md:pl-0")}>
      <div className={cn("flex flex-row  justify-center  items-center py-0 pb-2 w-full gap-0 rounded-r-3xl  h-auto ",
                    "md:flex-col md:static md:justify-center  md:py-8 md:w-[120px] md:gap-8 md:h-svh md:min-h-svh md:fixed md:top-0"
      )}>
        <Link prefetch="render" to="/dashboard" className=" hidden md:flex">
          <img
            className="min-w-10 h-10 md:w-[60px] md:h-[60px]"
            src="/dash/logo-full.svg"
            alt="Formmy Logo"
          />
        </Link>
        <nav className=" flex pt-2 flex-row md:flex-col items-center justify-center md:gap-8 gap-0 w-fit md:w-full px-0 md:px-2">
          <IconButtonLink
            to="/dashboard/ghosty"
            icon={<AiIcon className="w-8 h-8 md:w-10 h-10 text-dark" />}
            activeIcon={<AiIconActive className="w-8 h-8 md:w-10 h-10 text-brand-500" />}
            title="Ghosty"
            variant="ghost"
            className="w-full justify-start px-3 rounded-xl"
          />
          <IconButtonLink
            to="/dashboard/formmys"
            icon={<DocumentIcon className="w-8 h-8 md:w-10 h-10 text-dark" />}
            activeIcon={
              <DocumentIconActive className="w-8 h-8 md:w-10 h-10 text-brand-500" />
            }
            title="Formmys"
            variant="ghost"
            className="w-full justify-start px-3 rounded-xl"
          />
          <IconButtonLink
            to="/dashboard/chat"
            icon={<ChatIcon className="w-8 h-8 md:w-10 h-10 text-dark" />}
            activeIcon={<ChatIconActive className="w-8 h-8 md:w-10 h-10 text-brand-500" />}
            title="Chatbots"
            variant="ghost"
            className="w-full justify-start px-3 rounded-xl"
          />
          <IconButtonLink
            to="/dashboard/ayuda"
            icon={<HelpIcon className="w-8 h-8 md:w-10 h-10 text-dark" />}
            activeIcon={<HelpIconActive className="w-8 h-8 md:w-10 h-10 text-brand-500" />}
            title="Ayuda"
            variant="ghost"
            className="w-full justify-start px-3 rounded-xl"
          />
        </nav>
      </div>
      <div className="flex flex-col grow w-full md:pb-8 pb-0 ml-0 md:ml-[120px]">
        <TopMenu user={user} />
        <div className="bg-white relative w-full h-full rounded-3xl md:rounded-[40px] min-h-[calc(100svh-144px)] max-h-[calc(100svh-144px)] overflow-y-scroll md:overflow-y-auto md:max-h-none noscroll">
          {children}
        </div>
      </div>
    </div>
  );
}

export const TopMenu = ({ user }: { user: User }) => {
  const fetcher = useFetcher();

  const handleLogout = () => {
    fetcher.submit(
      { intent: "logout" },
      { method: "post", action: "/api/login" }
    );
  };

  return (
    <div className="md:h-20 h-16 flex items-center justify-between  gap-2 w-full">
      <Link prefetch="render" to="/dashboard" className=" flex md:hidden ">
          <img
            className="w-10 h-10  "
            src="/dash/logo-full.svg"
            alt="Formmy Logo"
          />
      </Link>
      <div className="flex items-center justify-end md:gap-2 gap-0 w-full">
      <Link to="">
        <Button
          variant="secondary"
          className="h-10 flex gap-1 items-center px-2"
        >
          <Usage className="w-8 h-8 ml-1 mt-1" /> Uso
        </Button>
      </Link>
      <Button className="h-10 px-4 md:px-6" variant="ghost">Docs</Button>
      {user ? (
        <Menu as="div" className="relative z-20 inline-block text-left">
          <Menu.Button className="inline-flex w-full justify-center py-2 rounded-md text-sm font-medium hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
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
            <Menu.Items className="absolute z-10 top-12 right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-2xl bg-white  shadow-standard ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/dashboard/ghosty"
                      className={`${
                        active ? "bg-brand-100  text-dark " : "text-dark "
                      } group flex w-full gap-2 items-center rounded-md px-2 py-2 text-sm`}
                    >
                      <BiGhost className="text-dark" size="20px" />
                      Ghosty
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/compartir"
                      className={`${
                        active
                          ? "bg-[#F5F5FC] dark:bg-gray-900/40 text-space-800 dark:text-space-300"
                          : "text-space-800 dark:text-clear"
                      } group flex w-full gap-2 items-center rounded-md px-2 py-2 text-sm`}
                    >
                      <IoGiftOutline size="20px" />
                      Compartir con amigos
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/feedback"
                      className={`${
                        active
                          ? "bg-[#F5F5FC] dark:bg-gray-900/40 text-space-800 dark:text-space-300"
                          : "text-space-800 dark:text-clear"
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
                      to="/dashboard/plan"
                      className={`${
                        active
                          ? "bg-[#F5F5FC] dark:bg-gray-900/40 text-space-800 dark:text-space-300"
                          : "text-space-800 dark:text-clear"
                      } group flex w-full gap-2 items-center rounded-md px-2 py-2 text-sm`}
                    >
                      <RiUserSettingsLine size="18px" />
                      Plan
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
                          ? "bg-[#F5F5FC] dark:bg-gray-900/40 text-space-800 dark:text-space-300"
                          : "text-space-800 dark:text-clear"
                      } group flex w-full gap-2 items-center rounded-md px-2 py-2 text-sm`}
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
        <Avatar />
      )}
      </div>
    </div>
  );
};
