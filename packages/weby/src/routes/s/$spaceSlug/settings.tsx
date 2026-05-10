// eslint-disable-next-line unicorn/filename-case
import { createFileRoute } from "@tanstack/react-router";
import { SpaceSettings } from "#/features/space/components/space-settings";

export const Route = createFileRoute("/s/$spaceSlug/settings")({
  component: SpaceSettings,
  head: () => ({
    meta: [{ content: "noindex, nofollow", name: "robots" }],
  }),
});
