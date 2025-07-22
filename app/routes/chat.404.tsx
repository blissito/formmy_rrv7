import { Link } from "react-router";

/**
 * 404 page for the chatbot management UI
 */
export default function ChatbotNotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Chatbot Not Found</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        The chatbot you're looking for doesn't exist or you don't have
        permission to access it.
      </p>
      <Link
        to="/chat"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Return to Chatbot List
      </Link>
    </div>
  );
}

export const meta = () => [
  { title: "Chatbot Not Found" },
  { name: "description", content: "The requested chatbot could not be found" },
];
