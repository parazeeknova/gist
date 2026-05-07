import { createContext, useContext } from "react";
import { useConsoleStore } from "#/stores/console-store";

interface ConsoleContextValue {
  selectedPageId: string | null;
  selectedSpaceId: string;
  selectedWorkspaceId: string;
  setSelectedPageId: (id: string | null) => void;
  setSelectedSpaceId: (id: string) => void;
  setSelectedWorkspaceId: (id: string) => void;
}

export const ConsoleContext = createContext<ConsoleContextValue | null>(null);

export const useConsoleContext = () => {
  const ctx = useContext(ConsoleContext);
  if (!ctx) {
    throw new Error("useConsoleContext must be used within ConsoleLayout");
  }
  return ctx;
};

export const useConsoleStoreContext = () => {
  const selectedWorkspaceId = useConsoleStore((s) => s.selectedWorkspaceId);
  const selectedSpaceId = useConsoleStore((s) => s.selectedSpaceId);
  const selectedPageId = useConsoleStore((s) => s.selectedPageId);
  const setSelectedWorkspaceId = useConsoleStore((s) => s.setSelectedWorkspaceId);
  const setSelectedSpaceId = useConsoleStore((s) => s.setSelectedSpaceId);
  const setSelectedPageId = useConsoleStore((s) => s.setSelectedPageId);

  return {
    selectedPageId,
    selectedSpaceId,
    selectedWorkspaceId,
    setSelectedPageId,
    setSelectedSpaceId,
    setSelectedWorkspaceId,
  };
};
