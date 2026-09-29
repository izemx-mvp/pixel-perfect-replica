import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { CalendarClock, Copy, FileDown, FileSpreadsheet, Loader2, Mail, RefreshCw, RotateCcw, Save, Send, Sparkles, X } from "lucide-react";
import { Panel, chartTooltipStyle } from "@/components/bi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CLIENTS, OFFERS, REFS, REPS, SALES, SECTORS, TODAY, ageDays, clientOf, convRate, downloadCSV, exportPDF, fmtK, fmtMAD, groupSum, refOf, repName, requesters, sum,
} from "@/data/rapports";
import { DataTable, KpiCard, useR } from "./shared";

export type Report = {
  title: string; period: string; kpis: { label: string; value: string }[]; head: string[]; rows: (string | number)[][];
  chart: { name: string; value: number }[]; summary: string[]; recs: string[];
};
type Opts = { period: number; sector: string; rep: string; top?: number | undefined; compare?: boolean | undefined };

export function interpret(prompt: string, base: { period: number; sector: string; rep: string }): Opts & { rephrase: string } {
  const p = prompt.toLowerCase();
  const o: Opts = { ...base };
  if (/trimestre/.test(p)) o.period = 90;
  if (/mois/.test(p)) o.period = 30;
  if (/année|annee|an\b/.test(p)) o.period = 365;
  SECTORS.forEach((s) => { if (p.includes(s.toLowerCase().slice(0, 6))) o.sector = s; });
  REPS.forEach((r) => { if (p.includes(r.short.toLowerCase())) o.rep = r.id; });
  const m = p.match(/top\s*(\d+)/); if (m) o.top = Number(m[1]);
  if (/compar|précédent|precedent/.test(p)) o.compare = true;
  const kind = kindOf(p);
  const label = { refs: "les références demandées par plusieurs clients avec leur stock disponible", offers: "les offres en attente et leur ancienneté", sales: "le chiffre d'affaires par commercial" }[kind];
  return { ...o, rephrase: `Rapport sur ${label}, ${o.sector !== "all" ? `secteur ${o.sector}, ` : ""}${o.rep !== "all" ? `commercial ${repName(o.rep)}, ` : ""}sur les ${o.period} derniers jours${o.top ? `, limité au top ${o.top}` : ""}${o.compare ? ", avec comparaison à la période précédente" : ""}.` };
}
const kindOf = (p: string) => (/référence|reference|stock|demand/.test(p) ? "refs" : /offre|attente|relanc/.test(p) ? "offers" : "sales");

