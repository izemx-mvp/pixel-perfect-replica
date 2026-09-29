import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertTriangle, Building2, CheckCircle2, ImagePlus, Loader2, RotateCcw, Sparkles, Trash2, UserRound, Wrench } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { InterfaceHeader, Panel, StatusPill } from "@/components/bi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SECTORS_BI } from "@/data/business";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/qualification")({
  head: () => ({
    meta: [
      { title: "Qualification IA — Rousseau Distribution" },
      { name: "description", content: "Espace de qualification IA des prospects Rousseau Distribution : besoin, produit, informations manquantes, potentiel commercial." },
      { property: "og:title", content: "Qualification IA — Rousseau Distribution" },
      { property: "og:description", content: "Qualification assistée par IA des besoins prospects en pièces industrielles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <QualificationPage />
    </AppShell>
  ),
});

const PRODUCTS_TYPES = ["Roulement", "Courroie", "Transmission", "Poulie", "Palier", "Lubrifiant", "Abrasif", "Pièce mécanique", "Outillage", "Autre"];
const URGENCIES = ["Faible", "Normale", "Urgente", "Critique (arrêt machine)"];
const STEPS = ["Analyse", "Identification du besoin", "Informations manquantes", "Qualification", "Profil prospect"];

type Form = {
  nom: string; societe: string; email: string; telephone: string; ville: string; secteur: string;
  produit: string; marque: string; reference: string; machine: string; application: string; quantite: string; urgence: string; description: string;
};
const EMPTY: Form = { nom: "", societe: "", email: "", telephone: "", ville: "", secteur: "", produit: "", marque: "", reference: "", machine: "", application: "", quantite: "", urgence: "Normale", description: "" };
const EXAMPLE: Form = { nom: "Hicham Bennis", societe: "Atlas Agro Process", email: "h.bennis@atlas-agro.ma", telephone: "+212 6 61 23 45 67", ville: "Casablanca", secteur: "Agroalimentaire", produit: "Roulement", marque: "SKF", reference: "", machine: "Convoyeur ligne d'embouteillage", application: "Remplacement préventif", quantite: "24", urgence: "Urgente", description: "Nous cherchons des roulements SKF pour un convoyeur. Arrêt technique prévu dans 10 jours." };

type Result = {
  ref: string; form: Form; missing: string[]; status: "Nouveau" | "À qualifier" | "Qualifié" | "Suivi commercial"; potential: "Faible" | "Moyen" | "Élevé"; score: number; summary: string; photo: boolean;
};

function qualify(f: Form, photo: boolean): Result {
  const missing: string[] = [];
  if (!f.reference) missing.push("Référence exacte");
  if (!f.marque) missing.push("Marque");
  if (!f.machine) missing.push("Machine / équipement");
  if (!f.quantite) missing.push("Quantité");
  if (!f.telephone) missing.push("Téléphone");
  if (!photo && !f.reference) missing.push("Photo ou dimensions de la pièce");
  const qty = Number(f.quantite) || 0;
  let score = 30;
  if (f.societe) score += 10;
  if (["Automobile", "Mines", "Agroalimentaire", "Énergie"].includes(f.secteur)) score += 15;
  if (qty >= 20) score += 15; else if (qty >= 5) score += 8;
  if (f.urgence.startsWith("Urgente") || f.urgence.startsWith("Critique")) score += 15;
  if (f.reference) score += 10;
  score -= missing.length * 3;
  score = Math.max(5, Math.min(98, score));
  const potential = score >= 65 ? "Élevé" : score >= 40 ? "Moyen" : "Faible";
  const status = missing.length === 0 ? (potential === "Élevé" ? "Suivi commercial" : "Qualifié") : missing.length <= 2 ? "Qualifié" : missing.length <= 4 ? "À qualifier" : "Nouveau";
  const summary = `${f.societe || f.nom} (${f.secteur || "secteur non précisé"}, ${f.ville || "ville non précisée"}) exprime un besoin de ${f.produit.toLowerCase() || "pièce"}${f.marque ? ` ${f.marque}` : ""}${f.quantite ? ` en quantité ${f.quantite}` : ""}${f.machine ? ` pour « ${f.machine} »` : ""}. Urgence : ${f.urgence.toLowerCase()}. ${missing.length ? `Pour finaliser la qualification, il manque : ${missing.join(", ").toLowerCase()}.` : "Toutes les informations nécessaires sont réunies."} Potentiel commercial estimé : ${potential.toLowerCase()}.`;
  return { ref: `RD-2026-${Math.floor(1000 + Math.random() * 9000)}`, form: f, missing, status, potential, score, summary, photo };
}

function QualificationPage() {
  const [f, setF] = useState<Form>(EMPTY);
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [phase, setPhase] = useState<"form" | "processing" | "result">("form");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof Form) => (v: string) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: false })); };

  const submit = () => {
    const req: (keyof Form)[] = ["nom", "email", "produit", "description"];
    const e: Partial<Record<keyof Form, boolean>> = {};
    req.forEach((k) => { if (!f[k].trim()) e[k] = true; });
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = true;
    setErrors(e);
    if (Object.keys(e).length) { toast.error("Veuillez compléter les informations nécessaires."); return; }
    setPhase("processing");
    setStep(0);
    let i = 0;
    const tick = () => {
      i++;
      if (i < STEPS.length) { setStep(i); setTimeout(tick, 800); }
      else setTimeout(() => { setResult(qualify(f, !!photo)); setPhase("result"); toast.success("Qualification terminée"); }, 700);
    };
    setTimeout(tick, 900);
  };

  const reset = () => { setF(EMPTY); setPhoto(null); setResult(null); setPhase("form"); setErrors({}); };

  return (
    <div className="space-y-6">
      <InterfaceHeader
        num="04"
        kicker="Qualification des prospects assistée par IA"
        title="Qualification IA"
        subtitle="Décrivez le prospect et son besoin : l'assistant identifie le besoin, les informations manquantes et estime le potentiel commercial."
        actions={phase === "form" ? <Button variant="outline" onClick={() => { setF(EXAMPLE); setErrors({}); toast("Exemple de prospect chargé"); }}><Sparkles className="size-4" /> Charger un exemple</Button> : <Button variant="outline" onClick={reset}><RotateCcw className="size-4" /> Nouvelle qualification</Button>}
      />

      {phase === "form" && (
        <div className="grid gap-6 lg:grid-cols-2 animate-rise">
          <Panel title="Prospect" action={<UserRound className="size-5 text-primary" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom *" error={errors.nom}><Input value={f.nom} onChange={(e) => set("nom")(e.target.value)} placeholder="Nom et prénom" /></Field>
              <Field label="Société"><Input value={f.societe} onChange={(e) => set("societe")(e.target.value)} placeholder="Raison sociale" /></Field>
              <Field label="Email *" error={errors.email}><Input type="email" value={f.email} onChange={(e) => set("email")(e.target.value)} placeholder="nom@societe.ma" /></Field>
              <Field label="Téléphone"><Input value={f.telephone} onChange={(e) => set("telephone")(e.target.value)} placeholder="+212 ..." /></Field>
              <Field label="Ville"><Input value={f.ville} onChange={(e) => set("ville")(e.target.value)} placeholder="Casablanca, Meknès..." /></Field>
              <Field label="Secteur">
                <Select value={f.secteur} onValueChange={set("secteur")}>
                  <SelectTrigger><SelectValue placeholder="Choisir un secteur" /></SelectTrigger>
                  <SelectContent>{SECTORS_BI.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          </Panel>
          <Panel title="Besoin" action={<Wrench className="size-5 text-primary" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Produit / pièce *" error={errors.produit}>
                <Select value={f.produit} onValueChange={set("produit")}>
                  <SelectTrigger><SelectValue placeholder="Type de pièce" /></SelectTrigger>
                  <SelectContent>{PRODUCTS_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Marque"><Input value={f.marque} onChange={(e) => set("marque")(e.target.value)} placeholder="SKF, Norton, Loxeal..." /></Field>
              <Field label="Référence"><Input value={f.reference} onChange={(e) => set("reference")(e.target.value)} placeholder="ex. 6205-2RS" /></Field>
              <Field label="Machine"><Input value={f.machine} onChange={(e) => set("machine")(e.target.value)} placeholder="Équipement concerné" /></Field>
              <Field label="Application"><Input value={f.application} onChange={(e) => set("application")(e.target.value)} placeholder="Maintenance, production..." /></Field>
              <Field label="Quantité"><Input type="number" min={1} value={f.quantite} onChange={(e) => set("quantite")(e.target.value)} placeholder="ex. 24" /></Field>
              <Field label="Urgence">
                <Select value={f.urgence} onValueChange={set("urgence")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{URGENCIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Photo / document">
                <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPhoto({ url: file.type.startsWith("image/") ? URL.createObjectURL(file) : "", name: file.name });
                  e.target.value = "";
                }} />
                {photo ? (
                  <div className="flex items-center gap-2 rounded-md border border-border p-1.5">
                    {photo.url ? <img src={photo.url} alt="Aperçu" className="size-9 rounded object-cover" /> : <span className="flex size-9 items-center justify-center rounded bg-muted text-[10px]">PDF</span>}
                    <span className="flex-1 truncate text-xs">{photo.name}</span>
                    <Button size="icon" variant="ghost" aria-label="Supprimer le fichier" onClick={() => setPhoto(null)}><Trash2 className="size-4" /></Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}><ImagePlus className="size-4" /> Ajouter un fichier</Button>
                )}
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description *" error={errors.description}>
                  <Textarea rows={4} value={f.description} onChange={(e) => set("description")(e.target.value)} placeholder="Décrivez le besoin du prospect..." />
                </Field>
              </div>
            </div>
          </Panel>
          <div className="flex justify-end lg:col-span-2">
            <Button size="lg" onClick={submit}><Sparkles className="size-4" /> Lancer la qualification IA</Button>
          </div>
        </div>
      )}

      {phase === "processing" && (
        <div className="mx-auto max-w-xl rounded-2xl p-8 panel animate-rise">
          <div className="relative mx-auto flex size-24 items-center justify-center">
            <span className="absolute inset-0 rounded-full border-4 border-dashed border-primary/40" style={{ animation: "rd-spin-slow 6s linear infinite" }} />
            <Sparkles className="size-9 text-primary" />
          </div>
          <ol className="mt-8 space-y-3">
            {STEPS.map((s, i) => (
              <li key={s} className={cn("flex items-center gap-3 text-sm transition-opacity", i > step && "opacity-40")}>
                {i < step ? <CheckCircle2 className="size-5 text-success" /> : i === step ? <Loader2 className="size-5 animate-spin text-primary" /> : <span className="size-5 rounded-full border border-border" />}
                <span className={cn(i === step && "font-semibold")}>{s}{i === step && "…"}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {phase === "result" && result && (
        <div className="space-y-4 animate-rise">
          <div className="overflow-hidden rounded-2xl panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5" style={{ backgroundImage: "linear-gradient(90deg, color-mix(in oklab, var(--primary) 12%, transparent), transparent)" }}>
              <div>
                <p className="text-kicker">Fiche de qualification prospect</p>
                <p className="mt-1 font-display text-2xl font-black text-primary">{result.ref}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill tone={result.status === "Suivi commercial" ? "green" : result.status === "Qualifié" ? "green" : result.status === "À qualifier" ? "amber" : "grey"}>Statut : {result.status}</StatusPill>
                <StatusPill tone={result.potential === "Élevé" ? "red" : result.potential === "Moyen" ? "amber" : "grey"}>Potentiel : {result.potential}</StatusPill>
                <StatusPill tone="grey"><Sparkles className="mr-1 size-3" /> Évaluation IA / démo</StatusPill>
              </div>
            </div>
            <div className="grid gap-6 p-5 md:grid-cols-3">
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Building2 className="size-4" /> Prospect</p>
                <p className="font-semibold">{result.form.nom}</p>
                <p className="text-sm">{result.form.societe || "—"}</p>
                <p className="text-sm text-muted-foreground">{result.form.email}</p>
                <p className="text-sm text-muted-foreground">{result.form.telephone || "Téléphone non renseigné"}</p>
                <p className="text-sm text-muted-foreground">{[result.form.ville, result.form.secteur].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm md:col-span-2">
                {[["Besoin", result.form.application || result.form.description.slice(0, 60)], ["Produit", `${result.form.produit}${result.form.marque ? ` ${result.form.marque}` : ""}`], ["Référence", result.form.reference || "Non renseignée"], ["Quantité", result.form.quantite || "Non renseignée"], ["Urgence", result.form.urgence], ["Machine", result.form.machine || "Non renseignée"]].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border p-3"><dt className="text-[11px] uppercase text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
                ))}
              </dl>
            </div>
            <div className="grid gap-6 border-t border-border p-5 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Potentiel commercial</p>
                <p className="mt-1 font-display text-3xl font-black">{result.score}<span className="text-base text-muted-foreground">/100</span></p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${result.score}%` }} /></div>
              </div>
              <div className="md:col-span-2">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><AlertTriangle className="size-4" /> Informations manquantes</p>
                {result.missing.length ? (
                  <div className="flex flex-wrap gap-2">{result.missing.map((m) => <StatusPill key={m} tone="amber">{m}</StatusPill>)}</div>
                ) : <p className="text-sm text-success">Aucune — dossier complet.</p>}
              </div>
            </div>
            <div className="border-t border-border p-5">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Sparkles className="size-4 text-primary" /> Résumé IA</p>
              <p className="text-sm leading-relaxed">{result.summary}</p>
              <p className="mt-3 text-[11px] text-muted-foreground">Évaluation générée par IA à titre de démonstration — enregistrée uniquement dans cet espace, sans transmission réelle.</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setPhase("form")}>Compléter les informations</Button>
            <Button onClick={reset}><RotateCcw className="size-4" /> Nouvelle qualification</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: boolean | undefined; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", error && "[&_input]:border-destructive [&_textarea]:border-destructive [&_button[role=combobox]]:border-destructive")}>
      <Label className={cn(error && "text-destructive")}>{label}</Label>
      {children}
      {error && <p className="text-[11px] text-destructive">Champ requis ou invalide.</p>}
    </div>
  );
}
