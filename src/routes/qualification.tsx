import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Eye, LayoutGrid, List, MessageCircle, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { InterfaceHeader, StatusPill } from "@/components/bi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { STAGES, loadLeads, missing, saveLeads, scoreLead, type Lead, type Stage } from "@/lib/leads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/qualification")({
  head: () => ({
    meta: [
      { title: "Qualification IA — Pipeline WhatsApp — Rousseau Distribution" },
      { name: "description", content: "Pipeline des contacts WhatsApp : besoin exprimé, qualification IA, suivi et gestion des demandes clients." },
      { property: "og:title", content: "Qualification IA — Pipeline WhatsApp" },
      { property: "og:description", content: "Qualification assistée par IA des clients qui nous contactent sur WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AppShell><Page /></AppShell>,
});

const SECTEURS = ["Agroalimentaire", "Pharmaceutique", "Automobile", "Textile", "Cimenterie", "Autre"];
const PRODUITS = ["Roulement", "Courroie", "Moteur", "Transmission", "Autre"];
const URGENCES = ["Faible", "Normale", "Urgente", "Critique (arrêt machine)"];
const EMPTY: Omit<Lead, "id" | "date" | "stage" | "score"> = { nom: "", societe: "", telephone: "", ville: "", secteur: "Autre", produit: "Roulement", reference: "", quantite: "", urgence: "Normale", message: "", notes: "" };
const tone = (s: Stage) => (s === "Gagné" ? "green" : s === "Perdu" ? "red" : s === "Qualifié" || s === "Offre envoyée" ? "amber" : "grey") as "green" | "red" | "amber" | "grey";

function Page() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("all");
  const [detail, setDetail] = useState<Lead | null>(null);
  const [edit, setEdit] = useState<Lead | "new" | null>(null);
  const [del, setDel] = useState<Lead | null>(null);
  useEffect(() => setLeads(loadLeads()), []);
  const upd = (l: Lead[]) => { setLeads(l); saveLeads(l); };
  const list = useMemo(() => leads.filter((l) => (sector === "all" || l.secteur === sector) && [l.nom, l.societe, l.telephone, l.produit, l.reference, l.message, l.id].join(" ").toLowerCase().includes(q.toLowerCase())), [leads, q, sector]);
  const move = (l: Lead, dir: 1 | -1) => {
    const i = STAGES.indexOf(l.stage) + dir; if (i < 0 || i >= STAGES.length) return;
    const n = { ...l, stage: STAGES[i]! }; upd(leads.map((x) => (x.id === l.id ? n : x))); if (detail?.id === l.id) setDetail(n);
    toast.success(`${l.nom} → ${n.stage}`);
  };
  const setStage = (l: Lead, s: Stage) => { const n = { ...l, stage: s }; upd(leads.map((x) => (x.id === l.id ? n : x))); setDetail(n); toast.success(`Étape : ${s}`); };

  return (
    <div className="space-y-5">
      <InterfaceHeader num="04" kicker="Qualification IA" title="Pipeline des contacts WhatsApp" subtitle="Clients qui nous contactent sur WhatsApp : ce qu'ils demandent, qualification IA et suivi. Données de démonstration, sans connexion WhatsApp réelle."
        actions={<Button onClick={() => setEdit("new")}><Plus className="size-4" /> Ajouter un contact</Button>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Contacts", leads.length], ["Nouveaux", leads.filter((l) => l.stage === "Nouveau contact").length], ["Qualifiés / offre", leads.filter((l) => l.stage === "Qualifié" || l.stage === "Offre envoyée").length], ["Gagnés", leads.filter((l) => l.stage === "Gagné").length]].map(([k, v]) => (
          <div key={k} className="panel rounded-xl p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">{k}</p><p className="mt-1 font-display text-2xl font-extrabold">{v}</p></div>
        ))}
      </div>
      <div className="panel flex flex-wrap items-center gap-2 rounded-xl p-3">
        <div className="relative min-w-52 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Rechercher un contact, une pièce, un message…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={sector} onValueChange={setSector}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous secteurs</SelectItem>{SECTEURS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <div className="flex gap-1"><Button size="icon" variant={view === "kanban" ? "default" : "outline"} onClick={() => setView("kanban")} aria-label="Vue pipeline"><LayoutGrid className="size-4" /></Button><Button size="icon" variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")} aria-label="Vue liste"><List className="size-4" /></Button></div>
      </div>

      {view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map((s) => {
            const col = list.filter((l) => l.stage === s);
            return (
              <div key={s} className="panel w-72 shrink-0 rounded-xl p-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { const id = e.dataTransfer.getData("id"); const l = leads.find((x) => x.id === id); if (l && l.stage !== s) { upd(leads.map((x) => (x.id === id ? { ...x, stage: s } : x))); toast.success(`${l.nom} → ${s}`); } }}>
                <div className="mb-3 flex items-center justify-between"><p className="font-display text-sm font-bold">{s}</p><span className="rounded-full bg-muted px-2 text-xs">{col.length}</span></div>
                <div className="space-y-2">
                  {col.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">Aucun contact</p>}
                  {col.map((l) => (
                    <div key={l.id} draggable onDragStart={(e) => e.dataTransfer.setData("id", l.id)} className="cursor-grab rounded-lg border border-border bg-card p-3 text-sm shadow-sm hover:border-primary/50">
                      <div className="flex items-start justify-between gap-2"><p className="font-semibold">{l.nom}</p><span className="text-xs font-bold text-primary">{l.score}</span></div>
                      <p className="text-xs text-muted-foreground">{l.societe || "Société non renseignée"}</p>
                      <p className="mt-1 text-xs"><b>{l.produit}</b> {l.reference && `— ${l.reference}`} {l.quantite && `× ${l.quantite}`}</p>
                      <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">« {l.message} »</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex gap-0.5">
                          <Button size="icon" variant="ghost" className="size-7" onClick={() => move(l, -1)} aria-label="Étape précédente"><ChevronLeft className="size-4" /></Button>
                          <Button size="icon" variant="ghost" className="size-7" onClick={() => move(l, 1)} aria-label="Étape suivante"><ChevronRight className="size-4" /></Button>
                        </div>
                        <div className="flex gap-0.5">
                          <Button size="icon" variant="ghost" className="size-7" onClick={() => setDetail(l)} aria-label="Voir détails"><Eye className="size-4" /></Button>
                          <Button size="icon" variant="ghost" className="size-7" onClick={() => setEdit(l)} aria-label="Modifier"><Pencil className="size-4" /></Button>
                          <Button size="icon" variant="ghost" className="size-7 text-primary" onClick={() => setDel(l)} aria-label="Supprimer"><Trash2 className="size-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="panel overflow-x-auto rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr>{["Contact", "Société", "Téléphone", "Demande", "Urgence", "Score", "Étape", ""].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Aucun résultat trouvé.</td></tr>}
              {list.map((l) => (
                <tr key={l.id} className="border-t border-border hover:bg-primary/5">
                  <td className="px-3 py-2 font-medium">{l.nom}</td><td className="px-3 py-2">{l.societe || "—"}</td><td className="whitespace-nowrap px-3 py-2">{l.telephone}</td>
                  <td className="px-3 py-2">{l.produit} {l.reference}</td><td className="px-3 py-2">{l.urgence}</td><td className="px-3 py-2 font-bold text-primary">{l.score}</td>
                  <td className="px-3 py-2"><StatusPill tone={tone(l.stage)}>{l.stage}</StatusPill></td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <Button size="icon" variant="ghost" onClick={() => setDetail(l)} aria-label="Voir détails"><Eye className="size-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEdit(l)} aria-label="Modifier"><Pencil className="size-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-primary" onClick={() => setDel(l)} aria-label="Supprimer"><Trash2 className="size-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {detail && (
            <>
              <SheetHeader><SheetTitle>{detail.nom}</SheetTitle><SheetDescription>{detail.id} — {new Date(detail.date).toLocaleString("fr-FR")}</SheetDescription></SheetHeader>
              <div className="space-y-4 px-4 pb-6 text-sm">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><MessageCircle className="size-4" /> Message WhatsApp d'origine</p>
                  <div className="w-fit max-w-[90%] rounded-lg rounded-tl-none border border-border bg-card px-3 py-2 shadow-sm">{detail.message}<p className="mt-1 text-right text-[10px] text-muted-foreground">{new Date(detail.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[["Société", detail.societe], ["Téléphone", detail.telephone], ["Ville", detail.ville], ["Secteur", detail.secteur], ["Produit", detail.produit], ["Référence", detail.reference], ["Quantité", detail.quantite], ["Urgence", detail.urgence]].map(([k, v]) => (
                    <div key={k}><p className="text-xs uppercase text-muted-foreground">{k}</p><p className="font-medium">{v || "Non renseigné"}</p></div>
                  ))}
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-primary" /> Qualification IA — score {detail.score}/100</p>
                  <p className="mt-1">Le client recherche {detail.quantite ? `${detail.quantite} × ` : ""}{detail.produit.toLowerCase()}{detail.reference ? ` (${detail.reference})` : ""}{detail.societe ? ` pour ${detail.societe}` : ""}. Potentiel {detail.score >= 75 ? "élevé" : detail.score >= 50 ? "moyen" : "faible"}.</p>
                  {missing(detail).length > 0 && <p className="mt-2 text-xs">Informations à demander : {missing(detail).join(", ")}</p>}
                </div>
                {detail.notes && <div><p className="text-xs uppercase text-muted-foreground">Notes</p><p>{detail.notes}</p></div>}
                <div><Label>Étape du pipeline</Label><Select value={detail.stage} onValueChange={(v) => setStage(detail, v as Stage)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex gap-2">
                  <Button asChild variant="outline"><a href={`https://wa.me/${detail.telephone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> Ouvrir WhatsApp</a></Button>
                  <Button variant="outline" onClick={() => { setEdit(detail); setDetail(null); }}><Pencil className="size-4" /> Modifier</Button>
                  <Button variant="outline" className="text-primary" onClick={() => { setDel(detail); setDetail(null); }}><Trash2 className="size-4" /> Supprimer</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {edit && <EditDialog lead={edit === "new" ? null : edit} onClose={() => setEdit(null)} onSave={(l) => {
        if (edit === "new") { upd([l, ...leads]); toast.success("Contact ajouté"); } else { upd(leads.map((x) => (x.id === l.id ? l : x))); toast.success("Contact modifié"); }
        setEdit(null);
      }} />}

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Supprimer ce contact ?</AlertDialogTitle><AlertDialogDescription>{del?.nom} sera retiré du pipeline.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => { upd(leads.filter((x) => x.id !== del!.id)); toast.success("Contact supprimé"); setDel(null); }}>Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditDialog({ lead, onClose, onSave }: { lead: Lead | null; onClose: () => void; onSave: (l: Lead) => void }) {
  const [f, setF] = useState(lead ?? { ...EMPTY, id: "", date: "", stage: "Nouveau contact" as Stage, score: 0 });
  const set = (k: keyof Lead, v: string) => setF({ ...f, [k]: v });
  const save = () => {
    if (!f.nom.trim() || !f.telephone.trim() || !f.message.trim()) return toast.error("Veuillez compléter les informations nécessaires.");
    onSave({ ...f, id: f.id || `WA-${Math.floor(3000 + Math.random() * 6000)}`, date: f.date || new Date().toISOString(), score: scoreLead(f) });
  };
  const T = ({ k, label, req }: { k: keyof Lead; label: string; req?: boolean }) => (
    <div><Label>{label}{req && " *"}</Label><Input className="mt-1" value={String(f[k])} onChange={(e) => set(k, e.target.value)} /></div>
  );
  const S = ({ k, label, opts }: { k: keyof Lead; label: string; opts: readonly string[] }) => (
    <div><Label>{label}</Label><Select value={String(f[k])} onValueChange={(v) => set(k, v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
  );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{lead ? "Modifier le contact" : "Ajouter un contact WhatsApp"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {T({ k: "nom", label: "Nom", req: true })}{T({ k: "telephone", label: "Téléphone WhatsApp", req: true })}
          {T({ k: "societe", label: "Société" })}{T({ k: "ville", label: "Ville" })}
          {S({ k: "secteur", label: "Secteur", opts: SECTEURS })}{S({ k: "produit", label: "Produit demandé", opts: PRODUITS })}
          {T({ k: "reference", label: "Référence" })}{T({ k: "quantite", label: "Quantité" })}
          {S({ k: "urgence", label: "Urgence", opts: URGENCES })}{S({ k: "stage", label: "Étape", opts: STAGES })}
        </div>
        <div><Label>Message WhatsApp *</Label><Textarea className="mt-1" rows={3} value={f.message} onChange={(e) => set("message", e.target.value)} /></div>
        <div><Label>Notes internes</Label><Textarea className="mt-1" rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>
        <p className={cn("text-xs text-muted-foreground")}>Score IA estimé : <b className="text-primary">{scoreLead(f)}/100</b></p>
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={save}>Enregistrer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
