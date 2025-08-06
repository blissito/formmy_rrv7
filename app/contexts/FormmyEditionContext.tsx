import { createContext, useContext, useState, type ReactNode } from "react";
import type { ConfigSchema } from "~/components/formmys/FormyV1";

interface FormmyEditionContextType {
  virtualConfig: ConfigSchema;
  updateVirtualConfig: (updates: Partial<ConfigSchema>) => void;
  setVirtualConfig: (config: ConfigSchema) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
}

const FormmyEditionContext = createContext<FormmyEditionContextType | undefined>(undefined);

export function FormmyEditionProvider({ 
  children, 
  initialConfig 
}: { 
  children: ReactNode; 
  initialConfig: ConfigSchema;
}) {
  const [virtualConfig, setVirtualConfig] = useState<ConfigSchema>(initialConfig);
  const [isDirty, setIsDirty] = useState(false);

  const updateVirtualConfig = (updates: Partial<ConfigSchema>) => {
    setVirtualConfig(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  return (
    <FormmyEditionContext.Provider 
      value={{ 
        virtualConfig, 
        updateVirtualConfig, 
        setVirtualConfig,
        isDirty,
        setIsDirty
      }}
    >
      {children}
    </FormmyEditionContext.Provider>
  );
}

export function useFormmyEdition() {
  const context = useContext(FormmyEditionContext);
  if (!context) {
    throw new Error("useFormmyEdition must be used within FormmyEditionProvider");
  }
  return context;
}