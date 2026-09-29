import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowLeft, Clock, FileDown, FileText, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Panel, StatusPill, chartTooltipStyle } from "@/components/bi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CLIENTS, FAMILIES, OFFERS, REFS, REPS, SALES, VISITS, ago, ageDays, clientOf, convRate, exportPDF, fmtDate, fmtK, fmtMAD,
  groupSum, lastReportDays, refOf, repName, requesters, salesSeries, scoped, sum, type Offer, type Visit,
} from "@/data/rapports";
import { DataTable, Evo, KpiCard, useR } from "./shared";

export const COLORS = ["var(--primary)", "var(--chart-2, #6b7280)", "var(--chart-3, #9ca3af)", "var(--chart-4, #374151)", "var(--chart-5, #d1d5db)"];
const statusTone = (s: string) => (s === "Conclue" || s === "Commande" ? "green" : s === "En attente" || s === "Offre émise" || s === "À relancer" ? "amber" : "red") as "green" | "amber" | "red";
const offerRows = (o: Offer[]) => o.map((x) => [x.id, fmtDate(x.date), repName(x.repId), clientOf(x.clientId).name, fmtMAD(x.amount), x.status]);
const OFFER_HEAD = ["Offre", "Date", "Commercial", "Client", "Montant", "Statut"];
const saleRows = (s: typeof SALES) => s.map((x) => [fmtDate(x.date), repName(x.repId), clientOf(x.clientId).name, x.ref, x.qty, fmtMAD(x.amount)]);
const SALE_HEAD = ["Date", "Commercial", "Client", "Référence", "Qté", "Montant"];

function Chart({ h = 240, children }: { h?: number; children: React.ReactElement }) {
  return <div style={{ height: h }}><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}
function HBar({ data, onClick, money = true }: { data: { name: string; value: number }[]; onClick?: (n: string) => void; money?: boolean }) {
  return (
    <Chart>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => (money ? fmtMAD(v) : v)} />
        <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} onClick={(d: { name?: string }) => d.name && onClick?.(d.name)} className="cursor-pointer" />
      </BarChart>
    </Chart>
  );
}
function useScope() {
  const { filters, q } = useR();
  return useMemo(() => {
    const cur = scoped(filters);
    const prev = scoped(filters, filters.period);
    const ql = q.trim().toLowerCase();
    const match = (...s: string[]) => !ql || s.some((x) => x.toLowerCase().includes(ql));
    return { cur, prev, match, filters };
  }, [filters, q]);
}

