import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "../components/landing/landing";

const AboutPage = () => <LandingPage />;

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    links: [
      {
        href: "/about",
        rel: "canonical",
      },
    ],
    meta: [
      { title: "verso — about" },
      {
        content:
          "verso is an open-source, self-hosted wiki and knowledge base. write, organize, and publish your thinking — in real-time, with full control over your data.",
        name: "description",
      },
      { content: "verso — about", property: "og:title" },
      {
        content:
          "verso is an open-source, self-hosted wiki and knowledge base. write, organize, and publish your thinking — in real-time, with full control over your data.",
        property: "og:description",
      },
      { content: "website", property: "og:type" },
      { content: "/verso-og.png", property: "og:image" },
      { content: "1200", property: "og:image:width" },
      { content: "630", property: "og:image:height" },
      { content: "image/png", property: "og:image:type" },
      { content: "summary_large_image", property: "twitter:card" },
      { content: "verso — about", property: "twitter:title" },
      {
        content:
          "verso is an open-source, self-hosted wiki and knowledge base. write, organize, and publish your thinking — in real-time, with full control over your data.",
        property: "twitter:description",
      },
      { content: "/verso-og.png", property: "twitter:image" },
    ],
  }),
});
