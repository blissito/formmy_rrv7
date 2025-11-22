import type { UIMessage } from "ai";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ContextValue = {
  showArtifact: boolean;
  setShowArtifact: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ArtifactContext = createContext<ContextValue>({} as any);

export const ArtifactProvider = ({ children }: { children: ReactNode }) => {
  const [showArtifact, setShowArtifact] = useState(false);
  const value = { showArtifact, setShowArtifact };
  return (
    <ArtifactContext.Provider value={value}>
      {children}
    </ArtifactContext.Provider>
  );
};

export const useArtifact = ({ messages }: { messages: UIMessage[] }) => {
  const { showArtifact, setShowArtifact } =
    useContext<ContextValue>(ArtifactContext);

  const findToolCall = (): boolean => {
    let isCalled = false;
    messages.forEach((message) => {
      message.parts.forEach((part) => {
        console.log("Buscando tool: [PART]:: ", part);
        const found = part.type === "tool-dummyArtifactTool";
        if (found) {
          isCalled = true;
        }
      });
    });
    return isCalled;
  };
  // @TODO: after open, maybe, select what to show? so artifact is generic?

  // Look into messages to find artifact
  useEffect(() => {
    setShowArtifact(findToolCall());
  }, [messages]);

  return {
    showArtifact,
  };
};
