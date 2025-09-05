import { useLocation } from "react-router";

/**
 * Catch-all route for handling unmatched URLs
 * This includes Chrome DevTools requests and other system requests
 */
export default function CatchAllRoute() {
  const location = useLocation();

  // Handle Chrome DevTools and other system requests silently
  if (
    location.pathname.includes(".well-known") ||
    location.pathname.includes("devtools") ||
    location.pathname.includes("favicon.ico")
  ) {
    return new Response(null, { status: 404 });
  }

  // For other unmatched routes, show a 404 page
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center min-h-svh grid place-items-center bg-[url('/dash/city.svg')] bg-center bg-no-repeat">
      <div className="flex flex-col items-center">
      <h1 className="text-dark  font-bold mb-4 uppercase mb-0 text-5xl md:text-[100px] xl:text-[172px] tracking-tight flex">¡Vaya <img className="w-20 md:w-24 lg:w-28 xl:w-auto -mt-4 lg:-mt-8 xl:-mt-16 ml-5" src="/dash/sleepy-ghosty.svg" alt="" /> vaya!</h1>
      <p className="text-dark text-3xl md:text-6xl xl:text-[100px] -mt-5 xl:-mt-50 uppercase font-semibold">
      Esta página no existe.
      </p>
      <img className="w-20" src="/dash/arrow.gif" alt=""/>
      <a
        href="/"
        className="inline-flex items-center px-4 h-12 border border-transparent text-lg font-medium rounded-full  text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-0  focus:ring-none"
      >
       Volver al Inicio
      </a>
      </div>
    </div>
  );
}

/**
 * Loader function to handle system requests
 */
export const loader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);

  // Handle Chrome DevTools and other system requests
  if (
    url.pathname.includes(".well-known") ||
    url.pathname.includes("devtools") ||
    url.pathname.includes("favicon.ico")
  ) {
    return new Response(null, { status: 404 });
  }

  // For other requests, continue to the component
  return null;
};

export const meta = () => [
  { title: "Page Not Found" },
  { name: "description", content: "The requested page could not be found" },
];
