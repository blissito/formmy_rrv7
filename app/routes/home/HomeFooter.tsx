import { AiFillInstagram } from "react-icons/ai";
import { FaFacebook, FaLinkedinIn, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { GrProductHunt } from "react-icons/gr";
import { Form } from "react-router";

export default function HomeFooter() {
  return (
    <footer className="bg-dark text-white w-full pt-10 md:pt-20 pb-10  border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row md:justify-between gap-12">
        {/* Logo y redes */}
        <div className="flex flex-col gap-8 min-w-[220px]">
          <img alt="logo" className="w-32" src="/logo.svg" />
          <div className="text-lightGray">
            <span className="block mb-2 text-sm text-gray-400">Síguenos</span>
            <div className="flex gap-4">
              <a
                className="hover:opacity-60"
                href="https://www.facebook.com/profile.php?id=61554028371141"
                target="_blank"
                rel="noreferrer"
              >
                <FaFacebook />
              </a>
              <a
                className="hover:opacity-60"
                href="https://twitter.com/FormmyApp1"
                target="_blank"
                rel="noreferrer"
              >
                <FaXTwitter />
              </a>
              <a
                className="hover:opacity-60"
                href="https://www.instagram.com/_formmyapp/"
                target="_blank"
                rel="noreferrer"
              >
                <AiFillInstagram />
              </a>
              <a
                className="hover:opacity-60"
                href="https://www.youtube.com/@_FormmyApp"
                target="_blank"
                rel="noreferrer"
              >
                <FaYoutube />
              </a>
              <a
                href="https://www.linkedin.com/company/formmyapp"
                className="hover:opacity-60"
              >
                <i className="fa-brands fa-linkedin-in" />
                <FaLinkedinIn />
              </a>
            </div>
          </div>
        </div>
        {/* Links */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="font-semibold mb-3 text-base">Empieza ya</div>
            <ul className="space-y-2 text-gray-500 text-sm text-lightGray">
              <Form method="post" action="/api/login">
                <button
                  type="submit"
                  name="intent"
                  value="google-login"
                  className="cursor-pointer hover:underline"
                >
                  Pruébalo gratis
                </button>
              </Form>
              <li>
                <a href="/formularios" className="hover:underline">
                  Formularios
                </a>
              </li>
              <li>
                <a href="/chat-ia" className="hover:underline">
                  Chat IA
                </a>
              </li>
              <li>
                <a href="/planes" className="hover:underline">
                  Planes
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3 text-base">Comunidad</div>
            <ul className="space-y-2 text-gray-500 text-sm text-lightGray">
              <li>
                <a href="/academy" className="hover:underline">
                  Formmy Academy
                </a>
              </li>
              <li>
                <a href="/blog" className="hover:underline">
                  Blog
                </a>
              </li>
              {/* <li><a href="#" className="hover:underline">Blog</a></li> */}
            </ul>
            <div className="block md:hidden mt-7">
              <div className="font-semibold mb-3 text-base">Empresa</div>
              <ul className="space-y-2 text-gray-500 text-sm text-lightGray">
                {/* <li><a href="#" className="hover:underline">Acerca de</a></li>
              <li><a href="#" className="hover:underline">Carreras</a></li> */}
                <li>
                  {" "}
                  <a
                    href="https://wa.me/527757609276?text=¡Hola!%20Quiero%20agendar%20un%20demo."
                    target="_blank"
                    className="hover:underline"
                  >
                    Contacto
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="font-semibold mb-3 text-base">Empresa</div>
            <ul className="space-y-2 text-gray-500 text-sm text-lightGray">
              {/* <li><a href="#" className="hover:underline">Acerca de</a></li>
              <li><a href="#" className="hover:underline">Carreras</a></li> */}
              <li>
                {" "}
                <a
                  href="https://wa.me/527757609276?text=¡Hola!%20Quiero%20agendar%20un%20demo."
                  target="_blank"
                  className="hover:underline"
                >
                  Contacto
                </a>
              </li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="font-semibold mb-3 text-base">
              Únete al newsletter
            </div>
            <form className="flex items-center gap-2 mt-2">
              <input
                type="email"
                placeholder="Escribe tu correo"
                className="rounded-full px-4 py-2 bg-white/5 border-none text-white placeholder:text-white/20 focus:ring-brand-500 focus:outline-none w-full"
              />
              <button
                type="submit"
                className="bg-brand-500 rounded-full min-w-10 h-10 flex items-center justify-center text-white text-lg hover:-rotate-45 transition-all "
              >
                →
              </button>
            </form>
          </div>
        </div>
      </div>
      {/* Trustpilot y legal */}
      <div className="max-w-7xl mx-auto px-4 mt-12 flex flex-col md:flex-row md:justify-between items-center gap-4 border-t border-white/5 pt-8 text-gray-500">
        <div className="flex items-center gap-4">
          <span className="text-xs text-lightGray ">
            © 2025 Formmy. Derechos reservados.
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex gap-1 items-center bg-[rgba(238,107,92,0.2)] py-1 px-2 rounded text-[#EE6B5C]">
            <GrProductHunt /> ProductHunt
          </span>
          <a
            href="/aviso"
            className="text-xs text-lightGray hover:underline"
          >
            Aviso de Privacidad
          </a>
          <a href="/terms" className="text-xs text-lightGray hover:underline">
            Términos y condiciones
          </a>
        </div>
      </div>
    </footer>
  );
}
