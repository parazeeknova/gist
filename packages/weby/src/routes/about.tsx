import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "../components/landing-page";

const AboutPage = () => <LandingPage />;

export const Route = createFileRoute("/about")({ component: AboutPage });
