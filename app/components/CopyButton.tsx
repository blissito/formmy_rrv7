import { useState, useEffect } from "react";
import { CheckIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  showText?: boolean;
  iconClassName?: string;
}

export function CopyButton({ 
  textToCopy, 
  className = '',
  showText = true,
  iconClassName = 'h-4 w-4'
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const baseStyles = 'inline-flex items-center justify-center transition-colors';
  const defaultButtonStyles = 'px-3 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
  const buttonStyles = className || defaultButtonStyles;

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${baseStyles} ${buttonStyles} ${copied ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : ''}`}
      aria-label={copied ? 'Copiado' : 'Copiar al portapapeles'}
      title={copied ? '¡Copiado!' : 'Copiar al portapapeles'}
    >
      {copied ? (
        <>
          <CheckIcon className={`${iconClassName} mr-1.5`} />
          {showText && <span>¡Copiado!</span>}
        </>
      ) : (
        <>
          <DocumentDuplicateIcon className={`${iconClassName} ${showText ? 'mr-1.5' : ''}`} />
          {showText && <span>Copiar</span>}
        </>
      )}
    </button>
  );
}