/* ---------------- ACCUEIL ---------------- */
export function Accueil() {
  const { cur, prev, filters } = useScope();
  const { showRows, go } = useR();
  const pending = cur.offers.filter((o) => o.status === "En attente");
  const outOfStock = REFS.filter((r) => r.stock <= r.min && requesters(r.code).length >= 3);
  const silentReps = REPS.filter((r) => lastReportDays(r.id) >= 5);
  const stale = OFFERS.filter((o) => o.status === "En attente" && ageDays(o.lastContact) > 15);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Chiffre d'affaires" value={fmtK(sum(cur.sales))} sub={`vs ${fmtK(sum(prev.sales))} période préc.`} onClick={() => showRows({ title: "Ventes de la période", head: SALE_HEAD, rows: saleRows(cur.sales) })} />
        <KpiCard label="Nombre de visites" value={String(cur.visits.length)} sub={`${prev.visits.length} période préc.`} onClick={() => go("visites")} />
        <KpiCard label="Offres en cours" value={String(pending.length)} sub={fmtK(sum(pending))} onClick={() => showRows({ title: "Offres en cours", head: OFFER_HEAD, rows: offerRows(pending) })} />
        <KpiCard label="Taux de conversion" value={`${convRate(cur.offers).toFixed(0)} %`} sub={`${convRate(prev.offers).toFixed(0)} % période préc.`} onClick={() => go("offres")} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Évolution des ventes">
          <Chart>
            <LineChart data={salesSeries(cur.sales, filters.period)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtMAD(v)} />
              <Line dataKey="value" stroke="var(--primary)" strokeWidth={2.5} dot={false} name="CA" />
            </LineChart>
          </Chart>
        </Panel>
        <Panel title="Ventes par secteur">
          <Chart>
            <PieChart>
              <Pie data={groupSum(cur.sales, (s) => clientOf(s.clientId).sector, (s) => s.amount)} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}
                onClick={(d: { name?: string }) => showRows({ title: `Ventes — ${d.name}`, head: SALE_HEAD, rows: saleRows(cur.sales.filter((s) => clientOf(s.clientId).sector === d.name)) })}>
                {SECTORS_COLORS}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtMAD(v)} /><Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </Chart>
        </Panel>
        <Panel title="Top commerciaux"><HBar data={groupSum(cur.sales, (s) => repName(s.repId), (s) => s.amount)} onClick={(n) => go("commerciaux", REPS.find((r) => r.name === n)?.id)} /></Panel>
        <Panel title="Top produits"><HBar data={groupSum(cur.sales, (s) => s.ref, (s) => s.amount).slice(0, 6)} onClick={(n) => go("produits", n)} /></Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Activité récente" className="lg:col-span-1">
          <ul className="space-y-3 text-sm">
            {VISITS.slice(0, 7).map((v, i) => (
              <li key={v.id}>
                <button className="text-left hover:text-primary" onClick={() => go("visites", v.id)}>
                  Nouveau rapport de visite reçu de <b>{REPS.find((r) => r.id === v.repId)!.short}</b>, client {clientOf(v.clientId).name}
                  <span className="block text-xs text-muted-foreground">{i === 0 ? "il y a 5 min" : ago(v.date)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Alertes" className="lg:col-span-1">
          <ul className="space-y-2 text-sm">
            {outOfStock.slice(0, 4).map((r) => (
              <li key={r.code}><button onClick={() => go("produits", r.code)} className="flex gap-2 text-left hover:text-primary"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />{r.code} : forte demande ({requesters(r.code).length} clients), stock {r.stock}</button></li>
            ))}
            {silentReps.map((r) => (
              <li key={r.id}><button onClick={() => go("commerciaux", r.id)} className="flex gap-2 text-left hover:text-primary"><Clock className="mt-0.5 size-4 shrink-0 text-warning" />{r.name} : aucun rapport depuis {lastReportDays(r.id)} jours</button></li>
            ))}
            {stale.slice(0, 3).map((o) => (
              <li key={o.id}><button onClick={() => showRows({ title: "Offre sans réponse", head: OFFER_HEAD, rows: offerRows([o]) })} className="flex gap-2 text-left hover:text-primary"><Send className="mt-0.5 size-4 shrink-0 text-warning" />{o.id} sans réponse depuis {ageDays(o.lastContact)} j ({clientOf(o.clientId).name})</button></li>
            ))}
          </ul>
        </Panel>
        <Panel title="Actions rapides">
          <div className="grid gap-2">
            <Button onClick={() => go("ia")}><Sparkles className="size-4" /> Générer un rapport</Button>
            <Button variant="outline" onClick={() => go("visites")}>Dernières visites</Button>
            <Button variant="outline" onClick={() => showRows({ title: "Offres à relancer", head: OFFER_HEAD, rows: offerRows(stale) })}>Offres à relancer ({stale.length})</Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
const SECTORS_COLORS = COLORS.map((c, i) => <Cell key={i} fill={c} className="cursor-pointer" />);

/* ---------------- COMMERCIAUX ---------------- */
function repStats(repId: string, s: ReturnType<typeof scoped>) {
  const sales = s.sales.filter((x) => x.repId === repId), visits = s.visits.filter((x) => x.repId === repId), offers = s.offers.filter((x) => x.repId === repId);
  return { sales, visits, offers, ca: sum(sales), conv: convRate(offers) };
}
export function Commerciaux({ id }: { id?: string | undefined }) {
  const { cur, filters, match } = useScope();
  const { go } = useR();
  if (id) return <RepDetail id={id} />;
  const stats = REPS.filter((r) => match(r.name)).map((r) => ({ r, ...repStats(r.id, cur) })).sort((a, b) => b.ca - a.ca);
  const exp = () => {
    exportPDF("Rapport Commerciaux", `Période : ${filters.period} derniers jours`, [
      { heading: "Classement", table: { head: ["Commercial", "Visites", "Offres", "Ventes", "Conversion"], rows: stats.map((s) => [s.r.name, s.visits.length, s.offers.length, fmtMAD(s.ca), `${s.conv.toFixed(0)} %`]) } },
    ], "rapport-commerciaux.pdf");
    toast.success("PDF exporté");
  };
  return (
    <Tabs defaultValue="liste">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList><TabsTrigger value="liste">Liste</TabsTrigger><TabsTrigger value="comp">Comparatif</TabsTrigger></TabsList>
        <Button variant="outline" onClick={exp}><FileDown className="size-4" /> Exporter en PDF</Button>
      </div>
      <TabsContent value="liste" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <button key={s.r.id} onClick={() => go("commerciaux", s.r.id)} className="panel hover-lift rounded-xl p-4 text-left">
            <p className="font-display text-lg font-bold">{s.r.name}</p>
            <p className="text-xs text-muted-foreground">{s.r.zone}</p>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
              <div><p className="font-bold text-base">{s.visits.length}</p>Visites</div>
              <div><p className="font-bold text-base">{s.offers.length}</p>Offres</div>
              <div><p className="font-bold text-base">{fmtK(s.ca)}</p>Ventes</div>
              <div><p className="font-bold text-base text-primary">{s.conv.toFixed(0)}%</p>Conv.</div>
            </div>
          </button>
        ))}
      </TabsContent>
      <TabsContent value="comp" className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Classement">
          <DataTable head={["#", "Commercial", "Visites", "Offres", "Ventes", "Conversion"]} rows={stats.map((s, i) => [i + 1, s.r.name, s.visits.length, s.offers.length, fmtMAD(s.ca), `${s.conv.toFixed(0)} %`])} onRow={(i) => go("commerciaux", stats[i]!.r.id)} />
        </Panel>
        <Panel title="Comparaison visites / offres">
          <Chart h={280}>
            <BarChart data={stats.map((s) => ({ name: s.r.name.split(" ")[0], Visites: s.visits.length, Offres: s.offers.length }))}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip contentStyle={chartTooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Visites" fill="var(--primary)" radius={4} /><Bar dataKey="Offres" fill="var(--muted-foreground)" radius={4} />
            </BarChart>
          </Chart>
        </Panel>
      </TabsContent>
    </Tabs>
  );
}
function RepDetail({ id }: { id: string }) {
  const { cur, filters } = useScope();
  const { go, showRows } = useR();
  const rep = REPS.find((r) => r.id === id);
  if (!rep) return <p>Commercial introuvable. <Button variant="link" onClick={() => go("commerciaux")}>Retour</Button></p>;
  const s = repStats(id, cur);
  const all = REPS.map((r) => repStats(r.id, cur));
  const avg = { ca: sum(all.map((a) => ({ amount: a.ca }))) / 5, visits: all.reduce((t, a) => t + a.visits.length, 0) / 5, conv: all.reduce((t, a) => t + a.conv, 0) / 5 };
  const proposed = groupSum(s.offers.flatMap((o) => o.lines), (l) => l.ref, (l) => l.qty).slice(0, 5);
  const sold = groupSum(s.sales, (x) => x.ref, (x) => x.amount).slice(0, 5);
  const byStatus = groupSum(s.offers, (o) => o.status, () => 1);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" onClick={() => go("commerciaux")}><ArrowLeft className="size-4" /> Commerciaux</Button>
        <Button variant="outline" onClick={() => { exportPDF(`Fiche commercial — ${rep.name}`, `Période : ${filters.period} jours`, [
          { heading: "Indicateurs", lines: [`Ventes : ${fmtMAD(s.ca)} (moyenne équipe ${fmtMAD(avg.ca)})`, `Visites : ${s.visits.length}`, `Offres : ${s.offers.length}`, `Conversion : ${s.conv.toFixed(0)} %`] },
          { heading: "Visites", table: { head: ["Date", "Client", "Résultat"], rows: s.visits.map((v) => [fmtDate(v.date), clientOf(v.clientId).name, v.result]) } },
        ], `commercial-${rep.short}.pdf`); toast.success("PDF exporté"); }}><FileDown className="size-4" /> Exporter en PDF</Button>
      </div>
      <h2 className="font-display text-2xl font-extrabold">{rep.name} <span className="text-sm font-normal text-muted-foreground">— {rep.zone}</span></h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Ventes" value={fmtK(s.ca)} sub={`Moyenne équipe : ${fmtK(avg.ca)}`} onClick={() => showRows({ title: `Ventes — ${rep.name}`, head: SALE_HEAD, rows: saleRows(s.sales) })} />
        <KpiCard label="Visites" value={String(s.visits.length)} sub={`Moyenne : ${avg.visits.toFixed(1)}`} />
        <KpiCard label="Offres" value={String(s.offers.length)} onClick={() => showRows({ title: `Offres — ${rep.name}`, head: OFFER_HEAD, rows: offerRows(s.offers) })} />
        <KpiCard label="Conversion" value={`${s.conv.toFixed(0)} %`} sub={`Moyenne : ${avg.conv.toFixed(0)} %`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Évolution des ventes"><Chart><LineChart data={salesSeries(s.sales, filters.period)}><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtMAD(v)} /><Line dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} /></LineChart></Chart></Panel>
        <Panel title="Offres par statut"><Chart><PieChart><Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85}>{SECTORS_COLORS}</Pie><Tooltip contentStyle={chartTooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></Chart></Panel>
        <Panel title="Produits les plus proposés (qté)"><HBar data={proposed} money={false} onClick={(n) => go("produits", n)} /></Panel>
        <Panel title="Produits les plus vendus"><HBar data={sold} onClick={(n) => go("produits", n)} /></Panel>
      </div>
      <Panel title="Visites" subtitle="Cliquez pour ouvrir le rapport de visite">
        <DataTable head={["Date", "Client", "Objet", "Résultat"]} rows={s.visits.map((v) => [fmtDate(v.date), clientOf(v.clientId).name, v.purpose, <StatusPill tone={statusTone(v.result)}>{v.result}</StatusPill>])} onRow={(i) => go("visites", s.visits[i]!.id)} />
      </Panel>
    </div>
  );
}

/* ---------------- VISITES ---------------- */
export function Visites({ id }: { id?: string | undefined }) {
  const { cur, match } = useScope();
  const { go } = useR();
  const [client, setClient] = useState("all");
  const [result, setResult] = useState("all");
  if (id) return <VisitDetail id={id} />;
  const list = cur.visits.filter((v) => (client === "all" || v.clientId === client) && (result === "all" || v.result === result) && match(clientOf(v.clientId).name, repName(v.repId), v.purpose, v.id));
  return (
    <Panel title={`Visites (${list.length})`} subtitle="Chaque visite génère un rapport envoyé par le commercial" action={
      <div className="flex flex-wrap gap-2">
        <Select value={client} onValueChange={setClient}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les clients</SelectItem>{CLIENTS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
        <Select value={result} onValueChange={setResult}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous résultats</SelectItem>{["Offre émise", "Commande", "À relancer", "Sans suite"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
      </div>
    }>
      <DataTable head={["Visite", "Date", "Commercial", "Client", "Secteur", "Objet", "Résultat"]} rows={list.map((v) => [v.id, fmtDate(v.date), repName(v.repId), clientOf(v.clientId).name, clientOf(v.clientId).sector, v.purpose, <StatusPill tone={statusTone(v.result)}>{v.result}</StatusPill>])} onRow={(i) => go("visites", list[i]!.id)} />
    </Panel>
  );
}
function VisitDetail({ id }: { id: string }) {
  const { go } = useR();
  const v = VISITS.find((x) => x.id === id) as Visit | undefined;
  if (!v) return <p>Visite introuvable. <Button variant="link" onClick={() => go("visites")}>Retour</Button></p>;
  const c = clientOf(v.clientId);
  const offer = OFFERS.find((o) => o.id === v.offerId);
  const F = ({ k, val }: { k: string; val: React.ReactNode }) => <div><p className="text-xs uppercase tracking-wider text-muted-foreground">{k}</p><p className="font-medium">{val}</p></div>;
  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => go("visites")}><ArrowLeft className="size-4" /> Visites</Button>
      <Panel title={`Visite ${v.id}`} subtitle={fmtDate(v.date)}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <F k="Commercial" val={<button className="hover:text-primary" onClick={() => go("commerciaux", v.repId)}>{repName(v.repId)}</button>} />
          <F k="Client" val={<button className="hover:text-primary" onClick={() => go("clients", c.id)}>{c.name}</button>} />
          <F k="Contact" val={v.contact} /><F k="Secteur" val={c.sector} />
          <F k="Objet" val={v.purpose} /><F k="Offre" val={offer ? `${offer.id} — ${fmtMAD(offer.amount)} (${offer.status})` : "Aucune"} />
          <F k="Résultat" val={<StatusPill tone={statusTone(v.result)}>{v.result}</StatusPill>} /><F k="Prochaine action" val={v.nextAction} />
        </div>
        <p className="mt-4 text-sm font-semibold">Références demandées</p>
        <div className="mt-2 flex flex-wrap gap-2">{v.requested.map((l) => <button key={l.ref} onClick={() => go("produits", l.ref)} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20">{l.ref} × {l.qty}</button>)}</div>
      </Panel>
      <Panel title="Rapport de visite d'origine" subtitle={`Transmis par ${repName(v.repId)} le ${fmtDate(v.date)}`}>
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
          <DataTable head={["Champ", "Valeur saisie"]} rows={[
            ["Date", new Date(v.date).toLocaleString("fr-FR")], ["Commercial", repName(v.repId)], ["Client", `${c.name} (${c.city})`], ["Interlocuteur", v.contact],
            ["Objet", v.purpose], ...v.requested.map((l) => [`Réf. demandée`, `${l.ref} — ${refOf(l.ref).label} — qté ${l.qty}`] as [string, string]),
            ["Offre", offer?.id ?? "—"], ["Résultat", v.result], ["Prochaine action", v.nextAction], ["Commentaire", v.notes],
          ]} />
        </div>
      </Panel>
    </div>
  );
}

/* ---------------- PRODUITS ---------------- */
export function Produits({ id }: { id?: string | undefined }) {
  const { cur, match } = useScope();
  const { go, showRows } = useR();
  if (id) return <RefDetail code={id} />;
  const sold = groupSum(cur.sales.filter((s) => match(s.ref, refOf(s.ref).label)), (s) => s.ref, (s) => s.qty).slice(0, 10);
  const asked = REFS.filter((r) => match(r.code, r.label)).map((r) => ({ r, n: requesters(r.code, cur.visits).length })).sort((a, b) => b.n - a.n).slice(0, 10);
  const hot = REFS.filter((r) => requesters(r.code).length >= 3 && r.stock <= r.min);
  const fam = FAMILIES.map((f) => { const s = cur.sales.filter((x) => refOf(x.ref).family === f); return { f, ca: sum(s), qty: s.reduce((t, x) => t + x.qty, 0), refs: REFS.filter((r) => r.family === f).length }; });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Références les plus vendues (qté)"><DataTable head={["Référence", "Désignation", "Qté"]} rows={sold.map((s) => [s.name, refOf(s.name).label, s.value])} onRow={(i) => go("produits", sold[i]!.name)} /></Panel>
        <Panel title="Références les plus demandées" subtitle="Nombre de clients distincts"><DataTable head={["Référence", "Désignation", "Clients"]} rows={asked.map((a) => [a.r.code, a.r.label, <b className="text-primary">{a.n}</b>])} onRow={(i) => go("produits", asked[i]!.r.code)} /></Panel>
      </div>
      <Panel title="Références à forte demande et faible stock">
        <DataTable head={["Référence", "Famille", "Clients demandeurs", "Stock", "Seuil", ""]} rows={hot.map((r) => [r.code, r.family, requesters(r.code).length, r.stock, r.min, <StatusPill tone="red">À approvisionner</StatusPill>])} onRow={(i) => go("produits", hot[i]!.code)} />
      </Panel>
      <Panel title="Rapport par famille de produits">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {fam.map((x) => <KpiCard key={x.f} label={x.f} value={fmtK(x.ca)} sub={`${x.qty} unités — ${x.refs} réf.`} onClick={() => showRows({ title: `Ventes — ${x.f}`, head: SALE_HEAD, rows: saleRows(cur.sales.filter((s) => refOf(s.ref).family === x.f)) })} />)}
        </div>
      </Panel>
    </div>
  );
}
function RefDetail({ code }: { code: string }) {
  const { go, showRows } = useR();
  const r = REFS.find((x) => x.code === code);
  if (!r) return <p>Référence introuvable. <Button variant="link" onClick={() => go("produits")}>Retour</Button></p>;
  const sales = SALES.filter((s) => s.ref === code);
  const req = requesters(code);
  const buyers = [...new Set(sales.map((s) => s.clientId))];
  const offers = OFFERS.filter((o) => o.lines.some((l) => l.ref === code));
  const reps = groupSum(sales, (s) => repName(s.repId), (s) => s.qty);
  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => go("produits")}><ArrowLeft className="size-4" /> Produits</Button>
      <h2 className="font-display text-2xl font-extrabold">{r.code} <span className="text-base font-normal text-muted-foreground">{r.label} — {r.family}</span></h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard highlight label="Clients ayant demandé" value={String(req.length)} sub={req.length >= 3 ? "Demande confirmée par plusieurs clients" : "Demande encore isolée"} onClick={() => showRows({ title: "Clients demandeurs", head: ["Client", "Secteur", "Ville"], rows: req.map((id) => { const c = clientOf(id); return [c.name, c.sector, c.city]; }) })} />
        <KpiCard label="Ventes (12 mois)" value={fmtK(sum(sales))} sub={`${sales.reduce((t, s) => t + s.qty, 0)} unités`} onClick={() => showRows({ title: `Ventes ${code}`, head: SALE_HEAD, rows: saleRows(sales) })} />
        <KpiCard label="Stock disponible" value={String(r.stock)} sub={r.stock <= r.min ? "À approvisionner" : `Seuil ${r.min}`} />
        <KpiCard label="Offres liées" value={String(offers.length)} onClick={() => showRows({ title: `Offres ${code}`, head: OFFER_HEAD, rows: offerRows(offers) })} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Clients acheteurs"><DataTable head={["Client", "Secteur"]} rows={buyers.map((id) => [clientOf(id).name, clientOf(id).sector])} onRow={(i) => go("clients", buyers[i])} /></Panel>
        <Panel title="Clients demandeurs"><DataTable head={["Client", "Secteur"]} rows={req.map((id) => [clientOf(id).name, clientOf(id).sector])} onRow={(i) => go("clients", req[i])} /></Panel>
        <Panel title="Top commerciaux (qté)"><DataTable head={["Commercial", "Qté"]} rows={reps.map((x) => [x.name, x.value])} /></Panel>
      </div>
    </div>
  );
}

/* ---------------- CLIENTS ---------------- */
export function Clients({ id }: { id?: string | undefined }) {
  const { cur, match } = useScope();
  const { go, filters } = { ...useR(), filters: useR().filters };
  if (id) return <ClientDetail id={id} />;
  const list = CLIENTS.filter((c) => (filters.sector === "all" || c.sector === filters.sector) && match(c.name, c.city, c.sector))
    .map((c) => ({ c, ca: sum(cur.sales.filter((s) => s.clientId === c.id)), last: SALES.filter((s) => s.clientId === c.id).map((s) => ageDays(s.date)).sort((a, b) => a - b)[0] ?? 999 }))
    .sort((a, b) => b.ca - a.ca);
  const inactive = list.filter((x) => x.last > 60);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel title="Top clients" className="lg:col-span-2"><DataTable head={["Client", "Secteur", "Ville", "Commercial", "CA période"]} rows={list.map((x) => [x.c.name, x.c.sector, x.c.city, repName(x.c.repId), fmtMAD(x.ca)])} onRow={(i) => go("clients", list[i]!.c.id)} /></Panel>
      <Panel title="Clients inactifs" subtitle="Aucun achat depuis 60 jours"><DataTable head={["Client", "Dernier achat"]} rows={inactive.map((x) => [x.c.name, x.last === 999 ? "Jamais" : `il y a ${x.last} j`])} onRow={(i) => go("clients", inactive[i]!.c.id)} /></Panel>
    </div>
  );
}
function ClientDetail({ id }: { id: string }) {
  const { go } = useR();
  const c = CLIENTS.find((x) => x.id === id);
  if (!c) return <p>Client introuvable. <Button variant="link" onClick={() => go("clients")}>Retour</Button></p>;
  const sales = SALES.filter((s) => s.clientId === id), visits = VISITS.filter((v) => v.clientId === id), offers = OFFERS.filter((o) => o.clientId === id);
  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => go("clients")}><ArrowLeft className="size-4" /> Clients</Button>
      <h2 className="font-display text-2xl font-extrabold">{c.name} <span className="text-sm font-normal text-muted-foreground">{c.sector} — {c.city} — {repName(c.repId)}</span></h2>
      <div className="grid grid-cols-3 gap-3"><KpiCard label="Achats (12 mois)" value={fmtK(sum(sales))} /><KpiCard label="Visites" value={String(visits.length)} /><KpiCard label="Offres" value={String(offers.length)} /></div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Achats"><DataTable max={15} head={["Date", "Réf.", "Montant"]} rows={sales.map((s) => [fmtDate(s.date), s.ref, fmtMAD(s.amount)])} /></Panel>
        <Panel title="Visites"><DataTable head={["Date", "Résultat"]} rows={visits.map((v) => [fmtDate(v.date), v.result])} onRow={(i) => go("visites", visits[i]!.id)} /></Panel>
        <Panel title="Offres"><DataTable head={["Offre", "Montant", "Statut"]} rows={offers.map((o) => [o.id, fmtMAD(o.amount), o.status])} /></Panel>
      </div>
    </div>
  );
}

