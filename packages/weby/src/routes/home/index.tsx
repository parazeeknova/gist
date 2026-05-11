import { createFileRoute } from "@tanstack/react-router";
import { PageDetail } from "#/features/console/components/pages/detail";
import { ConsoleHome } from "#/features/console/components/console-home";
import { useConsoleContext } from "#/features/console/components/console-context";

const HomeIndex = () => {
  const { selectedPageId } = useConsoleContext();

  if (selectedPageId) {
    return <PageDetail pageId={selectedPageId} />;
  }

  return <ConsoleHome />;
};

export const Route = createFileRoute("/home/")({
  component: HomeIndex,
});
