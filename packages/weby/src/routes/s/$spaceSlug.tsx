import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { useTheme } from "#/shared/hooks/use-theme";
import { AuthGate } from "#/features/auth/components/auth-gate";
import { ConsoleLayout } from "#/features/console/components/console-layout";
import { useSpaceBySlug } from "#/features/console/hooks/use-spaces";

const SpaceConsole = function SpaceConsole() {
  const { isDarkMode } = useTheme();
  const { spaceSlug } = useParams({ from: "/s/$spaceSlug" });
  const { data: space } = useSpaceBySlug(spaceSlug);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.backgroundColor = isDarkMode ? "#111111" : "#eeeeee";
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.backgroundColor = "";
      }
    };
  }, [isDarkMode]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.title = space?.name ? `verso — ${space.name}` : `verso — ${spaceSlug}`;

    return () => {
      document.title = "verso — console";
    };
  }, [space?.name, spaceSlug]);

  return (
    <AuthGate>
      <ConsoleLayout />
    </AuthGate>
  );
};

export const Route = createFileRoute("/s/$spaceSlug")({
  component: SpaceConsole,
  head: () => ({
    meta: [{ content: "noindex, nofollow", name: "robots" }],
  }),
});
