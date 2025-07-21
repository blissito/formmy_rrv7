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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Go Home
      </a>
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