export function buildReport(prompt: string, o: Opts): Report {
  const kind = kindOf(prompt.toLowerCase());
  const inScope = (d: string, rep: string, client: string, shift = 0) => { const a = ageDays(d) - shift; return a >= 0 && a < o.period && (o.rep === "all" || rep === o.rep) && (o.sector === "all" || clientOf(client).sector === o.sector); };
  const period = `${o.period} derniers jours — au ${TODAY.toLocaleDateString("fr-FR")}${o.sector !== "all" ? ` — ${o.sector}` : ""}`;
  if (kind === "refs") {
    const minM = prompt.match(/plus de (\d+)/); const min = minM ? Number(minM[1]) : 2;
    let rows = REFS.map((r) => ({ r, n: requesters(r.code).length })).filter((x) => x.n > min).sort((a, b) => b.n - a.n);
    if (o.top) rows = rows.slice(0, o.top);
    const low = rows.filter((x) => x.r.stock <= x.r.min);
    return {
      title: `Références demandées par plus de ${min} clients`, period,
      kpis: [{ label: "Références", value: String(rows.length) }, { label: "À approvisionner", value: String(low.length) }, { label: "Stock cumulé", value: String(rows.reduce((t, x) => t + x.r.stock, 0)) }],
      head: ["Référence", "Désignation", "Famille", "Clients demandeurs", "Stock", "Statut"],
      rows: rows.map((x) => [x.r.code, x.r.label, x.r.family, x.n, x.r.stock, x.r.stock <= x.r.min ? "À approvisionner" : "OK"]),
      chart: rows.slice(0, 10).map((x) => ({ name: x.r.code, value: x.n })),
      summary: [`${rows.length} références sont demandées par plus de ${min} clients distincts.`, `${low.length} d'entre elles sont sous le seuil de stock.`, rows[0] ? `La plus demandée est ${rows[0].r.code} (${rows[0].n} clients).` : "Aucune référence ne répond au critère."],
      recs: low.length ? [`Lancer un réapprovisionnement sur ${low.slice(0, 3).map((x) => x.r.code).join(", ")}.`, "Prévenir les commerciaux concernés des délais."] : ["Maintenir le niveau de stock actuel."],
    };
  }
  if (kind === "offers") {
    const dM = prompt.match(/(\d+)\s*jours/); const d = dM ? Number(dM[1]) : 30;
    let rows = OFFERS.filter((x) => x.status === "En attente" && ageDays(x.date) > d && (o.rep === "all" || x.repId === o.rep) && (o.sector === "all" || clientOf(x.clientId).sector === o.sector)).sort((a, b) => b.amount - a.amount);
    if (o.top) rows = rows.slice(0, o.top);
    return {
      title: `Offres en attente depuis plus de ${d} jours`, period,
      kpis: [{ label: "Offres", value: String(rows.length) }, { label: "Montant en jeu", value: fmtK(sum(rows)) }, { label: "Ancienneté moyenne", value: `${Math.round(rows.reduce((t, x) => t + ageDays(x.date), 0) / Math.max(1, rows.length))} j` }],
      head: ["Offre", "Client", "Commercial", "Montant", "Ancienneté"],
      rows: rows.map((x) => [x.id, clientOf(x.clientId).name, repName(x.repId), fmtMAD(x.amount), `${ageDays(x.date)} j`]),
      chart: groupSum(rows, (x) => repName(x.repId), (x) => x.amount),
      summary: [`${rows.length} offres restent sans décision depuis plus de ${d} jours.`, `Montant total en jeu : ${fmtMAD(sum(rows))}.`],
      recs: ["Relancer en priorité les offres au montant le plus élevé.", "Fixer une date limite de validité sur les nouvelles offres."],
    };
  }
  const cur = SALES.filter((s) => inScope(s.date, s.repId, s.clientId)), prev = SALES.filter((s) => inScope(s.date, s.repId, s.clientId, o.period));
  let g = groupSum(cur, (s) => repName(s.repId), (s) => s.amount);
  if (o.top) g = g.slice(0, o.top);
  const pg = groupSum(prev, (s) => repName(s.repId), (s) => s.amount);
  const offers = OFFERS.filter((x) => inScope(x.date, x.repId, x.clientId));
  return {
    title: `Ventes par commercial${o.sector !== "all" ? ` — secteur ${o.sector}` : ""}`, period,
    kpis: [{ label: "Chiffre d'affaires", value: fmtK(sum(cur)) }, ...(o.compare ? [{ label: "Période précédente", value: fmtK(sum(prev)) }] : []), { label: "Conversion", value: `${convRate(offers).toFixed(0)} %` }, { label: "Top produit", value: groupSum(cur, (s) => s.ref, (s) => s.amount)[0]?.name ?? "—" }],
    head: ["Commercial", "CA", ...(o.compare ? ["Période préc.", "Évolution"] : []), "Part"],
    rows: g.map((x) => { const p = pg.find((y) => y.name === x.name)?.value ?? 0; return [x.name, fmtMAD(x.value), ...(o.compare ? [fmtMAD(p), p ? `${(((x.value - p) / p) * 100).toFixed(1)} %` : "—"] : []), `${((x.value / Math.max(1, sum(cur))) * 100).toFixed(0)} %`]; }),
    chart: g,
    summary: [g[0] ? `${g[0].name} réalise la meilleure performance avec ${fmtMAD(g[0].value)}.` : "Aucune vente sur la période.", `CA total ${fmtMAD(sum(cur))} contre ${fmtMAD(sum(prev))} sur la période précédente.`, g.length > 1 && g[g.length - 1]!.value < g[0]!.value / 3 ? `Anomalie : écart important avec ${g[g.length - 1]!.name}.` : "Répartition équilibrée entre commerciaux."],
    recs: ["Partager les bonnes pratiques du meilleur commercial.", "Accompagner les commerciaux en retrait sur les comptes clés."],
  };
}

