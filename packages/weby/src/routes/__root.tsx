import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";

import appCss from "../styles.css?url";

const RootComponent = () => <Outlet />;

const RootShell = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <head>
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
        href: "/apple-touch-icon.png",
        rel: "apple-touch-icon",
        sizes: "180x180",
      },
      {
        href: "/favicon-32x32.png",
        rel: "icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        href: "/favicon-16x16.png",
        rel: "icon",
        sizes: "16x16",
        type: "image/png",
      },
      {
        href: "/manifest.json",
        rel: "manifest",
      },
      {
        color: "#000000",
        href: "/gist.svg",
        rel: "mask-icon",
      },
      {
        href: "/gist.svg",
        rel: "shortcut icon",
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
        content: "/android-chrome-512x512.png",
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
        content: "/android-chrome-512x512.png",
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
      {
        title: "gist - parazeeknova",
      },
    ],
  }),
  notFoundComponent: () => <p>Not Found</p>,
  shellComponent: RootShell,
});
