import { useState } from "react";
import { useAuth, useAuthActions } from "../../hooks/use-auth";
import { PageDetail } from "./page-detail";
import { PageList } from "./page-list";

export const ConsoleLayout = () => {
  const { data: user } = useAuth();
  const { logout } = useAuthActions();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  return (
    <div className="grid min-h-screen grid-cols-1 overflow-hidden lg:grid-cols-[280px_1fr]">
      <aside className="flex flex-col border-r border-border-dark bg-bg-dark/60 p-4">
        <div className="flex items-center justify-between border-b border-border-dark pb-3 mb-4">
          <h1 className="text-sm font-medium text-text-dark">console</h1>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-dark/60">{user?.username}</span>
            <button
              className="text-[11px] lowercase text-text-dark/40 hover:text-text-dark/80"
              onClick={() => logout()}
              type="button"
            >
              logout
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PageList onSelectPage={(id) => setSelectedPageId(id)} selectedPageId={selectedPageId} />
        </div>
      </aside>
      <main className="min-h-0 overflow-y-auto bg-bg-dark p-6">
        {selectedPageId ? (
          <PageDetail pageId={selectedPageId} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-dark/40">select a page from the sidebar</p>
          </div>
        )}
      </main>
    </div>
  );
};
