import { createContext, useContext } from "react";

interface ConsoleContextValue {
  selectedPageId: string | null;
  setSelectedPageId: (id: string | null) => void;
  selectedWorkspaceId: string;
  setSelectedWorkspaceId: (id: string) => void;
  selectedSpaceId: string;
  setSelectedSpaceId: (id: string) => void;
}

export const ConsoleContext = createContext<ConsoleContextValue | null>(null);

export const useConsoleContext = () => {
  const ctx = useContext(ConsoleContext);
  if (!ctx) {
    throw new Error("useConsoleContext must be used within ConsoleLayout");
  }
  return ctx;
};