/* ---------------- VENTES ---------------- */
export function Ventes() {
  const { cur, prev, filters } = useScope();
  const { showRows } = useR();
  const [dim, setDim] = useState("Commercial");
  const key = (s: (typeof SALES)[number]) => dim === "Commercial" ? repName(s.repId) : dim === "Client" ? clientOf(s.clientId).name : dim === "Produit" ? s.ref : clientOf(s.clientId).sector;
  const cg = groupSum(cur.sales, key, (s) => s.amount), pg = groupSum(prev.sales, key, (s) => s.amount);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard label="CA période" value={fmtK(sum(cur.sales))} sub={`Préc. ${fmtK(sum(prev.sales))}`} onClick={() => showRows({ title: "Ventes", head: SALE_HEAD, rows: saleRows(cur.sales) })} />
        <KpiCard label="Lignes de vente" value={String(cur.sales.length)} sub={`Préc. ${prev.sales.length}`} />
        <KpiCard label="Panier moyen" value={fmtMAD(sum(cur.sales) / Math.max(1, cur.sales.length))} />
      </div>
      <Panel title="Évolution" ><Chart><LineChart data={salesSeries(cur.sales, filters.period).map((d, i) => ({ ...d, prev: salesSeries(prev.sales.map((s) => ({ ...s, date: new Date(new Date(s.date).getTime() + filters.period * 86400000).toISOString() })), filters.period)[i]?.value ?? 0 }))}><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtMAD(v)} /><Legend wrapperStyle={{ fontSize: 11 }} /><Line dataKey="value" name="Période" stroke="var(--primary)" strokeWidth={2} dot={false} /><Line dataKey="prev" name="Période préc." stroke="var(--muted-foreground)" strokeDasharray="4 4" dot={false} /></LineChart></Chart></Panel>
      <Panel title={`Ventes par ${dim.toLowerCase()}`} action={<Select value={dim} onValueChange={setDim}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{["Commercial", "Client", "Produit", "Secteur"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>}>
        <DataTable head={[dim, "CA période", "Période préc.", "Évolution"]} rows={cg.map((g) => { const p = pg.find((x) => x.name === g.name)?.value ?? 0; return [g.name, fmtMAD(g.value), fmtMAD(p), <Evo cur={g.value} prev={p} />]; })}
          onRow={(i) => showRows({ title: `Ventes — ${cg[i]!.name}`, head: SALE_HEAD, rows: saleRows(cur.sales.filter((s) => key(s) === cg[i]!.name)) })} />
      </Panel>
    </div>
  );
}

