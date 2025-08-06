import { useState } from "react";
import { Button } from "~/components/Button";
import { cn } from "~/lib/utils";

interface GhostyCompactInputProps {
  onSubmit: (message: string) => void;
  onExpand: () => void;
  isLoading?: boolean;
}

export const GhostyCompactInput = ({ 
  onSubmit, 
  onExpand, 
  isLoading = false 
}: GhostyCompactInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSubmit(inputValue.trim());
      setInputValue("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputClick = () => {
    onExpand();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={cn(
        "border border-outlines rounded-full w-full h-14 overflow-hidden flex justify-between items-center px-3",
        "transition-all duration-300 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/10",
        "group"
      )}>
        <input 
          className={cn(
            "border-none placeholder:text-lightgray text-dark h-12",
            "focus:border-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:shadow-none",
            "text-base w-full cursor-pointer"
          )}
          type="text" 
          placeholder="Ayúdame a configurar mi chat bot... ✨" 
          value={inputValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <Button 
          className={cn(
            "h-10 mt-0",
            { "opacity-50 cursor-not-allowed": isLoading }
          )}
          type="submit"
          isLoading={isLoading}
          isDisabled={!inputValue.trim() || isLoading}
        >
          Enviar
        </Button>
      </div>
    </form>
  );
};