import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BarChart3, Boxes, Briefcase, Building2, ClipboardList, History, Home, Package, PanelRightOpen, Search, ShoppingCart, Sparkles, Tag, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { InterfaceHeader } from "@/components/bi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REPS, SECTORS } from "@/data/rapports";
import { RapportsProvider, useR } from "@/components/rapports/shared";
import { Accueil, Clients, Commerciaux, Offres, Produits, Stock, Ventes, Visites } from "@/components/rapports/pages";
import { Assistant, CustomReport, Historique } from "@/components/rapports/ai";
import { cn } from "@/lib/utils";

type S = { vue?: string; id?: string; prompt?: string };
export const Route = createFileRoute("/rapports")({
  validateSearch: (s: Record<string, unknown>): S => ({
    vue: typeof s.vue === "string" ? s.vue : undefined,
    id: typeof s.id === "string" ? s.id : undefined,
    prompt: typeof s.prompt === "string" ? s.prompt : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Rapports & Analyse — Rousseau Distribution" },
      { name: "description", content: "Rapports commerciaux Rousseau Distribution : commerciaux, visites, références, clients, ventes, stock, offres et rapports IA." },
      { property: "og:title", content: "Rapports & Analyse — Rousseau Distribution" },
      { property: "og:description", content: "Analyse commerciale et rapports personnalisés par IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RapportsPage,
});

const MENU = [
  { vue: "accueil", label: "Accueil", icon: Home },
  { vue: "commerciaux", label: "Commerciaux", icon: Users },
  { vue: "produits", label: "Produits / Références", icon: Package },
  { vue: "clients", label: "Clients", icon: Building2 },
  { vue: "ventes", label: "Ventes", icon: ShoppingCart },
  { vue: "stock", label: "Stock", icon: Boxes },
  { vue: "offres", label: "Offres", icon: Tag },
  { vue: "visites", label: "Visites", icon: ClipboardList },
  { vue: "ia", label: "Rapport personnalisé (IA)", icon: Sparkles },
  { vue: "historique", label: "Historique", icon: History },
];

function RapportsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const go = (vue: string, id?: string, prompt?: string) => navigate({ to: "/rapports", search: { vue, id, prompt } });
  return (
    <AppShell>
      <RapportsProvider go={go}>
        <Inner vue={search.vue ?? "accueil"} id={search.id} prompt={search.prompt} />
      </RapportsProvider>
    </AppShell>
  );
}

function Inner({ vue, id, prompt }: { vue: string; id?: string; prompt?: string }) {
  const { filters, setFilters, q, setQ, go } = useR();
  const [ai, setAi] = useState(true);
  const view = {
    accueil: <Accueil />, commerciaux: <Commerciaux id={id} />, produits: <Produits id={id} />, clients: <Clients id={id} />,
    ventes: <Ventes />, stock: <Stock />, offres: <Offres />, visites: <Visites id={id} />, ia: <CustomReport initialPrompt={prompt} />, historique: <Historique />,
  }[vue] ?? <Accueil />;
  return (
    <div className="space-y-5">
      <InterfaceHeader num="02" kicker="Rapports & Analyse" title={MENU.find((m) => m.vue === vue)?.label ?? "Accueil"} subtitle="Activité commerciale, visites, références et rapports générés par l'IA." actions={
        !ai && <Button variant="outline" onClick={() => setAi(true)}><PanelRightOpen className="size-4" /> Assistant IA</Button>
      } />
      <div className="panel flex flex-wrap items-center gap-2 rounded-xl p-3">
        <div className="relative min-w-52 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Recherche rapide (client, référence, commercial…)" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={String(filters.period)} onValueChange={(v) => setFilters({ ...filters, period: Number(v) })}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{[30, 90, 180, 365].map((p) => <SelectItem key={p} value={String(p)}>{p} jours</SelectItem>)}</SelectContent></Select>
        <Select value={filters.rep} onValueChange={(v) => setFilters({ ...filters, rep: v })}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous commerciaux</SelectItem>{REPS.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select>
        <Select value={filters.sector} onValueChange={(v) => setFilters({ ...filters, sector: v })}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous secteurs</SelectItem>{SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className={cn("grid gap-5", ai ? "lg:grid-cols-[210px_1fr_320px]" : "lg:grid-cols-[210px_1fr]")}>
        <nav className="panel h-fit rounded-xl p-2 lg:sticky lg:top-20">
          <div className="flex gap-1 overflow-x-auto lg:flex-col">
            {MENU.map((m) => (
              <button key={m.vue} onClick={() => go(m.vue)} className={cn("flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition", vue === m.vue ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                <m.icon className="size-4" /> {m.label}
              </button>
            ))}
          </div>
        </nav>
        <main className="min-w-0 animate-rise" key={vue + (id ?? "")}>{view}</main>
        {ai && <div className="lg:sticky lg:top-20 lg:h-fit"><Assistant onClose={() => setAi(false)} /></div>}
      </div>
    </div>
  );
}
export { BarChart3, Briefcase };