/* ---------------- STOCK ---------------- */
export function Stock() {
  const { match } = useScope();
  const { go } = useR();
  const list = REFS.filter((r) => match(r.code, r.label, r.family)).map((r) => ({ r, d: VISITS.filter((v) => v.requested.some((l) => l.ref === r.code)).reduce((t, v) => t + v.requested.find((l) => l.ref === r.code)!.qty, 0) }));
  const short = list.filter((x) => x.r.stock <= x.r.min);
  const top = [...list].sort((a, b) => b.d - a.d).slice(0, 12);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Références" value={String(list.length)} /><KpiCard label="Ruptures" value={String(list.filter((x) => x.r.stock === 0).length)} /><KpiCard label="Sous le seuil" value={String(short.length)} />
      </div>
      <Panel title="Demande vs stock"><Chart h={280}><BarChart data={top.map((x) => ({ name: x.r.code, Demande: x.d, Stock: x.r.stock }))}><XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} height={60} textAnchor="end" /><YAxis tick={{ fontSize: 11 }} /><Tooltip contentStyle={chartTooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="Demande" fill="var(--primary)" radius={4} /><Bar dataKey="Stock" fill="var(--muted-foreground)" radius={4} /></BarChart></Chart></Panel>
      <Panel title="État du stock"><DataTable head={["Référence", "Désignation", "Famille", "Stock", "Seuil", "Demande", "Statut"]} rows={list.map((x) => [x.r.code, x.r.label, x.r.family, x.r.stock, x.r.min, x.d, <StatusPill tone={x.r.stock === 0 ? "red" : x.r.stock <= x.r.min ? "amber" : "green"}>{x.r.stock === 0 ? "Rupture" : x.r.stock <= x.r.min ? "Stock faible" : "Disponible"}</StatusPill>])} onRow={(i) => go("produits", list[i]!.r.code)} /></Panel>
    </div>
  );
}

