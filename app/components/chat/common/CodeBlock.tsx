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
    <section className="mt-6 md:mt-8">
      <h4 className="text-dark text-lg font-medium mb-2">{title}</h4>
      <ol className="space-y-2 text-gray-600 mb-6">
        {instructions.map((instruction, index) => (
          <li key={index} className="flex items-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full text-metal text-base font-medium mr-2">
              {index + 1}.
            </span>
            {instruction.description}.
          </li>
        ))}
      </ol>
      <div className="bg-[#F8F9F9] border border-outlines rounded-2xl p-4 overflow-x-auto">
        <div className="flex justify-between items-center text-metal text-xs mb-2">
          <span className="text-metal uppercase">{language}</span>
          <button
            onClick={copyToClipboard}
            className="text-metal hover:text-metal/70 transition-colors relative w-6 h-6 flex items-center justify-center"
            aria-label="Copiar código"
            title="Copiar al portapapeles"
          >
            {isCopied ? (
              <svg
                className="w-6 h-6 text-grass"
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
                className="w-5 h-5"
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
        <pre className="text-dark text-sm font-mono max-w-[30ch]">
          <code>{code}</code>
        </pre>
      </div>
    </section>
  );
};
