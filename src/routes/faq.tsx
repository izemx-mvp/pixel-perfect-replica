import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EditDialog, useStored } from "@/lib/editable";
import type { Faq } from "@/data/content";
import { ServiceClientTabs } from "@/components/ServiceClientTabs";
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
      <ServiceClientTabs />
      <FaqPage />
    </AppShell>
  ),
});

function FaqPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");
  const [open, setOpen] = useState<string | null>(null);
  const [faqs, setFaqs, resetFaqs] = useStored<Faq[]>("rd_faqs", FAQS);
  const [edit, setEdit] = useState<Faq | null>(null);
  const cats = FAQ_CATEGORIES.filter((c) => c !== "Tous");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter(
      (f) =>
        (category === "Tous" || f.category === category) &&
        (!q || (f.question + f.answer).toLowerCase().includes(q)),
    );
  }, [query, category, faqs]);

  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <p className="text-kicker">Service Client</p>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Questions fréquentes</h1>
        <p className="mt-2 text-muted-foreground">
          Trouvez rapidement une réponse à vos questions techniques et commerciales.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => setEdit({ id: "", question: "", answer: "", category: cats[0]! })}><Plus className="size-4" /> Ajouter une question</Button>
          <Button variant="outline" onClick={() => { resetFaqs(); toast.success("FAQ réinitialisée"); }}><RotateCcw className="size-4" /> Réinitialiser</Button>
        </div>
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
                    <p className="whitespace-pre-line border-t border-border px-5 py-4 text-sm text-muted-foreground">
                      {f.answer}
                    </p>
                    <div className="flex gap-2 px-5 pb-4">
                      <Button size="sm" variant="outline" onClick={() => setEdit(f)}><Pencil className="size-3.5" /> Modifier</Button>
                      <Button size="sm" variant="outline" className="text-primary" onClick={() => { if (confirm("Supprimer cette question ?")) { setFaqs(faqs.filter((x) => x.id !== f.id)); toast.success("Question supprimée"); } }}><Trash2 className="size-3.5" /> Supprimer</Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {edit && (
        <EditDialog title={edit.id ? "Modifier la question" : "Ajouter une question"} value={edit} onClose={() => setEdit(null)}
          fields={[{ key: "question", label: "Question", required: true }, { key: "answer", label: "Réponse", type: "textarea", required: true }, { key: "category", label: "Catégorie", type: "select", options: cats }]}
          onSave={(v) => { if (v.id) setFaqs(faqs.map((x) => (x.id === v.id ? v : x))); else setFaqs([{ ...v, id: `faq-${Date.now()}` }, ...faqs]); toast.success(v.id ? "Question modifiée" : "Question ajoutée"); setEdit(null); }} />
      )}
    </div>
  );
}
