import { useState } from "react";
import { Streamdown } from "streamdown";

interface CodeSnippetProps {
  code: string;
  language?: string;
  title?: string;
  filename?: string;
  onDownload?: () => void;
}

export function CodeSnippet({ code, language = "typescript", title, filename, onDownload }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  // Wrap code in markdown code fence for Streamdown to process
  const markdownCode = `\`\`\`${language}\n${code}\n\`\`\``;

  return (
    <div className="border border-outlines rounded-lg overflow-hidden">
      {title && (
        <div className="bg-[#24292e] px-3 py-2 flex items-center justify-between border-b border-[#1b1f23]">
          <span className="text-xs font-semibold text-[#e1e4e8]">{title}</span>
          <div className="flex gap-2">
            {onDownload && filename && (
              <button
                onClick={onDownload}
                className="text-xs px-2 py-1 bg-[#2f363d] border border-[#444d56] rounded hover:bg-[#444d56] transition-colors flex items-center gap-1 text-[#e1e4e8]"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {filename}
              </button>
            )}
            <button
              onClick={copyToClipboard}
              className={`text-xs px-2 py-1 rounded transition-all flex items-center gap-1 ${
                copied
                  ? 'bg-green-600 text-white font-semibold'
                  : 'bg-[#2f363d] border border-[#444d56] hover:bg-[#444d56] text-[#e1e4e8]'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copiado
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>
      )}
      <div className="streamdown-code-container text-xs overflow-x-auto font-mono leading-relaxed [&_pre]:!p-4 [&_pre]:!m-0 [&_pre]:rounded-none">
        <Streamdown shikiTheme={["github-light", "github-dark"]}>{markdownCode}</Streamdown>
      </div>
    </div>
  );
}
