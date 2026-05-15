import { createFileRoute } from "@tanstack/react-router";
import { ConsoleHome } from "#/features/console/components/console-home";

const HomeIndex = () => <ConsoleHome />;

export const Route = createFileRoute("/home/")({
  component: HomeIndex,
});
