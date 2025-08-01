import React, { useState, useEffect } from "react";
import { Form, Link, useLocation } from "react-router";
import { BigCTA } from "~/components/BigCTA";
import { Button } from "~/components/Button";
import { motion, AnimatePresence } from "framer-motion";
import { FaWpforms } from "react-icons/fa";
import { PiRobotLight } from "react-icons/pi";
import { RiRobot3Line } from "react-icons/ri";
import { MdOutlineDynamicForm } from "react-icons/md";
import { HiMenu, HiX, HiChevronDown } from "react-icons/hi";
const imgVector = "/assets/formmy-logo.png";
const imgGroup = "http://localhost:3845/assets/3b231df5bf5b664c9077cec67d79aa66bee912bf.svg";

export default function HomeHeader() {
  const location = useLocation();
  const pathname = location.pathname;
  const [showDropdown, setShowDropdown] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setExpanded(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Header mobile: estático, sin animación */}
      <header className="block md:hidden fixed bg-[#ffffff] !h-16 md:!h-20 top-6 left-1/2 translate-x-[-45vw] z-30 flex justify-between items-center pl-6 pr-4 w-[90vw] rounded-[99px] shadow-[0px_2px_32px_0px_rgba(33,22,76,0.08)]">
        <Link to="/">
          <img className="w-20 md:auto" src={imgVector} alt="logo" />
        </Link>
        <button className="block md:hidden text-2xl text-dark focus:outline-none border border-gray-200 rounded-full w-12 h-12 flex items-center justify-center" aria-label="Abrir menú" onClick={() => setMobileMenu((v) => !v)}>
          {mobileMenu ? <HiX /> : <HiMenu />}
        </button>
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="absolute left-0 top-full w-full bg-clear shadow-2xl rounded-3xl z-40 flex flex-col gap-2 py-8 px-6 mt-4"
            >
              <div className="flex flex-col gap-1 mt-2">
                <div className="text-dark text-lg font-medium mb-1 pl-2">Productos</div>
                <Link to="/formularios" className="flex items-center gap-2 px-2 py-3 pl-4 text-gray-800 hover:bg-gray-50 rounded-2xl text-lg font-medium" onClick={() => setMobileMenu(false)}>
                  <MdOutlineDynamicForm className="text-dark text-lg" />
                  Formularios
                </Link>
                <Link to="/chat-ia" className="flex items-center gap-2 px-2 py-3 pl-4 text-gray-800 hover:bg-gray-50 rounded-2xl text-lg font-medium" onClick={() => setMobileMenu(false)}>
                  <RiRobot3Line className="text-dark text-lg" />
                  Chat IA
                </Link>
                <a className="flex items-center justify-between px-2 py-3 text-gray-800 hover:bg-gray-50 rounded-2xl text-lg font-medium" href="/planes" onClick={() => setMobileMenu(false)}>
                  <span>Planes</span>
                </a>
                <a className="flex items-center justify-between px-2 py-3 text-gray-800 hover:bg-gray-50 rounded-2xl text-lg font-medium" href="#" onClick={() => setMobileMenu(false)}>
                  <span>Iniciar sesión</span>
                </a>
                <Form method="post" className="mt-4">
                  <BigCTA type="submit" name="intent" value="google-login" />
                </Form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      {/* Header desktop: animado con motion */}
      <motion.header
        initial={false}
        animate={expanded ? "expanded" : "default"}
        variants={{
          default: {
            width: 810,
            boxShadow: "0px 2px 32px 0px rgba(33,22,76,0.08)",
          },
          expanded: {
            width: 700,
            boxShadow: "0px 8px 32px 0px rgba(33,22,76,0.12)",
          },
        }}
        transition={{ duration: 0.04, ease: "linear" }}
        className="hidden md:flex fixed bg-[#ffffff] !h-20 top-6 left-1/2 rounded-[99px] translate-x-[-50%] z-30 flex justify-between items-center pl-8 pr-4 w-[810px]"
        style={{
          transition: "width 0.3s, box-shadow 0.3s",
        }}
      >
        <Link to="/">
          <img className="w-28" src={imgVector} alt="logo" />
        </Link>
        <nav className="flex-1 flex justify-end items-center gap-6">
          <div
            className="relative text-dark text-lg font-regular cursor-pointer pl-3 "
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            {(pathname === "/formularios" || pathname === "/chat-ia") && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-500" />
            )}
            Productos
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="absolute left-0 top-full mt-2 w-56 bg-clear rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                >
                  <Link to="/chat-ia" className="flex items-center gap-3 px-4 py-2 text-dark hover:bg-gray-50 transition">
                    <RiRobot3Line className="text-dark text-xl" />
                    Chat IA
                  </Link>
                  <Link to="/formularios" className="flex items-center gap-3 px-4 py-2 text-dark hover:bg-gray-50 transition">
                    <MdOutlineDynamicForm className="text-dark text-xl" />
                    Formularios
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link className="relative text-dark text-lg font-regular pl-3" to="/planes">
            {pathname === "/planes" && (
               <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-500" />
            )}
            Planes
          </Link>
          <Form method="post">
          <button className="text-dark text-lg font-regular" type="submit" name="intent" value="google-login">Iniciar sesión</button>
          </Form>
          <Form method="post">
              <BigCTA type="submit" name="intent" value="google-login" className="hidden md:block"/>
          </Form>
        </nav>
      </motion.header>
    </>
  );
} 