export type SavedReport = { id: string; date: string; type: string; title: string; prompt: string; filters: string; author: string };
const HKEY = "rd_reports_history";
export const loadHistory = (): SavedReport[] => { try { return JSON.parse(localStorage.getItem(HKEY) || "[]"); } catch { return []; } };
export const saveHistory = (h: SavedReport[]) => localStorage.setItem(HKEY, JSON.stringify(h));
export function pushHistory(r: Omit<SavedReport, "id" | "date" | "author">) {
  const h = [{ ...r, id: `RPT-${Date.now().toString().slice(-6)}`, date: new Date().toISOString(), author: "Client Démonstration" }, ...loadHistory()];
  saveHistory(h);
}

export function ReportView({ rep }: { rep: Report }) {
  return (
    <div className="space-y-4">
      <div><h3 className="font-display text-xl font-extrabold">{rep.title}</h3><p className="text-xs text-muted-foreground">{rep.period}</p></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{rep.kpis.map((k) => <KpiCard key={k.label} label={k.label} value={k.value} />)}</div>
      <div className="grid gap-4 lg:grid-cols-2">
        <DataTable head={rep.head} rows={rep.rows} />
        <div className="h-64"><ResponsiveContainer><BarChart data={rep.chart}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip contentStyle={chartTooltipStyle} /><Bar dataKey="value" fill="var(--primary)" radius={4} /></BarChart></ResponsiveContainer></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4"><p className="mb-2 flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-primary" /> Résumé IA</p><ul className="list-disc space-y-1 pl-5 text-sm">{rep.summary.map((s) => <li key={s}>{s}</li>)}</ul></div>
        <div className="rounded-lg border border-border p-4"><p className="mb-2 font-semibold">Recommandations</p><ul className="list-disc space-y-1 pl-5 text-sm">{rep.recs.map((s) => <li key={s}>{s}</li>)}</ul></div>
      </div>
    </div>
  );
}

const EXAMPLES = ["Ventes du secteur pharmaceutique ce trimestre, par commercial", "Références demandées par plus de 3 clients et leur stock disponible", "Offres en attente depuis plus de 30 jours"];

