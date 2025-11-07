import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import stylesheet from "./app.css?url";
import type { ReactNode } from "react";
import useHotjar from "./utils/useHotjar";
import useGoogleTM from "./utils/useGoogleTM";
import useFacebookPixel from "./utils/useFacebookPixel";
import { Toaster } from "react-hot-toast";
import { useTagManager } from "./utils/useTagManager";

// Flag to ensure server initialization happens only once
let serverInitialized = false;

/**
 * Root loader - initializes server background tasks
 */
export async function loader() {
  if (!serverInitialized && typeof window === "undefined") {
    serverInitialized = true;

    // ✅ Import dinámico para evitar ERR_MODULE_NOT_FOUND en producción
    const { initializeServer } = await import("server/init.server");

    await initializeServer().catch((error) => {
      console.error("⚠️  Server initialization failed:", error);
    });
  }

  return null;
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Flavors&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Kablammo&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Rubik+Wet+Paint&display=swap",
  },
  { rel: "stylesheet", href: stylesheet },
];

export function Layout({ children }: { children: ReactNode }) {
  useHotjar();
  useGoogleTM();
  useFacebookPixel();
  useTagManager();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={{
        overflowX: "hidden",
        background: "transparent",
      }}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
    // No log
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
