import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConsoleState {
  sidebarOpen: boolean;
  selectedWorkspaceId: string;
  selectedSpaceId: string;
  selectedPageId: string | null;
  bootstrapped: boolean;
}

interface ConsoleActions {
  toggleSidebar: () => void;
  setSelectedWorkspaceId: (id: string) => void;
  setSelectedSpaceId: (id: string) => void;
  setSelectedPageId: (id: string | null) => void;
  setBootstrapped: (v: boolean) => void;
  reset: () => void;
}

const initialState: ConsoleState = {
  bootstrapped: false,
  selectedPageId: null,
  selectedSpaceId: "",
  selectedWorkspaceId: "",
  sidebarOpen: true,
};

const getInitialSidebarOpen = (): boolean => {
  if (typeof window === "undefined") {
    return true;
  }
  if (window.innerWidth < 768) {
    return false;
  }
  const stored = localStorage.getItem("verso-console-store");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed.state?.sidebarOpen === "boolean") {
        return parsed.state.sidebarOpen;
      }
    } catch {
      /* ignore */
    }
  }
  return true;
};

export const useConsoleStore = create<ConsoleState & ConsoleActions>()(
  persist(
    (set) => ({
      ...initialState,
      reset: () => set(initialState),
      setBootstrapped: (v: boolean) => set({ bootstrapped: v }),
      setSelectedPageId: (id: string | null) => set({ selectedPageId: id }),
      setSelectedSpaceId: (id: string) => set({ selectedSpaceId: id }),
      setSelectedWorkspaceId: (id: string) => set({ selectedWorkspaceId: id }),
      sidebarOpen: getInitialSidebarOpen(),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    {
      name: "verso-console-store",
      partialize: (state) => ({
        selectedSpaceId: state.selectedSpaceId,
        selectedWorkspaceId: state.selectedWorkspaceId,
        sidebarOpen: state.sidebarOpen,
      }),
    },
  ),
);
