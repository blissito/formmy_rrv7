import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar } from "./Avatar";

interface MessageBubbleProps {
  message: {
    role: "user" | "assistant";
    content: string;
  };
  primaryColor?: string;
}

export const MessageBubble = ({
  message,
  primaryColor,
}: MessageBubbleProps) => {
  if (message.role === "assistant") {
    return (
      <main className="px-4 flex items-start gap-3">
        <Avatar primaryColor={primaryColor} />
        <div className="bg-white dark:bg-space-700 rounded-lg p-3 max-w-md shadow-sm">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:mb-2 prose-p:last:mb-0 prose-headings:mb-2 prose-headings:font-bold prose-ul:mb-2 prose-ol:mb-2 prose-li:text-sm prose-code:bg-gray-100 prose-code:dark:bg-gray-600 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-gray-100 prose-pre:dark:bg-gray-600 prose-pre:p-2 prose-pre:rounded prose-pre:text-xs prose-code:font-mono prose-pre:overflow-x-auto prose-pre:mb-2 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:dark:border-gray-500 prose-blockquote:pl-2 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:dark:text-gray-400 prose-blockquote:mb-2 prose-strong:font-semibold prose-em:italic prose-a:text-blue-600 prose-a:dark:text-blue-400 prose-a:hover:underline prose-table:overflow-x-auto prose-table:w-full prose-th:px-2 prose-th:py-1 prose-th:text-xs prose-th:font-semibold prose-td:px-2 prose-td:py-1 prose-td:text-xs">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ children, href }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-left">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs">
                    {children}
                  </td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex items-start gap-3 justify-end">
      <div className="bg-brand-500 rounded-lg p-3 max-w-xs">
        <p className="text-sm text-white">{message.content}</p>
      </div>
      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0" />
    </div>
  );
};
