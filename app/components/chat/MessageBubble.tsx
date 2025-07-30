import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar } from "./Avatar";
import type { ReactNode } from "react";

interface MessageBubbleProps {
  message?: {
    role: "user" | "assistant";
    content: ReactNode;
  };
  role?: "user" | "assistant";
  children?: ReactNode;
  primaryColor?: string;
}

export const MessageBubble = ({
  message = { role: "assistant", content: "..." },
  children: nodes,
  primaryColor,
}: MessageBubbleProps) => {
  if (message.role === "user" && message.content) {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="bg-dark rounded-xl p-2 max-w-xs">
          <p className="text-base text-white whitespace-pre-line leading-tight">
            {nodes || message?.content}
          </p>
        </div>
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0" />
      </div>
    );
  }
  if (nodes) {
    return (
      <main className="px-4 flex items-start gap-3 ">
        {/* <Avatar primaryColor={primaryColor} /> */}
        <div className="bg-white border dark:bg-space-700 rounded-xl p-3 max-w-md">
          <div
            className="prose prose-sm dark:prose-invert max-w-none prose-p:my-0 prose-p:leading-tight prose-headings:my-1 prose-headings:font-bold prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-li:text-sm prose-code:bg-gray-100 prose-code:dark:bg-gray-600 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-gray-100 prose-pre:dark:bg-gray-600 prose-pre:p-1 prose-pre:rounded prose-pre:text-xs prose-code:font-mono prose-pre:overflow-x-auto prose-pre:my-1 prose-blockquote:border-l-2 prose-blockquote:border-gray-200 prose-blockquote:dark:border-gray-500 prose-blockquote:pl-2 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:dark:text-gray-400 prose-blockquote:my-1 prose-strong:font-semibold prose-em:italic prose-a:text-blue-600 prose-a:dark:text-blue-400 prose-a:hover:underline prose-table:overflow-x-auto prose-table:w-full prose-th:px-2 prose-th:py-0.5 prose-th:text-xs prose-th:font-semibold prose-td:px-2 prose-td:py-0.5 prose-td:text-xs"
            style={{ whiteSpace: "pre-line", lineHeight: "1" }}
          >
            {nodes}
          </div>
        </div>
      </main>
    );
  }
  return (
    <main className="px-4 flex items-start gap-3 max-w-[90%] ">
      <Avatar className="w-8 h-8"  />
      <div className="bg-white border border-outlines rounded-tr-lg rounded-xl  p-3 max-w-md ">
        <div
          className="prose prose-sm dark:prose-invert max-w-none prose-p:my-0 prose-p:leading-tight prose-headings:my-1 prose-headings:font-bold prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-li:text-sm prose-code:bg-gray-100 prose-code:dark:bg-gray-600 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-gray-100 prose-pre:dark:bg-gray-600 prose-pre:p-1 prose-pre:rounded prose-pre:text-xs prose-code:font-mono prose-pre:overflow-x-auto prose-pre:my-1 prose-blockquote:border-l-2 prose-blockquote:border-gray-200 prose-blockquote:dark:border-gray-500 prose-blockquote:pl-2 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:dark:text-gray-400 prose-blockquote:my-1 prose-strong:font-semibold prose-em:italic prose-a:text-blue-600 prose-a:dark:text-blue-400 prose-a:hover:underline prose-table:overflow-x-auto prose-table:w-full prose-th:px-2 prose-th:py-0.5 prose-th:text-xs prose-th:font-semibold prose-td:px-2 prose-td:py-0.5 prose-td:text-xs"
          style={{ whiteSpace: "pre-line", lineHeight: "1" }}
        >
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
};
