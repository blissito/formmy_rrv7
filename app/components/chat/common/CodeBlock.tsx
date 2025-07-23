import { useState } from "react";

interface CodeBlockProps {
  title: string;
  language: string;
  code: string;
  instructions: {
    step: string;
    description: string;
  }[];
}

export const CodeBlock = ({
  title,
  language,
  code,
  instructions,
}: CodeBlockProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <section className="mt-6">
      <h4 className="text-gray-900 text-lg font-medium mb-4">{title}</h4>
      <ol className="space-y-2 text-gray-600 mb-6">
        {instructions.map((instruction, index) => (
          <li key={index} className="flex items-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-sm font-medium mr-2">
              {index + 1}
            </span>
            {instruction.description}
          </li>
        ))}
      </ol>
      <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
        <div className="flex justify-between items-center text-gray-400 text-xs mb-2">
          <span>{language}</span>
          <button
            onClick={copyToClipboard}
            className="text-gray-400 hover:text-white transition-colors relative w-4 h-4 flex items-center justify-center"
            aria-label="Copiar código"
            title="Copiar al portapapeles"
          >
            {isCopied ? (
              <svg
                className="w-4 h-4 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
            )}
          </button>
        </div>
        <pre className="text-gray-200 text-sm font-mono max-w-[30ch]">
          <code>{code}</code>
        </pre>
      </div>
    </section>
  );
};
