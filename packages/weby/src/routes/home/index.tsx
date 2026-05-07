import { createFileRoute } from "@tanstack/react-router";
import { PageDetail } from "@/features/console/components/pages/detail";
import { ConsoleHome } from "@/features/console/components/console-home";
import { useConsoleContext } from "@/features/console/components/console-context";

const HomeIndex = () => {
  const { selectedPageId, setSelectedPageId } = useConsoleContext();

  if (selectedPageId) {
    return <PageDetail pageId={selectedPageId} onDeleted={() => setSelectedPageId(null)} />;
  }

  return <ConsoleHome />;
};

export const Route = createFileRoute("/home/")({
  component: HomeIndex,
});
