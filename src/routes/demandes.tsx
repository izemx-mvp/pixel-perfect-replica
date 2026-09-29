import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Sparkles } from "lucide-react";
import { AppShell, useShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/demandes")({
  head: () => ({
    meta: [
      { title: "Mes demandes de pièces — Rousseau Distribution" },
      {
        name: "description",
        content:
          "Suivez vos demandes de pièces industrielles qualifiées par l'assistant IA Rousseau Distribution : référence, statut, marque et machine.",
      },
      { property: "og:title", content: "Mes demandes — Rousseau Distribution" },
      {
        property: "og:description",
        content: "Historique et suivi des demandes de pièces qualifiées par l'IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <RequestsPage />
    </AppShell>
  ),
});

const STATUS_STYLES: Record<string, string> = {
  "Demande reçue": "bg-primary/12 text-primary",
  "En cours d'analyse": "bg-warning/15 text-warning",
  "Informations complémentaires nécessaires": "bg-warning/15 text-warning",
  Traitée: "bg-success/15 text-success",
};

function RequestsPage() {
  const { requests } = useApp();
  const { openAI } = useShell();
  const [filter, setFilter] = useState<"Toutes" | "En cours" | "Traitées">("Toutes");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = requests.filter((r) => {
      const statusOk =
        filter === "Toutes"
          ? true
          : filter === "Traitées"
            ? r.status === "Traitée"
            : r.status !== "Traitée";
      return (
        statusOk &&
        (!q ||
          (r.reference + r.type + r.brand + r.machine + r.description).toLowerCase().includes(q))
      );
    });
    return [...filtered].sort((a, b) =>
      sort === "recent" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
    );
  }, [requests, filter, query, sort]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 animate-rise">
        <div>
          <p className="text-kicker">Suivi</p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Mes demandes</h1>
          <p className="mt-2 text-muted-foreground">
            Vos demandes qualifiées, enregistrées dans cet espace de démonstration.
          </p>
        </div>
        <Button onClick={openAI}>
          <Sparkles className="size-4" /> Nouvelle demande IA
        </Button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une demande..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["Toutes", "En cours", "Traitées"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Plus récente</SelectItem>
            <SelectItem value="ancien">Plus ancienne</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl px-6 py-14 text-center panel">
          <h2 className="text-xl font-bold">Aucun résultat trouvé.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Créez une demande avec l'assistant IA ou réinitialisez vos filtres.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setFilter("Toutes");
              }}
            >
              Réinitialiser
            </Button>
            <Button onClick={openAI}>Identifier ma pièce avec l'IA</Button>
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map((r) => (
            <li key={r.reference} className="rounded-xl p-5 panel hover-lift">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-primary">{r.reference}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    STATUS_STYLES[r.status] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  {r.status}
                </span>
              </div>
              <p className="mt-3 text-sm">{r.description}</p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                {[
                  ["Pièce", r.type],
                  ["Marque", r.brand],
                  ["Machine", r.machine],
                  ["Référence", r.partRef],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
