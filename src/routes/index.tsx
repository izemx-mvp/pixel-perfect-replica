import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/analyse" });
  },
  head: () => ({
    meta: [
      { title: "Rousseau Distribution — Plateforme IA industrielle" },
      { name: "description", content: "Plateforme IA Rousseau Distribution : analyse, consolidation des données, service client et qualification IA." },
      { property: "og:title", content: "Rousseau Distribution — Plateforme IA" },
      { property: "og:description", content: "La force de vos machines, notre engagement." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
