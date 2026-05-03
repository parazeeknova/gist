import { createFileRoute } from "@tanstack/react-router";
import { PageDetail } from "../components/console/page-detail";
import { ConsoleHome } from "../components/console/console-home";
import { useConsoleContext } from "../components/console/console-layout";

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
