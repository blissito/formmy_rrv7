import { useState, useEffect } from "react";
import { cn } from "~/lib/utils";

type ChipTabsProps = {
  activeTab?: string;
  type?: string;
  names?: string[];
  onTabChange?: (tab: string) => void;
};

export const ChipTabs = ({
  activeTab = "Chat",
  type = "",
  names = ["Chat", "Agente"],
  onTabChange,
}: ChipTabsProps) => {
  const tabs = names || ["Chat", "Agente"];

  return (
    <section className={cn(
      "flex gap-1 bg-gray-200 rounded-full w-fit",
      {
        "w-full": type === "full",
      }
    )}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange?.(tab)}
          className={cn(
            " h-10 rounded-full text-base  font-medium transition-colors",
            "px-3 md:px-6",
            {
              "w-[50%]": type === "full",
            },
            {
              "bg-dark text-[#fff]": activeTab === tab,
            }
          )}
        >
          {tab}
        </button>
      ))}
    </section>
  );
};

export const useChipTabs = (initial: string = "", context?: string) => {
  // Crear una clave única para localStorage usando el contexto (ej: chatbotId)
  const storageKey = context ? `activeTab_${context}` : 'activeTab_default';
  
  // Función para obtener el tab desde localStorage
  const getStoredTab = (): string => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(storageKey) || initial;
      } catch {
        return initial;
      }
    }
    return initial;
  };

  const [currentTab, set] = useState(getStoredTab);

  // Sincronizar con localStorage cuando cambie el tab
  const setCurrentTab = (val: string) => {
    set(val);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, val);
      } catch {
        // Ignorar errores de localStorage (modo privado, etc.)
      }
    }
  };

  const catchCurrentTab = (val: string) => setCurrentTab(val);

  // Cargar desde localStorage al montar el componente
  useEffect(() => {
    const stored = getStoredTab();
    if (stored !== currentTab) {
      set(stored);
    }
  }, [context]); // Re-ejecutar si cambia el contexto

  return {
    currentTab,
    setCurrentTab,
    catchCurrentTab,
  };
};
