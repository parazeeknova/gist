import { createFileRoute } from "@tanstack/react-router";
import { SpaceOverview } from "../components/space/space-overview";

export const Route = createFileRoute("/s/$spaceSlug/")({
  component: SpaceOverview,
});
