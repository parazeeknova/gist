import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useRef, useState } from "react";

import appCss from "../styles.css?url";

const APP_VERSION = import.meta.env.VITE_APP_VERSION;
const VERSION_STORAGE_KEY = "app-version";
// Default key used by createAsyncStoragePersister
const QUERY_CACHE_KEY = "REACT_QUERY_OFFLINE_CACHE";

// Clear persisted query cache when the app version changes so users
// always get fresh data after a deploy instead of stale browser-cached output.
const clearStaleCacheOnVersionBump = () => {
  if (typeof window === "undefined") {
    return;
  }
  const storedVersion = window.localStorage.getItem(VERSION_STORAGE_KEY);
  if (storedVersion !== APP_VERSION) {
    window.localStorage.removeItem(QUERY_CACHE_KEY);
    window.localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
  }
};

const createQueryClient = () => {
  clearStaleCacheOnVersionBump();

  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 1000 * 60 * 60,
      },
    },
  });
};

const persister = createAsyncStoragePersister({
  key: QUERY_CACHE_KEY,
  storage: typeof window === "undefined" ? undefined : window.localStorage,
});

const RootComponent = () => {
  const [queryClient] = useState(createQueryClient);
  const hasRestored = useRef(false);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      onSuccess={async () => {
        if (hasRestored.current) {
          return;
        }
        hasRestored.current = true;
        await queryClient.resumePausedMutations();
        await queryClient.invalidateQueries({ queryKey: ["github-stats"] });
      }}
      persistOptions={{ persister }}
    >
      <Outlet />
    </PersistQueryClientProvider>
  );
};

const RootShell = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <head>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var t='dark';try{t=localStorage.getItem('theme')||'dark'}catch(e){}document.documentElement.dataset.theme=t})()`,
        }}
      />
      <HeadContent />
    </head>
    <body>
      {children}
      <Scripts />
    </body>
  </html>
);

export const Route = createRootRoute({
  component: RootComponent,
  head: () => ({
    links: [
      {
        href: appCss,
        rel: "stylesheet",
      },
      {
        href: "/verso.svg",
        rel: "icon",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        color: "#000000",
        href: "/verso.svg",
        rel: "mask-icon",
      },
    ],
    meta: [
      {
        charSet: "utf-8",
      },
      {
        content: "width=device-width, initial-scale=1",
        name: "viewport",
      },
      {
        content: "#000000",
        name: "msapplication-TileColor",
      },
      {
        content: "#ffffff",
        name: "theme-color",
      },
      {
        content: "third year undergrad, full stack and devops engineer",
        name: "description",
      },
      {
        content: "gist, parazeeknova, developer, fullstack, devops",
        name: "keywords",
      },
      {
        content: "parazeeknova",
        name: "author",
      },
      {
        content: "website",
        property: "og:type",
      },
      {
        content: "gist - parazeeknova",
        property: "og:title",
      },
      {
        content: "third year undergrad, fullstack & devops engineer",
        property: "og:description",
      },
      {
        content:
          "http://cdn.itssingularity.com/images/2026/05/02/52d60e02dc868234b4c03f50270ba3f0.png",
        property: "og:image",
      },
      {
        content: "https://folio.zephyyrr.in",
        property: "og:url",
      },
      {
        content: "summary_large_image",
        property: "twitter:card",
      },
      {
        content: "gist - parazeeknova",
        property: "twitter:title",
      },
      {
        content: "third year undergrad, fullstack & devops engineer",
        property: "twitter:description",
      },
      {
        content:
          "http://cdn.itssingularity.com/images/2026/05/02/52d60e02dc868234b4c03f50270ba3f0.png",
        property: "twitter:image",
      },
      {
        content: "gist - parazeeknova",
        name: "application-name",
      },
      {
        content: "yes",
        name: "apple-mobile-web-app-capable",
      },
      {
        content: "default",
        name: "apple-mobile-web-app-status-bar-style",
      },
      {
        content: "gist",
        name: "apple-mobile-web-app-title",
      },
      {
        content: "yes",
        name: "mobile-web-app-capable",
      },
    ],
    title: "gist - parazeeknova",
  }),
  notFoundComponent: () => <p>Not Found</p>,
  shellComponent: RootShell,
});
