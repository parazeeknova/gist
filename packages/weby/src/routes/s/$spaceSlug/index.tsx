/* eslint-disable unicorn/filename-case */
import { createFileRoute } from "@tanstack/react-router";
import { SpaceOverview } from "@/features/space/components/space-overview";

export const Route = createFileRoute("/s/$space-slug/")({
  component: SpaceOverview,
});
