import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Database,
  FileSpreadsheet,
  Loader2,
  Mail,
  Play,
  Search,
  ServerCog,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { InterfaceHeader, Kpi, Panel, StatusPill, chartTooltipStyle } from "@/components/bi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  COMMERCIALS,
  EMAILS,
  EXCEL_FILES,
  OFFERS,
  PRODUCTS,
  REVIEW_ITEMS,
  SALES,
  SOURCES,
  fmtDate,
  fmtK,
  fmtMAD,
  stockStatus,
  type ReviewIssue,
  type SaleRecord,
} from "@/data/business";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/consolidation")({
  head: () => ({
    meta: [
      { title: "Consolidation des Données — Rousseau Distribution" },
      { name: "description", content: "Collecte, extraction, nettoyage et consolidation des données commerciales Rousseau Distribution : emails, Excel et Sage (simulation)." },
      { property: "og:title", content: "Consolidation des Données — Rousseau Distribution" },
      { property: "og:description", content: "Pipeline de consolidation, qualité des données, ventes, stock et offres consolidés." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <ConsolidationPage />
    </AppShell>
  ),
});

type CState = { runs: number; lastRun: string; review: ReviewIssue[] };
const KEY = "rd_consolidation";
const INITIAL: CState = { runs: 0, lastRun: "2026-09-29T07:45:00", review: REVIEW_ITEMS };

const STEPS = [
  "Analyse des sources",
  "Extraction des données",
  "Nettoyage",
  "Détection des doublons",
  "Validation",
  "Consolidation",
  "Finalisation",
];

function ConsolidationPage() {
  const [st, setSt] = useState<CState>(INITIAL);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSt(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  const save = (next: CState) => {
    setSt(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const open = st.review.filter((r) => r.status === "À vérifier").length;
  const resolved = st.review.length - open;
  const extracted = 1542 + st.runs * 38;
  const duplicates = 23 + st.runs * 2;
  const cleaned = extracted - duplicates;
  const consolidated = cleaned - open - 12 + resolved;
  const quality = Math.min(99.6, 96.4 + resolved * 0.25 + st.runs * 0.1);
  const errors = open + 7;

  const run = () => {
    setRunning(true);
    setStep(0);
    let i = 0;
    const tick = () => {
      i++;
      if (i < STEPS.length) {
        setStep(i);
        setTimeout(tick, 650 + Math.random() * 350);
      } else {
        setTimeout(() => {
          save({ ...st, runs: st.runs + 1, lastRun: new Date().toISOString() });
          setRunning(false);
          setStep(-1);
          toast.success("Consolidation terminée", { description: "+38 enregistrements extraits, statistiques mises à jour." });
        }, 500);
      }
    };
    setTimeout(tick, 700);
  };

  const updateReview = (id: string, status: ReviewIssue["status"], value?: string) => {
    save({ ...st, review: st.review.map((r) => (r.id === id ? { ...r, status, value: value ?? r.value } : r)) });
    toast.success(status === "Corrigé" ? "Enregistrement corrigé" : status === "Validé" ? "Enregistrement validé" : "Enregistrement ignoré");
  };

  return (
    <div className="space-y-6">
      <InterfaceHeader
        num="02"
        kicker="Collecte · Extraction · Nettoyage · Consolidation"
        title="Consolidation des Données"
        subtitle="Les données issues des emails commerciaux, fichiers Excel et Sage transformées en informations structurées et fiables."
        actions={
          <Button size="lg" onClick={run} disabled={running}>
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Lancer la consolidation
          </Button>
        }
      />

      <Dialog open={running}>
        <DialogContent className="max-w-lg [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Consolidation en cours</DialogTitle>
            <DialogDescription>Traitement simulé des sources de démonstration.</DialogDescription>
          </DialogHeader>
          <Progress value={((step + 1) / STEPS.length) * 100} />
          <ol className="mt-2 space-y-2">
            {STEPS.map((s, i) => (
              <li key={s} className={cn("flex items-center gap-3 text-sm transition-opacity", i > step && "opacity-40")}>
                {i < step ? <CheckCircle2 className="size-4 text-success" /> : i === step ? <Loader2 className="size-4 animate-spin text-primary" /> : <span className="size-4 rounded-full border border-border" />}
                <span className={cn(i === step && "font-semibold")}>{s}</span>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          {[
            ["dashboard", "Tableau de bord"],
            ["sources", "Sources"],
            ["pipeline", "Pipeline"],
            ["quality", "Qualité"],
            ["data", "Données consolidées"],
            ["sales", "Ventes"],
            ["stock", "Stock"],
            ["offers", "Offres"],
            ["review", `À vérifier (${open})`],
          ].map(([v, l]) => (
            <TabsTrigger key={v} value={v!} className="rounded-full border border-border px-4 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="mt-6 space-y-6 animate-rise">
          <div className="relative overflow-hidden rounded-2xl p-6 panel">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-kicker">Enregistrements consolidés</p>
                <p className="mt-2 font-display text-5xl font-black">{consolidated.toLocaleString("fr-FR")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill tone="green">+8 % vs période préc.</StatusPill>
                  <StatusPill tone="green">{quality.toFixed(1).replace(".", ",")} % qualité</StatusPill>
                  <StatusPill tone="amber">{duplicates} doublons détectés</StatusPill>
                  <StatusPill tone="red">{open} à vérifier</StatusPill>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Dernière consolidation : <b className="text-foreground">{new Date(st.lastRun).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</b></p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="Sources" value="3" hint="Emails commerciaux, fichiers Excel, Sage (simulation)." />
            <Kpi label="Fichiers reçus" value={String(EXCEL_FILES.length + st.runs)} hint="Fichiers Excel importés." />
            <Kpi label="Emails traités" value={String(312 + st.runs * 14)} hint="Emails commerciaux analysés." />
            <Kpi label="Extraits" value={extracted.toLocaleString("fr-FR")} hint="Enregistrements extraits de toutes les sources." />
            <Kpi label="Nettoyés" value={cleaned.toLocaleString("fr-FR")} hint="Enregistrements valides après nettoyage." />
            <Kpi label="Consolidés" value={consolidated.toLocaleString("fr-FR")} hint="Enregistrements intégrés au référentiel." />
            <Kpi label="Erreurs" value={String(errors)} hint="Anomalies détectées (champs manquants, formats invalides)." />
            <Kpi label="Doublons" value={String(duplicates)} hint="Enregistrements identiques détectés et fusionnés." />
          </div>
          <Pipeline extracted={extracted} cleaned={cleaned} duplicates={duplicates} consolidated={consolidated} running={running} step={step} />
        </TabsContent>

        <TabsContent value="sources" className="mt-6 animate-rise"><Sources runs={st.runs} /></TabsContent>
        <TabsContent value="pipeline" className="mt-6 animate-rise"><Pipeline extracted={extracted} cleaned={cleaned} duplicates={duplicates} consolidated={consolidated} running={running} step={step} /></TabsContent>
        <TabsContent value="quality" className="mt-6 animate-rise"><Quality quality={quality} review={st.review} onGo={() => setTab("review")} /></TabsContent>
        <TabsContent value="data" className="mt-6 animate-rise"><DataTable /></TabsContent>
        <TabsContent value="sales" className="mt-6 animate-rise"><SalesConsolidated /></TabsContent>
        <TabsContent value="stock" className="mt-6 animate-rise"><StockConsolidated /></TabsContent>
        <TabsContent value="offers" className="mt-6 animate-rise"><OffersConsolidated /></TabsContent>
        <TabsContent value="review" className="mt-6 animate-rise"><Review items={st.review} onUpdate={updateReview} onReset={() => { save({ ...st, review: REVIEW_ITEMS }); toast("Liste de vérification réinitialisée"); }} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Pipeline({ extracted, cleaned, duplicates, consolidated, running, step }: { extracted: number; cleaned: number; duplicates: number; consolidated: number; running: boolean; step: number }) {
  const stages = [
    { n: "Sources", rec: 3, unit: "sources", time: "0,4 s", err: 0 },
    { n: "Extraction", rec: extracted, unit: "enregistrements", time: "3,2 s", err: 4 },
    { n: "Nettoyage", rec: cleaned + duplicates, unit: "valides", time: "1,8 s", err: 3 },
    { n: "Structuration", rec: cleaned, unit: `${duplicates} doublons retirés`, time: "1,1 s", err: 0 },
    { n: "Validation", rec: consolidated, unit: "validés", time: "0,9 s", err: 0 },
    { n: "Consolidation", rec: consolidated, unit: "consolidés", time: "0,6 s", err: 0 },
  ];
  return (
    <Panel title="Pipeline de traitement" subtitle="Sources → Extraction → Nettoyage → Structuration → Validation → Consolidation">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stages.map((s, i) => {
          const active = running && step >= 0 && Math.min(5, step) === i;
          const done = !running || step > i;
          return (
            <div key={s.n} className={cn("relative rounded-lg border p-4 transition-all", active ? "border-primary shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_20%,transparent)]" : "border-border bg-background/50")}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
                <StatusPill tone={active ? "amber" : done ? "green" : "grey"}>{active ? "En cours" : done ? "Terminé" : "En attente"}</StatusPill>
              </div>
              <p className="mt-2 font-display font-bold">{s.n}</p>
              <p className="font-display text-xl font-extrabold">{s.rec.toLocaleString("fr-FR")}</p>
              <p className="text-[11px] text-muted-foreground">{s.unit}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full bg-primary transition-all duration-700", active && "animate-pulse")} style={{ width: done ? "100%" : active ? "60%" : "0%" }} />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">{s.time} · {s.err} erreur{s.err > 1 ? "s" : ""}</p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Sources({ runs }: { runs: number }) {
  const [email, setEmail] = useState<(typeof EMAILS)[number] | null>(null);
  return (
    <div className="space-y-6">
      <Panel title="Emails commerciaux" action={<Mail className="size-5 text-primary" />}>
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-6">
          {[["Emails analysés", 312 + runs * 14], ["Avec info. commerciale", 187 + runs * 9], ["Offres détectées", 94 + runs * 4], ["Références détectées", 241 + runs * 11], ["Clients détectés", 68], ["Dernier traitement", "29/09 07:45"]].map(([l, v]) => (
            <div key={l as string} className="rounded-lg bg-muted/50 p-3"><p className="text-[11px] text-muted-foreground">{l}</p><p className="font-display font-bold">{v}</p></div>
          ))}
        </div>
        <ul className="divide-y divide-border">
          {EMAILS.map((e) => (
            <li key={e.id}>
              <button onClick={() => setEmail(e)} className="flex w-full flex-wrap items-center justify-between gap-2 py-3 text-left hover:text-primary">
                <span><span className="block text-sm font-semibold">{e.subject}</span><span className="text-xs text-muted-foreground">{e.from} · {fmtDate(e.date)}</span></span>
                <span className="flex gap-1">{e.detected.map((d) => <StatusPill key={d} tone="grey">{d}</StatusPill>)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
      <Dialog open={!!email} onOpenChange={(o) => !o && setEmail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{email?.subject}</DialogTitle>
            <DialogDescription>{email?.from} — email de démonstration</DialogDescription>
          </DialogHeader>
          {email && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border-l-4 border-primary bg-muted/50 p-4">
                <p>{email.subject}</p>
                <p>Client : {email.client}</p>
                <p>Quantité : {email.quantity}</p>
                <p>Secteur : {email.sector}</p>
              </div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Extraction automatique</p>
              <dl className="grid grid-cols-2 gap-2">
                {[["Client", email.client], ["Référence", email.reference], ["Quantité", email.quantity], ["Secteur", email.sector]].map(([k, v]) => (
                  <div key={k as string} className="rounded-md border border-border p-2"><dt className="text-[11px] text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>
                ))}
              </dl>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Panel title="Fichiers Excel" subtitle="Enregistrements de démonstration" action={<FileSpreadsheet className="size-5 text-primary" />}>
        <Table>
          <TableHeader><TableRow><TableHead>Fichier</TableHead><TableHead className="hidden sm:table-cell">Import</TableHead><TableHead className="text-right">Lignes</TableHead><TableHead className="text-right hidden md:table-cell">Colonnes</TableHead><TableHead className="text-right">Extraits</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Qualité</TableHead></TableRow></TableHeader>
          <TableBody>
            {EXCEL_FILES.map((f) => (
              <TableRow key={f.name}>
                <TableCell className="font-mono text-xs font-semibold">{f.name}</TableCell>
                <TableCell className="hidden sm:table-cell text-xs">{fmtDate(f.date)}</TableCell>
                <TableCell className="text-right">{f.rows}</TableCell>
                <TableCell className="text-right hidden md:table-cell">{f.cols}</TableCell>
                <TableCell className="text-right">{f.extracted}</TableCell>
                <TableCell><StatusPill tone={f.status === "Traité" ? "green" : "amber"}>{f.status}</StatusPill></TableCell>
                <TableCell className="text-right font-semibold">{f.quality.toString().replace(".", ",")} %</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <Panel title="Données Sage" action={<ServerCog className="size-5 text-primary" />}>
        <p className="mb-4 inline-block rounded-md border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning">Simulation frontend — aucune connexion Sage réelle</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {[["Dernière synchro.", "29/09 07:30"], ["Ventes", SALES.filter((s) => s.source === "Sage").length], ["Clients", 18], ["Produits", PRODUCTS.length], ["Stock", PRODUCTS.length], ["Offres", OFFERS.filter((o) => o.source === "Sage").length]].map(([l, v]) => (
            <div key={l as string} className="rounded-lg bg-muted/50 p-3"><p className="text-[11px] text-muted-foreground">{l}</p><p className="font-display font-bold">{v}</p></div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Quality({ quality, review, onGo }: { quality: number; review: ReviewIssue[]; onGo: () => void }) {
  const count = (k: string) => review.filter((r) => r.status === "À vérifier" && r.issue.toLowerCase().includes(k)).length;
  const dims = [["Complétude", quality + 0.8], ["Exactitude", quality - 0.6], ["Cohérence", quality - 1.2], ["Unicité", quality + 1.1]] as const;
  const issues = [["Champs manquants", count("manquant")], ["Références invalides", count("référence invalide")], ["Doublons", count("doublon")], ["Emails invalides", count("email")], ["Quantités manquantes/invalides", count("quantité")], ["Infos produit manquantes", count("produit")], ["Noms clients incohérents", count("incohérent") + count("inconnu")]] as const;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel title="Score qualité des données">
        <div className="relative mx-auto size-44">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="10" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(quality / 100) * 264} 264`} className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl font-black">{quality.toFixed(1).replace(".", ",")} %</span>
            <span className="text-xs text-muted-foreground">qualité globale</span>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {dims.map(([l, v]) => (
            <div key={l}><div className="flex justify-between text-sm"><span>{l}</span><b>{Math.min(99.9, v).toFixed(1).replace(".", ",")} %</b></div><Progress value={Math.min(99.9, v)} className="mt-1 h-1.5" /></div>
          ))}
        </div>
      </Panel>
      <Panel title="Anomalies détectées" className="lg:col-span-2" action={<Button size="sm" variant="outline" onClick={onGo}>Traiter les anomalies</Button>}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {issues.map(([l, v]) => (
            <li key={l} className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">{l}</span>
              <StatusPill tone={v > 0 ? "red" : "green"}>{v > 0 ? v : "OK"}</StatusPill>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

const COLS = [
  ["date", "Date"],
  ["client", "Client"],
  ["company", "Société"],
  ["commercial", "Commercial"],
  ["sector", "Secteur"],
  ["product", "Produit"],
  ["reference", "Référence"],
  ["quantity", "Quantité"],
  ["amount", "Montant"],
  ["status", "Statut"],
  ["source", "Source"],
  ["quality", "Qualité"],
] as const;
type ColKey = (typeof COLS)[number][0];
type Row = SaleRecord & { status: string; kind: "Vente" | "Offre" };

const ROWS: Row[] = [
  ...SALES.map((s) => ({ ...s, status: "Facturée", kind: "Vente" as const })),
  ...OFFERS.map((o) => ({ id: o.id, date: o.date, client: "—", company: o.client, commercial: o.commercial, sector: o.sector, region: o.region, category: o.category, product: o.product, reference: o.reference, quantity: o.quantity, amount: o.amount, source: o.source, quality: "Validé" as const, status: `Offre ${o.status.toLowerCase()}`, kind: "Offre" as const })),
].sort((a, b) => b.date.localeCompare(a.date));

function DataTable() {
  const [q, setQ] = useState("");
  const [source, setSource] = useState("all");
  const [kind, setKind] = useState("all");
  const [sort, setSort] = useState<{ k: ColKey; dir: 1 | -1 }>({ k: "date", dir: -1 });
  const [hidden, setHidden] = useState<ColKey[]>(["client", "product"]);
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<Row | null>(null);
  const PER = 12;

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return ROWS.filter((r) => (source === "all" || r.source === source) && (kind === "all" || r.kind === kind) && (!t || `${r.id} ${r.company} ${r.client} ${r.commercial} ${r.reference} ${r.product} ${r.sector}`.toLowerCase().includes(t))).sort((a, b) => {
      const va = a[sort.k];
      const vb = b[sort.k];
      return (typeof va === "number" ? (va as number) - (vb as number) : String(va).localeCompare(String(vb))) * sort.dir;
    });
  }, [q, source, kind, sort]);
  useEffect(() => setPage(0), [q, source, kind, sort]);
  const pages = Math.max(1, Math.ceil(rows.length / PER));
  const visible = COLS.filter(([k]) => !hidden.includes(k));

  return (
    <Panel title="Données consolidées" subtitle={`${rows.length.toLocaleString("fr-FR")} enregistrements`}>
      <div className="mb-4 flex flex-col gap-2 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher client, référence, commercial..." className="pl-9" />
        </div>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="md:w-36"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tous types</SelectItem><SelectItem value="Vente">Ventes</SelectItem><SelectItem value="Offre">Offres</SelectItem></SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="md:w-36"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Toutes sources</SelectItem>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline"><Columns3 className="size-4" /> Colonnes</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COLS.map(([k, l]) => (
              <DropdownMenuCheckboxItem key={k} checked={!hidden.includes(k)} onSelect={(e) => e.preventDefault()} onCheckedChange={(c) => setHidden((h) => (c ? h.filter((x) => x !== k) : [...h, k]))}>{l}</DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {rows.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-semibold">Aucun résultat trouvé.</p>
          <Button variant="outline" className="mt-3" onClick={() => { setQ(""); setSource("all"); setKind("all"); }}>Réinitialiser</Button>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                {visible.map(([k, l]) => (
                  <TableHead key={k}>
                    <button onClick={() => setSort((s) => ({ k, dir: s.k === k ? (s.dir === 1 ? -1 : 1) : 1 }))} className="inline-flex items-center gap-1 hover:text-primary">
                      {l}{sort.k === k && (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(page * PER, page * PER + PER).map((r) => (
                <TableRow key={r.id} onClick={() => setSel(r)} className="cursor-pointer">
                  {visible.map(([k]) => (
                    <TableCell key={k} className="whitespace-nowrap text-xs">
                      {k === "amount" ? <b>{fmtMAD(r.amount)}</b> : k === "date" ? fmtDate(r.date) : k === "quality" ? <StatusPill tone={r.quality === "Validé" ? "green" : r.quality === "Corrigé" ? "amber" : "red"}>{r.quality}</StatusPill> : k === "reference" ? <span className="font-mono">{r.reference}</span> : String(r[k])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Page {page + 1} / {pages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="size-4" /> Précédent</Button>
              <Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Suivant <ChevronRight className="size-4" /></Button>
            </div>
          </div>
        </>
      )}
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{sel?.id}</SheetTitle>
            <SheetDescription>{sel?.kind} consolidée — source {sel?.source}</SheetDescription>
          </SheetHeader>
          {sel && (
            <dl className="mt-6 space-y-3 px-4 text-sm">
              {COLS.map(([k, l]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">{l}</dt>
                  <dd className="text-right font-medium">{k === "amount" ? fmtMAD(sel.amount) : k === "date" ? fmtDate(sel.date) : String(sel[k])}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Région</dt><dd className="font-medium">{sel.region}</dd></div>
            </dl>
          )}
        </SheetContent>
      </Sheet>
    </Panel>
  );
}

function groupSum<T>(rows: T[], key: (r: T) => string, val: (r: T) => number) {
  const m = new Map<string, number>();
  rows.forEach((r) => m.set(key(r), (m.get(key(r)) ?? 0) + val(r)));
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function SalesConsolidated() {
  const total = SALES.reduce((a, s) => a + s.amount, 0);
  const qty = SALES.reduce((a, s) => a + s.quantity, 0);
  const blocks = [
    ["Par commercial", groupSum(SALES, (s) => s.commercial, (s) => s.amount)],
    ["Par produit", groupSum(SALES, (s) => s.reference, (s) => s.amount).slice(0, 8)],
    ["Par secteur", groupSum(SALES, (s) => s.sector, (s) => s.amount)],
  ] as const;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Ventes totales" value={SALES.length.toLocaleString("fr-FR")} hint="Lignes de vente consolidées (12 mois)." />
        <Kpi label="Chiffre d'affaires" value={fmtK(total)} hint="CA consolidé (12 mois)." />
        <Kpi label="Quantité" value={qty.toLocaleString("fr-FR")} hint="Articles vendus (12 mois)." />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {blocks.map(([t, data]) => (
          <Panel key={t} title={t}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={data.map((d) => ({ name: d.name.split(" ")[0], CA: d.value }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <RTooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtMAD(v)} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="CA" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function StockConsolidated() {
  const [filter, setFilter] = useState("Tous");
  const rows = PRODUCTS.map((p) => ({ p, status: stockStatus(p), demand: SALES.filter((s) => s.reference === p.reference).reduce((a, s) => a + s.quantity, 0) })).filter((r) => filter === "Tous" || r.status === filter);
  return (
    <Panel
      title="Stock consolidé"
      action={
        <div className="flex flex-wrap gap-1">
          {["Tous", "Disponible", "Stock faible", "Rupture", "Surstock"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={cn("rounded-full border px-3 py-1 text-xs font-medium", filter === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground")}>{s}</button>
          ))}
        </div>
      }
    >
      <Table>
        <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead>Référence</TableHead><TableHead className="text-right">Disponible</TableHead><TableHead className="text-right">Stock min.</TableHead><TableHead className="text-right">Demande 12 m</TableHead><TableHead>Statut</TableHead><TableHead className="hidden md:table-cell">Mise à jour</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.map(({ p, status, demand }) => (
            <TableRow key={p.reference}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell className="font-mono text-xs">{p.reference}</TableCell>
              <TableCell className="text-right font-semibold">{p.stock}</TableCell>
              <TableCell className="text-right">{p.minStock}</TableCell>
              <TableCell className="text-right">{demand.toLocaleString("fr-FR")}</TableCell>
              <TableCell><StatusPill tone={status === "Rupture" ? "red" : status === "Stock faible" ? "amber" : status === "Surstock" ? "grey" : "green"}>{status}</StatusPill></TableCell>
              <TableCell className="hidden md:table-cell text-xs">29 sept. 2026</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}

function OffersConsolidated() {
  const [status, setStatus] = useState<"Gagnée" | "En attente" | "Perdue">("En attente");
  const [com, setCom] = useState("all");
  const by = (s: string) => OFFERS.filter((o) => o.status === s);
  const val = (s: string) => by(s).reduce((a, o) => a + o.amount, 0);
  const conv = (by("Gagnée").length / (by("Gagnée").length + by("Perdue").length)) * 100;
  const rows = OFFERS.filter((o) => o.status === status && (com === "all" || o.commercial === com)).slice(0, 15);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Pipeline total" value={fmtK(OFFERS.reduce((a, o) => a + o.amount, 0))} hint="Valeur totale des offres." />
        <Kpi label="Gagnées" value={fmtK(val("Gagnée"))} hint="Valeur des offres gagnées." />
        <Kpi label="En attente" value={fmtK(val("En attente"))} hint="Valeur des offres en attente." />
        <Kpi label="Perdues" value={fmtK(val("Perdue"))} hint="Valeur des offres perdues." />
        <Kpi label="Conversion" value={`${conv.toFixed(1).replace(".", ",")} %`} hint="Gagnées / (gagnées + perdues)." />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {(["Gagnée", "En attente", "Perdue"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={cn("rounded-xl p-4 text-left panel transition-all", status === s && "ring-2 ring-primary")}>
            <StatusPill tone={s === "Gagnée" ? "green" : s === "Perdue" ? "red" : "amber"}>{s === "Gagnée" ? "Gagnées" : s === "Perdue" ? "Perdues" : "En attente"}</StatusPill>
            <p className="mt-2 font-display text-2xl font-extrabold">{by(s).length}</p>
            <p className="text-xs text-muted-foreground">{s === "Gagnée" ? "Offres converties" : s === "Perdue" ? "Offres non converties" : "En attente de décision client"}</p>
          </button>
        ))}
      </div>
      <Panel title={`Offres — ${status}`} action={
        <Select value={com} onValueChange={setCom}>
          <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tous les commerciaux</SelectItem>{COMMERCIALS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      }>
        <Table>
          <TableHeader><TableRow><TableHead>Offre</TableHead><TableHead>Client</TableHead><TableHead className="hidden md:table-cell">Commercial</TableHead><TableHead className="hidden lg:table-cell">Produit</TableHead><TableHead className="text-right">Montant</TableHead><TableHead className="hidden sm:table-cell">Date</TableHead><TableHead>Source</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-xs font-semibold">{o.id}</TableCell>
                <TableCell>{o.client}</TableCell>
                <TableCell className="hidden md:table-cell">{o.commercial}</TableCell>
                <TableCell className="hidden lg:table-cell font-mono text-xs">{o.reference}</TableCell>
                <TableCell className="text-right font-semibold">{fmtK(o.amount)}</TableCell>
                <TableCell className="hidden sm:table-cell text-xs">{fmtDate(o.date)}</TableCell>
                <TableCell><StatusPill tone="grey">{o.source}</StatusPill></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Aucun résultat trouvé.</p>}
      </Panel>
    </div>
  );
}

function Review({ items, onUpdate, onReset }: { items: ReviewIssue[]; onUpdate: (id: string, s: ReviewIssue["status"], v?: string) => void; onReset: () => void }) {
  const [fix, setFix] = useState<ReviewIssue | null>(null);
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");
  const open = items.filter((i) => i.status === "À vérifier");
  const done = items.filter((i) => i.status !== "À vérifier");
  return (
    <div className="space-y-6">
      <Panel title="Données à vérifier" subtitle={`${open.length} enregistrement${open.length > 1 ? "s" : ""} en attente de vérification manuelle`} action={done.length > 0 && <Button size="sm" variant="ghost" onClick={onReset}>Réinitialiser la démo</Button>}>
        {open.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="mx-auto size-10 text-success" />
            <p className="mt-3 font-semibold">Toutes les données ont été vérifiées.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {open.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4 animate-rise">
                <div>
                  <div className="flex items-center gap-2"><StatusPill tone="red">{i.issue}</StatusPill><StatusPill tone="grey">{i.source}</StatusPill></div>
                  <p className="mt-2 text-sm font-medium">{i.record}</p>
                  <p className="text-xs text-muted-foreground">Champ « {i.field} » : {i.value || <em>vide</em>}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { setFix(i); setValue(i.value); setErr(""); }}>Corriger</Button>
                  <Button size="sm" variant="outline" onClick={() => onUpdate(i.id, "Validé")}>Valider</Button>
                  <Button size="sm" variant="ghost" onClick={() => onUpdate(i.id, "Ignoré")}>Ignorer</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {done.length > 0 && (
        <Panel title="Historique de vérification">
          <ul className="divide-y divide-border text-sm">
            {done.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 py-2">
                <span>{i.issue} — <span className="text-muted-foreground">{i.record}</span></span>
                <StatusPill tone={i.status === "Ignoré" ? "grey" : "green"}>{i.status}</StatusPill>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <Dialog open={!!fix} onOpenChange={(o) => !o && setFix(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Corriger l'enregistrement</DialogTitle>
            <DialogDescription>{fix?.issue} — {fix?.record}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="fixv">{fix?.field}</Label>
            <Input id="fixv" value={value} onChange={(e) => { setValue(e.target.value); setErr(""); }} placeholder={`Nouvelle valeur pour « ${fix?.field} »`} />
            {err && <p className="text-xs text-destructive">{err}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFix(null)}>Annuler</Button>
            <Button onClick={() => {
              if (!value.trim()) return setErr("Veuillez compléter les informations nécessaires.");
              if (fix?.field === "Quantité" && !(Number(value) > 0)) return setErr("La quantité doit être un nombre positif.");
              onUpdate(fix!.id, "Corrigé", value.trim());
              setFix(null);
            }}><Database className="size-4" /> Enregistrer la correction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