/* ---------------- OFFRES ---------------- */
export function Offres() {
  const { cur, match } = useScope();
  const { showRows } = useR();
  const [st, setSt] = useState("all");
  const list = cur.offers.filter((o) => (st === "all" || o.status === st) && match(o.id, clientOf(o.clientId).name, repName(o.repId)));
  const pend = cur.offers.filter((o) => o.status === "En attente");
  const follow = pend.filter((o) => ageDays(o.lastContact) > 15);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Offres" value={String(cur.offers.length)} /><KpiCard label="Taux de conversion" value={`${convRate(cur.offers).toFixed(0)} %`} />
        <KpiCard label="Pipeline total" value={fmtK(sum(pend))} sub={`${pend.length} en attente`} onClick={() => showRows({ title: "Pipeline", head: OFFER_HEAD, rows: offerRows(pend) })} />
        <KpiCard label="À relancer" value={String(follow.length)} onClick={() => showRows({ title: "Offres à relancer", head: OFFER_HEAD, rows: offerRows(follow) })} />
      </div>
      <Panel title="Offres" action={<div className="flex gap-1">{["all", "Conclue", "En attente", "Perdue"].map((s) => <Button key={s} size="sm" variant={st === s ? "default" : "outline"} onClick={() => setSt(s)}>{s === "all" ? "Toutes" : s}</Button>)}</div>}>
        <DataTable head={[...OFFER_HEAD, "Dernier contact"]} rows={list.map((o) => [o.id, fmtDate(o.date), repName(o.repId), clientOf(o.clientId).name, fmtMAD(o.amount), <StatusPill tone={statusTone(o.status)}>{o.status}</StatusPill>, `il y a ${ageDays(o.lastContact)} j`])}
          onRow={(i) => showRows({ title: `Offre ${list[i]!.id}`, head: ["Référence", "Désignation", "Qté", "Montant"], rows: list[i]!.lines.map((l) => [l.ref, refOf(l.ref).label, l.qty, fmtMAD(refOf(l.ref).price * l.qty)]) })} />
      </Panel>
    </div>
  );
}
export { FileText };
