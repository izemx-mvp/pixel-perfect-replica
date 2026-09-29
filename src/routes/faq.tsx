import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FAQS, FAQ_CATEGORIES } from "@/data/content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Questions fréquentes — Rousseau Distribution" },
      {
        name: "description",
        content:
          "Réponses aux questions sur les roulements, la transmission, la lubrification, les abrasifs, les commandes et la disponibilité chez Rousseau Distribution.",
      },
      { property: "og:title", content: "Questions fréquentes — Rousseau Distribution" },
      {
        property: "og:description",
        content: "FAQ industrielle : produits, marques, identification de pièces, devis et disponibilité.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <FaqPage />
    </AppShell>
  ),
});

function FaqPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");
  const [open, setOpen] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter(
      (f) =>
        (category === "Tous" || f.category === category) &&
        (!q || (f.question + f.answer).toLowerCase().includes(q)),
    );
  }, [query, category]);

  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <p className="text-kicker">Service Client</p>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Questions fréquentes</h1>
        <p className="mt-2 text-muted-foreground">
          Trouvez rapidement une réponse à vos questions techniques et commerciales.
        </p>
      </header>

      <div className="space-y-4">
        <div className="relative max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une question..."
            className="pl-9"
          />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {FAQ_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl px-6 py-14 text-center panel">
          <h2 className="text-xl font-bold">Aucune réponse trouvée</h2>
          <p className="mt-2 text-sm text-muted-foreground">Essayez avec d'autres mots-clés.</p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setQuery("");
              setCategory("Tous");
            }}
          >
            Réinitialiser la recherche
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {results.map((f) => {
            const isOpen = open === f.id;
            return (
              <li key={f.id} className="overflow-hidden rounded-xl panel">
                <button
                  onClick={() => setOpen(isOpen ? null : f.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/60"
                >
                  <span className="font-display font-semibold">{f.question}</span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-primary transition-transform duration-300",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                <div
                  className="grid transition-all duration-300 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
                      {f.answer}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
