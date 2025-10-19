import { useState, useEffect, useRef } from "react";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import "highlight.js/styles/base16/dracula.css";

// Registrar lenguajes
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);

interface CodeSnippetProps {
  code: string;
  language?: string;
  title?: string;
  filename?: string;
  onDownload?: () => void;
}

export function CodeSnippet({ code, language = "typescript", title, filename, onDownload }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      // Aplicar syntax highlighting
      hljs.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  return (
    <div className="border border-outlines rounded-lg overflow-hidden">
      {title && (
        <div className="bg-dracula-bg px-3 py-2 flex items-center justify-between border-b border-dracula-current">
          <span className="text-xs font-semibold text-dracula-foreground">{title}</span>
          <div className="flex gap-2">
            {onDownload && filename && (
              <button
                onClick={onDownload}
                className="text-xs px-2 py-1 bg-dracula-current border border-dracula-comment rounded hover:bg-dracula-comment transition-colors flex items-center gap-1 text-dracula-foreground"
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
                  ? 'bg-dracula-green text-dracula-bg font-semibold'
                  : 'bg-dracula-current border border-dracula-comment hover:bg-dracula-comment text-dracula-foreground'
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
      <pre className="bg-dracula-bg text-dracula-foreground p-4 text-xs overflow-x-auto font-mono leading-relaxed">
        <code ref={codeRef} className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}