export function CustomReport({ initialPrompt }: { initialPrompt?: string | undefined }) {
  const { filters } = useR();
  const [prompt, setPrompt] = useState(initialPrompt ?? "");
  const [sel, setSel] = useState({ period: filters.period, sector: filters.sector, rep: filters.rep, product: "all", client: "all" });
  const [stage, setStage] = useState<"input" | "confirm" | "loading" | "done">("input");
  const [opts, setOpts] = useState<ReturnType<typeof interpret> | null>(null);
  const [rep, setRep] = useState<Report | null>(null);
  const [chat, setChat] = useState<{ q: string; a: string }[]>([]);
  const [refine, setRefine] = useState("");
  const [dlg, setDlg] = useState<"email" | "plan" | null>(null);
  const [email, setEmail] = useState("direction@rousseaudistribution.ma");
  const [freq, setFreq] = useState("hebdomadaire");
  useEffect(() => { if (initialPrompt) { setPrompt(initialPrompt); setStage("input"); } }, [initialPrompt]);

  const submit = () => {
    if (!prompt.trim()) { toast.error("Veuillez saisir une recherche."); return; }
    setOpts(interpret(prompt, sel)); setStage("confirm");
  };
  const validate = () => {
    setStage("loading");
    setTimeout(() => {
      const r = buildReport(prompt, opts!);
      setRep(r); setStage("done"); setChat([]);
      pushHistory({ type: "Rapport personnalisé", title: r.title, prompt, filters: r.period });
    }, 1600);
  };
  const doRefine = (text: string) => {
    if (!text.trim() || !opts) return;
    const next = { ...opts, ...interpret(text, opts) , sector: interpret(text, opts).sector, top: interpret(text, opts).top ?? opts.top, compare: opts.compare || interpret(text, opts).compare };
    setOpts(next);
    const r = buildReport(prompt, next);
    setRep(r);
    setChat((c) => [...c, { q: text, a: `Rapport mis à jour : ${next.top ? `top ${next.top}` : "toutes les lignes"}${next.compare ? ", comparaison ajoutée" : ""}${next.sector !== "all" ? `, secteur ${next.sector}` : ""}.` }]);
    setRefine("");
  };
  const pdf = async () => {
    if (!rep) return;
    await exportPDF(rep.title, rep.period, [
      { heading: "Indicateurs clés", lines: rep.kpis.map((k) => `${k.label} : ${k.value}`) },
      { heading: "Détail", table: { head: rep.head, rows: rep.rows } },
      { heading: "Résumé IA", lines: rep.summary }, { heading: "Recommandations", lines: rep.recs },
    ], "rapport-personnalise.pdf");
    toast.success("PDF exporté");
  };

  return (
    <div className="space-y-4">
      <Panel title="Rapport personnalisé (IA)" subtitle="Décrivez le rapport souhaité en langage naturel">
        <Textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ex. : Ventes du secteur pharmaceutique ce trimestre, par commercial" className="text-base" />
        <div className="mt-2 flex flex-wrap gap-2">{EXAMPLES.map((e) => <button key={e} onClick={() => setPrompt(e)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary">{e}</button>)}</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Select value={String(sel.period)} onValueChange={(v) => setSel({ ...sel, period: Number(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[30, 90, 180, 365].map((p) => <SelectItem key={p} value={String(p)}>{p} jours</SelectItem>)}</SelectContent></Select>
          <Select value={sel.rep} onValueChange={(v) => setSel({ ...sel, rep: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous commerciaux</SelectItem>{REPS.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select>
          <Select value={sel.sector} onValueChange={(v) => setSel({ ...sel, sector: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous secteurs</SelectItem>{SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          <Select value={sel.product} onValueChange={(v) => setSel({ ...sel, product: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous produits</SelectItem>{REFS.map((r) => <SelectItem key={r.code} value={r.code}>{r.code}</SelectItem>)}</SelectContent></Select>
          <Select value={sel.client} onValueChange={(v) => setSel({ ...sel, client: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous clients</SelectItem>{CLIENTS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
        </div>
        <Button className="mt-3" onClick={submit}><Sparkles className="size-4" /> Générer le rapport</Button>
      </Panel>

      {stage === "confirm" && opts && (
        <Panel title="Reformulation de l'IA">
          <p className="text-sm">{opts.rephrase}</p>
          <div className="mt-3 flex gap-2"><Button onClick={validate}>Valider</Button><Button variant="outline" onClick={() => setStage("input")}>Modifier</Button></div>
        </Panel>
      )}
      {stage === "loading" && <Panel><div className="flex items-center gap-3 py-8 text-sm"><Loader2 className="size-5 animate-spin text-primary" /> Génération du rapport en cours…</div></Panel>}
      {stage === "done" && rep && (
        <Panel action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={pdf}><FileDown className="size-4" /> Exporter en PDF</Button>
            <Button size="sm" variant="outline" onClick={() => { downloadCSV("rapport.csv", [rep.head, ...rep.rows]); toast.success("Export Excel lancé"); }}><FileSpreadsheet className="size-4" /> Exporter en Excel</Button>
            <Button size="sm" variant="outline" onClick={() => setDlg("email")}><Mail className="size-4" /> Envoyer par email</Button>
            <Button size="sm" variant="outline" onClick={() => { pushHistory({ type: "Modèle", title: rep.title, prompt, filters: rep.period }); toast.success("Enregistré comme modèle"); }}><Save className="size-4" /> Enregistrer comme modèle</Button>
            <Button size="sm" variant="outline" onClick={() => setDlg("plan")}><CalendarClock className="size-4" /> Planifier</Button>
          </div>
        }>
          <ReportView rep={rep} />
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-2 text-sm font-semibold">Affiner le rapport</p>
            <div className="space-y-2">{chat.map((c, i) => <div key={i} className="text-sm"><p className="ml-auto w-fit rounded-lg bg-primary px-3 py-1.5 text-primary-foreground">{c.q}</p><p className="mt-1 w-fit rounded-lg bg-muted px-3 py-1.5">{c.a}</p></div>)}</div>
            <div className="mt-2 flex flex-wrap gap-2">{["ajoute la comparaison avec le trimestre précédent", "montre seulement le top 10", "montre seulement le top 3"].map((s) => <button key={s} onClick={() => doRefine(s)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary">{s}</button>)}</div>
            <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); doRefine(refine); }}><Input value={refine} onChange={(e) => setRefine(e.target.value)} placeholder="Ex. : montre seulement le top 5" /><Button type="submit"><Send className="size-4" /></Button></form>
          </div>
        </Panel>
      )}
      <Dialog open={!!dlg} onOpenChange={(o) => !o && setDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dlg === "email" ? "Envoyer par email" : "Planifier le rapport"}</DialogTitle></DialogHeader>
          {dlg === "email" ? <Input value={email} onChange={(e) => setEmail(e.target.value)} /> : (
            <Select value={freq} onValueChange={setFreq}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hebdomadaire">Hebdomadaire</SelectItem><SelectItem value="mensuel">Mensuel</SelectItem></SelectContent></Select>
          )}
          <p className="text-xs text-muted-foreground">Simulation dans cet espace de démonstration.</p>
          <DialogFooter><Button onClick={() => { if (dlg === "email" && !/\S+@\S+\.\S+/.test(email)) { toast.error("Adresse e-mail invalide"); return; } toast.success(dlg === "email" ? `Envoi simulé à ${email}` : `Rapport planifié (${freq})`); setDlg(null); }}>Confirmer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- ASSISTANT ---------- */
type Msg = { role: "user" | "ai"; text: string; table?: (string | number)[][]; chart?: { name: string; value: number }[]; q?: string };
function answer(q: string, ctx: { intent: string; shift: number; ref?: string | undefined }) {
  const p = q.toLowerCase();
  let intent = ctx.intent, shift = 0, ref = ctx.ref;
  if (/précédent|precedent|avant/.test(p) && intent) shift = ctx.shift + 30;
  else if (/vendu|meilleur|commercial/.test(p)) intent = "topRep";
  else if (/combien de clients|référence|reference/.test(p)) { intent = "refClients"; ref = REFS.find((r) => p.includes(r.code.toLowerCase()) || p.includes(r.code.toLowerCase().split("-").slice(1).join("-")))?.code ?? "ROU-6205-2RS"; }
  else if (/offre|attente/.test(p)) intent = "pending";
  else if (/stock|rupture/.test(p)) intent = "stock";
  else intent = intent || "topRep";
  const win = (d: string) => { const a = ageDays(d) - shift; return a >= 0 && a < 30; };
  const lbl = shift ? "le mois précédent" : "ce mois-ci";
  let m: Msg;
  if (intent === "topRep") {
    const g = groupSum(SALES.filter((s) => win(s.date)), (s) => repName(s.repId), (s) => s.amount);
    m = { role: "ai", text: `${g[0]?.name ?? "—"} est le commercial ayant le plus vendu ${lbl} (${fmtMAD(g[0]?.value ?? 0)}).`, chart: g };
  } else if (intent === "refClients") {
    const n = requesters(ref!);
    m = { role: "ai", text: `${n.length} clients distincts ont demandé la référence ${ref} (${refOf(ref!).label}). Stock disponible : ${refOf(ref!).stock}.`, table: n.map((id) => [clientOf(id).name, clientOf(id).sector]) };
  } else if (intent === "pending") {
    const l = OFFERS.filter((o) => o.status === "En attente");
    m = { role: "ai", text: `${l.length} offres sont en attente pour ${fmtMAD(sum(l))}.`, table: l.slice(0, 6).map((o) => [o.id, clientOf(o.clientId).name, fmtMAD(o.amount)]) };
  } else {
    const l = REFS.filter((r) => r.stock <= r.min);
    m = { role: "ai", text: `${l.length} références sont sous le seuil de stock.`, table: l.slice(0, 8).map((r) => [r.code, r.stock]) };
  }
  return { m: { ...m, q }, ctx: { intent, shift, ref } };
}

export function Assistant({ onClose }: { onClose: () => void }) {
  const { go } = useR();
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "ai", text: "Bonjour, posez-moi une question sur l'activité commerciale." }]);
  const [ctx, setCtx] = useState({ intent: "", shift: 0, ref: undefined as string | undefined });
  const [v, setV] = useState("");
  const ask = (q: string) => {
    if (!q.trim()) return;
    const r = answer(q, ctx);
    setCtx(r.ctx); setMsgs((m) => [...m, { role: "user", text: q }, r.m]); setV("");
  };
  return (
    <aside className="panel flex h-[calc(100vh-9rem)] flex-col rounded-xl">
      <div className="flex items-center justify-between border-b border-border p-3"><p className="flex items-center gap-2 font-display font-bold"><Sparkles className="size-4 text-primary" /> Assistant IA</p><Button size="icon" variant="ghost" onClick={onClose} aria-label="Fermer"><X className="size-4" /></Button></div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-auto w-fit max-w-[85%] rounded-lg bg-primary px-3 py-2 text-primary-foreground" : "max-w-[95%] rounded-lg bg-muted px-3 py-2"}>
            {m.text}
            {m.table && <table className="mt-2 w-full text-xs">{m.table.map((r, j) => <tr key={j} className="border-t border-border">{r.map((c, k) => <td key={k} className="py-0.5 pr-2">{c}</td>)}</tr>)}</table>}
            {m.chart && <div className="mt-2 h-28"><ResponsiveContainer><BarChart data={m.chart}><XAxis dataKey="name" hide /><Tooltip contentStyle={chartTooltipStyle} formatter={(x: number) => fmtMAD(x)} /><Bar dataKey="value" fill="var(--primary)" radius={3} /></BarChart></ResponsiveContainer></div>}
            {m.q && <Button size="sm" variant="link" className="h-auto px-0 text-primary" onClick={() => go("ia", undefined, m.q)}>Transformer en rapport</Button>}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 px-3">{["Quel commercial a le plus vendu ce mois-ci ?", "Combien de clients ont demandé la référence 6205-2RS ?", "et pour le mois précédent ?"].map((s) => <button key={s} onClick={() => ask(s)} className="rounded-full border border-border px-2 py-0.5 text-[11px] hover:border-primary">{s}</button>)}</div>
      <form className="flex gap-2 p-3" onSubmit={(e) => { e.preventDefault(); ask(v); }}><Input value={v} onChange={(e) => setV(e.target.value)} placeholder="Votre question…" /><Button type="submit" size="icon" aria-label="Envoyer"><Send className="size-4" /></Button></form>
    </aside>
  );
}

/* ---------- HISTORIQUE ---------- */
export function Historique() {
  const { go } = useR();
  const [h, setH] = useState<SavedReport[]>([]);
  useEffect(() => {
    const cur = loadHistory();
    if (!cur.length) {
      const seed: SavedReport[] = [
        { id: "RPT-100231", date: "2026-09-25T10:00:00", type: "Rapport personnalisé", title: "Ventes par commercial — secteur Pharmaceutique", prompt: EXAMPLES[0]!, filters: "90 derniers jours — Pharmaceutique", author: "Direction commerciale" },
        { id: "RPT-100198", date: "2026-09-18T15:20:00", type: "Rapport personnalisé", title: "Références demandées par plus de 3 clients", prompt: EXAMPLES[1]!, filters: "90 derniers jours", author: "Direction commerciale" },
      ];
      saveHistory(seed); setH(seed);
    } else setH(cur);
  }, []);
  const upd = (n: SavedReport[]) => { setH(n); saveHistory(n); };
  return (
    <Panel title="Historique des rapports" subtitle={`${h.length} rapport(s)`}>
      <DataTable head={["Date", "Type", "Titre", "Filtres", "Auteur", "Actions"]} rows={h.map((r) => [
        new Date(r.date).toLocaleString("fr-FR"), r.type, r.title, r.filters, r.author,
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => go("ia", undefined, r.prompt)}><RotateCcw className="size-3.5" /> Rouvrir</Button>
          <Button size="sm" variant="outline" onClick={() => { upd([{ ...r, id: `RPT-${Date.now().toString().slice(-6)}`, date: new Date().toISOString(), title: `${r.title} (copie)` }, ...h]); toast.success("Rapport dupliqué"); }}><Copy className="size-3.5" /> Dupliquer</Button>
          <Button size="sm" variant="outline" onClick={() => { upd(h.map((x) => (x.id === r.id ? { ...x, date: new Date().toISOString() } : x))); toast.success("Rapport régénéré avec les données actuelles"); }}><RefreshCw className="size-3.5" /> Régénérer</Button>
        </div>,
      ])} />
    </Panel>
  );
}
