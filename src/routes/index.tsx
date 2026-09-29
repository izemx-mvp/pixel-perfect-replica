import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, BookOpen, Database, FileText, Info, Sparkles } from "lucide-react";
import { AppShell, useShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Espace Service Client — Rousseau Distribution" },
      {
        name: "description",
        content:
          "Service Client Rousseau Distribution : FAQ industrielle, documents techniques, informations agences et assistant IA pour identifier vos pièces.",
      },
      { property: "og:title", content: "Espace Service Client — Rousseau Distribution" },
      {
        property: "og:description",
        content:
          "Identifiez vos pièces industrielles avec l'IA, consultez la documentation technique et suivez vos demandes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Home />
    </AppShell>
  ),
});

const SERVICE_CARDS = [
  {
    to: "/faq",
    icon: BookOpen,
    title: "FAQ",
    text: "Trouvez rapidement une réponse",
    cta: "Consulter",
  },
  {
    to: "/documents",
    icon: FileText,
    title: "Documents",
    text: "Accédez à nos ressources",
    cta: "Explorer",
  },
  {
    to: "/informations",
    icon: Info,
    title: "Informations générales",
    text: "Horaires, contact et localisation",
    cta: "Voir les informations",
  },
] as const;

const AGENTS = [
  {
    n: "01",
    icon: BarChart3,
    title: "Analyse & Reporting",
    text: "KPIs, performance, analyse de la demande et rapports IA.",
    modal: {
      title: "Agent Analyse & Reporting",
      description:
        "Analyse les ventes, la performance commerciale et la demande par référence afin de fournir une vision consolidée de l'activité.",
      caps: ["KPI", "Filtres", "Rapports IA", "Export PDF", "Analyse de demande"],
    },
  },
  {
    n: "02",
    icon: Database,
    title: "Consolidation des Données",
    text: "Emails, Excel, Sage, ventes, stocks et offres commerciales.",
    modal: {
      title: "Agent Consolidation des Données",
      description:
        "Centralise et structure les informations issues des échanges commerciaux et des systèmes de gestion pour produire des rapports instantanés.",
      caps: ["Emails", "Excel", "Consolidation", "Sage", "Ventes", "Stocks", "Offres"],
    },
  },
] as const;

function Home() {
  const { openAI } = useShell();
  const { profile, requests } = useApp();
  const [agent, setAgent] = useState<(typeof AGENTS)[number] | null>(null);

  return (
    <div className="space-y-16">
      <section className="animate-rise">
        <p className="text-kicker">Espace Service Client</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
          Bienvenue chez Rousseau Distribution
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Retrouvez rapidement les informations, documents et réponses dont vous avez besoin.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          Connecté en tant que <span className="font-semibold text-foreground">{profile.name}</span>{" "}
          · {requests.length} demande{requests.length > 1 ? "s" : ""} enregistrée
          {requests.length > 1 ? "s" : ""}
        </p>
      </section>

      <section className="relative overflow-hidden rounded-xl p-8 panel sm:p-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
          <div className="absolute -right-16 -top-16 size-64 rounded-full border-2 border-dashed border-primary/25" style={{ animation: "rd-spin-slow 40s linear infinite" }} />
          <div className="absolute -bottom-24 right-24 size-48 rounded-full border border-primary/20" style={{ animation: "rd-spin-reverse 55s linear infinite" }} />
          <div className="absolute inset-y-0 left-0 w-1/3 bg-primary/5 blur-3xl animate-sweep" />
        </div>
        <div className="relative max-w-2xl">
          <p className="text-kicker">Agent Service Client IA</p>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Besoin d'une pièce ?</h2>
          <p className="mt-3 text-muted-foreground">
            Décrivez votre besoin et notre assistant IA vous aide à qualifier votre demande.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" onClick={openAI}>
              <Sparkles className="size-4" /> Identifier ma pièce avec l'IA
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/demandes">Mes demandes</Link>
            </Button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Vos services</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {SERVICE_CARDS.map((c) => (
            <div key={c.to} className="flex flex-col rounded-xl p-6 panel hover-lift">
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <c.icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{c.title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.text}</p>
              <Button variant="outline" className="mt-5 w-full" asChild>
                <Link to={c.to}>
                  {c.cta} <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Une intelligence connectée à votre activité</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Trois agents composent la solution Rousseau Distribution. Seul l'agent Service Client IA
          est accessible aux clients dans cet espace.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {AGENTS.map((a) => (
            <div key={a.n} className="flex flex-col rounded-xl p-6 panel hover-lift">
              <span className="font-display text-sm font-bold text-primary">{a.n}</span>
              <a.icon className="mt-4 size-5 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-bold">{a.title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{a.text}</p>
              <Button variant="ghost" className="mt-5 justify-start px-0" onClick={() => setAgent(a)}>
                En savoir plus <ArrowRight className="size-4" />
              </Button>
            </div>
          ))}
          <div className="flex flex-col rounded-xl border-primary/40 p-6 panel hover-lift">
            <span className="font-display text-sm font-bold text-primary">03</span>
            <Sparkles className="mt-4 size-5 text-primary" />
            <h3 className="mt-4 text-lg font-bold">Service Client IA</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">
              Qualification des demandes et identification des besoins.
            </p>
            <Button className="mt-5" onClick={openAI}>
              Découvrir <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={Boolean(agent)} onOpenChange={(v) => !v && setAgent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{agent?.modal.title}</DialogTitle>
            <DialogDescription>{agent?.modal.description}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {agent?.modal.caps.map((c) => (
              <span
                key={c}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Agent interne : présenté à titre informatif, sans tableau de bord dans cet espace client.
          </p>
          <Button variant="outline" onClick={() => setAgent(null)}>
            Fermer
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
