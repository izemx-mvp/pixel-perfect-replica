import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bookmark, Download, Eye, FileText, Loader2, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { EditDialog, useStored } from "@/lib/editable";
import { ServiceClientTabs } from "@/components/ServiceClientTabs";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DOCUMENTS, DOC_CATEGORIES, type Doc } from "@/data/content";
import { useApp } from "@/lib/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents & catalogues — Rousseau Distribution" },
      {
        name: "description",
        content:
          "Catalogues, documentation technique, fiches produits et guides Rousseau Distribution : consultation, téléchargement et favoris.",
      },
      { property: "og:title", content: "Documents & catalogues — Rousseau Distribution" },
      {
        property: "og:description",
        content: "Toutes les ressources techniques de la fourniture industrielle en un seul espace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <ServiceClientTabs />
      <DocumentsPage />
    </AppShell>
  ),
});

function frDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function downloadDoc(doc: Doc) {
  const content = `ROUSSEAU DISTRIBUTION\nLa force de vos machines, notre engagement\n\n${doc.title}\nCatégorie : ${doc.category}\nDate : ${frDate(doc.date)}\nFormat : ${doc.format} — ${doc.size} — ${doc.pages} pages\n\n${doc.description}\n\nDocument de démonstration généré localement.`;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.title.replace(/[^\w\-]+/g, "_")}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast.success("Téléchargement lancé", { description: doc.title });
}

function DocumentsPage() {
  const { favorites, toggleFavorite } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");
  const [sort, setSort] = useState("recent");
  const [preview, setPreview] = useState<Doc | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [docs, setDocs, resetDocs] = useStored<Doc[]>("rd_documents", DOCUMENTS);
  const [edit, setEdit] = useState<Doc | null>(null);
  const cats = DOC_CATEGORIES.filter((c) => c !== "Tous" && c !== "Favoris");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = docs.filter((d) => {
      const catOk =
        category === "Tous"
          ? true
          : category === "Favoris"
            ? favorites.includes(d.id)
            : d.category === category;
      return catOk && (!q || (d.title + d.description + d.category).toLowerCase().includes(q));
    });
    return [...list].sort((a, b) => {
      if (sort === "recent") return b.date.localeCompare(a.date);
      if (sort === "ancien") return a.date.localeCompare(b.date);
      if (sort === "az") return a.title.localeCompare(b.title, "fr");
      return b.title.localeCompare(a.title, "fr");
    });
  }, [query, category, sort, favorites, docs]);

  const openPreview = (doc: Doc) => {
    setPreview(doc);
    setPreviewLoading(true);
    window.setTimeout(() => setPreviewLoading(false), 700);
  };

  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <p className="text-kicker">Ressources</p>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Documents</h1>
        <p className="mt-2 text-muted-foreground">
          Catalogues, documentation technique, fiches produits et guides.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => setEdit({ id: "", title: "", category: cats[0]!, description: "", date: new Date().toISOString().slice(0, 10), format: "PDF", size: "1,0 Mo", pages: 1 })}><Plus className="size-4" /> Ajouter un document</Button>
          <Button variant="outline" onClick={() => { resetDocs(); toast.success("Documents réinitialisés"); }}><RotateCcw className="size-4" /> Réinitialiser</Button>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un document..."
              className="pl-9"
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récent</SelectItem>
              <SelectItem value="ancien">Plus ancien</SelectItem>
              <SelectItem value="az">Nom A → Z</SelectItem>
              <SelectItem value="za">Nom Z → A</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {DOC_CATEGORIES.map((c) => (
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
          <h2 className="text-xl font-bold">Aucun résultat trouvé.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Modifiez votre recherche ou changez de catégorie.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setQuery("");
              setCategory("Tous");
              setSort("recent");
            }}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map((d) => {
            const fav = favorites.includes(d.id);
            return (
              <article key={d.id} className="flex flex-col rounded-xl p-5 panel hover-lift">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-5" />
                  </span>
                  <div className="flex">
                  <button aria-label="Modifier" onClick={() => setEdit(d)} className="rounded-md p-2 text-muted-foreground hover:bg-accent"><Pencil className="size-4" /></button>
                  <button aria-label="Supprimer" onClick={() => { if (confirm("Supprimer ce document ?")) { setDocs(docs.filter((x) => x.id !== d.id)); toast.success("Document supprimé"); } }} className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-primary"><Trash2 className="size-4" /></button>
                  <button
                    aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
                    onClick={() => {
                      const added = toggleFavorite(d.id);
                      toast.success(
                        added ? "Document ajouté aux favoris" : "Document retiré des favoris",
                      );
                    }}
                    className={cn(
                      "rounded-md p-2 transition-colors hover:bg-accent",
                      fav ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <Bookmark className={cn("size-4", fav && "fill-current")} />
                  </button>
                  </div>
                </div>
                <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">
                  {d.category}
                </p>
                <h2 className="mt-1 font-display text-base font-bold">{d.title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{d.description}</p>
                <p className="mt-4 text-xs text-muted-foreground">
                  {frDate(d.date)} · {d.format} · {d.size}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => openPreview(d)}>
                    <Eye className="size-4" /> Consulter
                  </Button>
                  <Button className="flex-1" onClick={() => downloadDoc(d)}>
                    <Download className="size-4" /> Télécharger
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(preview)} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{preview?.title}</DialogTitle>
            <DialogDescription>{preview?.description}</DialogDescription>
          </DialogHeader>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {preview?.category} · {preview?.format} · {preview?.size}
          </p>
          <div className="rounded-lg border border-border bg-muted/40 p-6">
            {previewLoading ? (
              <div className="flex h-56 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto max-w-sm rounded-md bg-card p-6 shadow-sm">
                  <p className="font-display text-sm font-extrabold">ROUSSEAU DISTRIBUTION</p>
                  <div className="mt-1 h-[3px] w-24 bg-primary" />
                  <p className="mt-6 font-display text-lg font-bold">{preview?.title}</p>
                  <div className="mt-4 space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-2 rounded bg-muted"
                        style={{ width: `${95 - i * 9}%` }}
                      />
                    ))}
                  </div>
                  <p className="mt-6 text-[11px] text-muted-foreground">
                    Aperçu de démonstration — page 1 / {preview?.pages}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => setPreview(null)}>
              Fermer
            </Button>
            <Button className="flex-1" onClick={() => preview && downloadDoc(preview)}>
              <Download className="size-4" /> Télécharger
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {edit && (
        <EditDialog title={edit.id ? "Modifier le document" : "Ajouter un document"} value={edit} onClose={() => setEdit(null)}
          fields={[{ key: "title", label: "Titre", required: true }, { key: "category", label: "Catégorie", type: "select", options: cats }, { key: "description", label: "Description", type: "textarea" }, { key: "date", label: "Date", type: "date" }, { key: "format", label: "Format" }, { key: "size", label: "Taille" }, { key: "pages", label: "Pages", type: "number" }]}
          onSave={(v) => { if (v.id) setDocs(docs.map((x) => (x.id === v.id ? v : x))); else setDocs([{ ...v, id: `doc-${Date.now()}` }, ...docs]); toast.success(v.id ? "Document modifié" : "Document ajouté"); setEdit(null); }} />
      )}
    </div>
  );
}
