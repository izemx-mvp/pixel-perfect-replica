import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/analyse")({
  beforeLoad: () => {
    throw redirect({ to: "/rapports" });
  },
});
